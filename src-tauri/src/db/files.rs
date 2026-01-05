//! File Index Database Module
//! Handles SQLite database for local file indexing
#![allow(dead_code)]

use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;

use super::get_files_db_path;
use tauri::AppHandle;

/// File index entry
#[derive(Debug, Clone)]
pub struct FileEntry {
    pub id: Option<i64>,
    pub path: String,
    pub filename: String,
    pub extension: Option<String>,
    pub size: i64,
    pub modified: i64,
    pub hidden: bool,
    pub indexed: i64,
}

/// Initialize the files database with schema
pub fn init_files_db(handle: &AppHandle) -> SqliteResult<Connection> {
    let db_path = get_files_db_path(handle)
        .map_err(|e| rusqlite::Error::InvalidPath(PathBuf::from(e)))?;

    let conn = Connection::open(&db_path)?;

    // Create files table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE NOT NULL,
            filename TEXT NOT NULL,
            extension TEXT,
            size INTEGER NOT NULL,
            modified INTEGER NOT NULL,
            hidden BOOLEAN DEFAULT 0,
            indexed INTEGER NOT NULL
        )",
        [],
    )?;

    // Create indexes for faster queries
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_filename ON files(filename)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_extension ON files(extension)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_path ON files(path)",
        [],
    )?;

    Ok(conn)
}

/// Insert or update a file entry
pub fn upsert_file(conn: &Connection, entry: &FileEntry) -> SqliteResult<i64> {
    let hidden_val: i64 = if entry.hidden { 1 } else { 0 };
    let extension_ref: Option<&String> = entry.extension.as_ref();

    conn.execute(
        "INSERT INTO files (path, filename, extension, size, modified, hidden, indexed)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(path) DO UPDATE SET
            filename = ?2,
            extension = ?3,
            size = ?4,
            modified = ?5,
            hidden = ?6,
            indexed = ?7",
        [
            &entry.path as &dyn rusqlite::ToSql,
            &entry.filename as &dyn rusqlite::ToSql,
            &extension_ref as &dyn rusqlite::ToSql,
            &entry.size as &dyn rusqlite::ToSql,
            &entry.modified as &dyn rusqlite::ToSql,
            &hidden_val as &dyn rusqlite::ToSql,
            &entry.indexed as &dyn rusqlite::ToSql,
        ],
    )?;

    Ok(conn.last_insert_rowid())
}

/// Search files by name
pub fn search_files(
    conn: &Connection,
    query: &str,
    limit: usize,
) -> SqliteResult<Vec<FileEntry>> {
    let pattern = format!("%{}%", query);
    let limit_i64 = limit as i64;

    conn.prepare(
        "SELECT id, path, filename, extension, size, modified, hidden, indexed
         FROM files
         WHERE filename LIKE ?1
         ORDER BY filename ASC
         LIMIT ?2"
    )?
    .query_map([&pattern as &dyn rusqlite::ToSql, &limit_i64 as &dyn rusqlite::ToSql], |row| {
        Ok(FileEntry {
            id: Some(row.get(0)?),
            path: row.get(1)?,
            filename: row.get(2)?,
            extension: row.get(3)?,
            size: row.get(4)?,
            modified: row.get(5)?,
            hidden: row.get(6)?,
            indexed: row.get(7)?,
        })
    })?
    .collect()
}

/// Delete a file entry
pub fn delete_file(conn: &Connection, path: &str) -> SqliteResult<()> {
    conn.execute("DELETE FROM files WHERE path = ?1", [path])?;
    Ok(())
}

/// Get file index statistics
pub fn get_index_stats(conn: &Connection) -> SqliteResult<FileIndexStats> {
    let total_files: i64 = conn.query_row("SELECT COUNT(*) FROM files", [], |row| row.get(0))?;
    let total_size: i64 = conn.query_row("SELECT SUM(size) FROM files", [], |row| row.get(0)).unwrap_or(0);

    Ok(FileIndexStats {
        total_files: total_files as usize,
        total_size,
    })
}

/// File index statistics
#[derive(Debug, Clone)]
pub struct FileIndexStats {
    pub total_files: usize,
    pub total_size: i64,
}
