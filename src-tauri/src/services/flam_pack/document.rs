//! Même frontière que le document d'auteur : seules des données deviennent du Lua.
use super::{Error, Result};
use serde_json::Value;
use std::collections::{BTreeMap, HashSet};

pub(super) fn validate(doc: &Value) -> Result<()> {
    let fail = || Error::InvalidDocument;
    let _: super::shape::Document = serde_json::from_value(doc.clone()).map_err(|_| fail())?;
    if doc["version"] != 1
        || doc["saveVersion"]
            .as_u64()
            .filter(|n| *n > 0 && *n <= 9007199254740991)
            .is_none()
        || doc["title"].as_str().is_none()
    {
        return Err(fail());
    }
    let id = uuid::Uuid::parse_str(doc["id"].as_str().ok_or_else(fail)?).map_err(|_| fail())?;
    if id.get_version_num() != 4
        || !id
            .to_string()
            .eq_ignore_ascii_case(doc["id"].as_str().unwrap())
    {
        return Err(fail());
    }
    let mut ids = BTreeMap::new();
    let mut all = HashSet::new();
    for collection in [
        "scenes", "choices", "classes", "items", "events", "rewards", "rolls",
    ] {
        let entries = doc[collection].as_array().ok_or_else(fail)?;
        let mut set = HashSet::new();
        for entry in entries {
            let id = entry["id"]
                .as_str()
                .filter(|s| !s.trim().is_empty())
                .ok_or_else(fail)?;
            if !all.insert(id) {
                return Err(fail());
            }
            set.insert(id);
            if collection != "scenes" && collection != "choices" && entry["name"].as_str().is_none()
            {
                return Err(fail());
            }
        }
        ids.insert(collection, set);
    }
    let reference = |collection: &str, value: &Value| -> Result<()> {
        if value
            .as_str()
            .is_some_and(|id| ids[collection].contains(id))
        {
            Ok(())
        } else {
            Err(fail())
        }
    };
    let rules = |entries: &Value, conditions: bool| -> Result<()> {
        for rule in entries.as_array().ok_or_else(fail)? {
            match rule["type"].as_str() {
                Some("class") if conditions => reference("classes", &rule["classId"])?,
                Some("chooseClass") if !conditions => reference("classes", &rule["classId"])?,
                Some("event") if conditions => {
                    reference("events", &rule["eventId"])?;
                    if !rule["present"].is_boolean() {
                        return Err(fail());
                    }
                }
                Some("setEvent") if !conditions => reference("events", &rule["eventId"])?,
                Some(kind)
                    if (conditions && kind == "item")
                        || (!conditions && ["giveItem", "consumeItem"].contains(&kind)) =>
                {
                    reference("items", &rule["itemId"])?;
                    if rule["quantity"]
                        .as_u64()
                        .filter(|n| *n > 0 && *n <= 9007199254740991)
                        .is_none()
                    {
                        return Err(fail());
                    }
                }
                _ => return Err(fail()),
            }
        }
        Ok(())
    };
    reference("scenes", &doc["startSceneId"])?;
    for scene in doc["scenes"].as_array().unwrap() {
        if scene["title"]
            .as_str()
            .filter(|s| !s.trim().is_empty())
            .is_none()
            || scene["text"].as_str().is_none()
            || !scene["ending"].is_boolean()
        {
            return Err(fail());
        }
        for kind in ["audio", "image"] {
            if !scene[kind].is_null() && scene[kind].as_str().filter(|s| !s.is_empty()).is_none() {
                return Err(fail());
            }
        }
        let choices = scene["choices"].as_array().ok_or_else(fail)?;
        if scene["ending"] == false && choices.is_empty() {
            return Err(fail());
        }
        for choice in choices {
            reference("choices", choice)?;
        }
    }
    for choice in doc["choices"].as_array().unwrap() {
        if choice["label"]
            .as_str()
            .filter(|s| !s.trim().is_empty())
            .is_none()
            || !matches!(
                choice["unavailable"]["mode"].as_str(),
                Some("disabled" | "hidden")
            )
            || !choice["unavailable"]["explanation"].is_string()
        {
            return Err(fail());
        }
        if !choice["rollId"].is_null() {
            reference("rolls", &choice["rollId"])?;
            if !choice["destination"].is_null() {
                return Err(fail());
            }
        } else {
            reference("scenes", &choice["destination"])?;
        }
        if !choice["rewardId"].is_null() {
            reference("rewards", &choice["rewardId"])?;
        }
        rules(&choice["conditions"], true)?;
        rules(&choice["effects"], false)?;
    }
    for reward in doc["rewards"].as_array().unwrap() {
        if !reward["repeatable"].is_boolean() {
            return Err(fail());
        }
        rules(&reward["effects"], false)?;
    }
    for roll in doc["rolls"].as_array().unwrap() {
        let mut covered = HashSet::new();
        for outcome in roll["outcomes"].as_array().ok_or_else(fail)? {
            let min = outcome["min"].as_u64().ok_or_else(fail)?;
            let max = outcome["max"].as_u64().ok_or_else(fail)?;
            if min < 1 || max > 20 || min > max {
                return Err(fail());
            }
            for n in min..=max {
                if !covered.insert(n) {
                    return Err(fail());
                }
            }
            reference("scenes", &outcome["destination"])?;
        }
        if covered.len() != 20 {
            return Err(fail());
        }
    }
    Ok(())
}

// Chaque octet est échappé sur trois chiffres : un texte arbitraire ne peut
// fermer une chaîne ou ajouter une instruction. Aucune source Lua de l'IPC.
pub(super) fn lua(value: &Value) -> String {
    match value {
        Value::Null => "nil".into(),
        Value::Bool(v) => v.to_string(),
        Value::Number(v) => v.to_string(),
        Value::String(v) => format!(
            "\"{}\"",
            v.as_bytes()
                .iter()
                .map(|b| format!("\\{b:03}"))
                .collect::<String>()
        ),
        Value::Array(v) => format!("{{{}}}", v.iter().map(lua).collect::<Vec<_>>().join(",")),
        Value::Object(v) => format!(
            "{{{}}}",
            v.iter()
                .map(|(k, v)| format!("[{}]={}", lua(&Value::String(k.clone())), lua(v)))
                .collect::<Vec<_>>()
                .join(",")
        ),
    }
}
