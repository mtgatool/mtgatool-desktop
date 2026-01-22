use tauri::{Manager, Window, WindowBuilder, WindowUrl};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct WindowBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub fn create_overlay_window(
    app: tauri::AppHandle,
    label: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    transparent: bool,
) -> Result<(), String> {
    // Check if window already exists
    if app.get_window(&label).is_some() {
        return Ok(());
    }

    let url = if cfg!(debug_assertions) {
        WindowUrl::External("http://localhost:3001".parse().unwrap())
    } else {
        WindowUrl::App("index.html".into())
    };

    let _ = transparent; // Transparency is configured in tauri.conf.json, not WindowBuilder in Tauri 1.x

    WindowBuilder::new(&app, &label, url)
        .title(&label)
        .position(x as f64, y as f64)
        .inner_size(width as f64, height as f64)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .focused(false)
        .resizable(true)
        .visible(true)
        .build()
        .map_err(|e: tauri::Error| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn set_ignore_cursor_events(window: Window, ignore: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(ignore)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_window_bounds(window: Window) -> Result<WindowBounds, String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;
    Ok(WindowBounds {
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
    })
}

#[tauri::command]
pub fn set_window_bounds(
    window: Window,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<(), String> {
    window
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)))
        .map_err(|e| e.to_string())?;
    window
        .set_size(tauri::Size::Physical(tauri::PhysicalSize::new(width, height)))
        .map_err(|e| e.to_string())
}
