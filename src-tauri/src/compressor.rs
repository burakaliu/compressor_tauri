use base64::prelude::*;
use image_compressor::Factor;
use image_compressor::FolderCompressor;
use std::fs;
use std::io::Write;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use serde::{Deserialize, Serialize};

// Import the global path functions from lib.rs
use crate::utility::{clear_input_folder, clear_output_folder, get_input_path, get_output_path};

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
        
        println!("Processing image[{}]: {} ({} bytes)", i, original_name, decoded_bytes.len());
        
        // Validate image data before proceeding
        if let Err(validation_error) = validate_image_data(&decoded_bytes, original_name) {
            println!("Skipping invalid image {}: {}", original_name, validation_error);
            continue; // Skip this image but continue with others
        }
        
        // Store original with original extension for input
        let input_filename = format!("{}", original_name);
        let input_path = source.join(&input_filename);
        
        // Create compressed filename with _compressed suffix and .jpg extension (tentative)
        let compressed_filename = format!("{}_compressed.jpg", file_stem);
        let output_path = get_output_path().join(&compressed_filename);

        let mut file = fs::File::create(&input_path).map_err(|e| e.to_string())?;
        file.write_all(&decoded_bytes).map_err(|e| e.to_string())?;
        
        println!("Created input file: {:?}", input_path);

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

    // Check if we have any valid images to compress
    if metadata.is_empty() {
        return Err("No valid images found to compress. Please check your image files.".to_string());
    }

    println!("Valid images prepared for compression: {}", metadata.len());

    //compress images
    compress();
    //crate::parallel_compressor::parallel_compress();

    Ok(())
}

#[tauri::command]
pub fn compress() {
    let source = get_input_path().clone();
    let dest = get_output_path().clone();

    // Clear the output folder before compressing new images
    clear_output_folder().expect("Failed to clear output folder");

    // Log input files before compression
    log_input_files();

    let (tx, rx) = mpsc::channel();

    let mut comp = FolderCompressor::new(&source, dest);
    comp.set_factor(Factor::new(80., 1.0));
    comp.set_thread_count(THREAD_COUNT);
    comp.set_sender(tx);

    // Start a thread to monitor compression progress
    let monitor_handle = thread::spawn(move || {
        for received in rx {
            println!("Compression progress: {:?}", received);
        }
    });

    match comp.compress() {
        Ok(_) => {
            println!("Folder compressed successfully!");
            // Wait for monitor thread to finish
            let _ = monitor_handle.join();
            // Log output files after compression
            log_output_files();
            
            // Analyze compression results
            if let Ok((input_count, output_count)) = get_compression_statistics() {
                let analysis = analyze_compression_results(input_count, output_count);
                println!("\n{}", analysis);
            }
            
            // Update metadata with compressed file sizes and rename files
            if let Err(e) = update_compressed_sizes() {
                println!("Warning: Failed to update compressed sizes: {}", e);
            }
        },
        Err(e) => {
            println!("Cannot compress the folder!: {}", e);
            let _ = monitor_handle.join();
            // Still try to update what was compressed
            log_output_files();
            
            // Analyze compression results even after error
            if let Ok((input_count, output_count)) = get_compression_statistics() {
                let analysis = analyze_compression_results(input_count, output_count);
                println!("\n{}", analysis);
            }
            
            if let Err(e) = update_compressed_sizes() {
                println!("Warning: Failed to update compressed sizes after error: {}", e);
            }
        },
    }
} // Sender and Receiver. for more info, check mpsc and message passing.

#[tauri::command]
pub fn get_image_metadata() -> Result<Vec<ImageMetadata>, String> {
    load_image_metadata()
}

#[tauri::command]
pub fn get_compression_diagnostics() -> Result<String, String> {
    let (input_count, output_count) = get_compression_statistics()?;
    Ok(analyze_compression_results(input_count, output_count))
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

fn log_input_files() {
    let input_dir = get_input_path();
    println!("=== INPUT FILES BEFORE COMPRESSION ===");
    match fs::read_dir(&*input_dir) {
        Ok(entries) => {
            let mut count = 0;
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_file() {
                        count += 1;
                        let size = fs::metadata(&path)
                            .map(|m| m.len())
                            .unwrap_or(0);
                        println!("Input[{}]: {:?} ({} bytes)", count, path.file_name(), size);
                    }
                }
            }
            println!("Total input files: {}", count);
        },
        Err(e) => println!("Failed to read input directory: {}", e),
    }
    println!("=======================================");
}

fn log_output_files() {
    let output_dir = get_output_path();
    println!("=== OUTPUT FILES AFTER COMPRESSION ===");
    match fs::read_dir(&*output_dir) {
        Ok(entries) => {
            let mut count = 0;
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_file() {
                        count += 1;
                        let size = fs::metadata(&path)
                            .map(|m| m.len())
                            .unwrap_or(0);
                        let created = fs::metadata(&path)
                            .and_then(|m| m.created())
                            .map(|t| format!("{:?}", t))
                            .unwrap_or("unknown".to_string());
                        println!("Output[{}]: {:?} ({} bytes, created: {})", count, path.file_name(), size, created);
                    }
                }
            }
            println!("Total output files: {}", count);
        },
        Err(e) => println!("Failed to read output directory: {}", e),
    }
    println!("=======================================");
}

