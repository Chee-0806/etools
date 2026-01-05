//! File Indexer Service (T133-T137, T141)
//! Indexes local files for search with file system watching and progress events
#![allow(dead_code)]
#![allow(unused_variables)]

use crate::db::files::{FileEntry, init_files_db, upsert_file, search_files, get_index_stats};
use notify::{Watcher, RecursiveMode, EventKind, Event};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use std::sync::mpsc::channel;
use tauri::Emitter;

/// File indexer configuration
#[derive(Debug, Clone)]
pub struct IndexerConfig {
    pub paths: Vec<PathBuf>,
    pub excluded_dirs: Vec<String>,
    pub max_files: usize,
    pub debounce_ms: u64,
}

impl Default for IndexerConfig {
    fn default() -> Self {
        Self {
            paths: vec![],
            excluded_dirs: vec![
                "node_modules".to_string(),
                ".git".to_string(),
                "target".to_string(),
                "dist".to_string(),
                "build".to_string(),
                ".cache".to_string(),
            ],
            max_files: 100_000,
            debounce_ms: 5000,
        }
    }
}

/// File indexer service
pub struct FileIndexer {
    config: IndexerConfig,
    indexed_files: Arc<Mutex<HashSet<PathBuf>>>,
    is_running: Arc<Mutex<bool>>,
    app_handle: Arc<Mutex<Option<tauri::AppHandle>>>,
}

/// Index progress event (T141)
#[derive(Debug, Clone, serde::Serialize)]
pub struct IndexProgressEvent {
    pub current: usize,
    pub total: usize,
    pub path: String,
    pub stage: String,
}

impl FileIndexer {
    /// Create a new file indexer
    pub fn new(config: IndexerConfig) -> Self {
        Self {
            config,
            indexed_files: Arc::new(Mutex::new(HashSet::new())),
            is_running: Arc::new(Mutex::new(false)),
            app_handle: Arc::new(Mutex::new(None)),
        }
    }

    /// Start indexing with file system watching (T133, T136)
    pub fn start(&self, app_handle: &tauri::AppHandle) -> Result<(), String> {
        // Store app handle
        {
            let mut handle_guard = self.app_handle.lock().map_err(|e| format!("Lock error: {}", e))?;
            *handle_guard = Some(app_handle.clone());
        }

        let mut running = self.is_running.lock().map_err(|e| format!("Lock error: {}", e))?;
        if *running {
            return Ok(());
        }
        *running = true;
        drop(running);

        // Initialize database
        let _conn = init_files_db(app_handle)
            .map_err(|e| format!("Failed to init DB: {}", e))?;

        // Spawn indexing thread
        let is_running = Arc::clone(&self.is_running);
        let indexed_files = Arc::clone(&self.indexed_files);
        let config = self.config.clone();
        let app_handle = app_handle.clone();
        let app_handle_arc = Arc::clone(&self.app_handle);

        thread::spawn(move || {
            let mut last_scan = std::time::Instant::now();

            while *is_running.lock().unwrap() {
                // Check if it's time to scan again
                if last_scan.elapsed() >= std::time::Duration::from_millis(config.debounce_ms) {
                    if let Err(e) = Self::scan_directory_recursive(
                        &config,
                        &indexed_files,
                        &app_handle,
                    ) {
                        eprintln!("Indexing error: {}", e);
                    }
                    last_scan = std::time::Instant::now();
                }

                thread::sleep(Duration::from_secs(10));
            }
        });

        // Setup file system watcher (T136)
        self.setup_file_watcher()?;

        Ok(())
    }

