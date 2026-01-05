/**
 * Application Commands
 * Tauri commands for application discovery and launching
 */

use crate::models::app::*;
use crate::services::app_monitor::AppMonitor;
use std::sync::Mutex;
use tauri::State;

/// Global app monitor state
pub struct AppState {
    pub app_monitor: Mutex<AppMonitor>,
}

/// Get installed applications
#[tauri::command]
pub fn get_installed_apps(
    refresh: bool,
    state: State<AppState>,
) -> Result<GetInstalledAppsResponse, String> {
    let start = std::time::Instant::now();

    let mut monitor = state.app_monitor.lock().map_err(|e| e.to_string())?;

    let apps = if refresh {
        monitor.scan_apps()
    } else {
        // Return cached apps or scan if empty
        if monitor.scan_apps().is_empty() {
            monitor.scan_apps()
        } else {
            vec![] // Will be populated from cache in production
        }
    };

    let scan_time = start.elapsed().as_millis() as u64;

    Ok(GetInstalledAppsResponse { apps, scan_time })
}

/// Launch an application
#[tauri::command]
pub fn launch_app(path: String) -> Result<LaunchAppResponse, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to launch app: {}", e))?;

        return Ok(LaunchAppResponse {
            success: true,
            pid: None,
        });
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("cmd")
            .args(&["/C", "start", "", &path])
            .spawn()
            .map_err(|e| format!("Failed to launch app: {}", e))?;

        return Ok(LaunchAppResponse {
            success: true,
            pid: None,
        });
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to launch app: {}", e))?;

        return Ok(LaunchAppResponse {
            success: true,
            pid: None,
        });
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        return Err("Unsupported platform".to_string());
    }
}

/// Track application usage
#[tauri::command]
pub fn track_app_usage(
    app_id: String,
    state: State<AppState>,
) -> Result<TrackAppUsageResponse, String> {
    let monitor = state.app_monitor.lock().map_err(|e| e.to_string())?;

    if let Some(app) = monitor.get_app(&app_id) {
        // In a real implementation, we would persist this
        // For now, just return success
        return Ok(TrackAppUsageResponse {
            success: true,
            usage_count: app.usage_count + 1,
        });
    }

    Ok(TrackAppUsageResponse {
        success: false,
        usage_count: 0,
    })
}

/// Get application icon (T052)
/// Returns base64-encoded PNG data from cached app entry
#[tauri::command]
pub fn get_app_icon(
    app_id: String,
    state: State<AppState>,
) -> Result<GetAppIconResponse, String> {
    let monitor = state.app_monitor.lock().map_err(|e| e.to_string())?;

    if let Some(app) = monitor.get_app(&app_id) {
        // Icon is already extracted and cached as base64 data URL during app scanning
        return Ok(GetAppIconResponse {
            icon: app.icon.clone(),
            icon_data_url: app.icon.clone(),
        });
    }

    Err(format!("App not found: {}", app_id))
}
