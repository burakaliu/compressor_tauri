use base64::prelude::*;
use std::fs;
use std::io::Read;
use tauri::Manager;

mod compressor;
mod utility;
mod lossy_compressor;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_compressed_images() -> Result<Vec<String>, String> {
    let mut base64_images = Vec::new();
    let output_dir = crate::utility::get_output_path();

    for entry in fs::read_dir(&*output_dir).map_err(|e| e.to_string())? {
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

#[tauri::command]
fn export_compressed_images(destination: String) -> Result<(), String> {
    let output_dir = crate::utility::get_output_path();

    for entry in std::fs::read_dir(&*output_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            let file_name = path.file_name().ok_or("Invalid file name")?;
            let dest_path = std::path::Path::new(&destination).join(file_name);
            fs::copy(&path, &dest_path).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
fn get_original_images() -> Result<Vec<String>, String> {
    let mut base64_images = Vec::new();
    let input_dir = crate::utility::get_input_path();

    for entry in fs::read_dir(&*input_dir).map_err(|e| e.to_string())? {
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
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_data = app.path().app_data_dir().unwrap();
            crate::utility::initialize_image_paths(app_data)?;
            println!("Input path: {:?}", crate::utility::get_input_path());
            println!("Output path: {:?}", crate::utility::get_output_path());

            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_compressed_images,
            export_compressed_images,
            get_original_images,
            lossy_compressor::lossy_compression,
            compressor::compress,
            compressor::handle_images,
            compressor::get_image_metadata,
            compressor::get_compression_diagnostics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
