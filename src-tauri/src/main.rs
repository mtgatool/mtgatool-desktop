#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod arena_log;
mod tray;
mod state;

use std::sync::Mutex;
use tauri::{WindowBuilder, WindowUrl};

fn main() {
    // WebView2 paints an opaque (white) backdrop by default, which shows through
    // transparent windows until they are resized (the "white overlay until you
    // drag it" artifact). Force the default backdrop to fully transparent ARGB
    // so transparent overlay/hover windows render correctly from first paint.
    std::env::set_var("WEBVIEW2_DEFAULT_BACKGROUND_COLOR", "00000000");

    tauri::Builder::default()
        .manage(state::AppState {
            log_watcher: Mutex::new(arena_log::watcher::ArenaLogWatcher::new()),
        })
        .system_tray(tray::create_tray())
        .on_system_tray_event(tray::handle_tray_event)
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
            // Create background window (hidden)
            let background_url = if cfg!(debug_assertions) {
                WindowUrl::External("http://localhost:3001".parse().unwrap())
            } else {
                WindowUrl::App("index.html".into())
            };

            WindowBuilder::new(app, "background", background_url.clone())
                .title("mtgatool-background")
                .visible(false)
                .build()?;

            // Create hover window (hidden initially) — borderless + transparent
            WindowBuilder::new(app, "hover", background_url)
                .title("mtgatool-hover")
                .visible(false)
                .decorations(false)
                .transparent(true)
                .always_on_top(true)
                .skip_taskbar(true)
                .inner_size(400.0, 600.0)
                .build()?;

            // Devtools are available on demand via right-click -> Inspect in dev
            // builds; we no longer auto-open them (they spawned extra decorated
            // windows that were easy to mistake for overlays).

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
