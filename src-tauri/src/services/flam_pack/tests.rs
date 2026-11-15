use super::*;
use std::{
    process::Command,
    sync::atomic::{AtomicBool, Ordering},
};
fn example() -> Value {
    serde_json::from_str(include_str!(
        "../../../../src/store/flamAdventure/example.json"
    ))
    .unwrap()
}
fn temp() -> Temporary {
    Temporary::new(&std::env::temp_dir()).unwrap()
}

#[test]
fn generated_folder_is_readable_portable_and_bounded() {
    let id = Uuid::parse_str(example()["id"].as_str().unwrap()).unwrap();
    assert_eq!(
        pack_folder_name("Les compagnons du village", id),
        format!("Les_compagnons_du_village--{id}.flam")
    );
    for title in ["../../CON:<clé>/?", "...", "", &"é".repeat(300)] {
        let name = pack_folder_name(title, id);
        assert_eq!(Path::new(&name).components().count(), 1);
        assert!(!name.contains(['/', '\\', ':', '<', '>', '?', '*', '"']));
        assert!(name.len() < 255);
        assert!(name.ends_with(&format!("--{id}.flam")));
    }
    assert_ne!(
        pack_folder_name("Même titre", id),
        pack_folder_name("Même titre", Uuid::new_v4())
    );
}

#[test]
fn pack_roundtrip_validates_runtime_identity_paths_and_hashes() {
    let temporary = temp();
    let mut doc = example();
    doc["title"] = Value::String("Texte \"é\" \\ ]===]\n\0return os.exit()".into());
    let output = generate(doc.clone(), &temporary.0, &|| false, &|_| {}).unwrap();
    assert_eq!(
        output.file_name().unwrap().to_str().unwrap(),
        pack_folder_name(
            doc["title"].as_str().unwrap(),
            Uuid::parse_str(doc["id"].as_str().unwrap()).unwrap()
        )
    );
    let checked = read_pack(&output, &|| false).unwrap();
    assert_eq!(checked.id.to_string(), doc["id"].as_str().unwrap());
    assert_eq!(checked.title, doc["title"]);
    // Le nom du dossier n'est pas une identité de contenu : les anciens packs
    // et les dossiers renommés restent chargeables par le même installateur.
    let legacy = temporary.0.join(format!("{}.flam", checked.id));
    fs::rename(&output, &legacy).unwrap();
    assert_eq!(read_pack(&legacy, &|| false).unwrap().id, checked.id);
    fs::rename(&legacy, &output).unwrap();
    assert!(matches!(
        generate(doc.clone(), &temporary.0, &|| false, &|_| {}),
        Err(Error::AlreadyExists)
    ));
    // Le vrai interpréteur charge le vrai runtime extrait du pack de production.
    let extracted = Temporary::new(&temporary.0).unwrap();
    for (name, data) in &checked.files {
        let path = extracted.0.join(name);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, data).unwrap();
    }
    let script = format!("local rules=require('rules'); assert(rules.data.title=={}); assert(rules.validPartie(rules.initialPartie())); local n=rules.transition(rules.initialPartie(),'choisir-pisteur',{{}}); assert(n and n.classId=='pisteur'); require('passage'); dofile('main.lua'); assert(type(setup)=='function')", document::lua(&doc["title"]));
    fs::write(extracted.0.join("check.lua"), script).unwrap();
    let status = Command::new("lua")
        .current_dir(&extracted.0)
        .env("LUA_PATH", "./script/?.lua;;")
        .arg("check.lua")
        .output()
        .unwrap();
    assert!(
        status.status.success(),
        "{}",
        String::from_utf8_lossy(&status.stderr)
    );
    let mut manifest: Value =
        serde_json::from_slice(&fs::read(output.join("manifest.json")).unwrap()).unwrap();
    manifest["uuid"] = Value::String(Uuid::new_v4().to_string());
    fs::write(
        output.join("manifest.json"),
        serde_json::to_vec(&manifest).unwrap(),
    )
    .unwrap();
    assert!(matches!(
        read_pack(&output, &|| false),
        Err(Error::InvalidPack)
    ));
}

#[test]
fn invalid_documents_missing_media_and_cancellation_never_publish() {
    let temporary = temp();
    let mut invalid = example();
    invalid["rolls"][0]["outcomes"][0]["max"] = 9.into();
    assert!(matches!(
        generate(invalid, &temporary.0, &|| false, &|_| {}),
        Err(Error::InvalidDocument)
    ));
    let mut missing = example();
    missing["scenes"][0]["audio"] = Value::String(
        temporary
            .0
            .join("missing.wav")
            .to_string_lossy()
            .into_owned(),
    );
    assert!(generate(missing, &temporary.0, &|| false, &|_| {}).is_err());
    let cancel = AtomicBool::new(false);
    assert!(matches!(
        generate(
            example(),
            &temporary.0,
            &|| cancel.load(Ordering::SeqCst),
            &|_| cancel.store(true, Ordering::SeqCst)
        ),
        Err(Error::Cancelled)
    ));
    assert_eq!(fs::read_dir(&temporary.0).unwrap().count(), 0);
}

