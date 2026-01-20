use tauri::{AppHandle, GlobalShortcutManager, Manager};

#[tauri::command]
pub fn register_shortcut(
    app: AppHandle,
    shortcut: String,
    event_name: String,
) -> Result<(), String> {
    let app_clone = app.clone();
    let event_name_clone = event_name.clone();

    // First unregister if already registered
    let _ = app.global_shortcut_manager().unregister(&shortcut);

    app.global_shortcut_manager()
        .register(&shortcut, move || {
            let _ = app_clone.emit_all(&event_name_clone, ());
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unregister_shortcut(app: AppHandle, shortcut: String) -> Result<(), String> {
    app.global_shortcut_manager()
        .unregister(&shortcut)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unregister_all_shortcuts(app: AppHandle) -> Result<(), String> {
    app.global_shortcut_manager()
        .unregister_all()
        .map_err(|e| e.to_string())
}
