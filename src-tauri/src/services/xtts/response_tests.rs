use super::{generate_audio_sync, XttsGenerateRequest, XttsSettings};
use std::{
    fs,
    io::{Read, Write},
    net::TcpListener,
    time::Duration,
};

fn generate_with_response(kind: &str) -> Result<Vec<u8>, String> {
    let kind = kind.to_owned();
    let root = std::env::temp_dir().join(format!("xtts-response-{}", uuid::Uuid::new_v4()));
    let server_output = root.join("output");
    fs::create_dir_all(&server_output).unwrap();
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let server_url = format!("http://{}", listener.local_addr().unwrap());
    let outside = root.join("outside.wav");
    fs::write(&outside, b"outside").unwrap();
    let server = std::thread::spawn(move || {
        for is_tts in [false, true] {
            let (mut stream, _) = listener.accept().unwrap();
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .unwrap();
            let mut received = Vec::new();
            let mut buffer = [0; 4096];
            let (header_end, content_length) = loop {
                let size = stream.read(&mut buffer).unwrap();
                assert!(size > 0);
                received.extend_from_slice(&buffer[..size]);
                if let Some(end) = received.windows(4).position(|part| part == b"\r\n\r\n") {
                    let headers = String::from_utf8_lossy(&received[..end]);
                    let length = headers
                        .lines()
                        .find_map(|line| {
                            line.to_lowercase()
                                .strip_prefix("content-length:")
                                .map(|n| n.trim().parse::<usize>().unwrap())
                        })
                        .unwrap_or(0);
                    break (end + 4, length);
                }
            };
            while received.len() < header_end + content_length {
                let size = stream.read(&mut buffer).unwrap();
                assert!(size > 0);
                received.extend_from_slice(&buffer[..size]);
            }
            let body = if is_tts {
                let request: serde_json::Value =
                    serde_json::from_slice(&received[header_end..]).unwrap();
                assert!(request["output_file"]
                    .as_str()
                    .unwrap()
                    .starts_with("dd_narration_faerun--"));
                let file = if kind == "requested" || kind == "no_metadata" {
                    request["output_file"].as_str().unwrap()
                } else {
                    "dd_narration_faerun--411dff069d6b415a834cccc9f702e231.wav"
                };
                let path = server_output.join(file);
                fs::write(&path, b"generated audio").unwrap();
                match kind.as_str() {
                    "file" | "requested" => serde_json::json!({"file": file}),
                    "path" => serde_json::json!({"path": path}),
                    "no_metadata" => serde_json::json!({}),
                    "traversal" => serde_json::json!({"file": "../outside.wav"}),
                    "windows_traversal" => serde_json::json!({"file": r"..\outside.wav"}),
                    "mismatch" => serde_json::json!({"file": file, "path": outside}),
                    "outside" => serde_json::json!({"path": outside}),
                    #[cfg(unix)]
                    "symlink" => {
                        fs::remove_file(&path).unwrap();
                        std::os::unix::fs::symlink(&outside, &path).unwrap();
                        serde_json::json!({"file": file})
                    }
                    _ => serde_json::json!({"file": file, "path": path}),
                }
                .to_string()
            } else {
                "{}".to_string()
            };
            write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", body.len(), body).unwrap();
        }
    });
    let result = generate_audio_sync(
        XttsSettings {
            enabled: true,
            server_url,
            xtts_dir: root.to_string_lossy().into_owned(),
            auto_start: false,
            force_cpu: false,
            language: "fr".into(),
        },
        XttsGenerateRequest {
            text: "Bonjour".into(),
            language: None,
            speaker: None,
            voice: None,
            workspace_dir: Some(root.join("workspace").to_string_lossy().into_owned()),
            project_destination: None,
            filename_hint: Some("dd_narration_faerun".into()),
        },
        &|_| {},
    );
    server.join().unwrap();
    if result.is_err() {
        assert_eq!(
            fs::read_dir(root.join("workspace/voix-generees"))
                .unwrap()
                .count(),
            0
        );
    }
    let copied = result.map(|path| {
        assert!(!path.contains("411dff069d6b415a834cccc9f702e231"));
        assert!(std::path::Path::new(&path)
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("dd_narration_faerun--"));
        fs::read(path).unwrap()
    });
    fs::remove_dir_all(root).unwrap();
    copied
}

#[test]
fn generation_accepts_server_assigned_filename() {
    for kind in ["file", "path", "both", "requested", "no_metadata"] {
        assert_eq!(
            generate_with_response(kind),
            Ok(b"generated audio".to_vec()),
            "{kind}"
        );
    }
}

#[test]
fn generation_rejects_unsafe_or_inconsistent_response() {
    for kind in ["traversal", "windows_traversal", "mismatch", "outside"] {
        assert!(generate_with_response(kind).is_err(), "{kind}");
    }
}

#[cfg(unix)]
#[test]
fn generation_rejects_output_symlink_outside_server_directory() {
    assert!(generate_with_response("symlink").is_err());
}

#[test]
#[ignore = "requires STORY_STUDIO_XTTS_TEST_DIR and a running XTTS server"]
fn live_generation_copies_server_assigned_audio_into_workspace() {
    let xtts_dir = std::env::var("STORY_STUDIO_XTTS_TEST_DIR").unwrap();
    let workspace = std::env::temp_dir().join(format!("xtts-live-{}", uuid::Uuid::new_v4()));
    let generated = generate_audio_sync(
        XttsSettings {
            enabled: true,
            server_url: "http://127.0.0.1:8020".into(),
            xtts_dir,
            auto_start: false,
            force_cpu: true,
            language: "fr".into(),
        },
        XttsGenerateRequest {
            text: "Bonjour, bienvenue dans cette aventure.".into(),
            language: None,
            speaker: None,
            voice: Some(std::env::var("STORY_STUDIO_XTTS_TEST_VOICE").unwrap()),
            workspace_dir: Some(workspace.to_string_lossy().into_owned()),
            project_destination: None,
            filename_hint: Some("verification-xtts".into()),
        },
        &|_| {},
    )
    .expect("live XTTS generation and project copy");
    let audio = fs::read(&generated).unwrap();
    assert!(audio.len() > 44);
    assert_eq!(&audio[..4], b"RIFF");
    assert_eq!(&audio[8..12], b"WAVE");
    fs::remove_dir_all(workspace).unwrap();
}
