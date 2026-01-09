use tauri::{AppHandle, Emitter, Manager};
use tokio::time::Duration;
use crate::models::{ViewConfig, CalculatedWindowLayout, ScreenInfo};
use crate::services::{detect_screen_info, calculate_window_layout};

/// Get current screen information
#[tauri::command]
pub async fn get_screen_info(app: AppHandle) -> Result<ScreenInfo, String> {
    detect_screen_info(&app).await
}

/// Resize window smartly with animation
#[tauri::command]
pub async fn resize_window_smart(
    app: AppHandle,
    view_id: String,
) -> Result<CalculatedWindowLayout, String> {
    // Get current screen info
    let screen_info = detect_screen_info(&app).await?;

    // Load view config
    let config = ViewConfig::from_id(&view_id)?;

    // Get current window
    let window = app.get_webview_window("main")
        .ok_or("Window 'main' not found")?;

    // Get current size
    let current_size = window.outer_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;

    let start_width = current_size.width;
    let start_height = current_size.height;

    // Calculate target layout
    let target_layout = calculate_window_layout(&screen_info, &config, Some((start_width, start_height)))?;

    // Check if animation is needed
    if !target_layout.animation_required {
        return Ok(target_layout);
    }

    // Emit resize_start event
    let _ = app.emit("window:resize_start", &screen_info);

    // Animate window resize
    let frames = 12; // 60fps * 200ms = 12 frames
    let delay_ms = config.transition_duration / frames;

    for i in 0..=frames {
        let progress = i as f64 / frames as f64;
        let eased = 1.0 - (1.0 - progress).powi(2); // ease-out

        let new_width = start_width as f64 + (target_layout.width as f64 - start_width as f64) * eased;
        let new_height = start_height as f64 + (target_layout.height as f64 - start_height as f64) * eased;

        let size = tauri::Size::Physical(tauri::PhysicalSize {
            width: new_width as u32,
            height: new_height as u32,
        });

        window.set_size(size)
            .map_err(|e| format!("Failed to set window size: {}", e))?;

        if i < frames {
            tokio::time::sleep(Duration::from_millis(delay_ms)).await;
        }
    }

    // Set final position
    let position = tauri::Position::Physical(tauri::PhysicalPosition {
        x: target_layout.x,
        y: target_layout.y,
    });

    window.set_position(position)
        .map_err(|e| format!("Failed to set window position: {}", e))?;

    // Emit resize_complete event
    let _ = app.emit("window:resize_complete", &target_layout);

    Ok(target_layout)
}
