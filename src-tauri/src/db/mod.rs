/**
 * Database module for Productivity Launcher
 * Handles SQLite databases for file index and browser cache
 */

pub mod files;
pub mod browser;
pub mod plugin_schema;

use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get the application data directory
pub fn get_data_dir(handle: &AppHandle) -> Result<PathBuf, String> {
    handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get data dir: {}", e))
}

/// Ensure the data directory exists
pub fn ensure_data_dir(handle: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = get_data_dir(handle)?;
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data dir: {}", e))?;
    Ok(data_dir)
}

/// Get the file index database path
pub fn get_files_db_path(handle: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = ensure_data_dir(handle)?;
    Ok(data_dir.join("files_index.db"))
}

/// Get the browser cache database path
pub fn get_browser_db_path(handle: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = ensure_data_dir(handle)?;
    Ok(data_dir.join("browser_cache.db"))
}
