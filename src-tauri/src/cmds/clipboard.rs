/**
 * Clipboard Commands
 * Tauri commands for clipboard history management
 */

use crate::models::clipboard::*;
use arboard::Clipboard;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get clipboard history directory
fn get_clipboard_dir(handle: &AppHandle) -> Result<PathBuf, String> {
    handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get data dir: {}", e))
        .map(|dir| dir.join("clipboard"))
}

/// Ensure clipboard directory exists
fn ensure_clipboard_dir(handle: &AppHandle) -> Result<PathBuf, String> {
    let dir = get_clipboard_dir(handle)?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create clipboard dir: {}", e))?;
    Ok(dir)
}

/// Get clipboard history
#[tauri::command]
pub fn get_clipboard_history(
    handle: AppHandle,
    limit: Option<usize>,
) -> Result<Vec<ClipboardItem>, String> {
    let clipboard_dir = ensure_clipboard_dir(&handle)?;
    let mut items = Vec::new();

    let entries = fs::read_dir(&clipboard_dir)
        .map_err(|e| format!("Failed to read clipboard directory: {}", e))?;

    for entry in entries.flatten() {
        if let Ok(content) = fs::read_to_string(entry.path()) {
            if let Ok(item) = serde_json::from_str::<ClipboardItem>(&content) {
                items.push(item);
            }
        }
    }

    // Sort by timestamp descending
    items.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    // Apply limit
    if let Some(limit) = limit {
        items.truncate(limit);
    }

    Ok(items)
}

/// Get a specific clipboard item
#[tauri::command]
pub fn get_clipboard_item(
    handle: AppHandle,
    id: String,
) -> Result<ClipboardItem, String> {
    let clipboard_dir = ensure_clipboard_dir(&handle)?;
    let item_path = clipboard_dir.join(&id);

    let content = fs::read_to_string(&item_path)
        .map_err(|e| format!("Failed to read clipboard item: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse clipboard item: {}", e))
}

/// Paste a clipboard item (put it back in system clipboard) - T009
#[tauri::command]
pub fn paste_clipboard_item(
    handle: AppHandle,
    id: String,
) -> Result<(), String> {
    let item = get_clipboard_item(handle, id)?;

    // Use arboard to write content to system clipboard
    let mut clipboard = Clipboard::new()
        .map_err(|e| format!("Failed to access system clipboard: {}", e))?;

    match item.content_type {
        ClipboardContentType::Text => {
            let text = item.text.unwrap_or_default();
            clipboard.set_text(&text)
                .map_err(|e| format!("Failed to set clipboard text: {}", e))?;
        }
        ClipboardContentType::Image => {
            // For images, we'd need to handle image data
            // This is more complex and may require additional libraries
            return Err("Image clipboard paste not yet implemented".to_string());
        }
        ClipboardContentType::Html => {
            // For HTML, try to set as text first
            let text = item.text.unwrap_or_default();
            clipboard.set_text(&text)
                .map_err(|e| format!("Failed to set clipboard text: {}", e))?;
        }
        ClipboardContentType::File => {
            // For file references, copy the file path
            let text = item.text.unwrap_or_default();
            clipboard.set_text(&text)
                .map_err(|e| format!("Failed to set clipboard text: {}", e))?;
        }
    }

    Ok(())
}

/// Delete a clipboard item
#[tauri::command]
pub fn delete_clipboard_item(
    handle: AppHandle,
    id: String,
) -> Result<(), String> {
    let clipboard_dir = get_clipboard_dir(&handle)?;
    let item_path = clipboard_dir.join(&id);

    if item_path.exists() {
        fs::remove_file(&item_path)
            .map_err(|e| format!("Failed to delete clipboard item: {}", e))?;
    }

    Ok(())
}

/// Clear all clipboard history
#[tauri::command]
pub fn clear_clipboard_history(
    handle: AppHandle,
) -> Result<(), String> {
    let clipboard_dir = get_clipboard_dir(&handle)?;

    if clipboard_dir.exists() {
        fs::remove_dir_all(&clipboard_dir)
            .map_err(|e| format!("Failed to clear clipboard history: {}", e))?;
    }

    Ok(())
}

/// Get clipboard settings
#[tauri::command]
pub fn get_clipboard_settings(
    _handle: AppHandle,
) -> Result<ClipboardSettings, String> {
    // TODO: Load from settings storage
    Ok(ClipboardSettings::default())
}

/// Set clipboard settings
#[tauri::command]
pub fn set_clipboard_settings(
    _handle: AppHandle,
    _settings: ClipboardSettings,
) -> Result<(), String> {
    // TODO: Persist settings
    Ok(())
}

/// Search clipboard history
#[tauri::command]
pub fn search_clipboard(
    handle: AppHandle,
    query: String,
    limit: usize,
) -> Result<Vec<ClipboardItem>, String> {
    let clipboard_db = get_clipboard_db_path(&handle)?;

    // Open database
    let conn = rusqlite::Connection::open(&clipboard_db)
        .map_err(|e| format!("Failed to open clipboard database: {}", e))?;

    // Build search query
    let search_pattern = format!("%{}%", query);

    let mut stmt = conn
        .prepare(
            "
            SELECT id, content_type, text, timestamp, is_sensitive
            FROM clipboard_history
            WHERE text LIKE ?1
            ORDER BY timestamp DESC
            LIMIT ?2
            ",
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let items: Vec<ClipboardItem> = stmt
        .query_map(
            rusqlite::params![search_pattern, limit as i64],
            |row| {
                let content_type_str: String = row.get(1)?;
                let content_type = match content_type_str.as_str() {
                    "Text" => ClipboardContentType::Text,
                    "Image" => ClipboardContentType::Image,
                    "Html" => ClipboardContentType::Html,
                    "File" => ClipboardContentType::File,
                    _ => ClipboardContentType::Text,
                };

                Ok(ClipboardItem {
                    id: row.get(0)?,
                    content_type,
                    text: row.get(2)?,
                    image_path: None,
                    hash: String::new(),
                    timestamp: row.get(3)?,
                    is_sensitive: row.get(4).unwrap_or(false),
                    app_source: None,
                })
            },
        )
        .map_err(|e| format!("Failed to query clipboard: {}", e))?
        .filter_map(|row| row.ok())
        .collect();

    Ok(items)
}

/// Get clipboard database path
fn get_clipboard_db_path(handle: &AppHandle) -> Result<String, String> {
    let data_dir = handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get data dir: {}", e))?;

    let db_dir = data_dir.join("clipboard");
    std::fs::create_dir_all(&db_dir)
        .map_err(|e| format!("Failed to create clipboard dir: {}", e))?;

    Ok(db_dir.join("history.db")
        .to_str()
        .ok_or("Invalid path")?
        .to_string())
}

/// Write text directly to system clipboard
/// Used by plugins to copy text results
#[tauri::command]
pub fn write_clipboard_text(text: String) -> Result<(), String> {
    use arboard::Clipboard;

    let mut clipboard = Clipboard::new()
        .map_err(|e| format!("Failed to access system clipboard: {}", e))?;

    clipboard.set_text(&text)
        .map_err(|e| format!("Failed to set clipboard text: {}", e))?;

    Ok(())
}
