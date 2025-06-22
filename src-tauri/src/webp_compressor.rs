
use crate::utility::{
    clear_output_folder, deduplicate_path, get_input_path, get_output_path, CompressionResult, is_jpeg
};
use crate::lossy_compressor::compress_image_lossy;
use std::fs;
use std::path::{Path, PathBuf};
use image::ImageReader;
use image::GenericImageView;
use webp::Encoder;
use rayon::prelude::*;


#[tauri::command]
pub fn webp_compression(lossless: bool, quality: f32) -> Result<Vec<CompressionResult>, String> {

    println!("WebP compression function called.");

    let input_dir = get_input_path();
    let output_dir = get_output_path();

    clear_output_folder().map_err(|e| format!("Failed to clear output folder: {}", e))?;
    fs::create_dir_all(&output_dir).map_err(|e| format!("Failed to create output dir: {}", e))?;

    let input_files: Vec<PathBuf> = fs::read_dir(&input_dir)
        .map_err(|e| format!("Failed to read input dir: {}", e))?
        .filter_map(|res| res.ok())
        .map(|entry| entry.path())
        .filter(|p| p.is_file())
        .collect();

    let results: Vec<CompressionResult> = input_files
        .par_iter()
        .filter_map(|input| {
            if (is_jpeg(input)){
                compress_image_lossy(input, &output_dir).ok()
            } else {
                compress_to_webp(input, &output_dir, quality, lossless).ok()
            }
        }
    )
        .collect();

    println!("Webp compression completed. {} files processed.", results.len());

    Ok(results)
}


pub fn compress_to_webp(input_path: &PathBuf, output_dir: &PathBuf, quality: f32, lossless: bool) -> Result<CompressionResult, String> {
    // Load the image using the image crate
    let img = ImageReader::open(input_path)
        .map_err(|e| format!("Failed to open image: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    let original_size = fs::metadata(input_path).map(|m| m.len()).unwrap_or(0);

    // Prepare image buffer
    let rgba = img.to_rgba8(); // ensures alpha is preserved
    let (width, height) = img.dimensions();

    // Encode with WebP
    let encoded = if lossless {
        Encoder::from_rgba(&rgba, width, height).encode_lossless()
    } else {
        Encoder::from_rgba(&rgba, width, height).encode(quality)
    };

    // Create output path
    let stem = input_path.file_stem().unwrap().to_string_lossy();
    let initial_output = output_dir.join(format!("{}_compressed.webp", stem));
    let output_path = deduplicate_path(&initial_output);

    fs::write(&output_path, &*encoded).map_err(|e| format!("Failed to write output: {}", e))?;

    let compressed_size = encoded.len() as u64;
    let reduction_percent = if original_size > 0 && compressed_size <= original_size {
        100.0 * (original_size - compressed_size) as f32 / original_size as f32
    } else if original_size > 0 && compressed_size > original_size {
        // Compression resulted in larger file, show negative reduction
        -100.0 * (compressed_size - original_size) as f32 / original_size as f32
    } else {
        0.0
    };

    println!(
        "\n Compressed {}: original size = {}, compressed size = {}, reduction = {:.2}%",
        input_path.display(),
        original_size,
        compressed_size,
        reduction_percent
    );

    Ok(CompressionResult {
        original_path: input_path.display().to_string(),
        compressed_path: output_path.display().to_string(),
        original_size,
        compressed_size,
        reduction_percent,
    })
}
