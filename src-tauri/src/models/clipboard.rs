/**
 * Clipboard Item Model
 * Represents a clipboard history item
 */

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardItem {
    pub id: String,
    pub content_type: ClipboardContentType,
    pub text: Option<String>,
    pub image_path: Option<PathBuf>,
    pub hash: String,
    pub timestamp: i64,
    pub is_sensitive: bool,
    pub app_source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClipboardContentType {
    Text,
    Image,
    Html,
    File,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardSettings {
    pub max_items: usize,
    pub retention_days: i64,
    pub sensitive_expiry_minutes: i64,
    pub enabled: bool,
}

impl Default for ClipboardSettings {
    fn default() -> Self {
        Self {
            max_items: 1000,
            retention_days: 30,
            sensitive_expiry_minutes: 2,
            enabled: true,
        }
    }
}
