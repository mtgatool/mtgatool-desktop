#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod arena_log;
mod commands;
mod state;
mod tray;

use std::sync::Mutex;
use tauri::{WebviewUrl, WebviewWindowBuilder};

fn main() {
    // WebView2 paints an opaque (white) backdrop by default, which shows through
    // transparent windows until they are resized (the "white overlay until you
    // drag it" artifact). Force the default backdrop to fully transparent ARGB
    // so transparent overlay/hover windows render correctly from first paint.
    std::env::set_var("WEBVIEW2_DEFAULT_BACKGROUND_COLOR", "00000000");

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .manage(state::AppState {
            log_watcher: Mutex::new(arena_log::watcher::ArenaLogWatcher::new()),
        })
        .invoke_handler(tauri::generate_handler![
            // File system commands
            commands::file_system::read_file,
            commands::file_system::read_file_chunk,
            commands::file_system::write_file,
            commands::file_system::file_exists,
            commands::file_system::get_file_size,
            commands::file_system::create_dir,
            commands::file_system::delete_file,
            commands::file_system::get_app_data_path,
            commands::file_system::get_home_path,
            // Window commands
            commands::window::create_overlay_window,
            commands::window::set_ignore_cursor_events,
            commands::window::get_window_bounds,
            commands::window::set_window_bounds,
            // Shortcuts commands
            commands::shortcuts::register_shortcut,
            commands::shortcuts::unregister_shortcut,
            commands::shortcuts::unregister_all_shortcuts,
            // Dialog commands
            commands::dialog::show_open_dialog,
            // App commands
            commands::app::get_default_log_path,
            commands::app::restart_app,
            commands::app::quit_app,
            commands::app::get_platform,
            commands::app::relaunch_as_admin,
            // Arena log watcher
            arena_log::watcher::start_log_watcher,
            arena_log::watcher::stop_log_watcher,
            // Memory reader commands
            commands::reader::is_admin,
            commands::reader::find_process,
            commands::reader::read_data,
            commands::reader::read_class,
            commands::reader::read_generic_instance,
            commands::reader::reader_init,
            commands::reader::reader_close,
            commands::reader::reader_is_initialized,
            commands::reader::read_decks,
            commands::reader::read_ranks,
            commands::reader::read_account,
            commands::reader::read_collection,
            commands::reader::read_inventory,
        ])
        .setup(|app| {
            // System tray (Tauri v2 builds it in code; menu items need a handle)
            tray::create_tray(app.handle())?;

            // Create background window (hidden)
            let background_url = if cfg!(debug_assertions) {
                WebviewUrl::External("http://localhost:3001".parse().unwrap())
            } else {
                WebviewUrl::App("index.html".into())
            };

            WebviewWindowBuilder::new(app, "background", background_url.clone())
                .title("mtgatool-background")
                .visible(false)
                .build()?;

            // Create hover window (hidden initially) — borderless + transparent
            WebviewWindowBuilder::new(app, "hover", background_url)
                .title("mtgatool-hover")
                .visible(false)
                .decorations(false)
                .transparent(true)
                .shadow(false)
                .always_on_top(true)
                .skip_taskbar(true)
                .inner_size(400.0, 600.0)
                .build()?;

            // Overlay/main devtools are available on demand via right-click ->
            // Inspect. The background window is hidden, so in dev we auto-open
            // its devtools to expose its console ([bc]/[bg] logs) for debugging
            // the cross-window match-data bridge.
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                if let Some(bg) = app.get_webview_window("background") {
                    bg.open_devtools();
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
