use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

use crate::state::AppState;

#[derive(Clone, Serialize)]
pub struct LogChunkPayload {
    pub text: String,
    pub position: u64,
    pub size: u64,
}

/// Read from `position` to the end of the file.
/// Returns (new_text, new_position, size). `new_text` is empty when there is
/// nothing new. If the file shrank (game restarted / log rotated) it re-reads
/// from the beginning. Uses lossy UTF-8 so a stray byte can't stall the read.
fn read_from(path: &str, position: u64) -> std::io::Result<(String, u64, u64)> {
    let size = std::fs::metadata(path)?.len();

    let mut pos = position;
    if pos > size {
        pos = 0; // file was recreated / truncated
    }

    if pos >= size {
        return Ok((String::new(), pos, size));
    }

    let mut file = File::open(path)?;
    file.seek(SeekFrom::Start(pos))?;
    let mut buffer = vec![0u8; (size - pos) as usize];
    let bytes_read = file.read(&mut buffer)?;
    buffer.truncate(bytes_read);
    let text = String::from_utf8_lossy(&buffer).to_string();

    Ok((text, pos + bytes_read as u64, size))
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
            // Start at the beginning so the existing log is read in full
            // (history, account, current state), then tail new content.
            let mut position: u64 = 0;
            let mut initial_read_done = false;

            eprintln!("[log-watcher] started for {}", path_clone);

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
                    eprintln!("[log-watcher] failed to create watcher: {}", e);
                    return;
                }
            };

            let path_obj = Path::new(&path_clone);
            if let Some(parent) = path_obj.parent() {
                if let Err(e) = watcher.watch(parent, RecursiveMode::NonRecursive) {
                    eprintln!("[log-watcher] failed to watch directory: {}", e);
                    return;
                }
            }

            // Polling loop
            loop {
                if stop_flag_clone.load(Ordering::Relaxed) {
                    break;
                }

                // Wake on a file change, or every 500ms as a fallback.
                let _ = rx.recv_timeout(Duration::from_millis(500));

                let old_position = position;
                match read_from(&path_clone, position) {
                    Ok((text, new_position, size)) => {
                        // Detect a restart (read_from reset to 0 internally).
                        if new_position < old_position {
                            initial_read_done = false;
                        }

                        if !text.is_empty() {
                            eprintln!(
                                "[log-watcher] chunk {} bytes (pos {} -> {} / {})",
                                text.len(),
                                old_position,
                                new_position,
                                size
                            );
                            let payload = LogChunkPayload {
                                text,
                                position: old_position,
                                size,
                            };
                            // Global emit: Rust `emit_to(label, ...)` is unreliable
                            // reaching a webview's frontend `listen` in Tauri v2, so
                            // broadcast instead. Only the background window listens
                            // for "log_chunk", so the other windows just ignore it.
                            if let Err(e) = app_clone.emit("log_chunk", payload) {
                                eprintln!("[log-watcher] emit log_chunk failed: {}", e);
                            }
                        }

                        position = new_position;

                        if !initial_read_done && position >= size {
                            initial_read_done = true;
                            eprintln!("[log-watcher] initial read finished at {} bytes", size);
                            let _ = app_clone.emit("log_finished", ());
                        }
                    }
                    Err(e) => {
                        eprintln!("[log-watcher] read error: {}", e);
                    }
                }
            }

            eprintln!("[log-watcher] stopped");
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

#[cfg(test)]
mod tests {
    use super::read_from;
    use std::io::Write;

    fn tmp(name: &str) -> String {
        std::env::temp_dir()
            .join(format!(
                "mtgatool_watchtest_{}_{}.log",
                std::process::id(),
                name
            ))
            .to_string_lossy()
            .to_string()
    }

    #[test]
    fn reads_whole_file_then_tails_growth() {
        let p = tmp("grow");
        std::fs::write(&p, "line1\nline2\n").unwrap();

        // Initial read from 0 gets the whole existing file.
        let (text, pos, size) = read_from(&p, 0).unwrap();
        assert_eq!(text, "line1\nline2\n");
        assert_eq!(size, 12);
        assert_eq!(pos, 12);

        // Nothing new when caught up.
        let (text2, pos2, _) = read_from(&p, pos).unwrap();
        assert_eq!(text2, "");
        assert_eq!(pos2, pos);

        // Append (simulate the live game writing) -> only the delta is read.
        let mut f = std::fs::OpenOptions::new().append(true).open(&p).unwrap();
        f.write_all(b"line3\n").unwrap();
        let (text3, pos3, size3) = read_from(&p, pos2).unwrap();
        assert_eq!(text3, "line3\n");
        assert_eq!(pos3, size3);
        assert_eq!(pos3, 18);

        std::fs::remove_file(&p).ok();
    }

    #[test]
    fn re_reads_when_file_shrinks() {
        let p = tmp("shrink");
        std::fs::write(&p, "aaaaaaaaaa\n").unwrap(); // 11 bytes
        let (_t, pos, _s) = read_from(&p, 0).unwrap();
        assert_eq!(pos, 11);

        // File recreated smaller (game restart) -> read_from resets to 0.
        std::fs::write(&p, "new\n").unwrap(); // 4 bytes, pos(11) > size(4)
        let (text, pos2, size) = read_from(&p, pos).unwrap();
        assert_eq!(text, "new\n");
        assert_eq!(size, 4);
        assert_eq!(pos2, 4);

        std::fs::remove_file(&p).ok();
    }
}
