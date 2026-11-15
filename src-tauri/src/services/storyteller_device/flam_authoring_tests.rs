use super::*;
use std::cell::Cell;
struct Volume(PathBuf);
impl Volumes for Volume {
    fn mounted_removable(&self) -> super::super::Result<Vec<PathBuf>> {
        Ok(vec![self.0.clone()])
    }
    fn capacity(&self, _: &Path) -> super::super::Result<(u64, u64)> {
        Ok((u64::MAX, u64::MAX))
    }
}
struct Fixture {
    temp: Temporary,
    root: PathBuf,
    pack: PathBuf,
    backups: PathBuf,
    id: Uuid,
}
impl Fixture {
    fn new() -> Self {
        let temp = Temporary::new(&std::env::temp_dir()).unwrap();
        let root = temp.0.join("device");
        fs::create_dir(&root).unwrap();
        for dir in ["str", "str.hidden", "etc/library", "usr/0/progress"] {
            fs::create_dir_all(root.join(dir)).unwrap();
        }
        let mut marker = vec![0; 126];
        marker[..2].copy_from_slice(&[1, 0]);
        marker[2..13].copy_from_slice(b"main: 2.4.2");
        marker[50..74].copy_from_slice(b"123456789012345678901234");
        marker[78..94].copy_from_slice(b"0123456789abcdef");
        marker[94..110].copy_from_slice(b"fedcba9876543210");
        fs::write(root.join(".mdf"), marker).unwrap();
        let witness = Uuid::new_v4();
        fs::create_dir(root.join("str").join(witness.to_string())).unwrap();
        fs::write(
            root.join("str").join(witness.to_string()).join("witness"),
            b"histoire temoin",
        )
        .unwrap();
        fs::write(root.join("etc/library/list"), format!("{witness}\n")).unwrap();
        fs::write(
            root.join("etc/library/list.hidden"),
            format!("{}\n", Uuid::new_v4()),
        )
        .unwrap();
        fs::write(root.join("usr/0/library.cache"), b"cache temoin").unwrap();
        fs::write(root.join("usr/0/progress/witness"), b"partie temoin").unwrap();
        let doc: serde_json::Value = serde_json::from_str(include_str!(
            "../../../../src/store/flamAdventure/example.json"
        ))
        .unwrap();
        let id = Uuid::parse_str(doc["id"].as_str().unwrap()).unwrap();
        let pack = pack::generate(doc, &temp.0, &|| false, &|_| {}).unwrap();
        let backups = temp.0.join("backups");
        Self {
            temp,
            root,
            pack,
            backups,
            id,
        }
    }
    fn run(&self, cancel: &impl Fn() -> bool, progress: &impl Fn(&str)) -> Result<PathBuf> {
        install(
            &self.pack,
            &self.root,
            &self.backups,
            &Volume(self.root.clone()),
            cancel,
            progress,
        )
    }
    fn snapshot(&self) -> std::collections::BTreeMap<PathBuf, Vec<u8>> {
        fn walk(
            root: &Path,
            path: &Path,
            result: &mut std::collections::BTreeMap<PathBuf, Vec<u8>>,
        ) {
            for entry in fs::read_dir(path).unwrap() {
                let path = entry.unwrap().path();
                if path.is_dir() {
                    walk(root, &path, result);
                } else {
                    result.insert(
                        path.strip_prefix(root).unwrap().to_owned(),
                        fs::read(path).unwrap(),
                    );
                }
            }
        }
        let mut result = std::collections::BTreeMap::new();
        walk(&self.root, &self.root, &mut result);
        result
    }
}
#[test]
fn install_verifies_ciphertext_backs_up_list_cache_and_preserves_witnesses() {
    let f = Fixture::new();
    let before = f.snapshot();
    let backup = f.run(&|| false, &|_| {}).unwrap();
    assert_eq!(
        fs::read(backup.join("library-list")).unwrap(),
        before[Path::new("etc/library/list")]
    );
    assert_eq!(
        fs::read(backup.join("library.cache")).unwrap(),
        before[Path::new("usr/0/library.cache")]
    );
    let destination = f.root.join("str").join(f.id.to_string());
    assert!(destination.join("main.lsf").is_file());
    assert!(!destination.join("main.lua").exists());
    let (_, key, iv) = material(&f.root).unwrap();
    let expected = encrypt(pack::RUNTIME[0].1.as_bytes(), &key, &iv).unwrap();
    assert_eq!(fs::read(destination.join("main.lsf")).unwrap(), expected);
    let after = f.snapshot();
    for (name, data) in before {
        if name != Path::new("etc/library/list") && name != Path::new("usr/0/library.cache") {
            assert_eq!(after[&name], data);
        }
    }
    assert_eq!(
        listed(&after[Path::new("etc/library/list")])
            .unwrap()
            .last(),
        Some(&f.id)
    );
    assert!(!f.root.join("usr/0/library.cache").exists());
    let before = f.snapshot();
    assert!(matches!(
        f.run(&|| false, &|_| {}),
        Err(Error::AlreadyExists)
    ));
    assert_eq!(f.snapshot(), before);
}
#[test]
fn cancellations_before_and_after_registration_restore_the_device() {
    for stop in ["copy", "register", "verification-publiee"] {
        let f = Fixture::new();
        let before = f.snapshot();
        let cancelled = Cell::new(false);
        let verifications = Cell::new(0);
        let result = f.run(&|| cancelled.get(), &|step| {
            if step == "verify" {
                verifications.set(verifications.get() + 1);
            }
            if step == stop || (stop == "verification-publiee" && verifications.get() == 2) {
                cancelled.set(true)
            }
        });
        assert!(
            matches!(result, Err(Error::Cancelled)),
            "{stop}: {result:?}"
        );
        assert_eq!(f.snapshot(), before);
        assert!(!f.root.join("str").join(f.id.to_string()).exists());
    }
}
#[test]
fn hidden_or_orphan_identity_and_tampered_content_are_refused_before_device_writes() {
    for hidden in [false, true] {
        let f = Fixture::new();
        let parent = if hidden { "str.hidden" } else { "str" };
        fs::create_dir(f.root.join(parent).join(f.id.to_string().to_uppercase())).unwrap();
        let before = f.snapshot();
        assert!(matches!(
            f.run(&|| false, &|_| {}),
            Err(Error::AlreadyExists)
        ));
        assert_eq!(f.snapshot(), before);
    }
    let f = Fixture::new();
    fs::write(f.pack.join("adventure.plain.pk"), b"tampered").unwrap();
    let before = f.snapshot();
    assert!(f.run(&|| false, &|_| {}).is_err());
    assert_eq!(f.snapshot(), before);
}
#[test]
fn external_library_change_is_never_overwritten_by_rollback() {
    let f = Fixture::new();
    let mut foreign = fs::read(f.root.join("etc/library/list")).unwrap();
    foreign.extend(format!("{}\n", Uuid::new_v4()).as_bytes());
    let result = f.run(&|| false, &|step| {
        if step == "register" {
            fs::write(f.root.join("etc/library/list"), &foreign).unwrap()
        }
    });
    assert!(matches!(result, Err(Error::RecoveryRequired)));
    assert_eq!(fs::read(f.root.join("etc/library/list")).unwrap(), foreign);
    assert!(f.root.join("str").join(f.id.to_string()).is_dir());
    assert_eq!(fs::read_dir(&f.backups).unwrap().count(), 1);
    assert!(f.temp.0.is_dir());
}
#[cfg(unix)]
#[test]
fn symlinked_media_and_device_paths_are_refused() {
    let f = Fixture::new();
    let link = f.temp.0.join("alias");
    std::os::unix::fs::symlink(&f.root, &link).unwrap();
    assert!(install(
        &f.pack,
        &link,
        &f.backups,
        &Volume(link.clone()),
        &|| false,
        &|_| {}
    )
    .is_err());
    let before = f.snapshot();
    fs::remove_file(f.root.join("usr/0/library.cache")).unwrap();
    std::os::unix::fs::symlink(
        f.root.join("usr/0/progress/witness"),
        f.root.join("usr/0/library.cache"),
    )
    .unwrap();
    assert!(f.run(&|| false, &|_| {}).is_err());
    assert_eq!(
        fs::read(f.root.join("usr/0/progress/witness")).unwrap(),
        before[Path::new("usr/0/progress/witness")]
    );
}

#[test]
fn aes_cbc_matches_the_independent_nist_block_vector() {
    let key = [
        0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6, 0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f,
        0x3c,
    ];
    let iv = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    let plain = [
        0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96, 0xe9, 0x3d, 0x7e, 0x11, 0x73, 0x93, 0x17,
        0x2a,
    ];
    assert_eq!(
        encrypt(&plain, &key, &iv).unwrap(),
        [
            0x76, 0x49, 0xab, 0xac, 0x81, 0x19, 0xb2, 0x46, 0xce, 0xe9, 0x8e, 0x9b, 0x12, 0xe9,
            0x19, 0x7d
        ]
    );
}
