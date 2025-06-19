use image_compressor::Factor;
use image_compressor::FolderCompressor;
use std::fs;
use std::io::Write;
use std::sync::mpsc;
use base64::prelude::*;

// Import the global path functions from lib.rs
use crate::{get_input_path, get_output_path};

static THREAD_COUNT: u32 = 4; // number of threads



#[tauri::command]
pub fn handle_images(images: Vec<String>) -> Result<(), String> {
    // Get the global input path
    let source = get_input_path();

    for (i, data_url) in images.iter().enumerate() {
        // Strip the base64 header
        let base64_str = data_url
            .split(',')
            .nth(1)
            .ok_or("Invalid base64 image format")?;

        let decoded_bytes = BASE64_STANDARD.decode(base64_str).map_err(|e| e.to_string())?;

        // Infer image type (you could parse it from the header if needed)
        let output_path = source.join(format!("image_{}.png", i)); // or jpg

        let mut file = fs::File::create(&output_path).map_err(|e| e.to_string())?;
        file.write_all(&decoded_bytes).map_err(|e| e.to_string())?;
    }

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

    match comp.compress() {
        Ok(_) => println!("Folder compressed successfully!"),
        Err(e) => println!("Cannot compress the folder!: {}", e),
    }

    //clear input folder
    if let Err(e) = fs::remove_dir_all(&source) {
        println!("Error clearing input folder: {}", e);
    }

    //recreate input folder
    if let Err(e) = fs::create_dir_all(&source) {
        println!("Error recreating input folder: {}", e);
    }
    
} // Sender and Receiver. for more info, check mpsc and message passing.
