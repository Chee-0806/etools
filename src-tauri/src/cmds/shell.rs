/**
 * Shell Commands
 * Tauri commands for shell integration and URL opening
 */

use tauri::AppHandle;

/// Open a URL in the default browser
#[tauri::command]
pub fn open_url(handle: AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    handle.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("Failed to open URL: {}", e))?;
    Ok(())
}

/// Get the default browser
#[tauri::command]
pub fn get_default_browser() -> Result<String, String> {
    // TODO: Implement default browser detection
    // This is platform-specific
    Ok("default".to_string())
}
