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
pub fn read_data(process_name: String, fields: Vec<String>) -> JsonValue {
    mtga_reader::api::read_data(&process_name, fields)
}

/// Read a class instance at a specific address
#[command]
pub fn read_class(process_name: String, address: i64) -> JsonValue {
    mtga_reader::api::read_class(&process_name, address)
}

/// Read a generic instance at a specific address
#[command]
pub fn read_generic_instance(process_name: String, address: i64) -> JsonValue {
    mtga_reader::api::read_generic_instance(&process_name, address)
}
