//! Installation d'une identité neuve, exclusivement depuis un pack recontrôlé.
use super::{platform, Volumes};
use crate::services::flam_pack::{
    self as pack, check, hash, read, safe, write, CheckedPack, Error, Result, Temporary,
};
use aes::{
    cipher::{BlockEncrypt, KeyInit},
    Aes128,
};
use serde_json::json;
use std::{
    fs,
    path::{Path, PathBuf},
};
use uuid::Uuid;

fn encrypt(bytes: &[u8], key: &[u8], iv: &[u8]) -> Result<Vec<u8>> {
    let cipher = Aes128::new_from_slice(key).map_err(|_| Error::UnsupportedDevice)?;
    let mut result = bytes.to_vec();
    result.resize((bytes.len() + 15) / 16 * 16, 0);
    let mut previous = iv.to_vec();
    for block in result.chunks_mut(16) {
        for (byte, prev) in block.iter_mut().zip(&previous) {
            *byte ^= prev;
        }
        cipher.encrypt_block(block.into());
        previous.copy_from_slice(block);
    }
    Ok(result)
}
fn material(root: &Path) -> Result<(Vec<u8>, Vec<u8>, Vec<u8>)> {
    safe(root)?;
    let data = read(&root.join(".mdf"), 126)?;
    if data.len() != 126 || data[..2] != [1, 0] {
        return Err(Error::UnsupportedDevice);
    }
    let firmware = std::str::from_utf8(&data[2..50])
        .map_err(|_| Error::UnsupportedDevice)?
        .trim_end_matches('\0');
    let main = firmware
        .lines()
        .next()
        .unwrap_or("")
        .strip_prefix("main: ")
        .unwrap_or(firmware);
    if !matches!(main.split('-').next(), Some("2.4.1" | "2.4.2")) {
        return Err(Error::UnsupportedDevice);
    }
    let serial = &data[50..74];
    let digits = serial.split(|b| *b == 0).next().unwrap_or(&[]);
    if digits.is_empty() || !digits.iter().all(u8::is_ascii_digit) {
        return Err(Error::UnsupportedDevice);
    }
    let keyfile = serial.iter().cycle().take(32).copied().collect();
    Ok((keyfile, data[78..94].to_vec(), data[94..110].to_vec()))
}
fn optional(path: &Path) -> Result<Option<Vec<u8>>> {
    safe(path)?;
    if path.try_exists()? {
        Ok(Some(read(path, 16 * 1024 * 1024)?))
    } else {
        Ok(None)
    }
}
fn listed(bytes: &[u8]) -> Result<Vec<Uuid>> {
    std::str::from_utf8(bytes)
        .map_err(|_| Error::UnsupportedDevice)?
        .lines()
        .filter(|s| !s.trim().is_empty())
        .map(|s| Uuid::parse_str(s.trim()).map_err(|_| Error::UnsupportedDevice))
        .collect()
}
fn absent(root: &Path, id: Uuid, list: &[u8], hidden: Option<&[u8]>) -> Result<()> {
    for dir in ["str", "str.hidden"] {
        let parent = root.join(dir);
        safe(&parent)?;
        if parent.try_exists()? {
            // FAT est insensible à la casse ; le volume synthétique doit l'être aussi.
            for entry in fs::read_dir(parent)? {
                if entry?.file_name().to_string_lossy().parse::<Uuid>().ok() == Some(id) {
                    return Err(Error::AlreadyExists);
                }
            }
        }
    }
    if listed(list)?.contains(&id) || listed(hidden.unwrap_or_default())?.contains(&id) {
        return Err(Error::AlreadyExists);
    }
    Ok(())
}
fn replace(path: &Path, data: &[u8]) -> Result<()> {
    safe(path)?;
    let temp = path.with_file_name(format!(".flam-{}.tmp", Uuid::new_v4()));
    write(&temp, data)?;
    let result = platform::replace(&temp, path).map_err(|_| Error::Io);
    let _ = fs::remove_file(&temp);
    result
}
fn barrier(root: &Path) -> Result<()> {
    platform::sync_volume(root).map_err(|_| Error::Io)
}

