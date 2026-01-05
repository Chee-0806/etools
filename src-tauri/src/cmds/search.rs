/**
 * Search Commands
 * Tauri commands for search indexing and queries
 */

use crate::models::app::ApplicationEntry;
use crate::services::app_monitor::AppMonitor;
use crate::services::file_indexer::{FileIndexer, IndexerConfig};
use crate::services::browser_reader::{BrowserReader, BrowserReaderConfig};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, State};

/// Global search state (T024)
pub struct SearchState {
    pub app_monitor: Mutex<AppMonitor>,
    pub file_indexer: Mutex<Option<FileIndexer>>,
}

/// Unified search query
#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub limit: Option<usize>,
    #[allow(dead_code)]
    pub sources: Option<Vec<String>>,
}

/// Search result item
#[derive(Debug, Serialize, Clone)]
pub struct SearchResultItem {
    pub id: String,
    pub title: String,
    pub subtitle: String,
    pub icon: Option<String>,
    #[serde(rename = "type")]
    pub result_type: String,
    pub score: f64,
    pub path: String,
    pub frequency: u32,
}

/// Search response
#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResultItem>,
    pub total: usize,
    pub query_time: u64,
}

/// Perform unified search
#[tauri::command]
pub fn unified_search(
    query: SearchQuery,
    state: State<SearchState>,
) -> Result<SearchResponse, String> {
    let start = std::time::Instant::now();

    let mut monitor = state.app_monitor.lock().map_err(|e| e.to_string())?;

    // Get all apps
    let apps = monitor.scan_apps();

    // Filter by query if provided
    let filtered: Vec<&ApplicationEntry> = if query.query.trim().is_empty() {
        apps.iter().collect()
    } else {
        apps
            .iter()
            .filter(|app| {
                let query_lower = query.query.to_lowercase();
                let name_matches = app.name.to_lowercase().contains(&query_lower);

                // Extract app bundle name from path for better matching
                // e.g., "/Applications/Visual Studio Code.app/..." -> "visual studio code"
                let app_name_from_path = app.executable_path
                    .split('/')
                    .find(|segment| segment.ends_with(".app"))
                    .map(|s| s.trim_end_matches(".app").to_lowercase())
                    .unwrap_or_default();

                let path_app_name_matches = !app_name_from_path.is_empty()
                    && app_name_from_path.contains(&query_lower);

                // Check alternate names (e.g., .app filename like "Visual Studio Code")
                let alternate_matches = app.alternate_names.as_ref().map_or(false, |names| {
                    names.iter().any(|n| n.to_lowercase().contains(&query_lower))
                });

                // NEW: Initialism/abbreviation matching (only for queries >= 2 chars)
                // Allows searching "vsc" for "Visual Studio Code"
                let initialism_matches = {
                    // Only use initialism matching for queries of 2+ characters
                    // to avoid over-matching single characters
                    if query_lower.chars().all(|c| c.is_ascii_lowercase()) && query_lower.len() >= 2 {
                        // Get initials from app name (split by spaces/special chars)
                        let initials: String = app.name
                            .split(|c: char| !c.is_alphanumeric())
                            .filter(|s| !s.is_empty())
                            .map(|word| word.chars().next().unwrap_or(' '))
                            .collect::<String>()
                            .to_lowercase();

                        // Also get initials from path app name
                        let path_initials: String = app_name_from_path
                            .split(|c: char| !c.is_alphanumeric())
                            .filter(|s| !s.is_empty())
                            .map(|word| word.chars().next().unwrap_or(' '))
                            .collect::<String>();

                        // Only use starts_with to avoid over-matching
                        initials.starts_with(&query_lower) || path_initials.starts_with(&query_lower)
                    } else {
                        false
                    }
                };

                name_matches || path_app_name_matches || alternate_matches || initialism_matches
            })
            .collect()
    };

    // Limit results
    let limit = query.limit.unwrap_or(50);
    let limited: Vec<&ApplicationEntry> = filtered.into_iter().take(limit).collect();

    // Convert to search results
    let results: Vec<SearchResultItem> = limited
        .iter()
        .map(|app| {
            // Calculate simple relevance score
            let query_lower = query.query.to_lowercase();
            let name_lower = app.name.to_lowercase();
            let exact_match = if name_lower == query_lower { 1.0 } else { 0.0 };
            let starts_with = if name_lower.starts_with(&query_lower) {
                0.8
            } else {
                0.0
            };
            let contains = if name_lower.contains(&query_lower) {
                0.5
            } else {
                0.0
            };

            // Check alternate names for scoring
            let alternate_score = app.alternate_names.as_ref().map_or(0.0, |names| {
                names.iter().fold(0.0_f64, |acc, n| {
                    let n_lower = n.to_lowercase();
                    let score = if n_lower == query_lower {
                        0.9  // Slightly less than exact name match
                    } else if n_lower.starts_with(&query_lower) {
                        0.7
                    } else if n_lower.contains(&query_lower) {
                        0.4
                    } else {
                        0.0
                    };
                    acc.max(score)
                })
            });

            // NEW: Score initialism matches (only for queries >= 2 chars)
            let initialism_score = {
                if query_lower.chars().all(|c| c.is_ascii_lowercase()) && query_lower.len() >= 2 {
                    let initials: String = app.name
                        .split(|c: char| !c.is_alphanumeric())
                        .filter(|s| !s.is_empty())
                        .map(|word| word.chars().next().unwrap_or(' '))
                        .collect::<String>()
                        .to_lowercase();

                    if initials == query_lower {
                        0.85  // Very high score for exact initialism match (e.g., "vsc" for "Visual Studio Code")
                    } else if initials.starts_with(&query_lower) {
                        0.65  // Good score for partial initialism match
                    } else {
                        0.0
                    }
                } else {
                    0.0
                }
            };

            let frequency_boost = (app.usage_count as f64).log10() / 10.0;

            SearchResultItem {
                id: app.id.clone(),
                title: app.name.clone(),
                subtitle: app.executable_path.clone(),
                icon: app.icon.clone(), // Return icon as-is (None or cached path)
                result_type: "app".to_string(),
                score: exact_match + starts_with + contains + alternate_score + initialism_score + frequency_boost,
                path: app.app_path.clone().unwrap_or_else(|| app.executable_path.clone()),
                frequency: app.usage_count,
            }
        })
        .collect();

    let total = results.len();
    let query_time = start.elapsed().as_millis() as u64;

    Ok(SearchResponse {
        results,
        total,
        query_time,
    })
}

