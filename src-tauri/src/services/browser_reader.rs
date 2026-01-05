//! Browser Data Reader Service (T142-T148)
//! Reads bookmarks and history from browser databases with cache expiry and lock handling
#![allow(dead_code)]

use crate::db::browser::{BrowserEntry, init_browser_db, upsert_browser_entry, search_browser_data, get_cache_stats};
use rusqlite::Connection;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tauri::AppHandle;
use tempfile::NamedTempFile;

/// Browser type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BrowserType {
    Chrome,
    Firefox,
    Safari,
    Edge,
}

/// Browser data reader configuration
#[derive(Debug, Clone)]
pub struct BrowserReaderConfig {
    pub cache_expiry_minutes: i64,
    pub enabled_browsers: Vec<BrowserType>,
}

impl Default for BrowserReaderConfig {
    fn default() -> Self {
        Self {
            cache_expiry_minutes: 5,
            enabled_browsers: vec![
                BrowserType::Chrome,
                BrowserType::Firefox,
                BrowserType::Safari,
                BrowserType::Edge,
            ],
        }
    }
}

/// Browser data reader service
pub struct BrowserReader {
    config: BrowserReaderConfig,
}

impl BrowserReader {
    /// Create a new browser reader
    pub fn new(config: BrowserReaderConfig) -> Self {
        Self { config }
    }

    /// Update browser cache with expiry (T148)
    pub fn update_cache(&self, handle: &AppHandle) -> Result<usize, String> {
        let mut count = 0;

        // Expire old cache entries (T148)
        self.expire_cache(handle)?;

        for browser_type in &self.config.enabled_browsers {
            match self.read_browser_data(browser_type) {
                Ok(entries) => {
                    let conn = init_browser_db(handle)
                        .map_err(|e| format!("DB error: {}", e))?;

                    for entry in entries {
                        let _ = upsert_browser_entry(&conn, &entry);
                        count += 1;
                    }
                }
                Err(e) => {
                    eprintln!("Failed to read {:?} data: {}", browser_type, e);
                }
            }
        }

        Ok(count)
    }

    /// Expire old cache entries (T148)
    fn expire_cache(&self, handle: &AppHandle) -> Result<(), String> {
        let conn = init_browser_db(handle)
            .map_err(|e| format!("DB error: {}", e))?;

        let expiry_time = chrono::Utc::now().timestamp() - (self.config.cache_expiry_minutes * 60);

        conn.execute(
            "DELETE FROM browser_data WHERE cached < ?1",
            [expiry_time],
        ).map_err(|e| format!("Failed to expire cache: {}", e))?;

        Ok(())
    }

    /// Read data from a specific browser
    fn read_browser_data(&self, browser_type: &BrowserType) -> Result<Vec<BrowserEntry>, String> {
        let data_dir = self.get_browser_data_dir(browser_type)?;

        match browser_type {
            BrowserType::Chrome => self.read_chrome_data(&data_dir),
            BrowserType::Firefox => self.read_firefox_data(&data_dir),
            BrowserType::Safari => self.read_safari_data(&data_dir),
            BrowserType::Edge => self.read_edge_data(&data_dir),
        }
    }

