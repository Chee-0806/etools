use tauri::Emitter;

// Toggle window visibility
#[tauri::command]
fn toggle_window(window: tauri::Window) -> Result<(), String> {
    if window.is_visible().map_err(|e| e.to_string())? {
        window.hide().map_err(|e| e.to_string())?;
    } else {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Hide window
#[tauri::command]
fn hide_window(window: tauri::Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

// Show window
#[tauri::command]
fn show_window(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Register global shortcut (Alt+Space / Cmd+Space)
            #[cfg(target_os = "macos")]
            let shortcut = "Cmd+Space";
            #[cfg(not(target_os = "macos"))]
            let shortcut = "Alt+Space";

            // Emit event for frontend to register shortcut
            let _ = app.emit("global-shortcut-register", shortcut);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            toggle_window,
            hide_window,
            show_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