/// Get search statistics
#[derive(Debug, Serialize)]
pub struct SearchStats {
    pub total_apps: usize,
    pub total_files: usize,
    pub total_browser_items: usize,
    pub index_last_updated: Option<String>,
}

#[tauri::command]
pub fn get_search_stats(state: State<SearchState>) -> Result<SearchStats, String> {
    let mut monitor = state.app_monitor.lock().map_err(|e| e.to_string())?;
    let apps = monitor.scan_apps();

    Ok(SearchStats {
        total_apps: apps.len(),
        total_files: 0,
        total_browser_items: 0,
        index_last_updated: Some(chrono::Utc::now().to_rfc3339()),
    })
}

/// File search result
#[derive(Debug, Serialize)]
pub struct FileSearchResult {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub extension: Option<String>,
    pub size: u64,
    pub indexed: i64,
}

/// Browser search result
#[derive(Debug, Serialize)]
pub struct BrowserSearchResult {
    pub id: String,
    pub title: String,
    pub url: String,
    pub browser: String,
    #[serde(rename = "entry_type")]
    pub entry_type: String,
    pub favicon: Option<String>,
    #[serde(rename = "last_visited")]
    pub last_visited: i64,
}

/// Search files (T140, T022) - queries file index
#[tauri::command]
pub fn search_files(
    handle: AppHandle,
    query: String,
    limit: usize,
) -> Result<Vec<FileSearchResult>, String> {
    use crate::services::file_indexer::FileIndexer;
    use crate::services::file_indexer::IndexerConfig;

    let config = IndexerConfig::default();
    let indexer = FileIndexer::new(config);

    let files = indexer.search(&handle, &query, limit)?;

    // Convert to FileSearchResult
    let results: Vec<FileSearchResult> = files
        .into_iter()
        .map(|f| FileSearchResult {
            id: f.id.unwrap_or(0).to_string(),
            filename: f.filename,
            path: f.path,
            extension: f.extension,
            size: f.size as u64,
            indexed: f.indexed,
        })
        .collect();

    Ok(results)
}

