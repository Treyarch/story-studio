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
    let validate_colors = |value: Option<&Value>| -> Result<()> {
        if let Some(value) = value {
            let colors = value.as_object().ok_or_else(fail)?;
            for field in ["background", "text", "selection"] {
                if let Some(value) = colors.get(field) {
                    let color = value.as_str().ok_or_else(fail)?;
                    if color.len() != 7
                        || !color.starts_with('#')
                        || !color.as_bytes()[1..].iter().all(u8::is_ascii_hexdigit)
                    {
                        return Err(fail());
                    }
                }
            }
        }
        Ok(())
    };
    validate_colors(doc.get("theme"))?;
    for collection in ["scenes", "screens"] {
        for screen in doc[collection].as_array().into_iter().flatten() {
            validate_colors(screen.get("colors"))?;
            if let Some(mode) = screen.get("illustrationMode") {
                if !matches!(mode.as_str(), Some("common" | "selection"))
                    || (collection == "screens" && screen["type"] != "menu")
                {
                    return Err(fail());
                }
            }
        }
    }
    let mut ids = BTreeMap::new();
    let mut all = HashSet::new();
    for collection in [
        "scenes", "choices", "classes", "items", "events", "rewards", "rolls", "screens",
    ] {
        if collection == "screens" && doc.get(collection).is_none() {
            ids.insert(collection, HashSet::new());
            continue;
        }
        let entries = doc[collection].as_array().ok_or_else(fail)?;
        let mut set = HashSet::new();
        for entry in entries {
            let id = entry["id"]
                .as_str()
                .filter(|s| !s.trim().is_empty())
                .ok_or_else(fail)?;
            if !all.insert(id.to_owned()) {
                return Err(fail());
            }
            set.insert(id);
            if collection != "scenes"
                && collection != "choices"
                && collection != "screens"
                && entry["name"].as_str().is_none()
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
    if let Some(menu) = doc.get("mainMenuId").filter(|value| !value.is_null()) {
        reference("screens", menu)?;
        if !doc["screens"]
            .as_array()
            .unwrap()
            .iter()
            .any(|screen| screen["id"] == *menu && screen["type"] == "menu")
        {
            return Err(fail());
        }
    }
    if let Some(screens) = doc.get("screens").and_then(Value::as_array) {
        for screen in screens {
            if !matches!(
                screen["type"].as_str(),
                Some("menu" | "detail" | "grid" | "character")
            ) {
                return Err(fail());
            }
            if let Some(layout) = screen.get("layout") {
                if screen["type"] != "detail"
                    || !matches!(layout.as_str(), Some("split" | "fullImage"))
                {
                    return Err(fail());
                }
            }
            if screen.get("audio").is_some() && screen["type"] != "detail" {
                return Err(fail());
            }
            if let Some(information) = screen.get("information") {
                if screen["type"] != "character" {
                    return Err(fail());
                }
                for info in information.as_array().ok_or_else(fail)? {
                    let id = info["id"]
                        .as_str()
                        .filter(|id| !id.trim().is_empty())
                        .ok_or_else(fail)?;
                    if !all.insert(id.to_owned()) {
                        return Err(fail());
                    }
                    rules(&info["conditions"], true)?;
                }
            }
            let links = screen["links"].as_array().ok_or_else(fail)?;
            if screen["type"] != "menu" && !links.is_empty() {
                return Err(fail());
            }
            if screen
                .get("entries")
                .is_some_and(|entries| !entries.is_array())
            {
                return Err(fail());
            }
            if screen["type"] == "grid" {
                match screen["source"].as_str() {
                    Some("inventory") => {
                        reference("screens", &screen["detailScreenId"])?;
                        if !screens.iter().any(|target| {
                            target["id"] == screen["detailScreenId"]
                                && target["type"] == "detail"
                                && target["contentSource"] == "item"
                        }) || screen["entries"]
                            .as_array()
                            .is_some_and(|entries| !entries.is_empty())
                        {
                            return Err(fail());
                        }
                    }
                    Some("collection") => {
                        if !screen["detailScreenId"].is_null() || !screen["entries"].is_array() {
                            return Err(fail());
                        }
                    }
                    _ => return Err(fail()),
                }
            } else if screen.get("source").is_some()
                || screen.get("detailScreenId").is_some()
                || screen.get("entries").is_some()
            {
                return Err(fail());
            }
            if let Some(entries) = screen["entries"].as_array() {
                for entry in entries {
                    let id = entry["id"]
                        .as_str()
                        .filter(|id| !id.trim().is_empty())
                        .ok_or_else(fail)?;
                    if !all.insert(id.to_owned())
                        || entry["label"]
                            .as_str()
                            .filter(|label| !label.trim().is_empty())
                            .is_none()
                        || !matches!(entry["unavailable"].as_str(), Some("hidden" | "disabled"))
                    {
                        return Err(fail());
                    }
                    reference("screens", &entry["screenId"])?;
                    if !screens.iter().any(|target| {
                        target["id"] == entry["screenId"]
                            && target["type"] == "detail"
                            && target["contentSource"] != "item"
                    }) {
                        return Err(fail());
                    }
                    rules(&entry["conditions"], true)?;
                }
            }
            if let Some(source) = screen.get("contentSource") {
                if screen["type"] != "detail" || !matches!(source.as_str(), Some("author" | "item"))
                {
                    return Err(fail());
                }
            }
            let mut link_ids = HashSet::new();
            for link in links {
                let id = link["id"]
                    .as_str()
                    .filter(|id| !id.trim().is_empty())
                    .ok_or_else(fail)?;
                if !link_ids.insert(id) {
                    return Err(fail());
                }
                if link["type"] == "narrative" {
                    reference("choices", &link["choiceId"])?;
                } else {
                    if link.get("type").is_some_and(|kind| kind != "consultation")
                        || link["label"]
                            .as_str()
                            .filter(|label| !label.trim().is_empty())
                            .is_none()
                    {
                        return Err(fail());
                    }
                    reference("screens", &link["screenId"])?;
                    if screens.iter().any(|target| {
                        target["id"] == link["screenId"] && target["contentSource"] == "item"
                    }) {
                        return Err(fail());
                    }
                }
            }
        }
    }
    if let Some(view) = doc.get("presentation") {
        let mut identify = |entry: &Value| -> Result<()> {
            let id = entry["id"]
                .as_str()
                .filter(|s| !s.trim().is_empty())
                .ok_or_else(fail)?;
            if !all.insert(id.to_owned()) {
                return Err(fail());
            }
            Ok(())
        };
        for section in view["sections"].as_array().ok_or_else(fail)? {
            identify(section)?;
            if !matches!(
                section["kind"].as_str(),
                Some("chapters" | "character" | "inventory" | "collection")
            ) || section["title"]
                .as_str()
                .filter(|s| !s.trim().is_empty())
                .is_none()
            {
                return Err(fail());
            }
            for entry in section["entries"].as_array().ok_or_else(fail)? {
                identify(entry)?;
                if entry["title"]
                    .as_str()
                    .filter(|s| !s.trim().is_empty())
                    .is_none()
                    || !matches!(entry["unavailable"].as_str(), Some("disabled" | "hidden"))
                {
                    return Err(fail());
                }
                rules(&entry["conditions"], true)?;
            }
        }
        for chapter in view["chapters"].as_array().ok_or_else(fail)? {
            identify(chapter)?;
            if chapter["title"]
                .as_str()
                .filter(|s| !s.trim().is_empty())
                .is_none()
            {
                return Err(fail());
            }
            let passages = chapter["passages"].as_array().ok_or_else(fail)?;
            let mut seen = HashSet::new();
            if passages.is_empty() {
                return Err(fail());
            }
            for passage in passages {
                reference("scenes", &passage["sceneId"])?;
                if !seen.insert(passage["sceneId"].as_str().unwrap()) {
                    return Err(fail());
                }
                rules(&passage["conditions"], true)?;
            }
        }
        let milestones = view["progress"]["milestones"].as_array().ok_or_else(fail)?;
        if view["progress"]["target"]
            .as_u64()
            .filter(|n| *n > 0 && *n <= milestones.len() as u64)
            .is_none()
        {
            return Err(fail());
        }
        let mut class_bounds: BTreeMap<&str, usize> = BTreeMap::new();
        let mut shared_milestones = 0;
        for milestone in milestones {
            identify(milestone)?;
            if milestone["conditions"]
                .as_array()
                .ok_or_else(fail)?
                .is_empty()
            {
                return Err(fail());
            }
            rules(&milestone["conditions"], true)?;
            let classes: HashSet<&str> = milestone["conditions"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|condition| condition["type"] == "class")
                .filter_map(|condition| condition["classId"].as_str())
                .collect();
            if classes.len() > 1 {
                return Err(fail());
            }
            if let Some(id) = classes.iter().next() {
                *class_bounds.entry(id).or_default() += 1;
            } else {
                shared_milestones += 1;
            }
        }
        if view["progress"]["target"].as_u64().unwrap() as usize
            > shared_milestones + class_bounds.values().copied().max().unwrap_or(0)
        {
            return Err(fail());
        }
    }
    for pointer in media_pointers(doc) {
        let value = doc.pointer(&pointer).ok_or_else(fail)?;
        if !value.is_null() && value.as_str().filter(|s| !s.is_empty()).is_none() {
            return Err(fail());
        }
    }
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

// Parcours fermé des médias : utilisé à la génération et à la relecture du pack.
pub(super) fn media_pointers(doc: &Value) -> Vec<String> {
    fn fields(doc: &Value, base: &str, result: &mut Vec<String>) {
        for kind in ["audio", "image"] {
            let pointer = format!("{base}/{kind}");
            if doc.pointer(&pointer).is_some() {
                result.push(pointer);
            }
        }
    }
    let mut result = Vec::new();
    for collection in ["scenes", "choices", "items", "screens"] {
        for (index, _) in doc[collection].as_array().into_iter().flatten().enumerate() {
            fields(doc, &format!("/{collection}/{index}"), &mut result);
            if collection == "screens" {
                for (j, _) in doc[collection][index]["links"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .enumerate()
                {
                    fields(doc, &format!("/screens/{index}/links/{j}"), &mut result);
                }
                for (j, _) in doc[collection][index]["entries"]
                    .as_array()
                    .into_iter()
                    .flatten()
                    .enumerate()
                {
                    fields(doc, &format!("/screens/{index}/entries/{j}"), &mut result);
                }
            }
        }
    }
    if let Some(view) = doc.get("presentation") {
        fields(doc, "/presentation", &mut result);
        for (i, section) in view["sections"].as_array().unwrap().iter().enumerate() {
            let base = format!("/presentation/sections/{i}");
            fields(doc, &base, &mut result);
            for (j, _) in section["entries"].as_array().unwrap().iter().enumerate() {
                fields(doc, &format!("{base}/entries/{j}"), &mut result);
            }
        }
        for (i, _) in view["chapters"].as_array().unwrap().iter().enumerate() {
            fields(doc, &format!("/presentation/chapters/{i}"), &mut result);
        }
    }
    result
}
