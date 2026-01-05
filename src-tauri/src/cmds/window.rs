/**
 * Window Commands
 * Enhanced window management commands with state persistence
 */

use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager, Window};

/// Write log entry to debug log file
fn write_log(level: &str, tag: &str, message: &str) {
    if let Ok(home_dir) = std::env::var("HOME") {
        let log_path = format!("{}/Codes/kaka/debug.log", home_dir);
        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
        {
            let timestamp = chrono::Local::now().to_rfc3339();
            let _ = writeln!(file, "[{}] [{}] [{}] {}", timestamp, level, tag, message);
        }
    }
}

/// Write debug log from frontend
#[tauri::command]
pub fn write_debug_log(content: String) -> Result<(), String> {
    if let Ok(home_dir) = std::env::var("HOME") {
        let log_path = format!("{}/Codes/kaka/debug.log", home_dir);
        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
        {
            let _ = writeln!(file, "{}", content);
        }
    }
    Ok(())
}

/// Window state structure for persistence
#[derive(Debug, Clone, Serialize, Deserialize)]
struct WindowState {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    is_maximized: bool,
}

/// Get window state file path
fn get_window_state_path(handle: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;

    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    Ok(app_dir.join("window_state.json"))
}

/// Save window state (T033)
#[tauri::command]
pub fn save_window_state(window: Window) -> Result<(), String> {
    let handle = window.app_handle();

    let position = window.outer_position().map_err(|e| e.to_string())?;
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let is_maximized = window.is_maximized().map_err(|e| e.to_string())?;

    let state = WindowState {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        is_maximized,
    };

    let state_path = get_window_state_path(&handle)?;
    let content = serde_json::to_string_pretty(&state)
        .map_err(|e| format!("Failed to serialize window state: {}", e))?;

    fs::write(&state_path, content)
        .map_err(|e| format!("Failed to write window state: {}", e))?;

    Ok(())
}

