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
