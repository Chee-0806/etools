/**
 * Debug Commands
 * Commands for debugging and logging
 */

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// ============================================================================
// Constants
// ============================================================================

/// Debug log file name
const DEBUG_LOG_FILE: &str = "debug.log";

// ============================================================================
// Utility Functions
// ============================================================================

/// Get debug log file path in app data directory
fn get_debug_log_path(handle: &AppHandle) -> Result<PathBuf, String> {
    handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get data dir: {}", e))
        .map(|dir| dir.join(DEBUG_LOG_FILE))
}

/// Ensure parent directory exists for a path
fn ensure_parent_dir(path: &PathBuf) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create log directory: {}", e))?;
    }
    Ok(())
}

// ============================================================================
// Commands
// ============================================================================

/// Write debug log content to file
#[tauri::command]
pub fn write_debug_log(handle: AppHandle, content: String) -> Result<(), String> {
    let log_path = get_debug_log_path(&handle)?;
    ensure_parent_dir(&log_path)?;

    OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .and_then(|mut file| writeln!(file, "{content}"))
        .map_err(|e| format!("Failed to write to log file: {}", e))
}

/// Clear debug log file
#[tauri::command]
pub fn clear_debug_log(handle: AppHandle) -> Result<(), String> {
    let log_path = get_debug_log_path(&handle)?;

    if log_path.exists() {
        fs::remove_file(&log_path)
            .map_err(|e| format!("Failed to remove log file: {}", e))?;
    }

    Ok(())
}

/// Read debug log file with optional line limit
#[tauri::command]
pub fn read_debug_log(handle: AppHandle, limit: Option<usize>) -> Result<String, String> {
    let log_path = get_debug_log_path(&handle)?;

    if !log_path.exists() {
        return Ok(String::new());
    }

    let content = fs::read_to_string(&log_path)
        .map_err(|e| format!("Failed to read log file: {}", e))?;

    // Apply limit if specified (get last N lines)
    match limit {
        Some(limit) => {
            let lines: Vec<&str> = content.lines().collect();
            let start = lines.len().saturating_sub(limit);
            Ok(lines[start..].join("\n"))
        }
        None => Ok(content),
    }
}