    /// Setup file system watcher for real-time updates (T136)
    fn setup_file_watcher(&self) -> Result<(), String> {
        let (tx, rx) = channel();

        // Create watcher
        let mut watcher = notify::recommended_watcher(move |res: Result<Event, _>| {
            if let Ok(event) = res {
                let _ = tx.send(event);
            }
        }).map_err(|e| format!("Failed to create watcher: {}", e))?;

        // Watch all configured paths
        for path in &self.config.paths {
            if path.exists() {
                watcher.watch(path, RecursiveMode::Recursive)
                    .map_err(|e| format!("Failed to watch path: {}", e))?;
            }
        }

        // Spawn watcher thread
        let indexed_files = Arc::clone(&self.indexed_files);
        let is_running = Arc::clone(&self.is_running);
        let app_handle_arc = Arc::clone(&self.app_handle);
        let excluded_dirs = self.config.excluded_dirs.clone();

        thread::spawn(move || {
            while *is_running.lock().unwrap() {
                if let Ok(event) = rx.recv_timeout(Duration::from_secs(1)) {
                    for path in event.paths {
                        // Skip excluded directories
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            if excluded_dirs.iter().any(|ex| ex == name) {
                                continue;
                            }
                        }

                        // Handle different event kinds
                        match event.kind {
                            EventKind::Create(_) | EventKind::Modify(_) => {
                                // Add or update file
                                if path.is_file() {
                                    if let Some(handle) = app_handle_arc.lock().unwrap().as_ref() {
                                        if let Ok(conn) = init_files_db(handle) {
                                            let metadata = fs::metadata(&path);
                                            if let Ok(meta) = metadata {
                                                let modified = meta.modified()
                                                    .ok()
                                                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                                    .map(|d| d.as_secs() as i64)
                                                    .unwrap_or(0);

                                                let filename = path.file_name()
                                                    .and_then(|n| n.to_str())
                                                    .unwrap_or("unknown")
                                                    .to_string();

                                                let is_hidden = filename.starts_with('.');

                                                let extension = path.extension()
                                                    .and_then(|e| e.to_str())
                                                    .map(|s| s.to_string());

                                                let entry = FileEntry {
                                                    id: None,
                                                    path: path.to_string_lossy().to_string(),
                                                    filename,
                                                    extension,
                                                    size: meta.len() as i64,
                                                    modified,
                                                    hidden: is_hidden,
                                                    indexed: chrono::Utc::now().timestamp(),
                                                };

                                                let _ = upsert_file(&conn, &entry);

                                                let mut files = indexed_files.lock().unwrap();
                                                files.insert(path);
                                            }
                                        }
                                    }
                                }
                            }
                            EventKind::Remove(_) => {
                                // Remove from index
                                if let Some(handle) = app_handle_arc.lock().unwrap().as_ref() {
                                    if let Ok(conn) = init_files_db(handle) {
                                        let path_str = path.to_string_lossy().to_string();
                                        let _ = conn.execute(
                                            "DELETE FROM files WHERE path = ?1",
                                            [&path_str]
                                        );
                                    }
                                }
                                let mut files = indexed_files.lock().unwrap();
                                files.remove(&path);
                            }
                            _ => {}
                        }
                    }
                }
            }
        });

