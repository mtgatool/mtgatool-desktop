use serde_json::Value as JsonValue;
use tauri::command;

/// Check if the current process has admin/elevated privileges
#[command]
pub fn is_admin() -> bool {
    mtga_reader::api::is_admin()
}

/// Find a process by name
#[command]
pub fn find_process(process_name: String) -> bool {
    mtga_reader::api::find_process(&process_name)
}

/// Read data from process memory following a field path
#[command]
pub async fn read_data(process_name: String, fields: Vec<String>) -> JsonValue {
    mtga_reader::api::read_data(&process_name, fields)
}

/// Read a class instance at a specific address
#[command]
pub async fn read_class(process_name: String, address: i64) -> JsonValue {
    mtga_reader::api::read_class(&process_name, address)
}

/// Read a generic instance at a specific address
#[command]
pub async fn read_generic_instance(process_name: String, address: i64) -> JsonValue {
    mtga_reader::api::read_generic_instance(&process_name, address)
}

/// Initialize a cached reader session. Scans assemblies once so subsequent
/// typed reads take ~10-20ms instead of a full ~4s scan.
#[command]
pub async fn reader_init(process_name: String) -> Result<bool, String> {
    mtga_reader::api::init(&process_name)
}

/// Clear the cached reader session
#[command]
pub fn reader_close() -> Result<bool, String> {
    mtga_reader::api::close()
}

/// Whether a cached reader session is active
#[command]
pub fn reader_is_initialized() -> bool {
    mtga_reader::api::is_initialized()
}

/// Read all saved decks (name, deckId, attributes, per-pile card lists)
#[command]
pub async fn read_decks(process_name: String) -> JsonValue {
    mtga_reader::api::read_decks(&process_name)
}

/// Read constructed/limited rank info
#[command]
pub async fn read_ranks(process_name: String) -> JsonValue {
    mtga_reader::api::read_ranks(&process_name)
}

/// Read account identity (displayName, personaId, ...)
#[command]
pub async fn read_account(process_name: String) -> JsonValue {
    mtga_reader::api::read_account(&process_name)
}

/// Read the card collection as {count, cards: [{grpId, qty}]}
#[command]
pub async fn read_collection(process_name: String) -> JsonValue {
    mtga_reader::api::read_collection(&process_name)
}

/// Read inventory (gems, gold, wildcards, vault progress, ...)
#[command]
pub async fn read_inventory(process_name: String) -> JsonValue {
    mtga_reader::api::read_inventory(&process_name)
}