    /// Get browser data directory
    fn get_browser_data_dir(&self, browser_type: &BrowserType) -> Result<PathBuf, String> {
        let home = std::env::var("HOME").map_err(|_| "Failed to get HOME directory")?;
        let home_path = PathBuf::from(home);

        match browser_type {
            BrowserType::Chrome => {
                #[cfg(target_os = "macos")]
                return Ok(home_path.join("Library/Application Support/Google/Chrome"));
                #[cfg(target_os = "linux")]
                return Ok(home_path.join(".config/google-chrome"));
                #[cfg(target_os = "windows")]
                return Ok(std::env::var("LOCALAPPDATA")
                    .map(PathBuf::from)
                    .unwrap_or_default()
                    .join("Google/Chrome/User Data"));
            }
            BrowserType::Firefox => {
                #[cfg(target_os = "macos")]
                return Ok(home_path.join("Library/Application Support/Firefox"));
                #[cfg(target_os = "linux")]
                return Ok(home_path.join(".mozilla/firefox"));
                #[cfg(target_os = "windows")]
                return Ok(std::env::var("APPDATA")
                    .map(PathBuf::from)
                    .unwrap_or_default()
                    .join("Mozilla/Firefox"));
            }
            BrowserType::Safari => {
                #[cfg(target_os = "macos")]
                return Ok(home_path.join("Library/Safari"));
                #[cfg(not(target_os = "macos"))]
                return Err("Safari is only available on macOS".to_string());
            }
            BrowserType::Edge => {
                #[cfg(target_os = "macos")]
                return Ok(home_path.join("Library/Application Support/Microsoft Edge"));
                #[cfg(target_os = "linux")]
                return Ok(home_path.join(".config/microsoft-edge"));
                #[cfg(target_os = "windows")]
                return Ok(std::env::var("LOCALAPPDATA")
                    .map(PathBuf::from)
                    .unwrap_or_default()
                    .join("Microsoft/Edge/User Data"));
            }
        }
    }

