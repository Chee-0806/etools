//! Clipboard Watcher Service
//! Monitors system clipboard and stores history
#![allow(dead_code)]
#![allow(unused_variables)]

use crate::models::clipboard::*;
use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::Hasher;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

/// Detect sensitive content (T075)
pub fn detect_sensitive_content(text: &str) -> bool {
    let lower = text.to_lowercase();

    // Password manager indicators
    let password_manager_patterns = [
        "1password",
        "bitwarden",
        "lastpass",
        "dashlane",
        "keepass",
        "password",
    ];

    // Check for password manager mentions
    for pattern in &password_manager_patterns {
        if lower.contains(pattern) {
            return true;
        }
    }

    // Check for password-like patterns (sequences of the form "password: xxx")
    if lower.contains("pass:") || lower.contains("pwd:") || lower.contains("密码") {
        return true;
    }

    // Check for API keys or tokens (common patterns)
    let api_key_patterns = [
        "api_key",
        "apikey",
        "api-key",
        "secret",
        "token",
        "access_token",
        "auth_token",
        "bearer",
    ];

    for pattern in &api_key_patterns {
        if lower.contains(pattern) && text.len() > 20 {
            return true;
        }
    }

    false
}

/// Calculate content hash for deduplication (T072)
pub fn calculate_content_hash(content: &str) -> String {
    let mut hasher = DefaultHasher::new();
    hasher.write(content.as_bytes());
    format!("{:x}", hasher.finish())
}

/// Clipboard watcher service
pub struct ClipboardWatcher {
    is_running: Arc<Mutex<bool>>,
    items: Arc<Mutex<Vec<ClipboardItem>>>,
    storage_dir: PathBuf,
    settings: ClipboardSettings,
}

impl ClipboardWatcher {
    /// Create a new clipboard watcher
    pub fn new(storage_dir: PathBuf, settings: ClipboardSettings) -> Self {
        Self {
            is_running: Arc::new(Mutex::new(false)),
            items: Arc::new(Mutex::new(Vec::new())),
            storage_dir,
            settings,
        }
    }

    /// Start watching clipboard
    pub fn start(&self) -> Result<(), String> {
        let mut running = self.is_running.lock().map_err(|e| format!("Lock error: {}", e))?;
        if *running {
            return Ok(());
        }
        *running = true;
        drop(running);

        // Load existing history
        self.load_history()?;

        // Spawn monitoring thread
        let is_running = Arc::clone(&self.is_running);
        let items = Arc::clone(&self.items);
        let storage_dir = self.storage_dir.clone();
        let settings = self.settings.clone();

        thread::spawn(move || {
            while *is_running.lock().unwrap() {
                // TODO: Implement actual clipboard monitoring
                // This would use a clipboard crate to read system clipboard
                thread::sleep(Duration::from_millis(500));
            }
        });

        Ok(())
    }

    /// Stop watching clipboard
    pub fn stop(&self) -> Result<(), String> {
        let mut running = self.is_running.lock().map_err(|e| format!("Lock error: {}", e))?;
        *running = false;
        Ok(())
    }

    /// Add a clipboard item with deduplication and sensitive detection (T072, T075, T076, T077)
    pub fn add_item(&self, item: ClipboardItem) -> Result<(), String> {
        let mut modified_item = item.clone();

        // Calculate hash if not set (T072)
        if modified_item.hash.is_empty() {
            if let Some(ref text) = modified_item.text {
                modified_item.hash = calculate_content_hash(text);
            }
        }

        // Detect sensitive content (T075)
        if !modified_item.is_sensitive {
            if let Some(ref text) = modified_item.text {
                modified_item.is_sensitive = detect_sensitive_content(text);
            }
        }

        let mut items = self.items.lock().map_err(|e| format!("Lock error: {}", e))?;

        // Check for duplicates using hash (T072)
        if items.iter().any(|i| i.hash == modified_item.hash) {
            return Ok(());
        }

        // Add to front
        items.insert(0, modified_item.clone());

        // Apply FIFO eviction (T077)
        if items.len() > self.settings.max_items {
            items.truncate(self.settings.max_items);
        }

        // Apply auto-expiration (T076)
        let now = chrono::Utc::now().timestamp();
        items.retain(|i| {
            let age = now - i.timestamp;
            if i.is_sensitive {
                age < (self.settings.sensitive_expiry_minutes * 60)
            } else {
                age < (self.settings.retention_days * 24 * 3600)
            }
        });

        // Persist to disk (T074 - rotating JSON file storage)
        self.persist_item(&modified_item)?;

        Ok(())
    }

