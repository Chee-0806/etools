//! Browser Cache Database Module
//! Handles SQLite database for browser bookmarks and history
#![allow(dead_code)]

use rusqlite::{Connection, Result as SqliteResult};
use serde::Serialize;

use super::get_browser_db_path;
use tauri::AppHandle;

/// Browser data entry
#[derive(Debug, Clone, Serialize)]
pub struct BrowserEntry {
    pub id: Option<i64>,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub browser: String,
    pub entry_type: String, // "bookmark" or "history"
    pub visit_count: i32,
    pub last_visited: Option<i64>,
    pub folder: Option<String>,
    pub cached: i64,
}

/// Initialize the browser cache database with schema
pub fn init_browser_db(handle: &AppHandle) -> SqliteResult<Connection> {
    let db_path = get_browser_db_path(handle)
        .map_err(|e| rusqlite::Error::InvalidPath(std::path::PathBuf::from(e)))?;

    let conn = Connection::open(&db_path)?;

    // Create browser_data table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS browser_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            favicon TEXT,
            browser TEXT NOT NULL,
            type TEXT NOT NULL,
            visitCount INTEGER DEFAULT 0,
            lastVisited INTEGER,
            folder TEXT,
            cached INTEGER NOT NULL
        )",
        [],
    )?;

    // Create indexes for faster queries
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_url ON browser_data(url)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_title ON browser_data(title)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_browser_type ON browser_data(browser, type)",
        [],
    )?;

    Ok(conn)
}

/// Insert or update a browser entry
pub fn upsert_browser_entry(conn: &Connection, entry: &BrowserEntry) -> SqliteResult<i64> {
    let favicon_ref: Option<&String> = entry.favicon.as_ref();
    let folder_ref: Option<&String> = entry.folder.as_ref();

    conn.execute(
        "INSERT INTO browser_data (url, title, favicon, browser, type, visitCount, lastVisited, folder, cached)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT(url, browser) DO UPDATE SET
            title = ?2,
            favicon = ?3,
            type = ?5,
            visitCount = ?6,
            lastVisited = ?7,
            folder = ?8,
            cached = ?9",
        [
            &entry.url as &dyn rusqlite::ToSql,
            &entry.title as &dyn rusqlite::ToSql,
            &favicon_ref as &dyn rusqlite::ToSql,
            &entry.browser as &dyn rusqlite::ToSql,
            &entry.entry_type as &dyn rusqlite::ToSql,
            &entry.visit_count as &dyn rusqlite::ToSql,
            &entry.last_visited as &dyn rusqlite::ToSql,
            &folder_ref as &dyn rusqlite::ToSql,
            &entry.cached as &dyn rusqlite::ToSql,
        ],
    )?;

    Ok(conn.last_insert_rowid())
}

/// Search browser data by title or URL
pub fn search_browser_data(
    conn: &Connection,
    query: &str,
    limit: usize,
) -> SqliteResult<Vec<BrowserEntry>> {
    let pattern = format!("%{}%", query);
    let limit_i64 = limit as i64;

    conn.prepare(
        "SELECT id, url, title, favicon, browser, type, visitCount, lastVisited, folder, cached
         FROM browser_data
         WHERE title LIKE ?1 OR url LIKE ?1
         ORDER BY visitCount DESC, lastVisited DESC
         LIMIT ?2"
    )?
    .query_map([&pattern as &dyn rusqlite::ToSql, &limit_i64 as &dyn rusqlite::ToSql], |row| {
        Ok(BrowserEntry {
            id: Some(row.get(0)?),
            url: row.get(1)?,
            title: row.get(2)?,
            favicon: row.get(3)?,
            browser: row.get(4)?,
            entry_type: row.get(5)?,
            visit_count: row.get(6)?,
            last_visited: row.get(7)?,
            folder: row.get(8)?,
            cached: row.get(9)?,
        })
    })?
    .collect()
}

/// Get browser cache statistics
pub fn get_cache_stats(conn: &Connection) -> SqliteResult<BrowserCacheStats> {
    let bookmarks: i64 = conn.query_row(
        "SELECT COUNT(*) FROM browser_data WHERE type = 'bookmark'",
        [],
        |row| row.get(0),
    )?;
    let history: i64 = conn.query_row(
        "SELECT COUNT(*) FROM browser_data WHERE type = 'history'",
        [],
        |row| row.get(0),
    )?;

    Ok(BrowserCacheStats {
        bookmarks: bookmarks as usize,
        history: history as usize,
    })
}

/// Browser cache statistics
#[derive(Debug, Clone, Serialize)]
pub struct BrowserCacheStats {
    pub bookmarks: usize,
    pub history: usize,
}