    /// Read Chrome data (bookmarks and history) (T143, T147)
    fn read_chrome_data(&self, data_dir: &PathBuf) -> Result<Vec<BrowserEntry>, String> {
        let mut entries = Vec::new();

        // Read bookmarks
        let bookmarks_path = data_dir.join("Default/Bookmarks");
        if bookmarks_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&bookmarks_path) {
                if let Ok(bookmarks_json) = serde_json::from_str::<serde_json::Value>(&content) {
                    self.extract_chrome_bookmarks(&bookmarks_json, &mut entries);
                }
            }
        }

        // Read history from SQLite with lock handling (T143, T147)
        let history_path = data_dir.join("Default/History");
        if history_path.exists() {
            if let Ok(history_entries) = self.read_chrome_history(&history_path) {
                entries.extend(history_entries);
            }
        }

        Ok(entries)
    }

    /// Read Chrome history with database lock handling (T147)
    fn read_chrome_history(&self, history_path: &PathBuf) -> Result<Vec<BrowserEntry>, String> {
        // Copy to temp file to avoid database locks (T147)
        let temp_file = self.copy_to_temp(history_path)?;

        // Open the copied database
        let conn = Connection::open(temp_file.path())
            .map_err(|e| format!("Failed to open history database: {}", e))?;

        let mut entries = Vec::new();

        // Query URLs and visit counts
        let mut stmt = conn.prepare(
            "SELECT url, title, visit_count, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 1000"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let urls = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
            ))
        }).map_err(|e| format!("Failed to query URLs: {}", e))?;

        for url_result in urls {
            if let Ok((url, title, visit_count, last_visit_time)) = url_result {
                // Convert Chrome timestamp (microseconds since 1601-01-01) to Unix timestamp
                let unix_timestamp = (last_visit_time / 1_000_000) - 11_644_473_600;

                entries.push(BrowserEntry {
                    id: None,
                    url,
                    title: title.unwrap_or_else(|| "Untitled".to_string()),
                    favicon: None,
                    browser: "chrome".to_string(),
                    entry_type: "history".to_string(),
                    visit_count: visit_count as i32,
                    last_visited: Some(unix_timestamp),
                    folder: None,
                    cached: chrono::Utc::now().timestamp(),
                });
            }
        }

        Ok(entries)
    }

    /// Copy database to temp file to avoid locks (T147)
    fn copy_to_temp(&self, path: &PathBuf) -> Result<NamedTempFile, String> {
        let content = fs::read(path)
            .map_err(|e| format!("Failed to read database: {}", e))?;

        let mut temp_file = NamedTempFile::new()
            .map_err(|e| format!("Failed to create temp file: {}", e))?;

        temp_file.write_all(&content)
            .map_err(|e| format!("Failed to write temp file: {}", e))?;

        Ok(temp_file)
    }

    /// Extract bookmarks from Chrome bookmarks JSON
    fn extract_chrome_bookmarks(&self, json: &serde_json::Value, entries: &mut Vec<BrowserEntry>) {
        if let Some(roots) = json.get("roots") {
            for (_key, root) in roots.as_object().unwrap_or(&serde_json::Map::new()) {
                if let Some(children) = root.get("children") {
                    self.extract_chrome_bookmark_children(children, entries);
                }
            }
        }
    }

    /// Recursively extract Chrome bookmark children
    fn extract_chrome_bookmark_children(&self, children: &serde_json::Value, entries: &mut Vec<BrowserEntry>) {
        if let Some(arr) = children.as_array() {
            for child in arr {
                // If this is a folder, recurse
                if child.get("type").and_then(|t| t.as_str()) == Some("folder") {
                    if let Some(kids) = child.get("children") {
                        self.extract_chrome_bookmark_children(kids, entries);
                    }
                }
                // If this is a bookmark, add it
                else if let Some(url) = child.get("url").and_then(|u| u.as_str()) {
                    let name = child.get("name")
                        .and_then(|n| n.as_str())
                        .unwrap_or("Untitled")
                        .to_string();

                    entries.push(BrowserEntry {
                        id: None,
                        url: url.to_string(),
                        title: name,
                        favicon: None,
                        browser: "chrome".to_string(),
                        entry_type: "bookmark".to_string(),
                        visit_count: 0,
                        last_visited: None,
                        folder: None,
                        cached: chrono::Utc::now().timestamp(),
                    });
                }
            }
        }
    }

    /// Read Firefox data from places.sqlite (T144)
    fn read_firefox_data(&self, data_dir: &PathBuf) -> Result<Vec<BrowserEntry>, String> {
        let mut entries = Vec::new();

        // Find the default Firefox profile
        let profiles_dir = data_dir.join("Profiles");
        if !profiles_dir.exists() {
            return Ok(entries);
        }

        // Find the default profile directory
        let default_profile = profiles_dir.read_dir()
            .map_err(|e| format!("Failed to read profiles: {}", e))?
            .flatten()
            .map(|e| e.path())
            .find(|p| p.join("places.sqlite").exists());

        let profile_dir = match default_profile {
            Some(dir) => dir,
            None => return Ok(entries),
        };

        // Read places.sqlite with lock handling (T147)
        let places_path = profile_dir.join("places.sqlite");
        if !places_path.exists() {
            return Ok(entries);
        }

        let temp_file = self.copy_to_temp(&places_path)?;
        let conn = Connection::open(temp_file.path())
            .map_err(|e| format!("Failed to open places database: {}", e))?;

        // Read bookmarks
        let mut stmt = conn.prepare(
            "SELECT b.title, p.url, b.dateAdded FROM moz_bookmarks b
             JOIN moz_places p ON b.fk = p.id
             WHERE b.type = 1 AND p.url IS NOT NULL
             ORDER BY b.dateAdded DESC LIMIT 1000"
        ).map_err(|e| format!("Failed to prepare bookmarks statement: {}", e))?;

        let bookmarks = stmt.query_map([], |row| {
            Ok((
                row.get::<_, Option<String>>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
            ))
        }).map_err(|e| format!("Failed to query bookmarks: {}", e))?;

        for bookmark_result in bookmarks {
            if let Ok((title, url, date_added)) = bookmark_result {
                // Convert Firefox timestamp (microseconds since 1970-01-01) to Unix timestamp
                let unix_timestamp = date_added / 1_000_000;

                entries.push(BrowserEntry {
                    id: None,
                    url,
                    title: title.unwrap_or_else(|| "Untitled".to_string()),
                    favicon: None,
                    browser: "firefox".to_string(),
                    entry_type: "bookmark".to_string(),
                    visit_count: 0,
                    last_visited: Some(unix_timestamp),
                    folder: None,
                    cached: chrono::Utc::now().timestamp(),
                });
            }
        }

        // Read history
        let mut stmt = conn.prepare(
            "SELECT url, title, visit_count, last_visit_date FROM moz_places
             WHERE visit_count > 0
             ORDER BY last_visit_date DESC LIMIT 1000"
        ).map_err(|e| format!("Failed to prepare history statement: {}", e))?;

        let history = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
            ))
        }).map_err(|e| format!("Failed to query history: {}", e))?;

        for history_result in history {
            if let Ok((url, title, visit_count, last_visit_date)) = history_result {
                // Convert Firefox timestamp (microseconds since 1970-01-01) to Unix timestamp
                let unix_timestamp = last_visit_date / 1_000_000;

                entries.push(BrowserEntry {
                    id: None,
                    url,
                    title: title.unwrap_or_else(|| "Untitled".to_string()),
                    favicon: None,
                    browser: "firefox".to_string(),
                    entry_type: "history".to_string(),
                    visit_count: visit_count as i32,
                    last_visited: Some(unix_timestamp),
                    folder: None,
                    cached: chrono::Utc::now().timestamp(),
                });
            }
        }

        Ok(entries)
    }

    /// Read Safari data (T145)
    fn read_safari_data(&self, data_dir: &PathBuf) -> Result<Vec<BrowserEntry>, String> {
        let mut entries = Vec::new();

        // Read Safari history from History.db
        let history_path = data_dir.join("History.db");
        if !history_path.exists() {
            return Ok(entries);
        }

        // Copy to temp file to avoid locks (T147)
        let temp_file = self.copy_to_temp(&history_path)?;
        let conn = Connection::open(temp_file.path())
            .map_err(|e| format!("Failed to open Safari history: {}", e))?;

        // Read history items
        let mut stmt = conn.prepare(
            "SELECT url, title, visit_count, last_visit_time FROM history_items
             ORDER BY last_visit_time DESC LIMIT 1000"
        ).map_err(|e| format!("Failed to prepare Safari history statement: {}", e))?;

        let history = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, f64>(3)?,
            ))
        }).map_err(|e| format!("Failed to query Safari history: {}", e))?;

        for history_result in history {
            if let Ok((url, title, visit_count, last_visit_time)) = history_result {
                // Convert Safari timestamp (seconds since 2001-01-01) to Unix timestamp
                let unix_timestamp = last_visit_time as i64 + 978_307_200;

                entries.push(BrowserEntry {
                    id: None,
                    url,
                    title: title.unwrap_or_else(|| "Untitled".to_string()),
                    favicon: None,
                    browser: "safari".to_string(),
                    entry_type: "history".to_string(),
                    visit_count: visit_count as i32,
                    last_visited: Some(unix_timestamp),
                    folder: None,
                    cached: chrono::Utc::now().timestamp(),
                });
            }
        }

        // Note: Safari bookmarks are in Bookmarks.plist (binary plist format)
        // Parsing binary plist requires additional dependencies (plist crate)
        // For now, we skip Safari bookmarks

        Ok(entries)
    }

    /// Read Edge data
    fn read_edge_data(&self, data_dir: &PathBuf) -> Result<Vec<BrowserEntry>, String> {
        // Edge uses the same format as Chrome
        self.read_chrome_data(data_dir)
    }

    /// Search cached browser data
    pub fn search(
        &self,
        handle: &AppHandle,
        query: &str,
        limit: usize,
    ) -> Result<Vec<BrowserEntry>, String> {
        let conn = init_browser_db(handle)
            .map_err(|e| format!("DB error: {}", e))?;
        search_browser_data(&conn, query, limit)
            .map_err(|e| format!("Search error: {}", e))
    }

    /// Get cache statistics
    pub fn get_cache_stats(&self, handle: &AppHandle) -> Result<crate::db::browser::BrowserCacheStats, String> {
        let conn = init_browser_db(handle)
            .map_err(|e| format!("DB error: {}", e))?;
        get_cache_stats(&conn)
            .map_err(|e| format!("Stats error: {}", e))
    }
}
