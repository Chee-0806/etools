//! Marketplace Commands
//! Tauri commands for plugin marketplace operations
#![allow(unused_variables)]

use crate::services::marketplace_service::MarketplaceService;
use crate::models::plugin::*;
use tauri::AppHandle;
use std::sync::Mutex;

// Lazy static marketplace service
use std::sync::OnceLock;

static MARKETPLACE_SERVICE: OnceLock<Mutex<MarketplaceService>> = OnceLock::new();

fn get_marketplace_service() -> &'static Mutex<MarketplaceService> {
    MARKETPLACE_SERVICE.get_or_init(|| Mutex::new(MarketplaceService::new()))
}

/// List marketplace plugins with pagination and filters
#[tauri::command]
pub fn marketplace_list(
    category: Option<String>,
    page: u32,
    page_size: u32,
    handle: AppHandle,
) -> Result<MarketplacePluginPage, String> {
    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    let category_ref = category.as_deref();
    service.list_plugins(category_ref, page, page_size, &handle)
}

/// Search marketplace plugins
#[tauri::command]
pub fn marketplace_search(
    query: String,
    category: Option<String>,
    page: u32,
    page_size: u32,
    handle: AppHandle,
) -> Result<MarketplacePluginPage, String> {
    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    let category_ref = category.as_deref();
    service.search_plugins(&query, category_ref, page, page_size, &handle)
}

/// Install a plugin from marketplace
#[tauri::command]
pub fn marketplace_install(
    plugin_id: String,
    handle: AppHandle,
) -> Result<Plugin, String> {
    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    service.install_plugin(&plugin_id, &handle)
}

/// Check for plugin updates
#[tauri::command]
pub fn marketplace_check_updates(
    handle: AppHandle,
) -> Result<Vec<String>, String> {
    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    service.check_updates(&handle)
}

/// Get plugin details from marketplace
#[tauri::command]
pub fn marketplace_get_plugin(
    plugin_id: String,
    handle: AppHandle,
) -> Result<MarketplacePlugin, String> {
    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    // Get mock plugins and find the requested one
    let plugins = service.get_mock_plugins();
    plugins
        .into_iter()
        .find(|p| p.id == plugin_id)
        .ok_or_else(|| format!("Plugin not found: {}", plugin_id))
}

/// Submit plugin rating
#[tauri::command]
pub fn marketplace_submit_rating(
    plugin_id: String,
    rating: f64,
    comment: Option<String>,
    _handle: AppHandle,
) -> Result<(), String> {
    // TODO: Implement rating submission to marketplace API
    println!(
        "Rating submitted for {}: {} stars, comment: {:?}",
        plugin_id, rating, comment
    );
    Ok(())
}

/// Report plugin issue
#[tauri::command]
pub fn marketplace_report_issue(
    plugin_id: String,
    issue_type: String,
    description: String,
    _handle: AppHandle,
) -> Result<(), String> {
    // TODO: Implement issue reporting to marketplace API
    println!(
        "Issue reported for {}: type={}, description={}",
        plugin_id, issue_type, description
    );
    Ok(())
}
