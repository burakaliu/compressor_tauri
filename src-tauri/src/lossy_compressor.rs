
use image::GenericImageView;
use mozjpeg::{ColorSpace, Compress};
use rayon::prelude::*;
use std::{
    fs,
    path::{PathBuf},
};

use crate::utility::{
    clear_output_folder, deduplicate_path, get_input_path, get_output_path, CompressionResult, encode_file
};

#[tauri::command]
pub fn lossy_compression() -> Result<Vec<CompressionResult>, String> {
    // This function implements lossy compression using mozjpeg
    println!("Lossy compression function called.");

    let input_dir = get_input_path().clone();
    let output_dir = get_output_path().clone();

    println!("Input path: {:?}", &input_dir);
    println!("Output path: {:?}", &output_dir);

    clear_output_folder().expect("Failed to clear output folder: {}");
    fs::create_dir_all(&output_dir).map_err(|e| format!("Failed to create output dir: {}", e))?;

    let input_files: Vec<PathBuf> = fs::read_dir(&input_dir)
        .map_err(|e| format!("Failed to read input dir: {}", e))?
        .filter_map(|res| res.ok())
        .map(|entry| entry.path())
        .filter(|p| p.is_file() && is_jpeg_compatible(p))
        .collect();

    let results: Vec<CompressionResult> = input_files
        .par_iter()
        .filter_map(|input| compress_image_lossy(input, &output_dir).ok())
        .collect();

    println!("Compression completed. {} files processed.", results.len());

    Ok(results)
}

fn is_jpeg_compatible(path: &PathBuf) -> bool {
    match path.extension().and_then(|s| s.to_str()) {
        Some(ext) => matches!(ext.to_lowercase().as_str(), "jpg" | "jpeg" | "png"),
        None => false,
    }
}

pub fn compress_image_lossy(
    input_path: &PathBuf,
    output_dir: &PathBuf,
) -> Result<CompressionResult, String> {
    let img = image::open(&input_path).map_err(|e| format!("Image open failed: {}", e))?;
    let image_data = img.to_rgb8();

    let mut comp = Compress::new(ColorSpace::JCS_RGB);
    comp.set_quality(75.0);
    comp.set_progressive_mode();

    let (w, h) = img.dimensions();
    comp.set_size(w as usize, h as usize);

    let mut compressed_bytes = Vec::new();
    let mut comp_writer = comp
        .start_compress(&mut compressed_bytes)
        .map_err(|e| format!("Start compress failed: {}", e))?;

    comp_writer
        .write_scanlines(image_data.as_flat_samples().as_slice())
        .map_err(|e| format!("Write scanlines failed: {}", e))?;

    comp_writer
        .finish()
        .map_err(|e| format!("Finish compress failed: {}", e))?;

    let file_stem = input_path.file_stem().unwrap().to_string_lossy();
    //let ext = input_path.extension().unwrap_or_default().to_string_lossy();
    let ext = "jpg"; // Assuming JPEG for compression, adjust as needed
    let initial_path = output_dir.join(format!("{}_compressed.{}", file_stem, ext));

    let output_path = deduplicate_path(&initial_path);
    fs::write(&output_path, &compressed_bytes)
        .map_err(|e| format!("Write output failed: {}", e))?;

    let original_size = fs::metadata(&input_path).map(|m| m.len()).unwrap_or(0);
    let compressed_size = compressed_bytes.len() as u64;

    let reduction_percent = if original_size > 0 && compressed_size <= original_size {
        100.0 * (original_size - compressed_size) as f32 / original_size as f32
    } else if original_size > 0 && compressed_size > original_size {
        // Compression resulted in larger file, show negative reduction
        -100.0 * (compressed_size - original_size) as f32 / original_size as f32
    } else {
        0.0
    };

    println!(
        "Compressed {} to {}: {} bytes -> {} bytes, {:.2}% reduction",
        input_path.display(),
        output_path.display(),
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
        original_base64: encode_file(&input_path.to_string_lossy())?,
        compressed_base64: encode_file(&output_path.to_string_lossy())?,
    })
}
