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
    items: Vec<Item>,
    events: Vec<Named>,
    rewards: Vec<Reward>,
    rolls: Vec<Roll>,
    presentation: Option<Presentation>,
    screens: Option<Vec<Screen>>,
    main_menu_id: Option<String>,
    theme: Option<Colors>,
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
    #[serde(rename = "illustrationMode")]
    illustration_mode: Option<String>,
    colors: Option<Colors>,
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
    image: Option<String>,
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

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Item {
    id: String,
    name: String,
    text: Option<String>,
    image: Option<String>,
    audio: Option<String>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Presentation {
    image: Value,
    text: String,
    sections: Vec<Section>,
    chapters: Vec<Chapter>,
    progress: Progress,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Section {
    id: String,
    kind: String,
    title: String,
    image: Value,
    enabled: bool,
    entries: Vec<Entry>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Entry {
    id: String,
    title: String,
    text: String,
    image: Value,
    audio: Value,
    conditions: Vec<Condition>,
    unavailable: String,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Chapter {
    id: String,
    title: String,
    image: Value,
    passages: Vec<Passage>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Passage {
    scene_id: Value,
    replayable: bool,
    conditions: Vec<Condition>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Progress {
    target: f64,
    milestones: Vec<Milestone>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Milestone {
    id: String,
    conditions: Vec<Condition>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Screen {
    id: String,
    #[serde(rename = "type")]
    kind: String,
    title: String,
    text: String,
    image: Value,
    links: Vec<ScreenLink>,
    information: Option<Vec<CharacterInformation>>,
    layout: Option<String>,
    audio: Option<String>,
    #[serde(rename = "illustrationMode")]
    illustration_mode: Option<String>,
    source: Option<String>,
    entries: Option<Vec<CollectionEntry>>,
    #[serde(rename = "detailScreenId")]
    detail_screen_id: Option<String>,
    #[serde(rename = "contentSource")]
    content_source: Option<String>,
    colors: Option<Colors>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct CharacterInformation {
    id: String,
    text: String,
    conditions: Vec<Condition>,
}
#[derive(Deserialize)]
#[serde(untagged)]
enum ScreenLink {
    Consultation(ConsultationLink),
    Narrative(NarrativeLink),
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct ConsultationLink {
    id: String,
    image: Option<String>,
    #[serde(rename = "type")]
    kind: Option<String>,
    label: String,
    screen_id: Value,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct NarrativeLink {
    id: String,
    image: Option<String>,
    #[serde(rename = "type")]
    kind: String,
    choice_id: Value,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Colors {
    background: Option<String>,
    text: Option<String>,
    selection: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct CollectionEntry {
    id: String,
    label: String,
    image: Value,
    screen_id: Value,
    conditions: Vec<Condition>,
    unavailable: String,
}
