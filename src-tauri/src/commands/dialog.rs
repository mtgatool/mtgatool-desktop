use tauri::api::dialog::blocking::FileDialogBuilder;
use serde::{Deserialize, Serialize};

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
    title: Option<String>,
    default_path: Option<String>,
    filters: Option<Vec<DialogFilter>>,
) -> OpenDialogResult {
    let mut dialog = FileDialogBuilder::new();

    if let Some(t) = title {
        dialog = dialog.set_title(&t);
    }

    if let Some(path) = default_path {
        dialog = dialog.set_directory(&path);
    }

    if let Some(filter_list) = filters {
        for filter in filter_list {
            let extensions: Vec<&str> = filter.extensions.iter().map(|s| s.as_str()).collect();
            dialog = dialog.add_filter(&filter.name, &extensions);
        }
    }

    match dialog.pick_file() {
        Some(path) => OpenDialogResult {
            canceled: false,
            file_paths: vec![path.to_string_lossy().to_string()],
        },
        None => OpenDialogResult {
            canceled: true,
            file_paths: vec![],
        },
    }
}
