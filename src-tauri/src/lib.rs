use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;
use base64::prelude::*;
use tauri::Manager;

mod compressor;

// Global static variables for image paths
static INPUT_PATH: OnceLock<PathBuf> = OnceLock::new();
static OUTPUT_PATH: OnceLock<PathBuf> = OnceLock::new();

// Public functions to access the global paths
pub fn get_input_path() -> &'static PathBuf {
    INPUT_PATH.get().expect("Input path not initialized")
}

pub fn get_output_path() -> &'static PathBuf {
    OUTPUT_PATH.get().expect("Output path not initialized")
}

// Initialize the global paths (called during setup)
fn initialize_image_paths(app_data_dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let input_dir = app_data_dir.join("images/input");
    let output_dir = app_data_dir.join("images/output");

    // Create directories if they don't exist
    fs::create_dir_all(&input_dir)?;
    fs::create_dir_all(&output_dir)?;

    // Set the global paths
    INPUT_PATH.set(input_dir).map_err(|_| "Failed to set input path")?;
    OUTPUT_PATH.set(output_dir).map_err(|_| "Failed to set output path")?;

    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_compressed_images() -> Result<Vec<String>, String> {
    use std::fs;
    use std::io::Read;

    let mut base64_images = Vec::new();
    let OUTPUT_DIR = get_output_path();

    for entry in fs::read_dir(&*OUTPUT_DIR).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() {
            let mut file = fs::File::open(&path).map_err(|e| e.to_string())?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

            let mime = if let Some(ext) = path.extension() {
                match ext.to_str().unwrap_or("").to_lowercase().as_str() {
                    "jpg" | "jpeg" => "image/jpeg",
                    "png" => "image/png",
                    "webp" => "image/webp",
                    _ => "application/octet-stream",
                }
            } else {
                "application/octet-stream"
            };

            let encoded = BASE64_STANDARD.encode(&buffer);
            base64_images.push(format!("data:{};base64,{}", mime, encoded));
        }
    }

    Ok(base64_images)
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data = app.path().app_data_dir().unwrap();
            initialize_image_paths(app_data)?;

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_compressed_images,
            compressor::compress,
            compressor::handle_images
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
