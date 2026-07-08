use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize, Deserialize)]
pub struct DialogFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct OpenDialogResult {
    pub canceled: bool,
    pub file_paths: Vec<String>,
}

#[tauri::command]
pub fn show_open_dialog(
    app: AppHandle,
    title: Option<String>,
    default_path: Option<String>,
    filters: Option<Vec<DialogFilter>>,
) -> OpenDialogResult {
    let mut dialog = app.dialog().file();

    if let Some(t) = title {
        dialog = dialog.set_title(t);
    }

    if let Some(path) = default_path {
        dialog = dialog.set_directory(path);
    }

    if let Some(filter_list) = filters {
        for filter in filter_list {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(filter.name, &extensions);
        }
    }

    match dialog.blocking_pick_file() {
        Some(path) => {
            let file_path = path
                .into_path()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();
            OpenDialogResult {
                canceled: false,
                file_paths: vec![file_path],
            }
        }
        None => OpenDialogResult {
            canceled: true,
            file_paths: vec![],
        },
    }
}