#[test]
fn prepares_real_stereo_mp3_and_seek_map_without_narrating_text() {
    let temporary = temp();
    let input = temporary.0.join("source.wav");
    let ffmpeg = crate::support::ffmpeg::get_ffmpeg_path().unwrap();
    assert!(Command::new(ffmpeg)
        .args([
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=440:duration=2.3"
        ])
        .arg(&input)
        .status()
        .unwrap()
        .success());
    let mut doc = example();
    doc["scenes"][0]["audio"] = Value::String(input.to_string_lossy().into_owned());
    let image = temporary.0.join("source.png");
    image::RgbImage::new(640, 480).save(&image).unwrap();
    doc["scenes"][0]["image"] = Value::String(image.to_string_lossy().into_owned());
    let output = generate(doc, &temporary.0, &|| false, &|_| {}).unwrap();
    let checked = read_pack(&output, &|| false).unwrap();
    assert!(checked.files.contains_key("sounds/0-stereo.mp3"));
    assert!(checked.files.contains_key("images/0.jpg"));
    assert!(!checked.files.contains_key("sounds/1-stereo.mp3"));
    let map = &checked.files["sounds/0-stereo.mp3map"];
    assert_eq!(map.len(), 28);
    let mut corrupt = checked.files["sounds/0-stereo.mp3"].clone();
    corrupt[2] = 0x98;
    assert!(media::audio_map(&corrupt).is_err());
}

#[test]
fn production_pack_runs_the_full_lua_harness_with_reopened_authoring_document() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
    for with_audio in [false, true] {
        let temporary = temp();
        let fixture = Command::new("node").current_dir(root).args(["--input-type=module","-e",&format!("import {{fixture}} from './scripts/flamRuntimeFixture.mjs'; process.stdout.write(JSON.stringify(fixture({with_audio})))")]).output().unwrap();
        assert!(fixture.status.success());
        // Même sérialisation JSON que l'enveloppe sauvegardée puis rouverte.
        let mut doc: Value = serde_json::from_slice(&fixture.stdout).unwrap();
        if with_audio {
            let input = temporary.0.join("source.wav");
            assert!(
                Command::new(crate::support::ffmpeg::get_ffmpeg_path().unwrap())
                    .args([
                        "-v",
                        "error",
                        "-f",
                        "lavfi",
                        "-i",
                        "sine=frequency=440:duration=1"
                    ])
                    .arg(&input)
                    .status()
                    .unwrap()
                    .success()
            );
            for scene in doc["scenes"].as_array_mut().unwrap() {
                scene["audio"] = Value::String(input.to_string_lossy().into_owned());
            }
        }
        let output = generate(doc, &temporary.0, &|| false, &|_| {}).unwrap();
        let checked = read_pack(&output, &|| false).unwrap();
        let extracted = Temporary::new(&temporary.0).unwrap();
        for (name, bytes) in checked.files {
            let path = extracted.0.join(name);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, bytes).unwrap();
        }
        let result = Command::new("lua")
            .current_dir(root)
            .arg(root.join("scripts/check-flam-runtime.lua"))
            .arg(&extracted.0)
            .output()
            .unwrap();
        assert!(
            result.status.success(),
            "{}\n{}",
            String::from_utf8_lossy(&result.stdout),
            String::from_utf8_lossy(&result.stderr)
        );
        assert!(String::from_utf8_lossy(&result.stdout).contains("OK : parcours complet"));
    }
}

#[test]
fn manifest_hashes_cannot_authorize_foreign_lua_or_archive_paths() {
    for target in ["script/rules.lua", "../outside.lua"] {
        let temporary = temp();
        let folder = generate(example(), &temporary.0, &|| false, &|_| {}).unwrap();
        let mut checked = read_pack(&folder, &|| false).unwrap();
        checked.files.insert(target.into(), b"os.exit(1)".to_vec());
        let mut manifest: Manifest =
            serde_json::from_slice(&fs::read(folder.join("manifest.json")).unwrap()).unwrap();
        manifest.files = checked
            .files
            .iter()
            .map(|(name, data)| (name.clone(), hash(data)))
            .collect();
        fs::write(
            folder.join("manifest.json"),
            serde_json::to_vec(&manifest).unwrap(),
        )
        .unwrap();
        let mut zip =
            zip::ZipWriter::new(fs::File::create(folder.join("adventure.plain.pk")).unwrap());
        for (name, data) in checked.files {
            zip.start_file(name, zip::write::SimpleFileOptions::default())
                .unwrap();
            zip.write_all(&data).unwrap();
        }
        zip.finish().unwrap();
        assert!(matches!(
            read_pack(&folder, &|| false),
            Err(Error::InvalidPack)
        ));
    }
}

#[test]
fn structure_unknown_fields_and_rule_references_are_checked_at_the_native_boundary() {
    let mut doc = example();
    doc["scenes"][0]["script"] = Value::String("print('hello')".into());
    assert!(document::validate(&doc).is_err());
    let mut doc = example();
    doc["choices"][0]["effects"][0]["classId"] = Value::String("absente".into());
    assert!(document::validate(&doc).is_err());
    let mut doc = example();
    doc["choices"][3]["effects"][0]["quantity"] = (-1).into();
    assert!(document::validate(&doc).is_err());
}
