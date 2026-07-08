use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[tauri::command]
pub fn register_shortcut(
    app: AppHandle,
    shortcut: String,
    event_name: String,
) -> Result<(), String> {
    let gs = app.global_shortcut();

    // First unregister if already registered
    let _ = gs.unregister(shortcut.as_str());

    let app_clone = app.clone();
    gs.on_shortcut(shortcut.as_str(), move |_app, _shortcut, event| {
        // Fire on key press only (not on release).
        if event.state() == ShortcutState::Pressed {
            let _ = app_clone.emit(&event_name, ());
        }
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unregister_shortcut(app: AppHandle, shortcut: String) -> Result<(), String> {
    app.global_shortcut()
        .unregister(shortcut.as_str())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unregister_all_shortcuts(app: AppHandle) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| e.to_string())
}
