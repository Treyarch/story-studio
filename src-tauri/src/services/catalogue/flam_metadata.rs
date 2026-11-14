//! Computer-side FLAM titles survive invalidation of the firmware cache.
use super::{
    store::{error, Store},
    Result,
};
use crate::services::storyteller_device::{self as driver, cards::CardCatalogue, Volumes};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::{Read, Write},
    path::Path,
};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Title {
    version: u8,
    uuid: Uuid,
    title: String,
}
impl Store {
    fn flam_title_path(&self, id: Uuid) -> std::path::PathBuf {
        self.images_root()
            .with_file_name("flam-metadata")
            .join(format!("{id}.json"))
    }
    pub(crate) fn remember_flam_title(&self, id: Uuid, title: &str) -> Result<()> {
        if title.trim().is_empty() || title.len() > 4096 {
            return Ok(());
        }
        let path = self.flam_title_path(id);
        if self.saved_flam_title(id).as_deref() == Some(title) {
            return Ok(());
        }
        let directory = path.parent().unwrap();
        fs::create_dir_all(directory).map_err(error)?;
        driver::safe(directory, true).map_err(crate::support::user_message::UserMessage::from)?;
        let temporary = directory.join(format!("{}.tmp", Uuid::new_v4()));
        let result = (|| {
            let mut file = fs::File::create_new(&temporary).map_err(error)?;
            let data = Title {
                version: 1,
                uuid: id,
                title: title.to_owned(),
            };
            file.write_all(&serde_json::to_vec(&data).map_err(error)?)
                .map_err(error)?;
            file.sync_all().map_err(error)?;
            super::files::publish::replace(&temporary, &path)
        })();
        let _ = fs::remove_file(&temporary);
        result
    }
    fn saved_flam_title(&self, id: Uuid) -> Option<String> {
        let path = self.flam_title_path(id);
        driver::safe(&path, false).ok()?;
        let file = fs::File::open(path).ok()?;
        if file.metadata().ok()?.len() > 32 * 1024 {
            return None;
        }
        let data: Title = serde_json::from_reader(file.take(32 * 1024 + 1)).ok()?;
        (data.version == 1
            && data.uuid == id
            && !data.title.trim().is_empty()
            && data.title.len() <= 4096)
            .then_some(data.title)
    }
    pub(crate) fn flam_inventory(
        &self,
        root: &Path,
        volumes: &impl Volumes,
    ) -> Result<driver::flam::Inventory> {
        let mut inventory = driver::flam::inspect(root, volumes)
            .map_err(crate::support::user_message::UserMessage::from)?;
        for story in &mut inventory.stories {
            if story.title.is_none() {
                // A local copy is indexed in a separate identity namespace.
                let copied = self
                    .flam_copy_link(story.uuid)
                    .ok()
                    .flatten()
                    .and_then(|fiche| {
                        self.read_snapshot(|c| super::data::card::snapshot(c, &fiche))
                            .ok()
                            .flatten()
                    })
                    .and_then(|card| {
                        card["fields"]
                            .as_array()
                            .and_then(|fields| {
                                fields.iter().find(|field| field["field"] == "title")
                            })
                            .and_then(|field| field["effective"]["value"].as_str())
                            .filter(|t| !t.trim().is_empty())
                            .map(str::to_owned)
                    });
                story.title = copied
                    .or_else(|| {
                        self.card(story.uuid)
                            .ok()
                            .flatten()
                            .map(|card| card.card.title)
                    })
                    .or_else(|| self.saved_flam_title(story.uuid))
                    .or_else(|| self.official_title(story.uuid).ok().flatten());
            }
            if let Some(title) = &story.title {
                // An unavailable computer cache must not hide otherwise readable titles.
                let _ = self.remember_flam_title(story.uuid, title);
            }
        }
        Ok(inventory)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    struct Temp(std::path::PathBuf);
    impl Drop for Temp {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn fixture() -> (Temp, Store, Uuid) {
        let root = Temp(
            std::env::temp_dir()
                .canonicalize()
                .unwrap()
                .join(format!("flam-titles-{}", Uuid::new_v4())),
        );
        let device = root.0.join("device");
        fs::create_dir_all(device.join("etc/library")).unwrap();
        fs::write(device.join(".mdf"), [0; 50]).unwrap();
        let id = Uuid::new_v4();
        fs::write(device.join("etc/library/list"), id.to_string()).unwrap();
        let store = Store::open(&root.0.join("data"), &root.0.join("cache")).unwrap();
        (root, store, id)
    }
    #[test]
    fn official_database_supplies_missing_flam_titles_without_creating_catalogue_entries() {
        let (root, store, id) = fixture();
        let document =
            serde_json::json!({"localized_infos":{"fr_FR":{"title":"Une histoire officielle"}}});
        store.lunii_locale("fr").unwrap();
        store
            .write(|tx| {
                tx.execute(
                    "INSERT INTO lunii_pack VALUES (?1,?2)",
                    [id.to_string(), document.to_string()],
                )
                .map_err(error)?;
                Ok(())
            })
            .unwrap();
        let inventory = store
            .flam_inventory(&root.0.join("device"), &driver::NativeVolumes)
            .unwrap();
        assert_eq!(
            inventory.stories[0].title.as_deref(),
            Some("Une histoire officielle")
        );
        assert!(store
            .query_entries(100, None, false)
            .unwrap()
            .items
            .is_empty());
        assert!(!root.0.join("device/usr/0/library.cache").exists());
    }
    #[test]
    fn firmware_title_survives_cache_removal_and_application_restart() {
        let (root, store, id) = fixture();
        let device = root.0.join("device");
        let mut record = vec![0; 4];
        record.extend(1u32.to_le_bytes());
        for text in [id.to_string(), format!("/str/{id}"), "Titre du FLAM".into()] {
            record.extend(((text.len() + 1) as u16).to_le_bytes());
            record.extend(text.as_bytes());
            record.push(0);
        }
        let len = record.len() as u32;
        record[..4].copy_from_slice(&len.to_le_bytes());
        let mut cache = vec![0; 68];
        cache[..4].copy_from_slice(&1u32.to_le_bytes());
        cache.extend(72u32.to_le_bytes());
        cache.extend(record);
        fs::create_dir_all(device.join("usr/0")).unwrap();
        fs::write(device.join("usr/0/library.cache"), cache).unwrap();
        assert_eq!(
            store
                .flam_inventory(&device, &driver::NativeVolumes)
                .unwrap()
                .stories[0]
                .title
                .as_deref(),
            Some("Titre du FLAM")
        );
        fs::remove_file(device.join("usr/0/library.cache")).unwrap();
        drop(store);
        let reopened = Store::open(&root.0.join("data"), &root.0.join("cache")).unwrap();
        assert_eq!(
            reopened
                .flam_inventory(&device, &driver::NativeVolumes)
                .unwrap()
                .stories[0]
                .title
                .as_deref(),
            Some("Titre du FLAM")
        );
        assert!(!device.join("usr/0/library.cache").exists());
    }
}
