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
pub struct ImageData {
    pub data: String,
    pub filename: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ImageMetadata {
    pub original_name: String,
    pub compressed_name: String,
    pub original_size: u64,
    pub compressed_size: Option<u64>,
    pub input_path: String,
    pub output_path: String,
    pub index: usize,
}

#[tauri::command]
pub fn handle_images(images: Vec<ImageData>) -> Result<(), String> {
    // Get the global input path
    let source = get_input_path();

    // Clear the input folder before processing new images
    clear_input_folder().map_err(|e| format!("Failed to clear input folder {}", e))?;

    // Store metadata for images
    let mut metadata: Vec<ImageMetadata> = Vec::new();

    for (i, image_data) in images.iter().enumerate() {
        // Strip the base64 header
        let base64_str = image_data.data
            .split(',')
            .nth(1)
            .ok_or("Invalid base64 image format")?;

        let decoded_bytes = BASE64_STANDARD
            .decode(base64_str)
            .map_err(|e| e.to_string())?;

        // Extract original filename and create new names
        let original_name = &image_data.filename;
        let file_stem = std::path::Path::new(original_name)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("image");
        
        // Store original with original extension for input
        let input_filename = format!("{}", original_name);
        let input_path = source.join(&input_filename);
        
        // Create compressed filename with _compressed suffix and .jpg extension (tentative)
        let compressed_filename = format!("{}_compressed.jpg", file_stem);
        let output_path = get_output_path().join(&compressed_filename);

        let mut file = fs::File::create(&input_path).map_err(|e| e.to_string())?;
        file.write_all(&decoded_bytes).map_err(|e| e.to_string())?;

        // Create metadata entry (output_path and compressed_name will be updated after compression)
        let image_meta = ImageMetadata {
            original_name: original_name.clone(),
            compressed_name: compressed_filename, // This will be updated after compression
            original_size: decoded_bytes.len() as u64,
            compressed_size: None, // Will be filled after compression
            input_path: input_path.to_string_lossy().to_string(),
            output_path: output_path.to_string_lossy().to_string(), // This will be updated after compression
            index: i,
        };
        metadata.push(image_meta);
    }

    // Save metadata to a JSON file
    save_image_metadata(&metadata)?;

    //compress images
    compress();

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
        Ok(_) => {
            println!("Folder compressed successfully!");
            // Update metadata with compressed file sizes and rename files
            if let Err(e) = update_compressed_sizes() {
                println!("Warning: Failed to update compressed sizes: {}", e);
            }
        },
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
    let output_dir = get_output_path();
    
    println!("Updating compressed sizes. Output directory: {:?}", output_dir);
    
    // Get all files in the output directory
    let mut output_files: Vec<_> = fs::read_dir(&*output_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            if path.is_file() {
                println!("Found compressed file: {:?}", path);
                Some(path)
            } else {
                None
            }
        })
        .collect();
    
    println!("Total compressed files found: {}", output_files.len());
    
    // Sort by filename to match with metadata by index
    output_files.sort_by(|a, b| a.file_name().cmp(&b.file_name()));
    
    // Update metadata with actual compressed file info and rename files
    for (i, meta) in metadata.iter_mut().enumerate() {
        if let Some(actual_output_path) = output_files.get(i) {
            println!("Processing metadata[{}]: original={}, actual_compressed={:?}", i, meta.original_name, actual_output_path);
            
            // Get the file size
            if let Ok(file_metadata) = fs::metadata(actual_output_path) {
                meta.compressed_size = Some(file_metadata.len());
                println!("Set compressed size for {}: {} bytes", meta.original_name, file_metadata.len());
            }
            
            // Create the desired filename with _compressed suffix
            let original_stem = std::path::Path::new(&meta.original_name)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("image");
            let desired_compressed_name = format!("{}_compressed.jpg", original_stem);
            let desired_output_path = output_dir.join(&desired_compressed_name);
            
            println!("Attempting to rename {:?} to {:?}", actual_output_path, desired_output_path);
            
            // Rename the file to our desired name
            if let Err(e) = fs::rename(actual_output_path, &desired_output_path) {
                println!("Warning: Failed to rename compressed file: {}", e);
                // If rename fails, use the original path
                meta.output_path = actual_output_path.to_string_lossy().to_string();
                if let Some(filename) = actual_output_path.file_name() {
                    meta.compressed_name = filename.to_string_lossy().to_string();
                }
            } else {
                // Successfully renamed, update metadata
                println!("Successfully renamed to: {}", desired_compressed_name);
                meta.output_path = desired_output_path.to_string_lossy().to_string();
                meta.compressed_name = desired_compressed_name;
            }
        } else {
            println!("No compressed file found for metadata[{}]: {}", i, meta.original_name);
        }
    }
    
    save_image_metadata(&metadata)?;
    println!("Metadata updated and saved");
    Ok(())
}
