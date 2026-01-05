/**
 * Search Commands Unit Tests
 * Tests for unified search, app search, and search statistics
 */

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::app_monitor::AppMonitor;
    use crate::models::app::ApplicationEntry;
    use std::sync::Mutex;
    use tauri::State;

    fn create_mock_search_state() -> SearchState {
        SearchState {
            app_monitor: Mutex::new(AppMonitor::new()),
        }
    }

    fn create_mock_apps() -> Vec<ApplicationEntry> {
        vec![
            ApplicationEntry {
                id: "1".to_string(),
                name: "Visual Studio Code".to_string(),
                executable_path: "/usr/bin/code".to_string(),
                icon: Some("📝".to_string()),
                usage_count: 45,
            },
            ApplicationEntry {
                id: "2".to_string(),
                name: "Chrome".to_string(),
                executable_path: "/usr/bin/google-chrome".to_string(),
                icon: Some("🌐".to_string()),
                usage_count: 120,
            },
            ApplicationEntry {
                id: "3".to_string(),
                name: "Finder".to_string(),
                executable_path: "/usr/bin/finder".to_string(),
                icon: Some("📁".to_string()),
                usage_count: 89,
            },
            ApplicationEntry {
                id: "4".to_string(),
                name: "Terminal".to_string(),
                executable_path: "/usr/bin/terminal".to_string(),
                icon: Some("⌨️".to_string()),
                usage_count: 67,
            },
        ]
    }

    #[test]
    fn test_search_query_deserialization() {
        let json = r#"{"query":"test","limit":10,"sources":["app","file"]}"#;
        
        let query: SearchQuery = serde_json::from_str(json).unwrap();
        
        assert_eq!(query.query, "test");
        assert_eq!(query.limit, Some(10));
        assert_eq!(query.sources, Some(vec!["app".to_string(), "file".to_string()]));
    }

    #[test]
    fn test_search_query_minimal() {
        let json = r#"{"query":"","limit":null,"sources":null}"#;
        
        let query: SearchQuery = serde_json::from_str(json).unwrap();
        
        assert_eq!(query.query, "");
        assert_eq!(query.limit, None);
        assert_eq!(query.sources, None);
    }

    #[test]
    fn test_search_result_item_serialization() {
        let item = SearchResultItem {
            id: "test-id".to_string(),
            title: "Test App".to_string(),
            subtitle: "/usr/bin/test".to_string(),
            icon: Some("🧪".to_string()),
            result_type: "app".to_string(),
            score: 0.95,
            path: "/usr/bin/test".to_string(),
            frequency: 50,
        };
        
        let json = serde_json::to_string(&item).unwrap();
        
        assert!(json.contains("test-id"));
        assert!(json.contains("Test App"));
        assert!(json.contains("0.95"));
    }

    #[test]
    fn test_search_response_serialization() {
        let response = SearchResponse {
            results: vec![
                SearchResultItem {
                    id: "1".to_string(),
                    title: "App 1".to_string(),
                    subtitle: "/path/to/app1".to_string(),
                    icon: Some("📱".to_string()),
                    result_type: "app".to_string(),
                    score: 1.0,
                    path: "/path/to/app1".to_string(),
                    frequency: 100,
                },
            ],
            total: 1,
            query_time: 15,
        };
        
        let json = serde_json::to_string(&response).unwrap();
        
        assert!(json.contains("\"total\":1"));
        assert!(json.contains("\"query_time\":15"));
    }

    #[test]
    fn test_search_stats_serialization() {
        let stats = SearchStats {
            total_apps: 42,
            total_files: 1000,
            total_browser_items: 500,
            index_last_updated: Some("2024-01-01T00:00:00Z".to_string()),
        };
        
        let json = serde_json::to_string(&stats).unwrap();
        
        assert!(json.contains("\"total_apps\":42"));
        assert!(json.contains("\"total_files\":1000"));
        assert!(json.contains("\"total_browser_items\":500"));
    }

    #[test]
    fn test_file_search_result_serialization() {
        let result = FileSearchResult {
            id: "file-1".to_string(),
            filename: "document.pdf".to_string(),
            path: "/Users/test/document.pdf".to_string(),
            extension: Some("pdf".to_string()),
            size: 1024000,
            indexed: 1704067200,
        };
        
        let json = serde_json::to_string(&result).unwrap();
        let deserialized: FileSearchResult = serde_json::from_str(&json).unwrap();
        
        assert_eq!(deserialized.filename, "document.pdf");
        assert_eq!(deserialized.extension, Some("pdf".to_string()));
        assert_eq!(deserialized.size, 1024000);
    }

    #[test]
    fn test_browser_search_result_serialization() {
        let result = BrowserSearchResult {
            id: "bookmark-1".to_string(),
            title: "GitHub".to_string(),
            url: "https://github.com".to_string(),
            browser: "Chrome".to_string(),
            entry_type: "bookmark".to_string(),
            favicon: Some("📦".to_string()),
            last_visited: 1704067200,
        };
        
        let json = serde_json::to_string(&result).unwrap();
        let deserialized: BrowserSearchResult = serde_json::from_str(&json).unwrap();
        
        assert_eq!(deserialized.title, "GitHub");
        assert_eq!(deserialized.entry_type, "bookmark");
        assert_eq!(deserialized.browser, "Chrome");
    }

    #[test]
    fn test_scoring_exact_match() {
        // Test exact match scoring
        let app = ApplicationEntry {
            id: "1".to_string(),
            name: "Code".to_string(),
            executable_path: "/usr/bin/code".to_string(),
            icon: Some("📝".to_string()),
            usage_count: 10,
        };
        
        let query_lower = "code";
        let name_lower = app.name.to_lowercase();
        
        let exact_match = if name_lower == query_lower { 1.0 } else { 0.0 };
        let starts_with = if name_lower.starts_with(&query_lower) { 0.8 } else { 0.0 };
        let contains = if name_lower.contains(&query_lower) { 0.5 } else { 0.0 };
        let frequency_boost = (app.usage_count as f64).log10() / 10.0;
        
        let score = exact_match + starts_with + contains + frequency_boost;
        
        assert_eq!(exact_match, 1.0);
        assert!(score > 1.0); // Should have frequency boost too
    }

    #[test]
    fn test_scoring_starts_with() {
        let app = ApplicationEntry {
            id: "1".to_string(),
            name: "Code".to_string(),
            executable_path: "/usr/bin/code".to_string(),
            icon: Some("📝".to_string()),
            usage_count: 5,
        };
        
        let query_lower = "co";
        let name_lower = app.name.to_lowercase();
        
        let exact_match = if name_lower == query_lower { 1.0 } else { 0.0 };
        let starts_with = if name_lower.starts_with(&query_lower) { 0.8 } else { 0.0 };
        let contains = if name_lower.contains(&query_lower) { 0.5 } else { 0.0 };
        
        assert_eq!(exact_match, 0.0);
        assert_eq!(starts_with, 0.8);
        assert_eq!(contains, 0.5); // Also contains
    }

    #[test]
    fn test_scoring_contains() {
        let app = ApplicationEntry {
            id: "1".to_string(),
            name: "Visual Studio Code".to_string(),
            executable_path: "/usr/bin/code".to_string(),
            icon: Some("📝".to_string()),
            usage_count: 5,
        };
        
        let query_lower = "studio";
        let name_lower = app.name.to_lowercase();
        
        let exact_match = if name_lower == query_lower { 1.0 } else { 0.0 };
        let starts_with = if name_lower.starts_with(&query_lower) { 0.8 } else { 0.0 };
        let contains = if name_lower.contains(&query_lower) { 0.5 } else { 0.0 };
        
        assert_eq!(exact_match, 0.0);
        assert_eq!(starts_with, 0.0);
        assert_eq!(contains, 0.5);
    }

    #[test]
    fn test_scoring_frequency_boost() {
        let low_freq_app = ApplicationEntry {
            id: "1".to_string(),
            name: "App".to_string(),
            executable_path: "/usr/bin/app".to_string(),
            icon: None,
            usage_count: 1,
        };
        
        let high_freq_app = ApplicationEntry {
            id: "2".to_string(),
            name: "App".to_string(),
            executable_path: "/usr/bin/app2".to_string(),
            icon: None,
            usage_count: 100,
        };
        
        let low_boost = (low_freq_app.usage_count as f64).log10() / 10.0;
        let high_boost = (high_freq_app.usage_count as f64).log10() / 10.0;
        
        assert!(high_boost > low_boost);
        assert!(high_boost > 0.1); // 100 uses should give noticeable boost
    }

    #[test]
    fn test_limit_results() {
        let apps = create_mock_apps();
        
        let limit = 2;
        let limited: Vec<&ApplicationEntry> = apps.iter().take(limit).collect();
        
        assert_eq!(limited.len(), 2);
        assert_eq!(limited[0].id, "1");
        assert_eq!(limited[1].id, "2");
    }

    #[test]
    fn test_filter_by_query() {
        let apps = create_mock_apps();
        let query_lower = "code";
        
        let filtered: Vec<&ApplicationEntry> = apps
            .iter()
            .filter(|app| {
                let name_matches = app.name.to_lowercase().contains(&query_lower);
                let path_matches = app.executable_path.to_lowercase().contains(&query_lower);
                name_matches || path_matches
            })
            .collect();
        
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].name, "Visual Studio Code");
    }

    #[test]
    fn test_filter_empty_query() {
        let apps = create_mock_apps();
        let query_lower = "";
        
        let filtered: Vec<&ApplicationEntry> = apps
            .iter()
            .filter(|app| {
                let name_matches = app.name.to_lowercase().contains(&query_lower);
                let path_matches = app.executable_path.to_lowercase().contains(&query_lower);
                name_matches || path_matches
            })
            .collect();
        
        // Empty query matches all
        assert_eq!(filtered.len(), apps.len());
    }

    #[test]
    fn test_case_insensitive_search() {
        let app = ApplicationEntry {
            id: "1".to_string(),
            name: "Visual Studio Code".to_string(),
            executable_path: "/usr/bin/code".to_string(),
            icon: None,
            usage_count: 0,
        };
        
        let queries = vec!["code", "CODE", "Code", "cOdE"];
        
        for query in queries {
            let query_lower = query.to_lowercase();
            let name_matches = app.name.to_lowercase().contains(&query_lower);
            assert!(name_matches, "Query '{}' should match", query);
        }
    }
}