fn validate_image_data(data: &[u8], filename: &str) -> Result<(), String> {
    // Basic validation - check if the data looks like an image
    if data.is_empty() {
        return Err(format!("Image data is empty for {}", filename));
    }
    
    // Check for common image file signatures
    let is_valid = match data.get(0..4) {
        Some([0xFF, 0xD8, 0xFF, _]) => true, // JPEG
        Some([0x89, 0x50, 0x4E, 0x47]) => true, // PNG
        Some([0x47, 0x49, 0x46, 0x38]) => true, // GIF
        Some([0x52, 0x49, 0x46, 0x46]) => {
            // WebP - check for WEBP signature at offset 8
            data.len() >= 12 && &data[8..12] == b"WEBP"
        },
        Some([0x42, 0x4D, _, _]) => true, // BMP
        _ => {
            // If we can't identify the format, let's still try to process it
            // The image_compressor library might handle it
            println!("Warning: Unknown image format for {}, attempting to process anyway", filename);
            true
        }
    };
    
    if !is_valid {
        return Err(format!("Invalid image format detected for {}", filename));
    }
    
    Ok(())
}

fn update_compressed_sizes() -> Result<(), String> {
    let mut metadata = load_image_metadata()?;
    let output_dir = get_output_path();
    let expected_count = metadata.len();
    
    println!("Updating compressed sizes. Output directory: {:?}", output_dir);
    println!("Expected {} compressed files", expected_count);
    
    // Wait for compression to complete - retry up to 30 seconds
    let mut attempts = 0;
    let max_attempts = 60; // 30 seconds with 500ms intervals
    let mut output_files: Vec<std::path::PathBuf> = Vec::new();
    
    while attempts < max_attempts {
        // Get all files in the output directory
        output_files = fs::read_dir(&*output_dir)
            .map_err(|e| e.to_string())?
            .filter_map(|entry| {
                let entry = entry.ok()?;
                let path = entry.path();
                if path.is_file() {
                    Some(path)
                } else {
                    None
                }
            })
            .collect();
        
        println!("Attempt {}: Found {} compressed files (expected {})", 
                attempts + 1, output_files.len(), expected_count);
        
        if output_files.len() >= expected_count {
            break;
        }
        
        // Wait before retrying
        thread::sleep(Duration::from_millis(500));
        attempts += 1;
    }
    
    if output_files.len() < expected_count {
        println!("Warning: Only found {} compressed files, expected {}. Some images may have failed to compress.", 
                output_files.len(), expected_count);
    }
    
    // Sort by creation time to maintain order
    output_files.sort_by(|a, b| {
        let a_created = fs::metadata(a).and_then(|m| m.created()).unwrap_or(std::time::SystemTime::UNIX_EPOCH);
        let b_created = fs::metadata(b).and_then(|m| m.created()).unwrap_or(std::time::SystemTime::UNIX_EPOCH);
        a_created.cmp(&b_created)
    });
    
    for file in &output_files {
        println!("Found compressed file: {:?}", file);
    }
    
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
            // Mark as failed compression
            meta.compressed_size = None;
            meta.compressed_name = format!("{}_failed", meta.original_name);
        }
    }
    
    save_image_metadata(&metadata)?;
    println!("Metadata updated and saved");
    Ok(())
}

fn analyze_compression_results(input_count: usize, output_count: usize) -> String {
    if input_count == output_count {
        format!("✅ All {} images compressed successfully", input_count)
    } else if output_count == 0 {
        "❌ No images were compressed. Possible causes:
        - All input images were corrupted or invalid
        - Unsupported image formats
        - Insufficient disk space
        - Permission issues with output folder".to_string()
    } else {
        format!("⚠️  Partial compression: {} out of {} images compressed successfully.
        
        Possible causes for failed images:
        - Corrupted image data
        - Unsupported image formats (some exotic formats may not be supported)
        - Images with unusual dimensions or color profiles
        - Memory limitations for very large images
        - File system errors during processing
        
        Successfully compressed: {}
        Failed to compress: {}", 
        output_count, input_count, output_count, input_count - output_count)
    }
}

fn get_compression_statistics() -> Result<(usize, usize), String> {
    let input_dir = get_input_path();
    let output_dir = get_output_path();
    
    let input_count = fs::read_dir(&*input_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            entry.ok().and_then(|e| {
                if e.path().is_file() { Some(()) } else { None }
            })
        })
        .count();
    
    let output_count = fs::read_dir(&*output_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            entry.ok().and_then(|e| {
                if e.path().is_file() { Some(()) } else { None }
            })
        })
        .count();
    
    Ok((input_count, output_count))
}
