use std::env;
use tauri::Manager;

#[tauri::command]
pub fn get_platform() -> String {
    env::consts::OS.to_string()
}

#[tauri::command]
pub fn get_default_log_path() -> Result<String, String> {
    let platform = env::consts::OS;

    match platform {
        "windows" => {
            // Windows: %LOCALAPPDATA%Low\Wizards Of The Coast\MTGA\Player.log
            if let Some(local_app_data) = dirs::data_local_dir() {
                let path = local_app_data
                    .parent()
                    .unwrap_or(&local_app_data)
                    .join("LocalLow")
                    .join("Wizards Of The Coast")
                    .join("MTGA")
                    .join("Player.log");
                Ok(path.to_string_lossy().to_string())
            } else {
                Err("Could not find local app data directory".to_string())
            }
        }
        "macos" => {
            // macOS: ~/Library/Logs/Wizards Of The Coast/MTGA/Player.log
            if let Some(home) = dirs::home_dir() {
                let path = home
                    .join("Library")
                    .join("Logs")
                    .join("Wizards Of The Coast")
                    .join("MTGA")
                    .join("Player.log");
                Ok(path.to_string_lossy().to_string())
            } else {
                Err("Could not find home directory".to_string())
            }
        }
        "linux" => {
            // Linux (Wine): ~/.wine/drive_c/users/{USER}/AppData/LocalLow/Wizards Of The Coast/MTGA/Player.log
            if let Some(home) = dirs::home_dir() {
                let user = env::var("USER").unwrap_or_else(|_| "user".to_string());
                let path = home
                    .join(".wine")
                    .join("drive_c")
                    .join("users")
                    .join(&user)
                    .join("AppData")
                    .join("LocalLow")
                    .join("Wizards Of The Coast")
                    .join("MTGA")
                    .join("Player.log");
                Ok(path.to_string_lossy().to_string())
            } else {
                Err("Could not find home directory".to_string())
            }
        }
        _ => Err(format!("Unsupported platform: {}", platform)),
    }
}

#[tauri::command]
pub fn restart_app(app: tauri::AppHandle) {
    tauri::api::process::restart(&app.env());
}

#[tauri::command]
pub fn quit_app() {
    std::process::exit(0);
}

/// Relaunch the app elevated (Windows UAC) and exit the current instance.
/// MTGA runs elevated, so memory reading only works when this app is too.
/// Waits for the elevation prompt to resolve: on accept, launches the new
/// instance and exits this one; on cancel, returns an error and stays open.
#[cfg(target_os = "windows")]
#[tauri::command]
pub fn relaunch_as_admin(app: tauri::AppHandle) -> Result<(), String> {
    let exe = env::current_exe().map_err(|e| e.to_string())?;
    // Escape single quotes for the PowerShell single-quoted string.
    let exe_str = exe.to_string_lossy().replace('\'', "''");

    let status = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-WindowStyle",
            "Hidden",
            "-Command",
            &format!("Start-Process -FilePath '{}' -Verb RunAs", exe_str),
        ])
        .status()
        .map_err(|e| format!("Failed to launch elevated instance: {}", e))?;

    if status.success() {
        app.exit(0);
        Ok(())
    } else {
        // UAC was declined / cancelled.
        Err("Elevation was cancelled".to_string())
    }
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub fn relaunch_as_admin(_app: tauri::AppHandle) -> Result<(), String> {
    Err("Elevation is only supported on Windows".to_string())
}
