/**
 * Clipboard Watcher Service Unit Tests
 * Tests for clipboard monitoring, deduplication, and sensitive content detection
 */

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::clipboard::{ClipboardItem, ClipboardContentType, ClipboardSettings};
    use std::path::PathBuf;
    use std::fs;

    fn create_test_item(text: &str) -> ClipboardItem {
        ClipboardItem {
            id: uuid::Uuid::new_v4().to_string(),
            content_type: ClipboardContentType::Text,
            text: Some(text.to_string()),
            image_path: None,
            hash: String::new(),
            timestamp: chrono::Utc::now().timestamp(),
            is_sensitive: false,
            app_source: None,
        }
    }

    fn create_temp_dir() -> PathBuf {
        let dir = std::env::temp_dir().join(format!("kaka_test_{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn test_detect_sensitive_content_password_manager() {
        // Test password manager detection
        assert!(detect_sensitive_content("My 1password is here"));
        assert!(detect_sensitive_content("bitwarden credentials"));
        assert!(detect_sensitive_content("lastpass master key"));
        assert!(detect_sensitive_content("dashlane entry"));
        assert!(detect_sensitive_content("keepass database"));
    }

    #[test]
    fn test_detect_sensitive_content_password_patterns() {
        // Test password pattern detection
        assert!(detect_sensitive_content("pass: secret123"));
        assert!(detect_sensitive_content("pwd: mypassword"));
        assert!(detect_sensitive_content("密码: 123456"));
        assert!(detect_sensitive_content("password=admin123"));
    }

    #[test]
    fn test_detect_sensitive_content_api_keys() {
        // Test API key pattern detection (requires > 20 chars)
        assert!(detect_sensitive_content("api_key=sk-1234567890abcdefglongtext"));
        assert!(detect_sensitive_content("secret=verylongsecretkeythatisover20characters"));
        assert!(detect_sensitive_content("access_token=longtokenstringherethatisover20characters"));
        assert!(detect_sensitive_content("bearer verylongbearertokenherethatisover20characters"));
    }

    #[test]
    fn test_detect_sensitive_content_false_negatives() {
        // Should not detect normal text as sensitive
        assert!(!detect_sensitive_content("Hello, world!"));
        assert!(!detect_sensitive_content("My password is short")); // Too short for API key pattern
        assert!(!detect_sensitive_content("API documentation")); // "API" alone is not sensitive
    }

    #[test]
    fn test_calculate_content_hash_consistency() {
        // Hash should be consistent for same content
        let content = "Test content for hashing";
        let hash1 = calculate_content_hash(content);
        let hash2 = calculate_content_hash(content);
        
        assert_eq!(hash1, hash2);
        assert!(!hash1.is_empty());
    }

    #[test]
    fn test_calculate_content_hash_uniqueness() {
        // Different content should produce different hashes
        let hash1 = calculate_content_hash("Content one");
        let hash2 = calculate_content_hash("Content two");
        
        assert_ne!(hash1, hash2);
    }

    #[test]
    fn test_calculate_content_hash_empty_string() {
        // Should handle empty string
        let hash = calculate_content_hash("");
        assert!(!hash.is_empty());
    }

    #[test]
    fn test_clipboard_watcher_new() {
        let storage_dir = create_temp_dir();
        let settings = ClipboardSettings::default();
        
        let watcher = ClipboardWatcher::new(storage_dir.clone(), settings.clone());
        
        assert_eq!(watcher.get_settings(), settings);
    }

    #[test]
    fn test_clipboard_watcher_add_item_deduplication() {
        let storage_dir = create_temp_dir();
        let settings = ClipboardSettings {
            max_items: 100,
            retention_days: 30,
            sensitive_expiry_minutes: 2,
            enabled: true,
        };
        
        let watcher = ClipboardWatcher::new(storage_dir, settings);
        
        // Add same content twice
        let item1 = create_test_item("Duplicate content");
        let item2 = create_test_item("Duplicate content");
        
        watcher.add_item(item1).unwrap();
        watcher.add_item(item2).unwrap();
        
        // Should only have one item due to hash deduplication
        let items = watcher.get_items().unwrap();
        assert_eq!(items.len(), 1);
    }

    #[test]
    fn test_clipboard_watcher_add_item_fifo_eviction() {
        let storage_dir = create_temp_dir();
        let settings = ClipboardSettings {
            max_items: 3,
            retention_days: 30,
            sensitive_expiry_minutes: 2,
            enabled: true,
        };
        
        let watcher = ClipboardWatcher::new(storage_dir, settings);
        
        // Add 5 items
        for i in 0..5 {
            let item = create_test_item(&format!("Item {}", i));
            watcher.add_item(item).unwrap();
        }
        
        // Should only have 3 items due to FIFO eviction
        let items = watcher.get_items().unwrap();
        assert_eq!(items.len(), 3);
        
        // Most recent items should be retained
        assert_eq!(items[0].text, Some("Item 4".to_string()));
        assert_eq!(items[1].text, Some("Item 3".to_string()));
        assert_eq!(items[2].text, Some("Item 2".to_string()));
    }

    #[test]
    fn test_clipboard_watcher_add_item_sensitive_detection() {
        let storage_dir = create_temp_dir();
        let settings = ClipboardSettings::default();
        
        let watcher = ClipboardWatcher::new(storage_dir, settings);
        
        // Add item with sensitive content
        let mut item = create_test_item("My password is secret123");
        watcher.add_item(item.clone()).unwrap();
        
        let items = watcher.get_items().unwrap();
        assert_eq!(items[0].is_sensitive, true);
    }

    #[test]
    fn test_clipboard_watcher_add_item_auto_expiration() {
        let storage_dir = create_temp_dir();
        let settings = ClipboardSettings {
            max_items: 100,
            retention_days: 1, // 1 day retention
            sensitive_expiry_minutes: 60, // 1 hour for sensitive
            enabled: true,
        };
        
        let watcher = ClipboardWatcher::new(storage_dir, settings);
        
        // Add old items
        let mut old_item = create_test_item("Old content");
        old_item.timestamp = chrono::Utc::now().timestamp() - (2 * 24 * 3600); // 2 days ago
        watcher.add_item(old_item).unwrap();
        
        let mut old_sensitive = create_test_item("Old sensitive password");
        old_sensitive.timestamp = chrono::Utc::now().timestamp() - (2 * 3600); // 2 hours ago
        old_sensitive.is_sensitive = true;
        watcher.add_item(old_sensitive).unwrap();
        
        // Old items should be expired
        let items = watcher.get_items().unwrap();
        assert_eq!(items.len(), 0);
    }

    #[test]
    fn test_clipboard_watcher_delete_item() {
        let storage_dir = create_temp_dir();
        let settings = ClipboardSettings::default();
        
        let watcher = ClipboardWatcher::new(storage_dir, settings);
        
        // Add an item
        let item = create_test_item("To be deleted");
        let id = item.id.clone();
        watcher.add_item(item).unwrap();
        
        // Delete it
        watcher.delete_item(&id).unwrap();
        
        let items = watcher.get_items().unwrap();
        assert_eq!(items.len(), 0);
    }

    #[test]
    fn test_clipboard_watcher_delete_nonexistent_item() {
        let storage_dir = create_temp_dir();
        let settings = ClipboardSettings::default();
        
        let watcher = ClipboardWatcher::new(storage_dir, settings);
        
        // Delete non-existent item should not error
        let result = watcher.delete_item("nonexistent-id");
        assert!(result.is_ok());
    }

    #[test]
    fn test_clipboard_watcher_clear() {
        let storage_dir = create_temp_dir();
        let settings = ClipboardSettings::default();
        
        let watcher = ClipboardWatcher::new(storage_dir.clone(), settings);
        
        // Add items
        for i in 0..5 {
            let item = create_test_item(&format!("Item {}", i));
            watcher.add_item(item).unwrap();
        }
        
        // Clear all
        watcher.clear().unwrap();
        
        let items = watcher.get_items().unwrap();
        assert_eq!(items.len(), 0);
        
        // Storage directory should be recreated
        assert!(storage_dir.exists());
    }

    #[test]
    fn test_clipboard_watcher_update_settings() {
        let storage_dir = create_temp_dir();
        let settings = ClipboardSettings::default();
        
        let mut watcher = ClipboardWatcher::new(storage_dir, settings);
        
        let new_settings = ClipboardSettings {
            max_items: 500,
            retention_days: 60,
            sensitive_expiry_minutes: 5,
            enabled: false,
        };
        
        watcher.update_settings(new_settings.clone());
        assert_eq!(watcher.get_settings(), new_settings);
    }

    #[test]
    fn test_clipboard_settings_default() {
        let settings = ClipboardSettings::default();
        
        assert_eq!(settings.max_items, 1000);
        assert_eq!(settings.retention_days, 30);
        assert_eq!(settings.sensitive_expiry_minutes, 2);
        assert_eq!(settings.enabled, true);
    }

    #[test]
    fn test_clipboard_item_serialization() {
        let item = ClipboardItem {
            id: "test-id".to_string(),
            content_type: ClipboardContentType::Text,
            text: Some("Test content".to_string()),
            image_path: None,
            hash: "test-hash".to_string(),
            timestamp: 1234567890,
            is_sensitive: false,
            app_source: Some("TestApp".to_string()),
        };
        
        // Serialize
        let json = serde_json::to_string(&item).unwrap();
        
        // Deserialize
        let deserialized: ClipboardItem = serde_json::from_str(&json).unwrap();
        
        assert_eq!(deserialized.id, item.id);
        assert_eq!(deserialized.text, item.text);
        assert_eq!(deserialized.is_sensitive, item.is_sensitive);
    }

    #[test]
    fn test_clipboard_item_content_type_variants() {
        let text_item = ClipboardItem {
            id: "1".to_string(),
            content_type: ClipboardContentType::Text,
            text: Some("Text content".to_string()),
            image_path: None,
            hash: String::new(),
            timestamp: 0,
            is_sensitive: false,
            app_source: None,
        };
        
        let image_item = ClipboardItem {
            id: "2".to_string(),
            content_type: ClipboardContentType::Image,
            text: None,
            image_path: Some(PathBuf::from("/tmp/image.png")),
            hash: String::new(),
            timestamp: 0,
            is_sensitive: false,
            app_source: None,
        };
        
        // Both should be serializable
        assert!(serde_json::to_string(&text_item).is_ok());
        assert!(serde_json::to_string(&image_item).is_ok());
    }
}