    /// Get all clipboard items
    pub fn get_items(&self) -> Result<Vec<ClipboardItem>, String> {
        let items = self.items.lock().map_err(|e| format!("Lock error: {}", e))?;
        Ok(items.clone())
    }

    /// Delete a clipboard item
    pub fn delete_item(&self, id: &str) -> Result<(), String> {
        let mut items = self.items.lock().map_err(|e| format!("Lock error: {}", e))?;
        items.retain(|item| item.id != id);

        // Delete from disk
        let item_path = self.storage_dir.join(id);
        if item_path.exists() {
            fs::remove_file(&item_path)
                .map_err(|e| format!("Failed to delete item: {}", e))?;
        }

        Ok(())
    }

    /// Clear all clipboard history
    pub fn clear(&self) -> Result<(), String> {
        let mut items = self.items.lock().map_err(|e| format!("Lock error: {}", e))?;
        items.clear();

        // Clear storage directory
        if self.storage_dir.exists() {
            fs::remove_dir_all(&self.storage_dir)
                .map_err(|e| format!("Failed to clear storage: {}", e))?;
        }
        fs::create_dir_all(&self.storage_dir)
            .map_err(|e| format!("Failed to recreate storage: {}", e))?;

        Ok(())
    }

    /// Load history from disk
    fn load_history(&self) -> Result<(), String> {
        if !self.storage_dir.exists() {
            fs::create_dir_all(&self.storage_dir)
                .map_err(|e| format!("Failed to create storage dir: {}", e))?;
            return Ok(());
        }

        let mut items = self.items.lock().map_err(|e| format!("Lock error: {}", e))?;
        items.clear();

        let entries = fs::read_dir(&self.storage_dir)
            .map_err(|e| format!("Failed to read storage dir: {}", e))?;

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(item) = serde_json::from_str::<ClipboardItem>(&content) {
                        // Check expiration
                        let now = chrono::Utc::now().timestamp();
                        let age_days = (now - item.timestamp) / (24 * 3600);

                        let should_expire = if item.is_sensitive {
                            (now - item.timestamp) > (self.settings.sensitive_expiry_minutes * 60)
                        } else {
                            age_days > self.settings.retention_days
                        };

                        if !should_expire {
                            items.push(item);
                        }
                    }
                }
            }
        }

        // Sort by timestamp
        items.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        Ok(())
    }

    /// Persist item to disk with rotating daily files (T074)
    fn persist_item(&self, item: &ClipboardItem) -> Result<(), String> {
        // Create daily file: clipboard_YYYY-MM-DD.json
        let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let daily_file = self.storage_dir.join(format!("clipboard_{}.json", date));

        // Read existing daily items
        let mut daily_items: Vec<ClipboardItem> = if daily_file.exists() {
            let content = fs::read_to_string(&daily_file)
                .map_err(|e| format!("Failed to read daily file: {}", e))?;
            serde_json::from_str(&content)
                .unwrap_or_default()
        } else {
            Vec::new()
        };

        // Add new item
        daily_items.push(item.clone());

        // Write back to daily file
        let content = serde_json::to_string_pretty(&daily_items)
            .map_err(|e| format!("Failed to serialize items: {}", e))?;
        fs::write(&daily_file, content)
            .map_err(|e| format!("Failed to write daily file: {}", e))?;

        // Also maintain individual item file for quick deletion
        let item_path = self.storage_dir.join(&item.id);
        let item_content = serde_json::to_string(item)
            .map_err(|e| format!("Failed to serialize item: {}", e))?;
        fs::write(&item_path, item_content)
            .map_err(|e| format!("Failed to write item: {}", e))?;

        Ok(())
    }

    /// Update settings
    pub fn update_settings(&mut self, settings: ClipboardSettings) {
        self.settings = settings;
    }

    /// Get settings
    pub fn get_settings(&self) -> ClipboardSettings {
        self.settings.clone()
    }
}
