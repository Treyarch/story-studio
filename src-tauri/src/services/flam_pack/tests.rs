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
    assert!(checked.files.contains_key("img/1.lif"));
    assert!(!checked.files.contains_key("sounds/1-stereo.mp3"));
    let map = &checked.files["sounds/0-stereo.mp3map"];
    assert_eq!(map.len(), 28);
    let audio = &checked.files["sounds/0-stereo.mp3"];
    // Garder le profil Audio B effectivement validé sur la FLAM : ID3v2.3
    // et trame Info/Xing, puis une table pointant sur le premier paquet audio.
    assert!(
        audio.starts_with(b"ID3\x03"),
        "Le profil matériel perd son en-tête ID3v2.3"
    );
    let first = u32::from_le_bytes(map[4..8].try_into().unwrap()) as usize;
    assert!(first > 0);
    assert!(audio[..first]
        .windows(4)
        .any(|w| w == b"Info" || w == b"Xing"));
    assert_eq!(&audio[first..first + 2], &[0xff, 0xfb]);
    let mut corrupt = audio.clone();
    corrupt[first + 2] = 0x98;
    assert!(media::audio_map(&corrupt).is_err());
}

#[test]
fn seek_map_excludes_metadata_and_rejects_truncation() {
    let mut frame = vec![0u8; 417];
    frame[..4].copy_from_slice(&[0xff, 0xfb, 0x90, 0]);
    let plain = frame.repeat(2);
    let plain_map = media::audio_map(&plain).unwrap();
    assert_eq!(&plain_map[..12], &[0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    let mut tagged = b"ID3\x03\0\0\0\0\0\x03abc".to_vec();
    let mut info = frame.clone();
    info[36..40].copy_from_slice(b"Info");
    tagged.extend(info);
    tagged.extend(&plain);
    let map = media::audio_map(&tagged).unwrap();
    assert_eq!(u32::from_le_bytes(map[4..8].try_into().unwrap()), 430);
    assert_eq!(
        &map[..4],
        &plain_map[..4],
        "Info ne contribue pas à la durée"
    );

    for invalid in [
        &tagged[..9],                // en-tête ID3 tronqué
        &tagged[..13],               // aucune trame
        &tagged[..430],              // Info sans paquet audio
        &tagged[..tagged.len() - 1], // dernier paquet tronqué
    ] {
        assert!(media::audio_map(invalid).is_err());
    }
    tagged[6] = 0x80; // taille ID3 non synchsafe
    assert!(media::audio_map(&tagged).is_err());
    tagged[6..10].copy_from_slice(&[0x7f; 4]);
    assert!(media::audio_map(&tagged).is_err());
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

#[test]
fn replay_audio_on_return_accepts_legacy_documents_and_only_boolean_values() {
    let mut doc = example();
    assert!(document::validate(&doc).is_ok());
    for value in [true, false] {
        doc["choices"][0]["replayAudioOnReturn"] = value.into();
        assert!(document::validate(&doc).is_ok());
    }
    for value in [Value::Null, Value::String("false".into()), 0.into()] {
        doc["choices"][0]["replayAudioOnReturn"] = value;
        assert!(document::validate(&doc).is_err());
    }
}

#[test]
fn illustrated_production_pack_runs_consultation_and_persistence_journeys() {
    run_presentation_pack("presentationFixture", "flamPresentationFixture.mjs");
}

#[test]
fn graph_screens_production_pack_runs_consultation_and_persistence_journeys() {
    run_presentation_pack("screensFixture", "flamScreensFixture.mjs");
}

#[test]
fn mixed_menus_production_pack_runs_shared_details_and_narrative_commands() {
    run_presentation_pack("mixedMenusFixture", "flamScreensFixture.mjs");
}

#[test]
fn themed_production_pack_applies_colors_to_lvgl_widgets() {
    run_presentation_pack("themedScreensFixture", "flamScreensFixture.mjs");
}

#[test]
fn inventory_grid_production_pack_runs_pagination_and_object_details() {
    run_presentation_pack("inventoryGridFixture", "flamScreensFixture.mjs");
}

#[test]
fn collections_production_pack_runs_conditions_and_persistent_memories() {
    run_presentation_pack("collectionsFixture", "flamScreensFixture.mjs");
}

#[test]
fn selection_illustrations_production_pack_tracks_the_selected_choices() {
    run_presentation_pack("selectionIllustrationsFixture", "flamScreensFixture.mjs");
}

#[test]
fn rich_details_production_pack_runs_layouts_text_and_explicit_audio() {
    run_presentation_pack("richDetailsFixture", "flamScreensFixture.mjs");
}

#[test]
fn character_sheet_production_pack_filters_information_and_preserves_story() {
    run_presentation_pack("characterSheetFixture", "flamScreensFixture.mjs");
}

#[test]
fn arranged_filtered_graph_produces_the_same_playable_adventure() {
    run_presentation_pack("arrangedGraphFixture", "flamArrangedGraphFixture.mjs");
}

#[test]
fn full_demo_production_pack_combines_screens_rules_audio_and_consultation() {
    run_presentation_pack("flamDemoFixture", "flamDemoFixture.mjs");
}

fn run_presentation_pack(factory: &str, module: &str) {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
    let temporary = temp();
    let fixture = Command::new("node").current_dir(root).args(["--input-type=module", "-e",
        &format!("import {{{factory}}} from './scripts/{module}'; process.stdout.write(JSON.stringify({factory}()))")])
        .output().unwrap();
    assert!(fixture.status.success());
    let mut doc: Value = serde_json::from_slice(&fixture.stdout).unwrap();
    let source = temporary.0.join("source.wav");
    assert!(
        Command::new(crate::support::ffmpeg::get_ffmpeg_path().unwrap())
            .args([
                "-v",
                "error",
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=440:duration=2"
            ])
            .arg(&source)
            .status()
            .unwrap()
            .success()
    );
    let image = temporary.0.join("source.png");
    image::RgbaImage::from_pixel(48, 48, image::Rgba([255, 160, 0, 255]))
        .save(&image)
        .unwrap();
    let rich_images = factory == "richDetailsFixture" || factory == "flamDemoFixture";
    let varied_images = factory == "selectionIllustrationsFixture" || rich_images;
    for (index, pointer) in document::media_pointers(&doc).into_iter().enumerate() {
        let value = doc.pointer_mut(&pointer).unwrap();
        if !value.is_null() {
            let varied = temporary.0.join(format!("source-{index}.png"));
            if varied_images && pointer.ends_with("/image") {
                let (width, height) = if rich_images {
                    if value
                        .as_str()
                        .is_some_and(|name| name == "journal.png" || name.ends_with("/carnet.png"))
                    {
                        (296, 140)
                    } else {
                        (140, 140)
                    }
                } else {
                    (48, 48)
                };
                image::RgbaImage::from_pixel(
                    width,
                    height,
                    image::Rgba([
                        ((index % 32) * 8) as u8,
                        (((index / 32) % 64) * 4) as u8,
                        0,
                        255,
                    ]),
                )
                .save(&varied)
                .unwrap();
            }
            *value = Value::String(
                if pointer.ends_with("/audio") {
                    &source
                } else if varied_images {
                    &varied
                } else {
                    &image
                }
                .to_string_lossy()
                .into_owned(),
            );
        }
    }
    let output = generate(doc, &temporary.0, &|| false, &|_| {}).unwrap();
    let checked = read_pack(&output, &|| false).unwrap();
    let extracted = Temporary::new(&temporary.0).unwrap();
    for (name, bytes) in checked.files {
        if name.ends_with(".lif") {
            // Dimensions contrôlées ; le pixel orange reste l’oracle des fixtures classiques.
            // La fixture de sélection utilise des images RGB565 distinctes.
            if rich_images {
                let width = u32::from_be_bytes(bytes[4..8].try_into().unwrap());
                let height = u32::from_be_bytes(bytes[8..12].try_into().unwrap());
                assert!([140, 296].contains(&width) && height == 140);
            } else {
                assert_eq!(&bytes[..13], b"liff\0\0\0\x30\0\0\0\x30\xa2");
            }
            if !varied_images {
                assert_eq!(&bytes[13..17], &[255, 0, 253, 255]);
            }
        }
        let path = extracted.0.join(name);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, bytes).unwrap();
    }
    let result = Command::new("lua")
        .current_dir(root)
        .arg(root.join("scripts/check-flam-presentation.lua"))
        .arg(&extracted.0)
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "{}\n{}",
        String::from_utf8_lossy(&result.stdout),
        String::from_utf8_lossy(&result.stderr)
    );
}

#[test]
fn graph_screen_references_and_consultation_boundary_are_checked_before_generation() {
    let mut doc = example();
    doc["mainMenuId"] = "menu".into();
    doc["screens"] = serde_json::json!([
        {"id":"menu", "type":"menu", "title":"Archives", "text":"", "image":null,
         "links":[{"id":"carte", "label":"Carte", "screenId":"fiche"}]},
        {"id":"fiche", "type":"detail", "title":"", "text":"Le pont", "image":null, "links":[]}
    ]);
    assert!(document::validate(&doc).is_ok());
    for (path, invalid) in [
        ("/mainMenuId", serde_json::json!("fiche")),
        ("/screens/0/links/0/screenId", serde_json::json!("absente")),
        ("/screens/0/links/0/screenId", serde_json::json!("depart")),
        ("/screens/0/links/0/label", serde_json::json!("")),
        (
            "/screens/1/links",
            serde_json::json!([{"id":"retour", "label":"Retour", "screenId":"fiche"}]),
        ),
        ("/screens/1/type", serde_json::json!("scene")),
        ("/screens/1/id", serde_json::json!("depart")),
        ("/screens/1/image", serde_json::json!(42)),
    ] {
        let mut invalid_doc = doc.clone();
        *invalid_doc.pointer_mut(path).unwrap() = invalid;
        assert!(document::validate(&invalid_doc).is_err(), "{path}");
    }
    let mut mixed = doc.clone();
    mixed["screens"][0]["links"][0] =
        serde_json::json!({"id":"commande", "type":"narrative", "choiceId":"prendre-cle"});
    assert!(document::validate(&mixed).is_ok());
    mixed["screens"][0]["links"][0]["choiceId"] = "absent".into();
    assert!(document::validate(&mixed).is_err());
    mixed["screens"][0]["links"][0]["choiceId"] = "prendre-cle".into();
    mixed["screens"][0]["links"][0]["screenId"] = "fiche".into();
    assert!(document::validate(&mixed).is_err());
    doc["screens"][0]["links"][0]["effects"] = serde_json::json!([]);
    assert!(document::validate(&doc).is_err());
}

#[test]
fn invalid_theme_and_screen_colors_are_rejected_at_native_generation_boundary() {
    let mut doc = example();
    doc["theme"] =
        serde_json::json!({"background":"#112233", "text":"#abcdef", "selection":"#AbCdEf"});
    doc["scenes"][0]["colors"] = serde_json::json!({"background":"#123456"});
    assert!(document::validate(&doc).is_ok());
    for path in ["/theme", "/scenes/0/colors"] {
        for invalid in [
            serde_json::json!({"text":"#fff"}),
            serde_json::json!({"text":"#11223344"}),
            serde_json::json!({"text":"#gg0000"}),
            serde_json::json!({"text":"red"}),
            serde_json::json!({"text":""}),
            serde_json::json!({"text":null}),
            serde_json::json!({"text":42}),
            serde_json::json!({"other":"#123456"}),
            Value::Null,
        ] {
            let mut invalid_doc = doc.clone();
            *invalid_doc.pointer_mut(path).unwrap() = invalid;
            assert!(document::validate(&invalid_doc).is_err(), "{path}");
        }
    }
}

#[test]
fn inventory_grid_requires_a_detail_template_and_an_object_context() {
    let mut doc = example();
    doc["mainMenuId"] = "menu".into();
    doc["screens"] = serde_json::json!([
        {"id":"grid", "type":"grid", "source":"inventory", "detailScreenId":"detail", "title":"Affaires", "text":"", "image":null, "links":[]},
        {"id":"detail", "type":"detail", "contentSource":"item", "title":"Fiche", "text":"", "image":null, "links":[]},
        {"id":"menu", "type":"menu", "title":"Menu", "text":"", "image":null, "links":[{"id":"affaires", "label":"Affaires", "screenId":"grid"}]}
    ]);
    assert!(document::validate(&doc).is_ok());
    for (path, value) in [
        ("/screens/0/detailScreenId", Value::Null),
        ("/screens/0/detailScreenId", serde_json::json!("absente")),
        ("/screens/0/detailScreenId", serde_json::json!("menu")),
        ("/screens/0/source", serde_json::json!("autre")),
        (
            "/screens/0/links",
            serde_json::json!([{"id":"effet", "type":"narrative", "choiceId":"prendre-cle"}]),
        ),
        ("/screens/1/contentSource", serde_json::json!("author")),
        ("/screens/1/contentSource", Value::Null),
        ("/screens/2/links/0/screenId", serde_json::json!("detail")),
    ] {
        let mut invalid = doc.clone();
        *invalid.pointer_mut(path).unwrap() = value;
        assert!(document::validate(&invalid).is_err(), "{path}");
    }
}

#[test]
fn collection_entries_are_validated_with_their_references_rules_and_unique_ids() {
    let mut doc = example();
    doc["screens"] = serde_json::json!([
        {"id":"collection", "type":"grid", "source":"collection", "detailScreenId":null, "title":"Souvenirs", "text":"", "image":null, "links":[],
         "entries":[{"id":"entree", "label":"Clé", "image":null, "screenId":"detail", "conditions":[{"type":"item", "itemId":"cle", "quantity":1}], "unavailable":"hidden"}]},
        {"id":"detail", "type":"detail", "title":"Souvenir", "text":"Une découverte", "image":null, "links":[]},
        {"id":"objet", "type":"detail", "contentSource":"item", "title":"Objet", "text":"", "image":null, "links":[]}
    ]);
    assert!(document::validate(&doc).is_ok());
    for (path, value) in [
        ("/screens/0/entries/0/screenId", serde_json::json!("objet")),
        ("/screens/0/entries/0/screenId", serde_json::json!("absent")),
        (
            "/screens/0/entries/0/screenId",
            serde_json::json!("collection"),
        ),
        (
            "/screens/0/entries/0/conditions/0/itemId",
            serde_json::json!("absent"),
        ),
        (
            "/screens/0/entries/0/conditions/0/quantity",
            serde_json::json!(0),
        ),
        (
            "/screens/0/entries/0/unavailable",
            serde_json::json!("autre"),
        ),
        ("/screens/0/entries/0/label", serde_json::json!("")),
        ("/screens/0/entries/0/id", serde_json::json!("cle")),
        ("/screens/0/entries/0/image", serde_json::json!(42)),
        ("/screens/0/detailScreenId", serde_json::json!("objet")),
        ("/screens/0/entries", Value::Null),
    ] {
        let mut invalid = doc.clone();
        *invalid.pointer_mut(path).unwrap() = value;
        assert!(document::validate(&invalid).is_err(), "{path}");
    }
    doc["screens"][0]["entries"][0]["effects"] = serde_json::json!([]);
    assert!(document::validate(&doc).is_err());
}

#[test]
fn selection_illustration_modes_and_optional_images_are_validated_natively() {
    let mut doc = example();
    doc["scenes"][0]["illustrationMode"] = "selection".into();
    doc["choices"][0]["image"] = "choice.png".into();
    doc["screens"] = serde_json::json!([
        {"id":"menu", "type":"menu", "illustrationMode":"common", "title":"Menu", "text":"", "image":null,
         "links":[{"id":"fiche", "label":"Fiche", "screenId":"detail", "image":"link.png"}]},
        {"id":"detail", "type":"detail", "title":"Fiche", "text":"", "image":null, "links":[]}
    ]);
    assert!(document::validate(&doc).is_ok());
    for (path, value) in [
        ("/scenes/0/illustrationMode", serde_json::json!("autre")),
        ("/scenes/0/illustrationMode", Value::Null),
        ("/screens/0/illustrationMode", serde_json::json!(false)),
        ("/choices/0/image", serde_json::json!(42)),
        ("/choices/0/image", serde_json::json!("")),
        ("/screens/0/links/0/image", serde_json::json!(42)),
        ("/screens/0/links/0/image", serde_json::json!("")),
    ] {
        let mut invalid = doc.clone();
        *invalid.pointer_mut(path).unwrap() = value;
        assert!(document::validate(&invalid).is_err(), "{path}");
    }
    doc["screens"][1]["illustrationMode"] = "selection".into();
    assert!(document::validate(&doc).is_err());
}

#[test]
fn detail_layouts_audio_and_optional_content_are_validated_natively() {
    let mut doc = example();
    doc["screens"] = serde_json::json!([
        {"id":"detail", "type":"detail", "title":"", "text":"", "image":null, "audio":null, "layout":"fullImage", "links":[]},
        {"id":"menu", "type":"menu", "title":"Menu", "text":"", "image":null, "links":[]}
    ]);
    assert!(document::validate(&doc).is_ok());
    doc["screens"][0]["layout"] = "split".into();
    doc["screens"][0]["audio"] = "description.mp3".into();
    assert!(document::validate(&doc).is_ok());
    for (path, value) in [
        ("/screens/0/layout", serde_json::json!("autre")),
        ("/screens/0/layout", Value::Null),
        ("/screens/0/audio", serde_json::json!(42)),
        ("/screens/0/audio", serde_json::json!("")),
    ] {
        let mut invalid = doc.clone();
        *invalid.pointer_mut(path).unwrap() = value;
        assert!(document::validate(&invalid).is_err(), "{path}");
    }
    let mut invalid = doc.clone();
    invalid["screens"][1]["layout"] = "split".into();
    assert!(document::validate(&invalid).is_err());
    doc["screens"][1]["audio"] = Value::Null;
    assert!(document::validate(&doc).is_err());
}

#[test]
fn character_information_checks_conditions_identity_and_consultation_scope() {
    let mut doc = example();
    doc["screens"] = serde_json::json!([
        {"id":"personnage", "type":"character", "title":"", "text":"", "image":null, "links":[],
         "information":[{"id":"info", "text":"Pisteur", "conditions":[{"type":"class", "classId":"pisteur"}]}]}
    ]);
    assert!(document::validate(&doc).is_ok());
    for (path, value) in [
        ("/screens/0/type", serde_json::json!("detail")),
        ("/screens/0/information", Value::Null),
        ("/screens/0/information/0/id", serde_json::json!("cle")),
        ("/screens/0/information/0/text", serde_json::json!(42)),
        (
            "/screens/0/information/0/conditions/0/classId",
            serde_json::json!("absente"),
        ),
        (
            "/screens/0/information/0/conditions",
            serde_json::json!([{"type":"item", "itemId":"cle", "quantity":0}]),
        ),
    ] {
        let mut invalid = doc.clone();
        *invalid.pointer_mut(path).unwrap() = value;
        assert!(document::validate(&invalid).is_err(), "{path}");
    }
    let mut invalid = doc.clone();
    invalid["screens"][0]["information"][0]["effects"] = serde_json::json!([]);
    assert!(document::validate(&invalid).is_err());
    doc["screens"][0]["statistics"] = serde_json::json!({"strength":10});
    assert!(document::validate(&doc).is_err());
}