/// Search browser data (T150, T032) - queries cached browser data
#[tauri::command]
pub fn search_browser_data(
    handle: AppHandle,
    query: String,
    limit: usize,
) -> Result<Vec<BrowserSearchResult>, String> {
    let config = BrowserReaderConfig::default();
    let reader = BrowserReader::new(config);

    let entries = reader.search(&handle, &query, limit)?;

    // Convert to BrowserSearchResult
    let results: Vec<BrowserSearchResult> = entries
        .into_iter()
        .map(|e| BrowserSearchResult {
            id: e.id.unwrap_or(0).to_string(),
            title: e.title,
            url: e.url,
            browser: e.browser,
            entry_type: e.entry_type,
            favicon: e.favicon,
            last_visited: e.last_visited.unwrap_or(0),
        })
        .collect();

    Ok(results)
}

/// Update browser cache (T149, T030) - refreshes bookmarks and history from browsers
#[tauri::command]
pub async fn update_browser_cache(handle: AppHandle) -> Result<usize, String> {
    let config = BrowserReaderConfig::default();
    let reader = BrowserReader::new(config);

    reader.update_cache(&handle)
}

/// Index files (T138)
#[tauri::command]
pub async fn index_files(
    handle: AppHandle,
    paths: Vec<String>,
) -> Result<usize, String> {
    let config = IndexerConfig::default();
    let indexer = FileIndexer::new(config);
    indexer.index_paths(&handle, &paths)
}

/// File index stats for API response (T139, T023)
#[derive(Debug, Serialize)]
pub struct FileIndexStats {
    pub total_files: usize,
    pub last_indexed: Option<String>,
    pub indexed_paths: Vec<String>,
}

/// Get file index stats - queries index statistics
#[tauri::command]
pub fn get_file_index_stats(handle: AppHandle) -> Result<FileIndexStats, String> {
    use crate::services::file_indexer::FileIndexer;

    let config = IndexerConfig::default();
    let paths: Vec<String> = config.paths.iter().map(|p| p.to_string_lossy().to_string()).collect();

    let indexer = FileIndexer::new(config);
    let db_stats = indexer.get_stats(&handle)?;

    // Convert db FileIndexStats to API FileIndexStats
    Ok(FileIndexStats {
        total_files: db_stats.total_files,
        last_indexed: Some(chrono::Utc::now().to_rfc3339()),
        indexed_paths: paths,
    })
}

/// Start file indexer (T024)
#[tauri::command]
pub fn start_file_indexer(
    handle: AppHandle,
    state: State<SearchState>,
    paths: Option<Vec<String>>,
) -> Result<(), String> {
    let mut indexer_guard = state.file_indexer.lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    // Create config with provided paths or defaults
    let config = if let Some(paths) = paths {
        IndexerConfig {
            paths: paths.into_iter().map(|p| p.into()).collect(),
            ..Default::default()
        }
    } else {
        IndexerConfig::default()
    };

    let indexer = FileIndexer::new(config);
    indexer.start(&handle)?;

    *indexer_guard = Some(indexer);

    Ok(())
}

/// Stop file indexer (T024)
#[tauri::command]
pub fn stop_file_indexer(state: State<SearchState>) -> Result<(), String> {
    let mut indexer_guard = state.file_indexer.lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if let Some(indexer) = indexer_guard.as_ref() {
        indexer.stop()?;
        *indexer_guard = None;
    }

    Ok(())
}
