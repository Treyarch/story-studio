//! Pack d'aventure FLAM contrôlé. Aucun accès appareil dans ce module.
mod document;
mod media;
mod shape;
#[cfg(test)]
mod tests;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
};
use uuid::Uuid;

pub(crate) type Result<T> = std::result::Result<T, Error>;
#[derive(Debug, Serialize)]
#[serde(tag = "code")]
pub(crate) enum Error {
    InvalidDocument,
    InvalidPack,
    MediaUnavailable,
    Cancelled,
    AlreadyExists,
    UnsafePath,
    UnsupportedDevice,
    DeviceChanged,
    RecoveryRequired,
    Busy,
    Io,
}
impl From<std::io::Error> for Error {
    fn from(_: std::io::Error) -> Self {
        Self::Io
    }
}
impl From<serde_json::Error> for Error {
    fn from(_: serde_json::Error) -> Self {
        Self::InvalidPack
    }
}
impl From<zip::result::ZipError> for Error {
    fn from(_: zip::result::ZipError) -> Self {
        Self::InvalidPack
    }
}

pub(crate) const RUNTIME: [(&str, &str); 4] = [
    (
        "main.lua",
        include_str!("../../../../src/flamRuntime/lua/main.lua"),
    ),
    (
        "script/passage.lua",
        include_str!("../../../../src/flamRuntime/lua/passage.lua"),
    ),
    (
        "script/rules.lua",
        include_str!("../../../../src/flamRuntime/lua/rules.lua"),
    ),
    (
        "script/savegame.lua",
        include_str!("../../../../src/flamRuntime/lua/savegame.lua"),
    ),
];
const LIMIT: u64 = 512 * 1024 * 1024;
pub(crate) fn hash(data: &[u8]) -> String {
    format!("{:x}", Sha256::digest(data))
}
pub(crate) fn check(cancel: &impl Fn() -> bool) -> Result<()> {
    if cancel() {
        Err(Error::Cancelled)
    } else {
        Ok(())
    }
}
pub(crate) fn safe(path: &Path) -> Result<()> {
    if !path.is_absolute() {
        return Err(Error::UnsafePath);
    }
    let mut current = PathBuf::new();
    for part in path.components() {
        if matches!(
            part,
            std::path::Component::ParentDir | std::path::Component::CurDir
        ) {
            return Err(Error::UnsafePath);
        }
        current.push(part);
        match fs::symlink_metadata(&current) {
            Ok(meta)
                if meta.file_type().is_symlink()
                    || crate::services::storyteller_device::platform::is_reparse(&meta) =>
            {
                return Err(Error::UnsafePath)
            }
            Ok(_) => (),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
            Err(e) => return Err(e.into()),
        }
    }
    Ok(())
}
pub(crate) fn read(path: &Path, limit: u64) -> Result<Vec<u8>> {
    safe(path)?;
    let file = fs::File::open(path)?;
    if !file.metadata()?.is_file() || file.metadata()?.len() > limit {
        return Err(Error::InvalidPack);
    }
    let mut data = Vec::new();
    file.take(limit + 1).read_to_end(&mut data)?;
    if data.len() as u64 > limit {
        return Err(Error::InvalidPack);
    }
    Ok(data)
}
pub(crate) fn write(path: &Path, data: &[u8]) -> Result<()> {
    let mut file = fs::File::create_new(path)?;
    file.write_all(data)?;
    file.sync_all()?;
    Ok(())
}
pub(crate) struct Temporary(pub PathBuf);
impl Temporary {
    pub(crate) fn new(parent: &Path) -> Result<Self> {
        safe(parent)?;
        let path = parent.join(format!(".story-studio-flam-{}", Uuid::new_v4()));
        fs::create_dir(&path)?;
        Ok(Self(path))
    }
}
impl Drop for Temporary {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Manifest {
    version: u8,
    uuid: Uuid,
    document: Value,
    files: BTreeMap<String, String>,
}
pub(crate) struct CheckedPack {
    pub id: Uuid,
    pub title: String,
    pub files: BTreeMap<String, Vec<u8>>,
}
fn data_module(doc: &Value) -> Vec<u8> {
    format!(
        "-- Document FLAM validé, version 1.\nreturn {}\n",
        document::lua(doc)
    )
    .into_bytes()
}
fn info(doc: &Value) -> Vec<u8> {
    let title: String = doc["title"]
        .as_str()
        .unwrap_or("")
        .chars()
        .map(|c| if c.is_control() { ' ' } else { c })
        .collect();
    format!("{title}\nStory Studio\n000000\n{title}").into_bytes()
}

fn pack_folder_name(title: &str, id: Uuid) -> String {
    let cleaned = crate::native_pack::sanitized_project_name(title);
    // Laisser de la place à l'identité et à l'extension, même en UTF-8.
    let mut stem = String::new();
    for ch in cleaned.chars().take(100) {
        if stem.len() + ch.len_utf8() > 180 {
            break;
        }
        stem.push(ch);
    }
    let stem = stem.trim_end_matches(['.', ' ']);
    format!("{stem}--{id}.flam")
}

pub(crate) fn generate(
    mut doc: Value,
    output: &Path,
    cancel: &impl Fn() -> bool,
    progress: &impl Fn(&str),
) -> Result<PathBuf> {
    document::validate(&doc)?;
    safe(output)?;
    let id = Uuid::parse_str(doc["id"].as_str().unwrap()).map_err(|_| Error::InvalidDocument)?;
    let destination = output.join(pack_folder_name(doc["title"].as_str().unwrap(), id));
    if destination.try_exists()? {
        return Err(Error::AlreadyExists);
    }
    check(cancel)?;
    let stage = Temporary::new(output)?;
    let mut files: BTreeMap<String, Vec<u8>> = RUNTIME
        .iter()
        .map(|(n, v)| (n.to_string(), v.as_bytes().to_vec()))
        .collect();
    for (index, scene) in doc["scenes"].as_array_mut().unwrap().iter_mut().enumerate() {
        check(cancel)?;
        progress("media");
        for kind in ["audio", "image"] {
            if let Some(source) = scene[kind].as_str() {
                safe(Path::new(source)).map_err(|_| Error::MediaUnavailable)?;
                let name = if kind == "audio" {
                    format!("sounds/{index}-stereo.mp3")
                } else {
                    format!("images/{index}.jpg")
                };
                let bytes = if kind == "audio" {
                    media::audio(Path::new(source), &stage.0, cancel)?
                } else {
                    media::image(Path::new(source))?
                };
                if kind == "audio" {
                    files.insert(format!("{name}map"), media::audio_map(&bytes)?);
                }
                files.insert(name.clone(), bytes);
                if files.values().map(|bytes| bytes.len() as u64).sum::<u64>() > LIMIT {
                    return Err(Error::InvalidPack);
                }
                // Les chemins Lua sont relatifs au dossier de ressources du firmware.
                scene[kind] = Value::String(name.split_once('/').unwrap().1.into());
            }
        }
    }
    files.insert("script/adventure_data.lua".into(), data_module(&doc));
    files.insert("info.plain".into(), info(&doc));
    files.insert("version".into(), b"1".to_vec());
    files.insert("uuid.bin".into(), id.as_bytes().to_vec());
    progress("verify");
    let manifest = Manifest {
        version: 1,
        uuid: id,
        document: doc,
        files: files.iter().map(|(n, b)| (n.clone(), hash(b))).collect(),
    };
    let archive_path = stage.0.join("adventure.plain.pk");
    let mut archive = zip::ZipWriter::new(fs::File::create_new(&archive_path)?);
    for (name, data) in &files {
        check(cancel)?;
        archive.start_file(
            name,
            zip::write::SimpleFileOptions::default()
                .compression_method(zip::CompressionMethod::Stored),
        )?;
        archive.write_all(data)?;
    }
    archive.finish()?.sync_all()?;
    drop(files);
    write(
        &stage.0.join("manifest.json"),
        &serde_json::to_vec_pretty(&manifest)?,
    )?;
    read_pack(&stage.0, cancel)?;
    check(cancel)?;
    crate::services::catalogue::files::publish::no_replace(&stage.0, &destination)
        .map_err(|_| Error::AlreadyExists)?;
    progress("ready");
    Ok(destination)
}

pub(crate) fn read_pack(folder: &Path, cancel: &impl Fn() -> bool) -> Result<CheckedPack> {
    check(cancel)?;
    let manifest: Manifest =
        serde_json::from_slice(&read(&folder.join("manifest.json"), 16 * 1024 * 1024)?)?;
    if manifest.version != 1 {
        return Err(Error::InvalidPack);
    }
    document::validate(&manifest.document)?;
    let doc = &manifest.document;
    if doc["id"].as_str().and_then(|id| Uuid::parse_str(id).ok()) != Some(manifest.uuid) {
        return Err(Error::InvalidPack);
    }
    let mut expected: BTreeMap<String, Vec<u8>> = RUNTIME
        .iter()
        .map(|(n, v)| (n.to_string(), v.as_bytes().to_vec()))
        .collect();
    expected.insert("uuid.bin".into(), manifest.uuid.as_bytes().to_vec());
    expected.insert("version".into(), b"1".to_vec());
    expected.insert("info.plain".into(), info(doc));
    expected.insert("script/adventure_data.lua".into(), data_module(doc));
    let mut media_names = Vec::new();
    for (index, scene) in doc["scenes"].as_array().unwrap().iter().enumerate() {
        for (kind, ext, dir) in [("audio", "mp3", "sounds"), ("image", "jpg", "images")] {
            if !scene[kind].is_null() {
                let filename = if kind == "audio" {
                    format!("{index}-stereo.{ext}")
                } else {
                    format!("{index}.{ext}")
                };
                if scene[kind] != filename {
                    return Err(Error::InvalidPack);
                }
                media_names.push(format!("{dir}/{filename}"));
                if kind == "audio" {
                    media_names.push(format!("{dir}/{filename}map"));
                }
            }
        }
    }
    let archive_bytes = read(&folder.join("adventure.plain.pk"), LIMIT)?;
    let mut archive = zip::ZipArchive::new(std::io::Cursor::new(archive_bytes))?;
    if archive.len() != expected.len() + media_names.len() {
        return Err(Error::InvalidPack);
    }
    let mut files = BTreeMap::new();
    let mut total = 0u64;
    let mut actual_total = 0u64;
    for i in 0..archive.len() {
        check(cancel)?;
        let entry = archive.by_index(i)?;
        let name = entry.name().to_owned();
        if (!expected.contains_key(&name) && !media_names.contains(&name))
            || files.contains_key(&name)
            || entry.size() > LIMIT
        {
            return Err(Error::InvalidPack);
        }
        total = total
            .checked_add(entry.size())
            .filter(|n| *n <= LIMIT)
            .ok_or(Error::InvalidPack)?;
        let mut data = Vec::new();
        entry.take(LIMIT + 1).read_to_end(&mut data)?;
        actual_total = actual_total
            .checked_add(data.len() as u64)
            .filter(|n| *n <= LIMIT)
            .ok_or(Error::InvalidPack)?;
        if data.len() as u64 > LIMIT
            || manifest.files.get(&name) != Some(&hash(&data))
            || expected.get(&name).is_some_and(|bytes| bytes != &data)
        {
            return Err(Error::InvalidPack);
        }
        files.insert(name, data);
    }
    if files.len() != manifest.files.len() {
        return Err(Error::InvalidPack);
    }
    for name in &media_names {
        if name.ends_with(".mp3")
            && files.get(&format!("{name}map")) != Some(&media::audio_map(&files[name])?)
        {
            return Err(Error::InvalidPack);
        }
        if name.ends_with(".jpg") {
            media::validate_image(&files[name])?;
        }
    }
    Ok(CheckedPack {
        id: manifest.uuid,
        title: doc["title"].as_str().unwrap().into(),
        files,
    })
}