/// Load and restore window state (T033)
#[tauri::command]
pub fn restore_window_state(window: Window) -> Result<(), String> {
    let handle = window.app_handle();
    let state_path = get_window_state_path(&handle)?;

    if !state_path.exists() {
        return Ok(()); // No saved state, use defaults
    }

    let content = fs::read_to_string(&state_path)
        .map_err(|e| format!("Failed to read window state: {}", e))?;

    let state: WindowState = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse window state: {}", e))?;

    // Restore position and size
    let position = tauri::Position::Physical(tauri::PhysicalPosition {
        x: state.x,
        y: state.y,
    });
    window.set_position(position).map_err(|e| e.to_string())?;

    let size = tauri::Size::Physical(tauri::PhysicalSize {
        width: state.width,
        height: state.height,
    });
    window.set_size(size).map_err(|e| e.to_string())?;

    // Restore maximized state
    if state.is_maximized {
        window.maximize().map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Get window info
#[tauri::command]
pub fn get_window_info(window: Window) -> Result<WindowInfo, String> {
    Ok(WindowInfo {
        is_visible: window.is_visible().map_err(|e| e.to_string())?,
        is_focused: window.is_focused().map_err(|e| e.to_string())?,
        is_maximized: window.is_maximized().map_err(|e| e.to_string())?,
        is_minimized: window.is_minimized().map_err(|e| e.to_string())?,
    })
}

/// Set window always on top
#[tauri::command]
pub fn set_always_on_top(window: Window, always_on_top: bool) -> Result<(), String> {
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())
}

/// Set window size
#[tauri::command]
pub fn set_window_size(window: Window, width: u32, height: u32) -> Result<(), String> {
    let size = tauri::Size::Physical(tauri::PhysicalSize { width, height });
    window.set_size(size).map_err(|e| e.to_string())
}

/// Show results window below the main window
#[tauri::command]
pub fn show_results_window(window: Window, results: Option<serde_json::Value>, query: Option<String>) -> Result<(), String> {
    write_log("INFO", "Rust", "show_results_window called");

    let handle = window.app_handle();

    // Get the main window position and size
    let main_pos = window.outer_position().map_err(|e| e.to_string())?;
    let main_size = window.outer_size().map_err(|e| e.to_string())?;

    write_log("INFO", "Rust", &format!("Main window position: {:?}, size: {:?}", main_pos, main_size));

    // Get or create the results window
    let results_window = handle.get_webview_window("results")
        .ok_or("Results window not found")?;

    write_log("INFO", "Rust", "Results window found");

    // Check window state before showing
    let is_visible_before = results_window.is_visible().map_err(|e| format!("Failed to check visibility: {}", e))?;
    write_log("INFO", "Rust", &format!("Results window visibility BEFORE show: {}", is_visible_before));

    // Calculate results window position (directly below main window)
    let results_y = main_pos.y + main_size.height as i32;

    // Set position below main window
    let position = tauri::Position::Physical(tauri::PhysicalPosition {
        x: main_pos.x,
        y: results_y,
    });
    results_window.set_position(position).map_err(|e| e.to_string())?;

    write_log("INFO", "Rust", &format!("Results window position set to {:?}", position));

    // Show the results window (it has alwaysOnTop: true in config)
    results_window.show().map_err(|e| e.to_string())?;

    // CRITICAL: Keep focus on main window so user can continue typing
    // This prevents the results window from stealing focus when it appears
    let _ = window.set_focus();

    // Check visibility after show
    let is_visible_after = results_window.is_visible().map_err(|e| format!("Failed to check visibility: {}", e))?;
    write_log("INFO", "Rust", &format!("Results window visibility AFTER show: {}", is_visible_after));

    // Get window size to confirm it's set correctly
    let results_size = results_window.outer_size().map_err(|e| e.to_string())?;
    write_log("INFO", "Rust", &format!("Results window actual size: {:?}", results_size));

    // CRITICAL: Forward results to results window via emit
    write_log("INFO", "Rust", &format!("Results parameter: {:?}, Query parameter: {:?}",
        results.as_ref().map(|v| if v.is_array() { v.as_array().map(|a| a.len()).unwrap_or(0) } else { 0 }),
        query.as_ref().map(|q| q.len())
    ));

    if let (Some(results_data), Some(query_str)) = (results, query) {
        let result_count = if results_data.is_array() { results_data.as_array().map(|v| v.len()).unwrap_or(0) } else { 0 };
        write_log("INFO", "Rust", &format!("Forwarding {} results to results window, query: '{}'", result_count, query_str));

        // NO DELAY: Results window is always ready once mounted
        // The event listener persists across window hide/show cycles
        // This prevents any input lag

        // Emit to the results window using AppHandle
        // In Tauri v2, we use emit_to to target a specific window
        let payload = serde_json::json!({
            "results": results_data,
            "query": query_str
        });
        write_log("INFO", "Rust", &format!("Emitting payload: {}", payload));

        // Try emit_to first
        match handle.emit_to("results", "show-results", payload.clone()) {
            Ok(_) => write_log("INFO", "Rust", "Event emitted successfully to 'results' window via emit_to"),
            Err(e) => {
                write_log("WARN", "Rust", &format!("emit_to failed: {}, trying emit_all", e));
                // Fallback to emit_all if emit_to fails
                match handle.emit_to(tauri::EventTarget::app(), "show-results", payload) {
                    Ok(_) => write_log("INFO", "Rust", "Event emitted via emit_to(app())"),
                    Err(e2) => write_log("ERROR", "Rust", &format!("emit_to(app()) also failed: {}", e2)),
                }
            }
        }
    } else {
        write_log("WARN", "Rust", "No results provided to forward");
    }

    // Bring window to front without stealing focus
    results_window.set_ignore_cursor_events(false).map_err(|e| e.to_string())?;

    write_log("INFO", "Rust", "Results window shown and ready");

    Ok(())
}

/// Hide results window
#[tauri::command]
pub fn hide_results_window(window: Window) -> Result<(), String> {
    let handle = window.app_handle();

    if let Some(results_window) = handle.get_webview_window("results") {
        results_window.hide().map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Update results window size based on content
#[tauri::command]
pub fn update_results_window_size(window: Window, height: u32) -> Result<(), String> {
    let handle = window.app_handle();

    let results_window = handle.get_webview_window("results")
        .ok_or("Results window not found")?;

    let size = results_window.outer_size().map_err(|e| e.to_string())?;
    let width = size.width;

    let new_size = tauri::Size::Physical(tauri::PhysicalSize { width, height });
    results_window.set_size(new_size).map_err(|e| e.to_string())?;

    Ok(())
}

/// Window information
#[derive(serde::Serialize)]
pub struct WindowInfo {
    pub is_visible: bool,
    pub is_focused: bool,
    pub is_maximized: bool,
    pub is_minimized: bool,
}
