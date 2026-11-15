//! Les opérations FLAM ne passent jamais dans le writer des packs à index.
use crate::services::{
    flam_pack::{self, Error, Result},
    storyteller_device::{flam_authoring, NativeVolumes},
};
use serde_json::{json, Value};
use std::{
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Default)]
pub(crate) struct FlamAuthoringState {
    busy: AtomicBool,
    cancel: AtomicBool,
}
struct Admission(Arc<FlamAuthoringState>);
impl Drop for Admission {
    fn drop(&mut self) {
        self.0.busy.store(false, Ordering::SeqCst);
    }
}
impl FlamAuthoringState {
    fn admit(self: &Arc<Self>) -> Result<Admission> {
        if self.busy.swap(true, Ordering::SeqCst) {
            return Err(Error::Busy);
        }
        self.cancel.store(false, Ordering::SeqCst);
        Ok(Admission(self.clone()))
    }
}
#[tauri::command]
pub(crate) fn cancel_flam_authoring(state: State<'_, Arc<FlamAuthoringState>>) {
    state.cancel.store(true, Ordering::SeqCst);
}
#[tauri::command]
pub(crate) async fn generate_flam_adventure(
    app: AppHandle,
    state: State<'_, Arc<FlamAuthoringState>>,
    document: Value,
    output_folder: String,
) -> Result<String> {
    let admission = state.inner().admit()?;
    tauri::async_runtime::spawn_blocking(move || {
        let cancel = || admission.0.cancel.load(Ordering::SeqCst);
        let progress = |step: &str| {
            let _ = app.emit("flam-authoring-progress", step);
        };
        let path =
            flam_pack::generate(document, &PathBuf::from(output_folder), &cancel, &progress)?;
        Ok(path.to_string_lossy().into_owned())
    })
    .await
    .map_err(|_| Error::Io)?
}
#[tauri::command]
pub(crate) async fn install_flam_adventure(
    app: AppHandle,
    state: State<'_, Arc<FlamAuthoringState>>,
    pack_folder: String,
    device_root: String,
) -> Result<Value> {
    let admission = state.inner().admit()?;
    let backups = app
        .path()
        .app_data_dir()
        .map_err(|_| Error::Io)?
        .join("flam-installations");
    tauri::async_runtime::spawn_blocking(move || {
        let cancel = || admission.0.cancel.load(Ordering::SeqCst);
        let progress = |step: &str| {
            let _ = app.emit("flam-authoring-progress", step);
        };
        let folder = PathBuf::from(pack_folder);
        // Métadonnées catalogue conservées avant l'invalidation du cache appareil.
        let content = flam_pack::read_pack(&folder, &cancel)?;
        let store = crate::services::catalogue::open_store(&app).map_err(|_| Error::Io)?;
        store
            .remember_flam_title(content.id, &content.title)
            .map_err(|_| Error::Io)?;
        drop(content);
        let backup = flam_authoring::install(
            &folder,
            &PathBuf::from(device_root),
            &backups,
            &NativeVolumes,
            &cancel,
            &progress,
        )?;
        Ok(json!({"backupPath": backup.to_string_lossy()}))
    })
    .await
    .map_err(|_| Error::Io)?
}
