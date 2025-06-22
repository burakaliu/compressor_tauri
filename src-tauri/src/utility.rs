use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use base64::prelude::*;
use serde::{Serialize, Deserialize};
use crate::webp_compressor::webp_compression;
use crate::lossy_compressor::lossy_compression;
use crate::lossless_compressor::lossless_compression;


#[derive(serde::Serialize)]
pub struct CompressionResult {
    pub(crate) original_path: String,
    pub compressed_path: String,
    pub original_size: u64,
    pub compressed_size: u64,
    pub reduction_percent: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub enum CompressionMethod {
    #[serde(rename = "lossy")]
    Lossy,
    #[serde(rename = "lossless")]
    Lossless,
    #[serde(rename = "webp_lossy")]
    WebpLossy,
    #[serde(rename = "webp_lossless")]
    WebpLossless,
}

impl Default for CompressionMethod {
    fn default() -> Self {
        Self::WebpLossy
    }
}

impl CompressionMethod {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Lossy => "lossy",
            Self::Lossless => "lossless",
            Self::WebpLossy => "webp_lossy",
            Self::WebpLossless => "webp_lossless",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "lossy" => Some(Self::Lossy),
            "lossless" => Some(Self::Lossless),
            "webp_lossy" => Some(Self::WebpLossy),
            "webp_lossless" => Some(Self::WebpLossless),
            _ => Some(Self::WebpLossy), // Default to WebpLossy if unknown
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppSettings {
    pub compression_quality: f32,
    pub method: CompressionMethod,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            compression_quality: 75.0,
            method: CompressionMethod::WebpLossy,
        }
    }
}

// Global static variables for image paths
pub static INPUT_PATH: OnceLock<PathBuf> = OnceLock::new();
pub static OUTPUT_PATH: OnceLock<PathBuf> = OnceLock::new();
pub static SETTINGS_DIR: OnceLock<PathBuf> = OnceLock::new();



// Public functions to access the global paths
pub fn get_input_path() -> &'static PathBuf {
    INPUT_PATH.get().expect("Input path not initialized")
}

pub fn get_output_path() -> &'static PathBuf {
    OUTPUT_PATH.get().expect("Output path not initialized")
}

// Initialize the global paths (called during setup)
pub fn initialize_image_paths(app_data_dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let input_dir = app_data_dir.join("images/input");
    let output_dir = app_data_dir.join("images/output");

    // Create directories if they don't exist
    fs::create_dir_all(&input_dir)?;
    fs::create_dir_all(&output_dir)?;

    // Set the global paths
    crate::utility::INPUT_PATH
        .set(input_dir)
        .map_err(|_| "Failed to set input path")?;
    crate::utility::OUTPUT_PATH
        .set(output_dir)
        .map_err(|_| "Failed to set output path")?;

    Ok(())
}

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

pub fn is_jpeg(path: &PathBuf) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("jpg") || ext.eq_ignore_ascii_case("jpeg"))
        .unwrap_or(false)
}



/// If `base_path` exists, appends `_1`, `_2`, etc. until it's unique.
/// Keeps file stem and extension intact.
pub fn deduplicate_path(base_path: &Path) -> PathBuf {
    if !base_path.exists() {
        return base_path.to_path_buf();
    }

    let parent = base_path.parent().unwrap_or_else(|| Path::new(""));
    let stem = base_path.file_stem().unwrap().to_string_lossy();
    let ext = base_path.extension().map(|e| e.to_string_lossy()).unwrap_or_default();
    //let ext = "jpg"; // Assuming JPEG for compression, adjust as needed

    for i in 1.. {
        let new_file_name = if ext.is_empty() {
            format!("{}_{}", stem, i)
        } else {
            format!("{}_{}.{}", stem, i, ext)
        };

        let new_path = parent.join(new_file_name);
        if !new_path.exists() {
            return new_path;
        }
    }

    unreachable!("deduplicate_path ran out of integer suffixes")
}

pub fn initialize_settings_path(app_data_dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let settings_path = app_data_dir.join("settings");
    // Create the app data directory if it doesn't exist
    fs::create_dir_all(&settings_path).map_err(|e| e.to_string())?;

        // Set the global paths
    crate::utility::SETTINGS_DIR
        .set(app_data_dir.clone())
        .map_err(|_| "Failed to set input path")?;

    Ok(())
}

fn get_settings_path() -> std::path::PathBuf {
    SETTINGS_DIR.get()
        .expect("Settings directory not initialized")
        .join("settings.json")
}

#[tauri::command]
pub fn load_settings() -> Result<AppSettings, String> {
    let path = get_settings_path();
    if !path.exists() {
        return Ok(AppSettings::default());
    }
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let settings = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    let path = get_settings_path();
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn handle_compression() -> Result<(), String> {
    let settings = load_settings().unwrap_or_default();

    if settings.method ==  CompressionMethod::WebpLossy || settings.method == CompressionMethod::WebpLossless {
        // run WebP compression
        println!("Running WebP compression with quality: {} and method: {}", settings.compression_quality, settings.method.as_str());
        if CompressionMethod::WebpLossy == settings.method {
            //webp_compression(settings.method == CompressionMethod::WebpLossy, settings.compression_quality).expect("WebP compression failed");
            println!("Running lossy WebP compression");
        } else if CompressionMethod::WebpLossless == settings.method {
            //webp_compression(settings.method == CompressionMethod::WebpLossless, settings.compression_quality).expect("WebP compression failed");
            println!("Running lossless WebP compression");
        }
        //webp_compression(settings.method == CompressionMethod::WebpLossless, settings.compression_quality).expect("WebP compression failed");
    } else if settings.method == CompressionMethod::Lossy {
        // run JPEG compression
        println!("Running lossy compression with quality: {}", settings.compression_quality);
        //lossy_compression().expect("Lossy compression failed");
    } else if settings.method == CompressionMethod::Lossless {
        // run PNG compression
        println!("Running lossless compression");
        //lossless_compression().expect("Lossless compression failed");
    } else {
        println!("Error: Unknown compression method");    
    }
    Ok(())
}





#[derive(Serialize, Deserialize, Clone)]
pub struct ImageData {
    pub data: String,
    pub filename: String,
}

#[tauri::command]
pub async fn handle_images(images: Vec<ImageData>) -> Result<(), String> {

    println!("handle_images function called with {} images", images.len());
    // Get the global input path
    let source = get_input_path();

    // Clear the input folder before processing new images
    clear_input_folder().map_err(|e| format!("Failed to clear input folder {}", e))?;

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

        let mut file = fs::File::create(&input_path).map_err(|e| e.to_string())?;
        file.write_all(&decoded_bytes).map_err(|e| e.to_string())?;
        
        println!("Created input file: {:?}", input_path);
    }

    //compress images
    println!("Starting compression process... (handle_compression is called)");
    let _ = handle_compression().await;
    //crate::parallel_compressor::parallel_compress();

    Ok(())
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
