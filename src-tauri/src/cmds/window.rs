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

/// Center window on screen (with slight offset to top 1/4 for better UX)
#[tauri::command]
pub fn center_window(window: Window) -> Result<(), String> {
    let monitor = window.current_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("No monitor found")?;

    let screen_size = monitor.size();
    let window_size = window.outer_size().map_err(|e| e.to_string())?;

    // Calculate position: horizontally centered, vertically at top 1/4
    let x = (screen_size.width as i32 - window_size.width as i32) / 2;
    let y = (screen_size.height as i32 - window_size.height as i32) / 4;

    window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Window size structure
#[derive(serde::Serialize)]
pub struct WindowSize {
    pub width: u32,
    pub height: u32,
}

/// Get current window size
#[tauri::command]
pub fn get_window_size(window: Window) -> Result<WindowSize, String> {
    let size = window.outer_size().map_err(|e| e.to_string())?;
    Ok(WindowSize {
        width: size.width,
        height: size.height,
    })
}

/// Window information
#[derive(serde::Serialize)]
pub struct WindowInfo {
    pub is_visible: bool,
    pub is_focused: bool,
    pub is_maximized: bool,
    pub is_minimized: bool,
}
