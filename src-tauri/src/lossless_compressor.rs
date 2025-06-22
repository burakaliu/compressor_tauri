use crate::lossy_compressor::compress_image_lossy;
use crate::utility::{
    clear_output_folder, deduplicate_path, encode_file, get_input_path, get_output_path,
    CompressionResult,
};
use oxipng::{optimize, InFile, Options, OutFile};
use rayon::prelude::*;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn lossless_compression() -> Result<Vec<CompressionResult>, String> {
    println!("Lossless compression function called.");

    let input_dir = get_input_path().clone();
    let output_dir = get_output_path().clone();
    println!("Input path: {:?}", &input_dir);
    println!("Output path: {:?}", &output_dir);

    // Clear the output folder
    clear_output_folder().map_err(|e| format!("Failed to clear output folder: {}", e))?;
    fs::create_dir_all(&output_dir).map_err(|e| format!("Failed to create output dir: {}", e))?;

    // Read all files in the input directory
    let input_files: Vec<PathBuf> = fs::read_dir(&input_dir)
        .map_err(|e| format!("Failed to read input dir: {}", e))?
        .filter_map(|res| res.ok())
        .map(|entry| entry.path())
        .filter(|p| p.is_file())
        .collect();

    // Process each file
    let results: Vec<CompressionResult> = input_files
        .par_iter()
        .filter_map(|input| {
            if is_lossless_compatible(&input) {
                compress_image_lossless(&input, &output_dir).ok()
            } else {
                compress_image_lossy(&input, &output_dir).ok()
            }
        })
        .collect();

    println!("Compression completed. {} files processed.", results.len());

    Ok(results)
}

fn is_lossless_compatible(path: &PathBuf) -> bool {
    match path.extension().and_then(|s| s.to_str()) {
        Some(ext) => matches!(ext.to_lowercase().as_str(), "png" | "webp"),
        None => false,
    }
}

fn compress_image_lossless(
    input_path: &PathBuf,
    output_dir: &PathBuf,
) -> Result<CompressionResult, String> {
    let file_stem = input_path.file_stem().unwrap().to_string_lossy();
    //let ext = input_path.extension().unwrap_or_default().to_string_lossy();
    let ext = "png"; // Assuming PNG for compression, adjust as needed
    let initial_path = output_dir.join(format!("{}_compressed.{}", file_stem, ext));
    let output_path = deduplicate_path(&initial_path);

    // Copy the file first, then optimize in place
    fs::copy(&input_path, &output_path).map_err(|e| format!("Failed to copy PNG: {}", e))?;

    let mut options = Options::max_compression();
    options.strip = oxipng::StripChunks::Safe; // Strip metadata?

    // Optimize in place using the copied file
    let input_file = InFile::Path(output_path.clone());
    let output_file = OutFile::from_path(output_path.clone());

    optimize(&input_file, &output_file, &options)
        .map_err(|e| format!("Failed to optimize PNG: {}", e))?;

    let original_size = fs::metadata(&input_path).map(|m| m.len()).unwrap_or(0);
    let compressed_size = fs::metadata(&output_path).map(|m| m.len()).unwrap_or(0);
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
