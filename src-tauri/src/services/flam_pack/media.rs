use super::{check, read, Error, Result};
use std::{
    fs,
    io::Cursor,
    path::Path,
    process::{Command, Stdio},
    time::Duration,
};

pub(super) fn image(source: &Path) -> Result<Vec<u8>> {
    let data = read(source, 64 * 1024 * 1024).map_err(|_| Error::MediaUnavailable)?;
    let mut reader = image::ImageReader::new(Cursor::new(data))
        .with_guessed_format()
        .map_err(|_| Error::MediaUnavailable)?;
    let mut limits = image::Limits::default();
    limits.max_image_width = Some(16384);
    limits.max_image_height = Some(16384);
    limits.max_alloc = Some(256 * 1024 * 1024);
    reader.limits(limits);
    let image = reader
        .decode()
        .map_err(|_| Error::MediaUnavailable)?
        .thumbnail(320, 240)
        .to_rgb8();
    let mut bytes = Vec::new();
    image::codecs::jpeg::JpegEncoder::new_with_quality(&mut bytes, 90)
        .encode_image(&image)
        .map_err(|_| Error::MediaUnavailable)?;
    validate_image(&bytes)?;
    Ok(bytes)
}
pub(super) fn validate_image(bytes: &[u8]) -> Result<()> {
    let mut reader = image::ImageReader::with_format(Cursor::new(bytes), image::ImageFormat::Jpeg);
    let mut limits = image::Limits::default();
    limits.max_image_width = Some(320);
    limits.max_image_height = Some(240);
    limits.max_alloc = Some(4 * 1024 * 1024);
    reader.limits(limits);
    let decoded = reader.decode().map_err(|_| Error::InvalidPack)?;
    if decoded.width() == 0 || decoded.height() == 0 {
        return Err(Error::InvalidPack);
    }
    Ok(())
}

pub(super) fn audio(source: &Path, stage: &Path, cancel: &impl Fn() -> bool) -> Result<Vec<u8>> {
    if !fs::metadata(source).is_ok_and(|m| m.is_file()) {
        return Err(Error::MediaUnavailable);
    }
    let output = stage.join("audio.mp3");
    let error = stage.join("ffmpeg.log");
    let tool = crate::support::ffmpeg::get_ffmpeg_path().map_err(|_| Error::MediaUnavailable)?;
    let mut command = Command::new(tool);
    crate::support::ffmpeg::apply_no_window(&mut command);
    let mut child = command
        .args(["-nostdin", "-y", "-v", "error", "-i"])
        .arg(source)
        .args([
            "-vn",
            "-ac",
            "2",
            "-ar",
            "44100",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "128k",
            "-write_xing",
            "1",
            "-id3v2_version",
            "3",
            "-map_metadata",
            "-1",
        ])
        .arg(&output)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(fs::File::create(&error)?)
        .spawn()
        .map_err(|_| Error::MediaUnavailable)?;
    let result = loop {
        if cancel() {
            let _ = child.kill();
            let _ = child.wait();
            break Err(Error::Cancelled);
        }
        match child.try_wait() {
            Ok(Some(status)) => {
                break if status.success() {
                    Ok(())
                } else {
                    Err(Error::MediaUnavailable)
                }
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(25)),
            Err(_) => {
                let _ = child.kill();
                let _ = child.wait();
                break Err(Error::MediaUnavailable);
            }
        }
    };
    result?;
    check(cancel)?;
    let bytes = read(&output, 256 * 1024 * 1024)?;
    fs::remove_file(output)?;
    fs::remove_file(error)?;
    audio_map(&bytes)?;
    Ok(bytes)
}

fn frame_size(bytes: &[u8], offset: usize) -> Result<usize> {
    let header = bytes.get(offset..offset + 4).ok_or(Error::InvalidPack)?;
    if header[0] != 0xff
        || header[1] & 0xfe != 0xfa
        || header[2] & 0xfc != 0x90
        || header[3] >> 6 == 3
    {
        return Err(Error::InvalidPack);
    }
    let size = 144 * 128000 / 44100 + ((header[2] >> 1) & 1) as usize;
    if offset + size > bytes.len() {
        return Err(Error::InvalidPack);
    }
    Ok(size)
}

// Profil Audio B validé sur FLAM : MPEG1 Layer III, CBR 128 kb/s,
// 44,1 kHz stéréo, ID3v2.3 et Info/Xing. La table commence au premier paquet
// audio, après les métadonnées, comme celle du prototype vérifiée par FFprobe.
// Les anciens packs sans métadonnées restent lisibles.
pub(super) fn audio_map(bytes: &[u8]) -> Result<Vec<u8>> {
    let mut offset = 0usize;
    if bytes.starts_with(b"ID3") {
        let tag = bytes.get(..10).ok_or(Error::InvalidPack)?;
        if tag[3..6] != [3, 0, 0] || tag[6..10].iter().any(|byte| byte & 0x80 != 0) {
            return Err(Error::InvalidPack);
        }
        offset = 10
            + tag[6..10]
                .iter()
                .fold(0usize, |size, byte| (size << 7) | *byte as usize);
    }
    let first_size = frame_size(bytes, offset)?;
    // MPEG1 stéréo : 32 octets de side information après l'en-tête et le CRC
    // éventuel. La trame Info/Xing n'est pas un paquet de narration.
    let marker = offset + 4 + if bytes[offset + 1] & 1 == 0 { 2 } else { 0 } + 32;
    if bytes
        .get(marker..marker + 4)
        .is_some_and(|value| value == b"Info" || value == b"Xing")
    {
        offset += first_size;
    }
    let first_audio = offset as u32;
    let mut frames = 0u64;
    let mut next_second = 1u64;
    let mut entries = Vec::new();
    while offset < bytes.len() {
        let size = frame_size(bytes, offset)?;
        let position = frames * 1152;
        if position >= next_second * 44100 {
            entries.push((offset as u32, (position * 2) as u32));
            next_second += 1;
        }
        offset += size;
        frames += 1;
    }
    if frames == 0 || frames * 2304 > u32::MAX as u64 {
        return Err(Error::InvalidPack);
    }
    let mut result = Vec::new();
    for number in [frames as u32 * 2304, first_audio, 0] {
        result.extend(number.to_le_bytes());
    }
    for (offset, position) in entries {
        result.extend(offset.to_le_bytes());
        result.extend(position.to_le_bytes());
    }
    Ok(result)
}
