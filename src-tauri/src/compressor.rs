use base64::prelude::*;
use image_compressor::Factor;
use image_compressor::FolderCompressor;
use std::fs;
use std::io::Write;
use std::sync::mpsc;
use serde::{Deserialize, Serialize};

// Import the global path functions from lib.rs
use crate::{get_input_path, get_output_path};

static THREAD_COUNT: u32 = 4; // number of threads

#[derive(Serialize, Deserialize, Clone)]
pub struct ImageMetadata {
    pub original_name: String,
    pub original_size: u64,
    pub compressed_size: Option<u64>,
    pub input_path: String,
    pub output_path: String,
    pub index: usize,
}

#[tauri::command]
pub fn handle_images(images: Vec<String>) -> Result<(), String> {
    // Get the global input path
    let source = get_input_path();

    // Clear the input folder before processing new images
    clear_input_folder().map_err(|e| format!("Failed to clear input folder {}", e))?;

    // Store metadata for images
    let mut metadata: Vec<ImageMetadata> = Vec::new();

    for (i, data_url) in images.iter().enumerate() {
        // Strip the base64 header
        let base64_str = data_url
            .split(',')
            .nth(1)
            .ok_or("Invalid base64 image format")?;

        let decoded_bytes = BASE64_STANDARD
            .decode(base64_str)
            .map_err(|e| e.to_string())?;

        // Infer image type (you could parse it from the header if needed)
        let output_path = source.join(format!("image_{}.png", i));

        let mut file = fs::File::create(&output_path).map_err(|e| e.to_string())?;
        file.write_all(&decoded_bytes).map_err(|e| e.to_string())?;

        // Create metadata entry
        let image_meta = ImageMetadata {
            original_name: format!("image_{}.png", i),
            original_size: decoded_bytes.len() as u64,
            compressed_size: None, // Will be filled after compression
            input_path: output_path.to_string_lossy().to_string(),
            output_path: get_output_path().join(format!("image_{}.jpg", i)).to_string_lossy().to_string(),
            index: i,
        };
        metadata.push(image_meta);
    }

    // Save metadata to a JSON file
    save_image_metadata(&metadata)?;

    //compress images
    compress();

    // Update metadata with compressed file sizes
    update_compressed_sizes()?;

    Ok(())
}

#[tauri::command]
pub fn compress() {
    let source = get_input_path().clone();
    let dest = get_output_path().clone();

    let (tx, _rx) = mpsc::channel();

    let mut comp = FolderCompressor::new(&source, dest);
    comp.set_factor(Factor::new(80., 1.0));
    comp.set_thread_count(THREAD_COUNT);
    comp.set_sender(tx);

    // Clear the output folder before compressing enw images
    clear_output_folder().expect("Failed to clear output folder");

    match comp.compress() {
        Ok(_) => println!("Folder compressed successfully!"),
        Err(e) => println!("Cannot compress the folder!: {}", e),
    }
} // Sender and Receiver. for more info, check mpsc and message passing.

#[tauri::command]
pub fn clear_input_folder() -> Result<(), String> {
    let input_path = get_input_path();

    // Clear the input folder
    fs::remove_dir_all(&input_path)
        .map_err(|e| e.to_string())
        .and_then(|_| {
            // Recreate the input folder
            fs::create_dir_all(&input_path).map_err(|e| e.to_string())
        })
        .map(|_| ())
}

#[tauri::command]
pub fn clear_output_folder() -> Result<(), String> {
    let output_path = get_output_path();

    // Clear the output folder
    fs::remove_dir_all(&output_path)
        .map_err(|e| e.to_string())
        .and_then(|_| {
            // Recreate the output folder
            fs::create_dir_all(&output_path).map_err(|e| e.to_string())
        })
        .map(|_| ())
}

#[tauri::command]
pub fn get_image_metadata() -> Result<Vec<ImageMetadata>, String> {
    load_image_metadata()
}

fn save_image_metadata(metadata: &[ImageMetadata]) -> Result<(), String> {
    let metadata_path = get_input_path().parent()
        .ok_or("Failed to get parent directory")?
        .join("metadata.json");
    
    let json = serde_json::to_string_pretty(metadata).map_err(|e| e.to_string())?;
    fs::write(metadata_path, json).map_err(|e| e.to_string())?;
    
    Ok(())
}

fn load_image_metadata() -> Result<Vec<ImageMetadata>, String> {
    let metadata_path = get_input_path().parent()
        .ok_or("Failed to get parent directory")?
        .join("metadata.json");
    
    if !metadata_path.exists() {
        return Ok(Vec::new());
    }
    
    let json = fs::read_to_string(metadata_path).map_err(|e| e.to_string())?;
    let metadata: Vec<ImageMetadata> = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    
    Ok(metadata)
}

fn update_compressed_sizes() -> Result<(), String> {
    let mut metadata = load_image_metadata()?;
    
    for meta in &mut metadata {
        let compressed_path = std::path::Path::new(&meta.output_path);
        if compressed_path.exists() {
            if let Ok(file_metadata) = fs::metadata(compressed_path) {
                meta.compressed_size = Some(file_metadata.len());
            }
        }
    }
    
    save_image_metadata(&metadata)?;
    Ok(())
}
