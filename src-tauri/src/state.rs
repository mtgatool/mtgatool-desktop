use crate::arena_log::watcher::ArenaLogWatcher;
use std::sync::Mutex;

pub struct AppState {
    pub log_watcher: Mutex<ArenaLogWatcher>,
}
