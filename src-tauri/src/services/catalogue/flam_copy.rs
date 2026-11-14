//! Lossless FLAM acquisition. Only local copies and their metadata are written.
use super::{
    analyze::{Identity, Observation},
    scan::{Operation, Sink},
    store::{error, Store},
    Result,
};
use crate::{
    services::storyteller_device as driver,
    support::user_message::{codes, UserMessage},
};
use rusqlite::OptionalExtension;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::{
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
};
use uuid::Uuid;

const MANIFEST: &str = "flam-copy.json";
const COVER: &str = "flam-cover.png";
const METADATA_LIMIT: u64 = 512 * 1024;
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Metadata {
    format: String,
    version: u8,
    uuid: Uuid,
    title: Option<String>,
    hidden: bool,
    #[serde(default, skip_serializing_if = "Map::is_empty")]
    fields: Map<String, Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    cover: Option<String>,
}
pub(super) fn manifest(path: &Path) -> PathBuf {
    path.parent().unwrap_or(path).join(MANIFEST)
}
pub(super) fn is_copy(path: &Path) -> bool {
    path.is_dir() && manifest(path).is_file()
}
pub(super) fn metadata_bytes(path: &Path) -> std::io::Result<Vec<u8>> {
    let path = manifest(path);
    driver::safe(&path, false)
        .map_err(|_| std::io::Error::from(std::io::ErrorKind::PermissionDenied))?;
    let mut bytes = Vec::new();
    fs::File::open(path)?
        .take(METADATA_LIMIT + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() as u64 > METADATA_LIMIT {
        return Err(std::io::ErrorKind::InvalidData.into());
    }
    Ok(bytes)
}
pub(super) fn observe(path: &Path) -> std::result::Result<Observation, String> {
    let bytes = metadata_bytes(path).map_err(|_| "invalidPackStructure")?;
    let data: Metadata = serde_json::from_slice(&bytes).map_err(|_| "invalidPackStructure")?;
    if data.format != "story-studio-flam-copy"
        || ![1, 2].contains(&data.version)
        || path.file_name().and_then(|n| n.to_str()) != Some(data.uuid.to_string().as_str())
    {
        return Err("invalidPackStructure".into());
    }
    let mut out = Observation::new("flamDirectory");
    out.title = data.title.clone();
    out.identity = Some(Identity {
        raw: json!(data.uuid),
        value: Some(data.uuid.to_string()),
        source: "flamCopy".into(),
        reliable: true,
    });
    out.raw = serde_json::to_value(&data).unwrap();
    out.fields.insert(
        "/title".into(),
        super::analyze::observed(&out.raw, "/title", "string"),
    );
    for (field, value) in &data.fields {
        if !super::data::resolver::FIELDS.contains(&field.as_str()) || field == "cover" {
            continue;
        }
        let kind = match field.as_str() {
            "ageMin" | "ageMax" => "age",
            "versionDeclared" | "storyCount" | "durationSeconds" => "integer",
            "keywords" => "keywords",
            _ => "string",
        };
        let name = match field.as_str() {
            "ageMin" => "minAge",
            "versionDeclared" => "version",
            _ => field,
        };
        let pointer = format!("/packMetadata/{name}");
        out.fields.insert(
            pointer.clone(),
            super::analyze::observed(&json!({"packMetadata":{name:value}}), &pointer, kind),
        );
    }
    if data.cover.as_deref() == Some(COVER) {
        let cover = manifest(path).with_file_name(COVER);
        if driver::safe(&cover, false).is_ok() {
            out.cover = Some(json!({"kind":"file", "path":cover}));
        }
    }
    out.capabilities = json!({"readMetadata":{"state":"available"},"readCover":{"state": if out.cover.is_some() { "available" } else { "unavailable" }},"assessEditors":{"state":"unavailable","reason":"unsupportedFormat"},"openSimulation":{"state":"unavailable","reason":"unsupportedFormat"}});
    Ok(out)
}
// The catalogue indexes UUIDs globally. Derive a stable separate UUID for the
// FLAM family, retaining the original UUID in the observation and metadata.
pub(super) fn identity(id: Uuid) -> Uuid {
    use sha2::{Digest, Sha256};
    let mut hash = Sha256::new();
    hash.update(b"story-studio/flam-copy/v1");
    hash.update(id.as_bytes());
    let mut bytes: [u8; 16] = hash.finalize()[..16].try_into().unwrap();
    bytes[6] = (bytes[6] & 0x0f) | 0x80;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    Uuid::from_bytes(bytes)
}
struct Enrichment {
    fields: Map<String, Value>,
    cover: Option<Vec<u8>>,
}
impl Store {
    fn flam_copy_enrichment(&self, id: Uuid) -> Result<Enrichment> {
        use crate::services::storyteller_device::cards::CardCatalogue;
        let mut fields = self.read_snapshot(|c| {
            let raw: Option<String> = c
                .query_row(
                    "SELECT document_json FROM lunii_pack WHERE uuid=?1",
                    [id.to_string()],
                    |r| r.get(0),
                )
                .optional()?;
            let locale: String =
                c.query_row("SELECT locale FROM lunii_context WHERE id=1", [], |r| {
                    r.get(0)
                })?;
            Ok(raw
                .and_then(|raw| serde_json::from_str::<Value>(&raw).ok())
                .and_then(|pack| super::lunii_db::parse::localized(&pack, &locale))
                .and_then(|(_, values)| values.as_object().cloned())
                .unwrap_or_default())
        })?;
        let mut cover = self.official_device_cover(&id.to_string()).ok();
        if let Some((fiche, _, _)) = self.device_card_link(id)? {
            if let Some(card) = self.read_snapshot(|c| super::data::card::snapshot(c, &fiche))? {
                for field in card["fields"].as_array().into_iter().flatten() {
                    if let Some(name) = field["field"].as_str().filter(|name| *name != "cover") {
                        let value = &field["effective"]["value"];
                        if !value.is_null() {
                            fields.insert(name.into(), value.clone());
                        }
                    }
                }
            }
            if let Some(card) = self.card(id).ok().flatten() {
                if card.card.cover_png.is_some() {
                    cover = card.card.cover_png;
                }
            }
        }
        fields.retain(|name, value| {
            name != "cover"
                && super::data::resolver::FIELDS.contains(&name.as_str())
                && !value.is_null()
        });
        Ok(Enrichment { fields, cover })
    }
    /// Upgrade our existing local sidecars before startup reconciliation. Story
    /// payloads remain untouched; ordinary scans stay read-only.
    pub(crate) fn repair_flam_copy_metadata(&self) -> Result<()> {
        let paths = self.read_snapshot(|c| {
            let mut query = c.prepare("SELECT DISTINCT e.anchor_json FROM exemplar e JOIN cache.observation o ON o.exemplar_id=e.id WHERE o.format='flamDirectory' AND e.retired=0 AND NOT EXISTS(SELECT 1 FROM fiche_forgotten f WHERE f.fiche_id=e.fiche_id) AND EXISTS(SELECT 1 FROM cache.coverage v JOIN source s ON s.id=v.source_id WHERE v.exemplar_id=e.id AND s.status='active')")?;
            let paths = query.query_map([], |r| r.get::<_, String>(0))?.collect::<rusqlite::Result<Vec<_>>>();
            paths
        })?;
        for anchor in paths {
            let anchor: Value = serde_json::from_str(&anchor).map_err(error)?;
            let Some(path) = anchor["path"].as_str().map(PathBuf::from) else {
                continue;
            };
            // Inspect only indexed copies, with bounded reads for offline sources.
            let owned = path.clone();
            let Some(Ok(bytes)) =
                super::probe::bounded(&path, super::probe::PROBE_TIMEOUT, move || {
                    metadata_bytes(&owned)
                })
            else {
                continue;
            };
            let Ok(metadata) = serde_json::from_slice::<Metadata>(&bytes) else {
                continue;
            };
            if metadata.format != "story-studio-flam-copy"
                || ![1, 2].contains(&metadata.version)
                || path.file_name().and_then(|n| n.to_str())
                    != Some(metadata.uuid.to_string().as_str())
            {
                continue;
            }
            let enrichment = self.flam_copy_enrichment(metadata.uuid)?;
            let owned = path.clone();
            let _ = super::probe::bounded(&path, super::probe::PROBE_TIMEOUT, move || {
                upgrade_metadata(&owned, metadata, enrichment)
            });
        }
        Ok(())
    }
    pub(crate) fn flam_copy_link(&self, id: Uuid) -> Result<Option<String>> {
        self.read_snapshot(|c| c.query_row("SELECT e.fiche_id FROM exemplar e JOIN pack_identity p ON p.fiche_id=e.fiche_id WHERE p.pack_uuid=?1 AND e.retired=0 AND NOT EXISTS(SELECT 1 FROM fiche_forgotten f WHERE f.fiche_id=e.fiche_id) LIMIT 1", [identity(id).to_string()], |r| r.get(0)).optional())
    }
}
fn upgrade_metadata(path: &Path, mut metadata: Metadata, enrichment: Enrichment) -> Result<()> {
    let before = serde_json::to_vec(&metadata).map_err(error)?;
    for (name, value) in enrichment.fields {
        metadata.fields.entry(name).or_insert(value);
    }
    if let Some(title) = &metadata.title {
        metadata.fields.insert("title".into(), json!(title));
    }
    let new_cover = metadata
        .cover
        .is_none()
        .then_some(enrichment.cover)
        .flatten();
    if new_cover.is_some() {
        metadata.cover = Some(COVER.into());
    }
    metadata.version = 2;
    let after = serde_json::to_vec_pretty(&metadata).map_err(error)?;
    if serde_json::to_vec(&metadata).map_err(error)? == before {
        return Ok(());
    }
    let sidecar = manifest(path);
    let directory = sidecar.parent().unwrap();
    driver::safe(directory, true).map_err(UserMessage::from)?;
    let own = super::writes::OwnWrite::begin(
        super::writes::Declaration::new("flamMetadataRepair").subtree(directory),
    );
    let temp = directory.join(format!(".story-studio-write-{}", Uuid::new_v4()));
    fs::create_dir(&temp).map_err(error)?;
    let staging = Staging(temp);
    if let Some(cover) = new_cover {
        let file = staging.0.join(COVER);
        fs::write(&file, cover).map_err(error)?;
        crate::support::file_sync::sync_file(&file).map_err(error)?;
        // A pre-existing user file is never replaced by backfill.
        if !directory.join(COVER).exists() {
            super::files::publish::no_replace(&file, &directory.join(COVER))?;
        }
    }
    let file = staging.0.join(MANIFEST);
    fs::write(&file, after).map_err(error)?;
    crate::support::file_sync::sync_file(&file).map_err(error)?;
    super::files::publish::replace(&file, &sidecar)?;
    own.succeeded(vec![path.to_owned()]);
    Ok(())
}

fn check(cancel: &AtomicBool) -> Result<()> {
    if cancel.load(Ordering::SeqCst) {
        Err(UserMessage::new(codes::STORYTELLER_SEND_CANCELLED))
    } else {
        Ok(())
    }
}
fn safe(path: &Path, directory: bool) -> Result<()> {
    driver::safe(path, directory).map_err(Into::into)
}
// Notify after every chunk so cancellation does not wait for a whole resource.
fn copy_tree(
    source: &Path,
    output: &Path,
    cancel: &AtomicBool,
    notify: &mut impl FnMut(u64),
    count: &mut u64,
    depth: usize,
) -> Result<()> {
    check(cancel)?;
    safe(source, true)?;
    if depth > super::walk::MAX_DEPTH {
        return Err(driver::Error::UnsafePath.into());
    }
    fs::create_dir(output).map_err(error)?;
    for entry in
        fs::read_dir(source).map_err(|_| UserMessage::from(driver::Error::IncompleteStory))?
    {
        check(cancel)?;
        *count += 1;
        if *count > super::walk::MAX_ITEMS as u64 {
            return Err(driver::Error::IncompleteStory.into());
        }
        let entry = entry.map_err(|_| UserMessage::from(driver::Error::IncompleteStory))?;
        let src = entry.path();
        let dst = output.join(entry.file_name());
        let metadata = fs::symlink_metadata(&src)
            .map_err(|_| UserMessage::from(driver::Error::IncompleteStory))?;
        if metadata.is_dir() {
            copy_tree(&src, &dst, cancel, notify, count, depth + 1)?;
            continue;
        }
        safe(&src, false)?;
        let mut input =
            fs::File::open(&src).map_err(|_| UserMessage::from(driver::Error::IncompleteStory))?;
        let mut target = fs::File::create_new(&dst).map_err(error)?;
        let mut buffer = [0; 65536];
        let mut copied = 0;
        loop {
            check(cancel)?;
            let n = input
                .read(&mut buffer)
                .map_err(|_| UserMessage::from(driver::Error::IncompleteStory))?;
            if n == 0 {
                break;
            }
            target.write_all(&buffer[..n]).map_err(error)?;
            copied += n as u64;
            notify(n as u64);
        }
        if copied != metadata.len()
            || fs::metadata(&src)
                .map_err(|_| UserMessage::from(driver::Error::IncompleteStory))?
                .modified()
                .ok()
                != metadata.modified().ok()
        {
            return Err(driver::Error::Changed.into());
        }
        target.sync_all().map_err(error)?;
    }
    super::files::publish::sync_directory(output)?;
    check(cancel)
}
struct Staging(PathBuf);
impl Drop for Staging {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

/// Returns the catalogue card and revision; an existing FLAM UUID is a typed skip.
#[cfg(test)]
pub(crate) fn import(
    store: &Store,
    root: &Path,
    id: Uuid,
    workspace: &Path,
    cancel: &AtomicBool,
    mut notify: impl FnMut(u64),
) -> Result<(String, i64)> {
    import_with_publication(store, root, id, workspace, cancel, &mut notify, || {
        check(cancel)
    })
}
fn import_with_publication(
    store: &Store,
    root: &Path,
    id: Uuid,
    workspace: &Path,
    cancel: &AtomicBool,
    notify: &mut impl FnMut(u64),
    publish: impl FnOnce() -> Result<()>,
) -> Result<(String, i64)> {
    let _heavy = store.scans.heavy.lock().map_err(error)?;
    check(cancel)?;
    if store.flam_copy_link(id)?.is_some() {
        return Err(UserMessage::new(codes::STORYTELLER_ALREADY_IN_CATALOGUE));
    }
    let inventory = store
        .flam_inventory(root, &driver::NativeVolumes)
        .map_err(|e| {
            if !driver::flam::is_device(root) {
                UserMessage::new(codes::STORYTELLER_REPATRIATE_DISCONNECTED)
            } else {
                e
            }
        })?;
    let story = inventory
        .stories
        .iter()
        .find(|s| s.uuid == id)
        .ok_or_else(|| UserMessage::from(driver::Error::MissingStory))?;
    if inventory.playlist_error || !story.complete {
        return Err(driver::Error::IncompleteStory.into());
    }
    // A misconfigured workspace must never turn a read-only import into a
    // write on FLAM, including when the workspace reaches it through a link.
    let resolved_workspace = fs::canonicalize(workspace)
        .map_err(|_| UserMessage::new(codes::STORYTELLER_WORKSPACE_UNAVAILABLE))?;
    if resolved_workspace.starts_with(fs::canonicalize(root).map_err(error)?) {
        return Err(driver::Error::UnsafePath.into());
    }
    let target = super::RepatriationTarget::prepare(workspace)?;
    let directory = fs::canonicalize(&target.directory).map_err(error)?;
    // A wrapper publishes the original folder and adjacent metadata in one rename.
    let destination = directory.join(format!("{id}.flam"));
    let temporary = directory.join(format!(".story-studio-write-{}", Uuid::new_v4()));
    let own = super::writes::OwnWrite::begin(
        super::writes::Declaration::new("flamImport")
            .temporary(&temporary)
            .subtree(&destination),
    );
    fs::create_dir(&temporary).map_err(error)?;
    let staging = Staging(temporary);
    let path = staging.0.join(id.to_string());
    let source = root
        .join(if story.hidden { "str.hidden" } else { "str" })
        .join(id.to_string());
    let acquisition = copy_tree(&source, &path, cancel, notify, &mut 0, 0);
    acquisition.map_err(|e| {
        if !driver::flam::is_device(root) {
            UserMessage::new(codes::STORYTELLER_REPATRIATE_DISCONNECTED)
        } else {
            e
        }
    })?;
    let mut metadata = Metadata {
        format: "story-studio-flam-copy".into(),
        version: 2,
        uuid: id,
        title: story.title.clone(),
        hidden: story.hidden,
        fields: Map::new(),
        cover: None,
    };
    let enrichment = store.flam_copy_enrichment(id)?;
    metadata.fields = enrichment.fields;
    if let Some(title) = &metadata.title {
        metadata.fields.insert("title".into(), json!(title));
    }
    if let Some(cover) = enrichment.cover {
        let mut file = fs::File::create_new(staging.0.join(COVER)).map_err(error)?;
        file.write_all(&cover).map_err(error)?;
        file.sync_all().map_err(error)?;
        metadata.cover = Some(COVER.into());
    }
    let mut file = fs::File::create_new(staging.0.join(MANIFEST)).map_err(error)?;
    file.write_all(&serde_json::to_vec_pretty(&metadata).map_err(error)?)
        .map_err(error)?;
    file.sync_all().map_err(error)?;
    super::files::publish::sync_directory(&staging.0)?;
    publish()?;
    let owned_id = super::writes::file_id(&staging.0);
    if let Err(e) = super::files::publish::no_replace(&staging.0, &destination) {
        if owned_id.is_some() && super::writes::file_id(&destination) == owned_id {
            let _ = fs::remove_dir_all(&destination);
        }
        return Err(e);
    }
    let final_path = destination.join(id.to_string());
    let result = (|| {
        let source = format!("flam-import-{}", Uuid::new_v4());
        let items = super::scan::observe(
            &source,
            &final_path,
            &super::scan::token(&final_path),
            &AtomicBool::new(false),
            &store.activity,
            true,
        );
        if items.len() != 1
            || items[0].observation.format != "flamDirectory"
            || items[0].observation.state != "available"
        {
            return Err(error("FLAM copy observation refused"));
        }
        let published = store.publish_repatriated_items(&directory, &source, &items)?;
        let fiche = store
            .flam_copy_link(id)?
            .ok_or_else(|| error("FLAM copy identity missing"))?;
        Ok((fiche, published.revision))
    })();
    if result.is_err() {
        let _ = fs::remove_dir_all(&destination);
    }
    own.finish(&result, |_| vec![final_path]);
    result
}

pub(crate) fn run(
    store: Arc<Store>,
    root: PathBuf,
    id: Uuid,
    workspace: PathBuf,
    op: Arc<Operation>,
    sink: Sink,
) {
    op.emit(&sink, false);
    let result = import_with_publication(
        &store,
        &root,
        id,
        &workspace,
        &op.cancel,
        &mut |bytes| {
            if let Ok(mut p) = op.progress.lock() {
                p.phase = "reconstructing".into();
                let total = p
                    .result
                    .as_ref()
                    .and_then(|v| v["copiedBytes"].as_u64())
                    .unwrap_or(0)
                    + bytes;
                p.result = Some(json!({"copiedBytes":total}));
            }
            op.emit(&sink, false);
        },
        || {
            let _p = op.progress.lock().map_err(error)?;
            check(&op.cancel)?;
            op.published.store(true, Ordering::SeqCst);
            Ok(())
        },
    );
    if let Ok(mut p) = op.progress.lock() {
        p.scan_complete = true;
        p.candidates.processed = 1;
        match result {
            Ok((fiche, revision)) => {
                p.status = "success".into();
                p.catalogue_changed = true;
                p.catalogue_revision = revision;
                p.sources_revision = store.sources_revision().unwrap_or(p.sources_revision);
                p.cards.created = 1;
                p.outcomes.indexed_new = 1;
                p.result = Some(json!({"progress":100,"catalogueFicheId":fiche}));
            }
            Err(e) if e.code == codes::STORYTELLER_ALREADY_IN_CATALOGUE => {
                p.status = "success".into();
                p.outcomes.ignored = 1;
                p.result = Some(json!({"progress":100,"alreadyPresent":true}));
            }
            Err(e) => {
                p.status = if op.cancel.load(Ordering::SeqCst) {
                    "cancelled"
                } else {
                    "failed"
                }
                .into();
                p.error = Some(driver::classify_error(
                    crate::services::storyteller::send::safe_reason(e),
                    "preparing",
                ));
                p.outcomes.refused = 1;
            }
        }
    }
    op.emit(&sink, true);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::catalogue::store::Store;
    use std::{
        collections::BTreeMap,
        fs,
        path::{Path, PathBuf},
        sync::atomic::AtomicBool,
    };
    use uuid::Uuid;
    struct Temp(PathBuf);
    impl Temp {
        fn new() -> Self {
            let p = std::env::temp_dir().join(format!("flam-copy-{}", Uuid::new_v4()));
            fs::create_dir(&p).unwrap();
            Self(p)
        }
    }
    impl Drop for Temp {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn snapshot(root: &Path) -> BTreeMap<PathBuf, Vec<u8>> {
        fn walk(root: &Path, p: &Path, out: &mut BTreeMap<PathBuf, Vec<u8>>) {
            for e in fs::read_dir(p).unwrap() {
                let p = e.unwrap().path();
                if p.is_dir() {
                    walk(root, &p, out);
                } else {
                    out.insert(
                        p.strip_prefix(root).unwrap().to_owned(),
                        fs::read(p).unwrap(),
                    );
                }
            }
        }
        let mut out = BTreeMap::new();
        walk(root, root, &mut out);
        out
    }
    fn device(root: &Path, id: Uuid, hidden: bool) -> PathBuf {
        fs::write(root.join(".mdf"), [0; 50]).unwrap();
        fs::create_dir_all(root.join("etc/library")).unwrap();
        fs::write(
            root.join("etc/library/list"),
            if hidden {
                String::new()
            } else {
                id.to_string()
            },
        )
        .unwrap();
        if hidden {
            fs::write(root.join("etc/library/list.hidden"), id.to_string()).unwrap();
        }
        let story = root
            .join(if hidden { "str.hidden" } else { "str" })
            .join(id.to_string());
        fs::create_dir_all(story.join("media")).unwrap();
        for name in ["info", "key", "main.lsf", "version", "media/unknown.bin"] {
            fs::write(story.join(name), format!("original:{name}")).unwrap();
        }
        story
    }
    fn cached_title(root: &Path, id: Uuid, title: &str) {
        let mut record = vec![0; 4];
        record.extend(1u32.to_le_bytes());
        for text in [id.to_string(), format!("/str/{id}"), title.into()] {
            record.extend(((text.len() + 1) as u16).to_le_bytes());
            record.extend(text.as_bytes());
            record.push(0);
        }
        let len = record.len() as u32;
        record[..4].copy_from_slice(&len.to_le_bytes());
        let mut data = vec![0; 68];
        data[..4].copy_from_slice(&1u32.to_le_bytes());
        data.extend(72u32.to_le_bytes());
        data.extend(record);
        fs::create_dir_all(root.join("usr/0")).unwrap();
        fs::write(root.join("usr/0/library.cache"), data).unwrap();
    }
    #[test]
    fn import_preserves_device_and_folder_and_survives_a_fresh_catalogue_scan() {
        let source = Temp::new();
        let local = Temp::new();
        let db = Temp::new();
        let id = Uuid::parse_str("12345678-1234-4321-8321-123456789abc").unwrap();
        let original = device(&source.0, id, true);
        cached_title(&source.0, id, "Une histoire conservée");
        let before = snapshot(&source.0);
        let store = Store::open(&db.0.join("data"), &db.0.join("cache")).unwrap();
        let result = import(
            &store,
            &source.0,
            id,
            &local.0,
            &AtomicBool::new(false),
            |_| {},
        )
        .unwrap();
        assert_eq!(snapshot(&source.0), before);
        let entries = store.query_entries(100, None, false).unwrap();
        assert_eq!(entries.items.len(), 1);
        let entry = &entries.items[0];
        let path = PathBuf::from(entry["exemplars"][0]["locator"]["path"].as_str().unwrap());
        assert_eq!(snapshot(&path), snapshot(&original));
        assert_eq!(entry["exemplars"][0]["format"], "flamDirectory");
        assert!(path.parent().unwrap().join("flam-copy.json").is_file());
        assert_eq!(entry["exemplars"][0]["observation"]["raw"]["hidden"], true);
        assert!(!result.0.is_empty());
        assert_eq!(
            entry["exemplars"][0]["observation"]["title"],
            "Une histoire conservée"
        );
        fs::remove_dir_all(&source.0).unwrap();
        fs::create_dir(&source.0).unwrap();
        let fresh_db = Temp::new();
        let fresh =
            Arc::new(Store::open(&fresh_db.0.join("data"), &fresh_db.0.join("cache")).unwrap());
        let source = fresh
            .add_source(&local.0, fresh.sources_revision().unwrap(), false)
            .unwrap();
        let _ = source;
        let receipt = fresh
            .start_scan(
                None,
                Uuid::new_v4().to_string(),
                fresh.sources_revision().unwrap(),
                fresh_db.0.join("cache"),
                fresh_db.0.join("data"),
                Arc::new(|_, _| {}),
            )
            .unwrap();
        let deadline = std::time::Instant::now();
        loop {
            let progress = fresh.get_operation(&receipt.operation_id).unwrap();
            if !["queued", "running", "cancelling"].contains(&progress.status.as_str()) {
                assert_eq!(progress.status, "success");
                break;
            }
            assert!(deadline.elapsed() < crate::test_support::timeout());
            std::thread::sleep(std::time::Duration::from_millis(5));
        }
        let rescanned = fresh.query_entries(100, None, false).unwrap();
        assert_eq!(rescanned.items.len(), 1);
        let copy = &rescanned.items[0]["exemplars"][0];
        assert_eq!(copy["locator"]["path"], path.to_str().unwrap());
        assert_eq!(copy["observation"]["identity"]["value"], id.to_string());
        assert_eq!(copy["observation"]["raw"]["hidden"], true);
    }
    #[test]
    fn duplicate_uuid_is_skipped_across_devices_and_changed_versions_without_overwrite() {
        let source = Temp::new();
        let other = Temp::new();
        let local = Temp::new();
        let db = Temp::new();
        let id = Uuid::new_v4();
        device(&source.0, id, false);
        let changed = device(&other.0, id, true);
        fs::write(changed.join("main.lsf"), b"a different version").unwrap();
        let store = Store::open(&db.0.join("data"), &db.0.join("cache")).unwrap();
        import(
            &store,
            &source.0,
            id,
            &local.0,
            &AtomicBool::new(false),
            |_| {},
        )
        .unwrap();
        let before = snapshot(&local.0);
        assert_eq!(
            import(
                &store,
                &other.0,
                id,
                &local.0,
                &AtomicBool::new(false),
                |_| {}
            )
            .unwrap_err()
            .code,
            codes::STORYTELLER_ALREADY_IN_CATALOGUE
        );
        assert_eq!(snapshot(&local.0), before);
        assert_eq!(
            store.query_entries(100, None, false).unwrap().items.len(),
            1
        );
    }
    #[test]
    fn interrupted_imports_discard_partial_data_and_keep_completed_stories_then_retry() {
        for disconnect in [false, true] {
            let source = Temp::new();
            let local = Temp::new();
            let db = Temp::new();
            let first = Uuid::new_v4();
            let second = Uuid::new_v4();
            let first_path = device(&source.0, first, false);
            let store = Store::open(&db.0.join("data"), &db.0.join("cache")).unwrap();
            import(
                &store,
                &source.0,
                first,
                &local.0,
                &AtomicBool::new(false),
                |_| {},
            )
            .unwrap();
            let finished = snapshot(&local.0);
            let second_path = device(&source.0, second, false);
            fs::write(second_path.join("media/large"), vec![11; 200000]).unwrap();
            let cancel = AtomicBool::new(false);
            let mut interrupted = false;
            let result = import(&store, &source.0, second, &local.0, &cancel, |_| {
                if !interrupted {
                    interrupted = true;
                    if disconnect {
                        fs::remove_file(source.0.join(".mdf")).unwrap();
                        fs::remove_dir_all(&second_path).unwrap();
                    } else {
                        cancel.store(true, Ordering::SeqCst);
                    }
                }
            });
            assert_eq!(
                result.unwrap_err().code,
                if disconnect {
                    codes::STORYTELLER_REPATRIATE_DISCONNECTED
                } else {
                    codes::STORYTELLER_SEND_CANCELLED
                }
            );
            assert_eq!(snapshot(&local.0), finished);
            assert_eq!(
                store.query_entries(100, None, false).unwrap().items.len(),
                1
            );
            assert!(first_path.is_dir());
            device(&source.0, second, false);
            import(
                &store,
                &source.0,
                second,
                &local.0,
                &AtomicBool::new(false),
                |_| {},
            )
            .unwrap();
            assert_eq!(
                store.query_entries(100, None, false).unwrap().items.len(),
                2
            );
        }
    }
    #[test]
    fn existing_destination_is_never_replaced() {
        let source = Temp::new();
        let local = Temp::new();
        let db = Temp::new();
        let id = Uuid::new_v4();
        device(&source.0, id, false);
        let collision = local.0.join("packs-rapatries").join(format!("{id}.flam"));
        fs::create_dir_all(&collision).unwrap();
        fs::write(collision.join("keep"), b"original local content").unwrap();
        let before = snapshot(&local.0);
        let store = Store::open(&db.0.join("data"), &db.0.join("cache")).unwrap();
        assert!(import(
            &store,
            &source.0,
            id,
            &local.0,
            &AtomicBool::new(false),
            |_| {}
        )
        .is_err());
        assert_eq!(snapshot(&local.0), before);
        assert!(store
            .query_entries(100, None, false)
            .unwrap()
            .items
            .is_empty());
    }

    #[test]
    fn index_stories_with_same_title_stay_distinct_and_do_not_collide_with_other_formats() {
        let source = Temp::new();
        let local = Temp::new();
        let db = Temp::new();
        let store = Store::open(&db.0.join("data"), &db.0.join("cache")).unwrap();
        let first = Uuid::new_v4();
        let second = Uuid::new_v4();
        let zip_path = db.0.join("ordinary.zip");
        let mut zip = zip::ZipWriter::new(fs::File::create(&zip_path).unwrap());
        zip.start_file("story.json", zip::write::SimpleFileOptions::default())
            .unwrap();
        zip.write_all(
            serde_json::to_string(
                &json!({"title":"Même titre","stageNodes":[{"uuid":first,"squareOne":true}]}),
            )
            .unwrap()
            .as_bytes(),
        )
        .unwrap();
        zip.finish().unwrap();
        store
            .publish_repatriated_story(&zip_path, first, &local.0, "Même titre")
            .unwrap();
        for id in [first, second] {
            let path = device(&source.0, id, false);
            cached_title(&source.0, id, "Même titre");
            fs::remove_file(path.join("main.lsf")).unwrap();
            fs::remove_file(path.join("version")).unwrap();
            for name in ["ni", "li", "ri", "si"] {
                fs::write(path.join(name), b"unchanged index bytes").unwrap();
            }
            import(
                &store,
                &source.0,
                id,
                &local.0,
                &AtomicBool::new(false),
                |_| {},
            )
            .unwrap();
        }
        assert_eq!(
            store.query_entries(100, None, false).unwrap().items.len(),
            3
        );
    }
    #[test]
    fn workspace_on_the_device_is_refused_without_any_device_write() {
        let source = Temp::new();
        let db = Temp::new();
        let id = Uuid::new_v4();
        device(&source.0, id, false);
        let before = snapshot(&source.0);
        let store = Store::open(&db.0.join("data"), &db.0.join("cache")).unwrap();
        assert!(import(
            &store,
            &source.0,
            id,
            &source.0,
            &AtomicBool::new(false),
            |_| {}
        )
        .is_err());
        assert_eq!(snapshot(&source.0), before);
    }
    fn rescan(store: &Arc<Store>, db: &Path) {
        let receipt = store
            .start_scan(
                None,
                Uuid::new_v4().to_string(),
                store.sources_revision().unwrap(),
                db.join("cache"),
                db.join("data"),
                Arc::new(|_, _| {}),
            )
            .unwrap();
        let start = std::time::Instant::now();
        loop {
            let p = store.get_operation(&receipt.operation_id).unwrap();
            if !["queued", "running", "cancelling"].contains(&p.status.as_str()) {
                assert_eq!(p.status, "success");
                break;
            }
            assert!(start.elapsed() < crate::test_support::timeout());
            std::thread::sleep(std::time::Duration::from_millis(5));
        }
    }
    #[test]
    fn local_flam_copy_keeps_available_metadata_and_cover_after_device_disconnection() {
        let source = Temp::new();
        let local = Temp::new();
        let db = Temp::new();
        let id = Uuid::new_v4();
        device(&source.0, id, false);
        let store = Store::open(&db.0.join("data"), &db.0.join("cache")).unwrap();
        store.lunii_locale("fr").unwrap();
        let document = json!({"localized_infos":{"fr_FR":{"title":"Histoire complète","description":"Une description conservée","subtitle":"Sous-titre"}},"ageMin":7,"author":"Autrice","language":"fr","keywords":["Aventure"]});
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
        let cover_dir = db.0.join("data/catalogue/lunii-device-covers");
        fs::create_dir_all(&cover_dir).unwrap();
        image::RgbImage::from_pixel(16, 16, image::Rgb([20, 100, 200]))
            .save(cover_dir.join(format!("{id}.png")))
            .unwrap();
        import(
            &store,
            &source.0,
            id,
            &local.0,
            &AtomicBool::new(false),
            |_| {},
        )
        .unwrap();
        fs::remove_dir_all(&source.0).unwrap();
        fs::create_dir(&source.0).unwrap();
        let entries = store.query_entries(100, None, false).unwrap();
        let entry = &entries.items[0];
        assert_eq!(entry["values"]["description"], "Une description conservée");
        assert_eq!(entry["values"]["author"], "Autrice");
        assert_eq!(entry["values"]["language"], "fr");
        assert_eq!(entry["values"]["ageMin"], 7);
        let exemplar = &entry["exemplars"][0];
        let cover = super::super::analyze::read_cover(
            &exemplar["locator"],
            &exemplar["observation"],
            65536,
        )
        .unwrap();
        assert_eq!(
            cover,
            fs::read(cover_dir.join(format!("{id}.png"))).unwrap()
        );
        assert_eq!(
            store
                .get_thumbnail(None, entry["id"].as_str(), None)
                .unwrap()
                .state,
            "ready"
        );
        // A previously known upper bound is part of the portable snapshot too.
        let path = PathBuf::from(exemplar["locator"]["path"].as_str().unwrap());
        let mut metadata: Value =
            serde_json::from_slice(&fs::read(manifest(&path)).unwrap()).unwrap();
        metadata["fields"]["ageMax"] = json!(12);
        fs::write(manifest(&path), serde_json::to_vec(&metadata).unwrap()).unwrap();
        // Move the complete copy and rebuild in a catalogue with no official DB
        // or device cover cache: only the copied files may supply information.
        let moved = Temp::new();
        fs::rename(local.0.join("packs-rapatries"), moved.0.join("copies")).unwrap();
        let fresh_db = Temp::new();
        let fresh =
            Arc::new(Store::open(&fresh_db.0.join("data"), &fresh_db.0.join("cache")).unwrap());
        fresh
            .add_source(&moved.0, fresh.sources_revision().unwrap(), false)
            .unwrap();
        rescan(&fresh, &fresh_db.0);
        let entries = fresh.query_entries(100, None, false).unwrap();
        let entry = &entries.items[0];
        assert_eq!(entry["values"]["description"], "Une description conservée");
        assert_eq!(entry["values"]["author"], "Autrice");
        assert_eq!(entry["values"]["language"], "fr");
        assert_eq!(entry["values"]["ageMin"], 7);
        assert_eq!(entry["values"]["ageMax"], 12);
        assert_eq!(
            fresh
                .get_thumbnail(None, entry["id"].as_str(), None)
                .unwrap()
                .state,
            "ready"
        );
    }
    #[test]
    fn existing_title_only_copies_recover_metadata_and_cover_on_restart_without_copying_again() {
        let source = Temp::new();
        let local = Temp::new();
        let db = Temp::new();
        let id = Uuid::new_v4();
        let original = device(&source.0, id, false);
        let original_bytes = snapshot(&original);
        let store = Store::open(&db.0.join("data"), &db.0.join("cache")).unwrap();
        store.lunii_locale("fr").unwrap();
        import(
            &store,
            &source.0,
            id,
            &local.0,
            &AtomicBool::new(false),
            |_| {},
        )
        .unwrap();
        let entries = store.query_entries(100, None, false).unwrap();
        let path = PathBuf::from(
            entries.items[0]["exemplars"][0]["locator"]["path"]
                .as_str()
                .unwrap(),
        );
        fs::write(manifest(&path), serde_json::to_vec(&json!({"format":"story-studio-flam-copy","version":1,"uuid":id,"title":"Titre conservé","hidden":false})).unwrap()).unwrap();
        let document = json!({"localized_infos":{"fr_FR":{"title":"Titre officiel","description":"Description récupérée"}},"author":"Auteur connu","ageMin":6,"language":"fr"});
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
        let cover_dir = db.0.join("data/catalogue/lunii-device-covers");
        fs::create_dir_all(&cover_dir).unwrap();
        image::RgbImage::from_pixel(16, 16, image::Rgb([30, 40, 50]))
            .save(cover_dir.join(format!("{id}.png")))
            .unwrap();
        drop(store);
        fs::remove_dir_all(&source.0).unwrap();
        fs::create_dir(&source.0).unwrap();
        let reopened = Arc::new(Store::open(&db.0.join("data"), &db.0.join("cache")).unwrap());
        rescan(&reopened, &db.0);
        let entries = reopened.query_entries(100, None, false).unwrap();
        assert_eq!(entries.items.len(), 1);
        let entry = &entries.items[0];
        assert_eq!(entry["displayTitle"], "Titre conservé");
        assert_eq!(entry["values"]["description"], "Description récupérée");
        assert_eq!(entry["values"]["author"], "Auteur connu");
        assert_eq!(entry["values"]["ageMin"], 6);
        assert_eq!(
            reopened
                .get_thumbnail(None, entry["id"].as_str(), None)
                .unwrap()
                .state,
            "ready"
        );
        assert_eq!(snapshot(&path), original_bytes);
    }
}
