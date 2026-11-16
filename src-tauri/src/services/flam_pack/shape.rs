//! Contrat structurel strict du document v1, sans état de partie.
#![allow(dead_code)]
use serde::Deserialize;
use serde_json::Value;
#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub(super) struct Document {
    version: u8,
    id: String,
    save_version: u64,
    title: String,
    start_scene_id: Value,
    scenes: Vec<Scene>,
    choices: Vec<Choice>,
    classes: Vec<Named>,
    items: Vec<Named>,
    events: Vec<Named>,
    rewards: Vec<Reward>,
    rolls: Vec<Roll>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Scene {
    id: String,
    title: String,
    text: String,
    audio: Value,
    image: Value,
    ending: bool,
    choices: Vec<String>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Choice {
    id: String,
    label: String,
    destination: Value,
    conditions: Vec<Condition>,
    effects: Vec<Effect>,
    reward_id: Value,
    roll_id: Value,
    #[serde(default = "default_replay_audio_on_return")]
    replay_audio_on_return: bool,
    unavailable: Unavailable,
}
fn default_replay_audio_on_return() -> bool {
    true
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Unavailable {
    mode: String,
    explanation: String,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Named {
    id: String,
    name: String,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Reward {
    id: String,
    name: String,
    repeatable: bool,
    effects: Vec<Effect>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Roll {
    id: String,
    name: String,
    outcomes: Vec<Outcome>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Outcome {
    min: f64,
    max: f64,
    destination: Value,
}
#[derive(Deserialize)]
#[serde(tag = "type", deny_unknown_fields)]
enum Condition {
    #[serde(rename = "class")]
    Class {
        #[serde(rename = "classId")]
        class_id: Value,
    },
    #[serde(rename = "item")]
    Item {
        #[serde(rename = "itemId")]
        item_id: Value,
        quantity: f64,
    },
    #[serde(rename = "event")]
    Event {
        #[serde(rename = "eventId")]
        event_id: Value,
        present: bool,
    },
}
#[derive(Deserialize)]
#[serde(tag = "type", deny_unknown_fields)]
enum Effect {
    #[serde(rename = "chooseClass")]
    ChooseClass {
        #[serde(rename = "classId")]
        class_id: Value,
    },
    #[serde(rename = "giveItem")]
    GiveItem {
        #[serde(rename = "itemId")]
        item_id: Value,
        quantity: f64,
    },
    #[serde(rename = "consumeItem")]
    ConsumeItem {
        #[serde(rename = "itemId")]
        item_id: Value,
        quantity: f64,
    },
    #[serde(rename = "setEvent")]
    SetEvent {
        #[serde(rename = "eventId")]
        event_id: Value,
    },
}