pub(crate) fn install(
    folder: &Path,
    root: &Path,
    backups: &Path,
    volumes: &impl Volumes,
    cancel: &impl Fn() -> bool,
    progress: &impl Fn(&str),
) -> Result<PathBuf> {
    let mutation = super::writes::mutation(root);
    let _guard = mutation.try_lock().map_err(|_| Error::Busy)?;
    let content = pack::read_pack(folder, cancel)?;
    install_checked(content, root, backups, volumes, cancel, progress)
}
fn install_checked(
    content: CheckedPack,
    root: &Path,
    backups: &Path,
    volumes: &impl Volumes,
    cancel: &impl Fn() -> bool,
    progress: &impl Fn(&str),
) -> Result<PathBuf> {
    if !volumes
        .mounted_removable()
        .map_err(|_| Error::UnsupportedDevice)?
        .contains(&root.to_path_buf())
        || !volumes.writable(root).map_err(|_| Error::Io)?
    {
        return Err(Error::UnsupportedDevice);
    }
    let (keyfile, key, iv) = material(root)?;
    for directory in ["str", "etc/library", "usr/0"] {
        super::safe(&root.join(directory), true).map_err(|_| Error::UnsafePath)?;
    }
    let marker = read(&root.join(".mdf"), 126)?;
    let playlist = root.join("etc/library/list");
    let hidden_path = root.join("etc/library/list.hidden");
    let cache_path = root.join("usr/0/library.cache");
    let original = read(&playlist, 400_000)?;
    let hidden = optional(&hidden_path)?;
    absent(root, content.id, &original, hidden.as_deref())?;
    let old_cache = optional(&cache_path)?;
    check(cancel)?;
    let required: u64 = content
        .files
        .values()
        .map(|v| v.len() as u64 + 8192)
        .sum::<u64>()
        + 1024 * 1024;
    if volumes.capacity(root).map_err(|_| Error::Io)?.0 < required {
        return Err(Error::Io);
    }
    safe(backups)?;
    fs::create_dir_all(backups)?;
    let backup = backups.join(Uuid::new_v4().to_string());
    fs::create_dir(&backup)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&backup, fs::Permissions::from_mode(0o700))?;
    }
    write(&backup.join("library-list"), &original)?;
    if let Some(cache) = &old_cache {
        write(&backup.join("library.cache"), cache)?;
    }
    if let Some(hidden) = &hidden {
        write(&backup.join("library-list.hidden"), hidden)?;
    }
    let mut changed = original.clone();
    if !changed.is_empty() && !changed.ends_with(b"\n") {
        changed.push(b'\n');
    }
    changed.extend(format!("{}\n", content.id).as_bytes());
    let temporary = Temporary::new(&root.join("str"))?;
    let stage = temporary.0.join(content.id.to_string());
    fs::create_dir(&stage)?;
    let mut hashes = std::collections::BTreeMap::new();
    progress("copy");
    for (name, data) in &content.files {
        check(cancel)?;
        if name == "uuid.bin" {
            continue;
        }
        let (target, payload) = if name == "info.plain" {
            ("info".into(), encrypt(data, &key, &iv)?)
        } else if let Some(stem) = name.strip_suffix(".lua") {
            (format!("{stem}.lsf"), encrypt(data, &key, &iv)?)
        } else {
            (name.clone(), data.clone())
        };
        let path = stage.join(&target);
        fs::create_dir_all(path.parent().unwrap())?;
        write(&path, &payload)?;
        if read(&path, 512 * 1024 * 1024)? != payload {
            return Err(Error::Io);
        }
        hashes.insert(target, hash(&payload));
    }
    write(&stage.join("key"), &keyfile)?;
    hashes.insert("key".into(), hash(&keyfile));
    write(
        &backup.join("installation.json"),
        &serde_json::to_vec_pretty(&json!({
            "uuid": content.id.to_string(), "title": content.title, "files": hashes,
            "playlistBefore": hash(&original), "playlistAfter": hash(&changed), "hardwareValidation": "pending",
        }))?,
    )?;
    platform::sync_dir(&backup).map_err(|_| Error::Io)?;
    platform::sync_dir(backups).map_err(|_| Error::Io)?;
    if let Some(parent) = backups.parent() {
        platform::sync_dir(parent).map_err(|_| Error::Io)?;
    }
    let destination = root.join("str").join(content.id.to_string());
    let unchanged = || -> Result<()> {
        if read(&root.join(".mdf"), 126)? != marker
            || read(&playlist, 400_000)? != original
            || optional(&hidden_path)? != hidden
            || optional(&cache_path)? != old_cache
        {
            return Err(Error::DeviceChanged);
        }
        absent(root, content.id, &original, hidden.as_deref())
    };
    progress("verify");
    check(cancel)?;
    unchanged()?;
    barrier(root)?;
    check(cancel)?;
    unchanged()?;
    // La publication exclusive ne remplace jamais un dossier concurrent, même vide.
    if crate::services::catalogue::files::publish::no_replace(&stage, &destination).is_err() {
        // Le renommage peut avoir réussi avant l'échec de sa barrière locale.
        return Err(if !stage.try_exists()? && destination.try_exists()? {
            Error::RecoveryRequired
        } else {
            Error::DeviceChanged
        });
    }
    let outcome = (|| {
        check(cancel)?;
        progress("register");
        if read(&playlist, 400_000)? != original
            || optional(&hidden_path)? != hidden
            || optional(&cache_path)? != old_cache
        {
            return Err(Error::DeviceChanged);
        }
        replace(&playlist, &changed)?;
        check(cancel)?;
        if optional(&cache_path)? != old_cache {
            return Err(Error::DeviceChanged);
        }
        if old_cache.is_some() {
            fs::remove_file(&cache_path)?;
        }
        progress("verify");
        barrier(root)?;
        check(cancel)?;
        if read(&playlist, 400_000)? != changed {
            return Err(Error::Io);
        }
        for (name, digest) in &hashes {
            if hash(&read(&destination.join(name), 512 * 1024 * 1024)?) != *digest {
                return Err(Error::Io);
            }
        }
        Ok(())
    })();
    if let Err(error) = outcome {
        // Restaurer seulement une liste que nous reconnaissons. Une intervention
        // externe ou une lecture incertaine conserve le dossier et le reçu.
        let rollback = (|| -> Result<()> {
            let current = read(&playlist, 400_000)?;
            if current == changed {
                replace(&playlist, &original)?;
            } else if current != original {
                return Err(Error::RecoveryRequired);
            }
            barrier(root)?;
            if read(&playlist, 400_000)? != original {
                return Err(Error::RecoveryRequired);
            }
            fs::remove_dir_all(&destination)?;
            if optional(&cache_path)?.is_none() {
                if let Some(cache) = &old_cache {
                    write(&cache_path, cache)?;
                }
            }
            barrier(root)?;
            Ok(())
        })();
        if rollback.is_err() {
            return Err(Error::RecoveryRequired);
        }
        return Err(error);
    }
    progress("installed");
    Ok(backup)
}

#[cfg(test)]
#[path = "flam_authoring_tests.rs"]
mod tests;
