/**
 * Settings Commands
 * Handle application settings and preferences
 */

use crate::models::preferences::AppSettings;
use serde_json;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Settings storage path
fn get_settings_path(handle: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;

    println!("[Settings] Config directory: {:?}", app_dir);

    // Ensure directory exists
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    let settings_path = app_dir.join("settings.json");
    println!("[Settings] Settings file path: {:?}", settings_path);

    Ok(settings_path)
}

/// Load settings from file
fn load_settings(handle: &AppHandle) -> Result<AppSettings, String> {
    let settings_path = get_settings_path(handle)?;

    if !settings_path.exists() {
        // Return default settings if file doesn't exist
        return Ok(AppSettings::default());
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings file: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))
}

/// Save settings to file
fn save_settings(handle: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let settings_path = get_settings_path(handle)?;

    println!("[Settings] Saving settings to: {:?}", settings_path);

    let content = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, content)
        .map_err(|e| format!("Failed to write settings file: {}", e))?;

    println!("[Settings] Settings saved successfully");
    Ok(())
}

/// Get all application settings (T025)
#[tauri::command]
pub fn get_settings(handle: AppHandle) -> Result<AppSettings, String> {
    load_settings(&handle)
}

/// Get a single setting value by key (T025)
#[tauri::command]
pub fn get_setting(handle: AppHandle, key: String) -> Result<serde_json::Value, String> {
    let settings = load_settings(&handle)?;

    match key.as_str() {
        "startup_behavior" => Ok(serde_json::to_value(settings.startup_behavior)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "language" => Ok(serde_json::to_value(settings.language)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "theme" => Ok(serde_json::to_value(settings.theme)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "window_opacity" => Ok(serde_json::to_value(settings.window_opacity)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "show_menubar_icon" => Ok(serde_json::to_value(settings.show_menubar_icon)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "enable_clipboard" => Ok(serde_json::to_value(settings.enable_clipboard)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "enable_file_search" => Ok(serde_json::to_value(settings.enable_file_search)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "enable_browser_search" => Ok(serde_json::to_value(settings.enable_browser_search)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "anonymize_usage" => Ok(serde_json::to_value(settings.anonymize_usage)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "crash_reports" => Ok(serde_json::to_value(settings.crash_reports)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "search_debounce_ms" => Ok(serde_json::to_value(settings.search_debounce_ms)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "max_results" => Ok(serde_json::to_value(settings.max_results)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "excluded_apps" => Ok(serde_json::to_value(settings.excluded_apps)
            .map_err(|e| format!("Serialization error: {}", e))?),
        "file_index_paths" => Ok(serde_json::to_value(settings.file_index_paths)
            .map_err(|e| format!("Serialization error: {}", e))?),
        _ => Err(format!("Unknown setting key: {}", key)),
    }
}

/// Set a single setting value by key (T026)
#[tauri::command]
pub fn set_setting(handle: AppHandle, key: String, value: serde_json::Value) -> Result<(), String> {
    let mut settings = load_settings(&handle)?;

    match key.as_str() {
        "startup_behavior" => {
            settings.startup_behavior = serde_json::from_value(value)
                .map_err(|e| format!("Invalid startup_behavior: {}", e))?;
        }
        "language" => {
            settings.language = serde_json::from_value(value)
                .map_err(|e| format!("Invalid language: {}", e))?;
        }
        "theme" => {
            settings.theme = serde_json::from_value(value)
                .map_err(|e| format!("Invalid theme: {}", e))?;
        }
        "window_opacity" => {
            settings.window_opacity = serde_json::from_value(value)
                .map_err(|e| format!("Invalid window_opacity: {}", e))?;
        }
        "show_menubar_icon" => {
            settings.show_menubar_icon = serde_json::from_value(value)
                .map_err(|e| format!("Invalid show_menubar_icon: {}", e))?;
        }
        "enable_clipboard" => {
            settings.enable_clipboard = serde_json::from_value(value)
                .map_err(|e| format!("Invalid enable_clipboard: {}", e))?;
        }
        "enable_file_search" => {
            settings.enable_file_search = serde_json::from_value(value)
                .map_err(|e| format!("Invalid enable_file_search: {}", e))?;
        }
        "enable_browser_search" => {
            settings.enable_browser_search = serde_json::from_value(value)
                .map_err(|e| format!("Invalid enable_browser_search: {}", e))?;
        }
        "anonymize_usage" => {
            settings.anonymize_usage = serde_json::from_value(value)
                .map_err(|e| format!("Invalid anonymize_usage: {}", e))?;
        }
        "crash_reports" => {
            settings.crash_reports = serde_json::from_value(value)
                .map_err(|e| format!("Invalid crash_reports: {}", e))?;
        }
        "search_debounce_ms" => {
            settings.search_debounce_ms = serde_json::from_value(value)
                .map_err(|e| format!("Invalid search_debounce_ms: {}", e))?;
        }
        "max_results" => {
            settings.max_results = serde_json::from_value(value)
                .map_err(|e| format!("Invalid max_results: {}", e))?;
        }
        "excluded_apps" => {
            settings.excluded_apps = serde_json::from_value(value)
                .map_err(|e| format!("Invalid excluded_apps: {}", e))?;
        }
        "file_index_paths" => {
            settings.file_index_paths = serde_json::from_value(value)
                .map_err(|e| format!("Invalid file_index_paths: {}", e))?;
        }
        _ => return Err(format!("Unknown setting key: {}", key)),
    }

    save_settings(&handle, &settings)
}

/// Update all application settings (T027)
#[tauri::command]
pub fn update_settings(handle: AppHandle, settings: AppSettings) -> Result<(), String> {
    save_settings(&handle, &settings)
}

/// Reset settings to defaults
#[tauri::command]
pub fn reset_settings(handle: AppHandle) -> Result<AppSettings, String> {
    let defaults = AppSettings::default();
    save_settings(&handle, &defaults)?;
    Ok(defaults)
}

/// Initialize preferences on first run (T029)
#[tauri::command]
pub fn init_preferences(handle: AppHandle) -> Result<AppSettings, String> {
    let settings_path = get_settings_path(&handle)?;

    if !settings_path.exists() {
        let defaults = AppSettings::default();
        save_settings(&handle, &defaults)?;
        Ok(defaults)
    } else {
        load_settings(&handle)
    }
}

/// Get global hotkey (T181)
#[tauri::command]
pub fn get_hotkey(handle: AppHandle) -> Result<String, String> {
    let settings = load_settings(&handle)?;
    Ok(settings.global_hotkey)
}

/// Set global hotkey (T180)
#[tauri::command]
pub fn set_hotkey(handle: AppHandle, hotkey: String) -> Result<(), String> {
    // Validate hotkey format
    if !validate_hotkey(&hotkey) {
        return Err("Invalid hotkey format".to_string());
    }

    // Load current settings, update hotkey, and save
    let mut settings = load_settings(&handle)?;
    settings.global_hotkey = hotkey.clone();
    save_settings(&handle, &settings)?;

    println!("Hotkey updated to: {}", hotkey);
    println!("Note: Restart the application for the new hotkey to take effect");

    Ok(())
}

/// Validate hotkey format
fn validate_hotkey(hotkey: &str) -> bool {
    let valid_modifiers = ["Cmd", "Ctrl", "Alt", "Shift", "Option", "Super"];
    let parts: Vec<&str> = hotkey.split('+').collect();

    if parts.is_empty() || parts.len() > 4 {
        return false;
    }

    // Check last part is a key (not a modifier)
    let last_part = parts.last().unwrap();
    if valid_modifiers.contains(&last_part) {
        return false;
    }

    // Check all but last are valid modifiers
    for part in &parts[..parts.len()-1] {
        if !valid_modifiers.contains(&part) {
            return false;
        }
    }

    true
}

/// Check for system hotkey conflicts (T182)
#[tauri::command]
pub fn check_hotkey_conflicts(hotkey: String) -> Result<Vec<String>, String> {
    let mut conflicts = Vec::new();

    // List of common system hotkeys that shouldn't be overridden
    let system_hotkeys = get_system_hotkeys();

    // Normalize the hotkey for comparison
    let normalized = normalize_hotkey(&hotkey);

    for system_hotkey in system_hotkeys {
        if normalized == normalize_hotkey(system_hotkey) {
            conflicts.push(system_hotkey.to_string());
        }
    }

    Ok(conflicts)
}

/// Get settings file path for debugging
#[tauri::command]
pub fn get_settings_file_path(handle: AppHandle) -> Result<String, String> {
    let path = get_settings_path(&handle)?;
    Ok(path.to_string_lossy().to_string())
}

/// Get list of system-reserved hotkeys
fn get_system_hotkeys() -> &'static [&'static str] {
    &[
        // macOS system shortcuts
        "Cmd+Space", "Cmd+Tab", "Cmd+Q", "Cmd+W", "Cmd+C", "Cmd+V",
        "Cmd+X", "Cmd+A", "Cmd+Z", "Cmd+Shift+Z", "Cmd+S", "Cmd+F",
        "Cmd+P", "Cmd+N", "Cmd+T", "Cmd+H", "Cmd+M", "Cmd+,",
        "Cmd+Option+Esc", "Cmd+Shift+3", "Cmd+Shift+4", "Cmd+Shift+5",
        // Windows/Linux system shortcuts
        "Ctrl+Esc", "Ctrl+Shift+Esc", "Ctrl+Alt+Delete",
        "Ctrl+Tab", "Ctrl+Shift+Tab", "Alt+Tab", "Alt+Shift+Tab",
        "Ctrl+C", "Ctrl+V", "Ctrl+X", "Ctrl+A", "Ctrl+Z", "Ctrl+Y",
        "Ctrl+S", "Ctrl+F", "Ctrl+P", "Ctrl+N", "Ctrl+W", "Ctrl+Q",
        "PrntScrn", "Ctrl+PrntScrn", "Alt+PrntScrn",
    ]
}

/// Normalize hotkey string for comparison
fn normalize_hotkey(hotkey: &str) -> String {
    hotkey
        .replace("Command", "Cmd")
        .replace("Control", "Ctrl")
        .replace("Option", "Alt")
        .to_lowercase()
}