        Ok(())
    }

    /// Emit progress event (T141)
    fn emit_progress(&self, event: IndexProgressEvent) {
        if let Some(handle) = self.app_handle.lock().unwrap().as_ref() {
            let _ = handle.emit("index:progress", event);
        }
    }

    /// Stop indexing
    pub fn stop(&self) -> Result<(), String> {
        let mut running = self.is_running.lock().map_err(|e| format!("Lock error: {}", e))?;
        *running = false;
        Ok(())
    }

    /// Scan a directory recursively
    fn scan_directory_recursive(
        config: &IndexerConfig,
        indexed_files: &Arc<Mutex<HashSet<PathBuf>>>,
        app_handle: &tauri::AppHandle,
    ) -> Result<(), String> {
        for base_path in &config.paths {
            if !base_path.exists() {
                continue;
            }

            Self::scan_dir(base_path, config, indexed_files, app_handle, 0, 0)?;
        }

        Ok(())
    }

    /// Scan a single directory with progress tracking (T141)
    fn scan_dir(
        dir: &Path,
        config: &IndexerConfig,
        indexed_files: &Arc<Mutex<HashSet<PathBuf>>>,
        app_handle: &tauri::AppHandle,
        current: usize,
        total: usize,
    ) -> Result<usize, String> {
        let entries = fs::read_dir(dir)
            .map_err(|e| format!("Failed to read directory: {}", e))?;

        let mut count = current;
        let entries_vec: Vec<_> = entries.flatten().collect();

        // Emit progress event
        if total > 0 {
            let progress = IndexProgressEvent {
                current: count,
                total,
                path: dir.to_string_lossy().to_string(),
                stage: "scanning".to_string(),
            };
            let _ = app_handle.emit("index:progress", progress);
        }

        for entry in entries_vec {
            let path = entry.path();

            // Skip excluded directories
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if config.excluded_dirs.iter().any(|ex| ex == name) {
                    continue;
                }
            }

            if path.is_dir() {
                // Recursively scan subdirectories
                count = Self::scan_dir(&path, config, indexed_files, app_handle, count, total)?;
            } else if path.is_file() {
                // Check if already indexed
                let mut files = indexed_files.lock().map_err(|e| format!("Lock error: {}", e))?;

                if !files.contains(&path) {
                    // Get file metadata
                    let metadata = fs::metadata(&path)
                        .map_err(|e| format!("Failed to get metadata: {}", e))?;

                    let modified = metadata.modified()
                        .map_err(|e| format!("Failed to get modified time: {}", e))?
                        .duration_since(std::time::UNIX_EPOCH)
                        .map_err(|e| format!("Time conversion error: {}", e))?
                        .as_secs() as i64;

                    // Get filename and extension
                    let filename = path.file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("unknown")
                        .to_string();

                    let extension = path.extension()
                        .and_then(|e| e.to_str())
                        .map(|s| s.to_string());

                    // Check if file is hidden
                    let hidden = filename.starts_with('.');

                    // Create file entry
                    let entry = FileEntry {
                        id: None,
                        path: path.to_string_lossy().to_string(),
                        filename,
                        extension,
                        size: metadata.len() as i64,
                        modified,
                        hidden,
                        indexed: chrono::Utc::now().timestamp(),
                    };

                    // Store in database
                    if let Ok(conn) = init_files_db(app_handle) {
                        let _ = upsert_file(&conn, &entry);
                    }

                    // Mark as indexed
                    files.insert(path);
                    count += 1;
                }
            }
        }

        Ok(count)
    }

    /// Search indexed files
    pub fn search(
        &self,
        app_handle: &tauri::AppHandle,
        query: &str,
        limit: usize,
    ) -> Result<Vec<FileEntry>, String> {
        let conn = init_files_db(app_handle)
            .map_err(|e| format!("DB error: {}", e))?;
        search_files(&conn, query, limit)
            .map_err(|e| format!("Search error: {}", e))
    }

    /// Get index statistics
    pub fn get_stats(&self, app_handle: &tauri::AppHandle) -> Result<crate::db::files::FileIndexStats, String> {
        let conn = init_files_db(app_handle)
            .map_err(|e| format!("DB error: {}", e))?;
        get_index_stats(&conn)
            .map_err(|e| format!("Stats error: {}", e))
    }

    /// Update configuration
    pub fn update_config(&mut self, config: IndexerConfig) {
        self.config = config;
    }

    /// Index specific paths (T138)
    pub fn index_paths(&self, app_handle: &tauri::AppHandle, paths: &[String]) -> Result<usize, String> {
        let mut count = 0;
        let mut indexed_files = self.indexed_files.lock().map_err(|e| format!("Lock error: {}", e))?;

        for path_str in paths {
            let path = PathBuf::from(path_str);
            if !path.exists() {
                continue;
            }

            // Create a temporary config for this path
            let temp_config = IndexerConfig {
                paths: vec![path.clone()],
                excluded_dirs: self.config.excluded_dirs.clone(),
                max_files: self.config.max_files,
                debounce_ms: self.config.debounce_ms,
            };

            // Scan the path
            if path.is_dir() {
                Self::scan_dir(&path, &temp_config, &Arc::new(Mutex::new(HashSet::new())), app_handle, 0, 0)?;
            } else if path.is_file() {
                // Index single file
                let metadata = fs::metadata(&path)
                    .map_err(|e| format!("Failed to get metadata: {}", e))?;

                let modified = metadata.modified()
                    .map_err(|e| format!("Failed to get modified time: {}", e))?
                    .duration_since(std::time::UNIX_EPOCH)
                    .map_err(|e| format!("Time conversion error: {}", e))?
                    .as_secs() as i64;

                let filename = path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                let extension = path.extension()
                    .and_then(|e| e.to_str())
                    .map(|s| s.to_string());

                let hidden = filename.starts_with('.');

                let entry = FileEntry {
                    id: None,
                    path: path.to_string_lossy().to_string(),
                    filename,
                    extension,
                    size: metadata.len() as i64,
                    modified,
                    hidden,
                    indexed: chrono::Utc::now().timestamp(),
                };

                if let Ok(conn) = init_files_db(app_handle) {
                    let _ = upsert_file(&conn, &entry);
                }

                indexed_files.insert(path);
                count += 1;
            }
        }

        Ok(count)
    }
}
