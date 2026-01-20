use notify::{RecommendedWatcher, RecursiveMode, Watcher, Config};
use serde::Serialize;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;
use std::sync::mpsc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

use crate::state::AppState;

#[derive(Clone, Serialize)]
pub struct LogChunkPayload {
    pub text: String,
    pub position: u64,
    pub size: u64,
}

pub struct ArenaLogWatcher {
    stop_flag: Option<Arc<AtomicBool>>,
    watcher_handle: Option<thread::JoinHandle<()>>,
}

impl ArenaLogWatcher {
    pub fn new() -> Self {
        Self {
            stop_flag: None,
            watcher_handle: None,
        }
    }

    pub fn start(&mut self, path: String, app: AppHandle) -> Result<(), String> {
        // Stop existing watcher if any
        self.stop();

        let stop_flag = Arc::new(AtomicBool::new(false));
        let stop_flag_clone = stop_flag.clone();

        let path_clone = path.clone();
        let app_clone = app.clone();

        let handle = thread::spawn(move || {
            let mut position: u64 = 0;

            // Initial read - get current file size
            if let Ok(metadata) = std::fs::metadata(&path_clone) {
                position = metadata.len();
            }

            // Set up file watcher using notify 5.x API
            let (tx, rx) = mpsc::channel();

            let watcher_result = RecommendedWatcher::new(
                move |res: Result<notify::Event, notify::Error>| {
                    if res.is_ok() {
                        let _ = tx.send(());
                    }
                },
                Config::default().with_poll_interval(Duration::from_millis(500)),
            );

            let mut watcher = match watcher_result {
                Ok(w) => w,
                Err(e) => {
                    eprintln!("Failed to create watcher: {}", e);
                    return;
                }
            };

            let path_obj = Path::new(&path_clone);
            if let Some(parent) = path_obj.parent() {
                if let Err(e) = watcher.watch(parent, RecursiveMode::NonRecursive) {
                    eprintln!("Failed to watch directory: {}", e);
                    return;
                }
            }

            // Polling loop
            loop {
                if stop_flag_clone.load(Ordering::Relaxed) {
                    break;
                }

                // Check for file changes (with timeout)
                let _ = rx.recv_timeout(Duration::from_millis(500));

                // Read new content
                if let Ok(metadata) = std::fs::metadata(&path_clone) {
                    let size = metadata.len();

                    // File was recreated (game restarted)
                    if position > size {
                        position = 0;
                    }

                    if position < size {
                        if let Ok(mut file) = File::open(&path_clone) {
                            if file.seek(SeekFrom::Start(position)).is_ok() {
                                let bytes_to_read = (size - position) as usize;
                                let mut buffer = vec![0u8; bytes_to_read];

                                if let Ok(bytes_read) = file.read(&mut buffer) {
                                    buffer.truncate(bytes_read);

                                    if let Ok(text) = String::from_utf8(buffer) {
                                        let payload = LogChunkPayload {
                                            text,
                                            position,
                                            size,
                                        };

                                        let _ = app_clone.emit_all("log_chunk", payload);
                                        position = size;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        self.stop_flag = Some(stop_flag);
        self.watcher_handle = Some(handle);

        Ok(())
    }

    pub fn stop(&mut self) {
        if let Some(flag) = self.stop_flag.take() {
            flag.store(true, Ordering::Relaxed);
        }
        if let Some(handle) = self.watcher_handle.take() {
            let _ = handle.join();
        }
    }
}

impl Default for ArenaLogWatcher {
    fn default() -> Self {
        Self::new()
    }
}

#[tauri::command]
pub fn start_log_watcher(
    path: String,
    state: tauri::State<'_, AppState>,
    app: AppHandle,
) -> Result<(), String> {
    let mut watcher = state.log_watcher.lock().map_err(|e| e.to_string())?;
    watcher.start(path, app)
}

#[tauri::command]
pub fn stop_log_watcher(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut watcher = state.log_watcher.lock().map_err(|e| e.to_string())?;
    watcher.stop();
    Ok(())
}
