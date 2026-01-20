use std::sync::Mutex;
use crate::arena_log::watcher::ArenaLogWatcher;

pub struct AppState {
    pub log_watcher: Mutex<ArenaLogWatcher>,
}
