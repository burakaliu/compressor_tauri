// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod compressor;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn slap(name: &str) -> String {
    return format!("Slap! You've been slapped, {}!", name);
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, slap, compressor::compress, compressor::handle_images])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
