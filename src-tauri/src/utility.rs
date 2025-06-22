use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;

// Global static variables for image paths
pub static INPUT_PATH: OnceLock<PathBuf> = OnceLock::new();
pub static OUTPUT_PATH: OnceLock<PathBuf> = OnceLock::new();

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