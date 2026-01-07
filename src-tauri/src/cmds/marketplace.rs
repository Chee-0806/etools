//! NPM-based Marketplace Commands
//! Tauri commands for npm-based plugin marketplace operations

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

/// List marketplace plugins from npm registry
#[tauri::command]
pub fn marketplace_list(
    category: Option<String>,
    page: u32,
    page_size: u32,
    handle: AppHandle,
) -> Result<MarketplacePluginPage, String> {
    println!("[Marketplace] Listing plugins - category: {:?}, page: {}", category, page);

    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    let category_ref = category.as_deref();
    service.list_plugins(category_ref, page, page_size, &handle)
}

/// Search marketplace plugins on npm
#[tauri::command]
pub fn marketplace_search(
    query: String,
    category: Option<String>,
    page: u32,
    page_size: u32,
    handle: AppHandle,
) -> Result<MarketplacePluginPage, String> {
    println!("[Marketplace] Searching plugins - query: {}, category: {:?}", query, category);

    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    let category_ref = category.as_deref();
    service.search_plugins(&query, category_ref, page, page_size, &handle)
}

/// Install a plugin from npm
///
/// @param package_name - npm package name (e.g., "@etools-plugin/hello")
#[tauri::command]
pub fn marketplace_install(
    package_name: String,
    handle: AppHandle,
) -> Result<Plugin, String> {
    println!("[Marketplace] Installing plugin: {}", package_name);

    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    service.install_plugin(&package_name, &handle)
}

/// Uninstall a plugin using npm
///
/// @param package_name - npm package name to uninstall
#[tauri::command]
pub fn marketplace_uninstall(
    package_name: String,
    handle: AppHandle,
) -> Result<(), String> {
    println!("[Marketplace] Uninstalling plugin: {}", package_name);

    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    service.uninstall_plugin(&package_name, &handle)
}

/// Update a plugin using npm
///
/// @param package_name - npm package name to update
#[tauri::command]
pub fn marketplace_update(
    package_name: String,
    handle: AppHandle,
) -> Result<Plugin, String> {
    println!("[Marketplace] Updating plugin: {}", package_name);

    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    service.update_plugin(&package_name, &handle)
}

/// Check for plugin updates
#[tauri::command]
pub fn marketplace_check_updates(
    handle: AppHandle,
) -> Result<Vec<String>, String> {
    println!("[Marketplace] Checking for updates");

    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    service.check_updates(&handle)
}

/// Get plugin details from npm registry
#[tauri::command]
pub fn marketplace_get_plugin(
    package_name: String,
    handle: AppHandle,
) -> Result<MarketplacePlugin, String> {
    println!("[Marketplace] Getting plugin details: {}", package_name);

    let service = get_marketplace_service()
        .lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    // Search for the specific package
    let result = service.search_plugins(&package_name, None, 1, 1, &handle)?;

    result.plugins
        .into_iter()
        .find(|p| p.id == package_name)
        .ok_or_else(|| format!("Plugin not found: {}", package_name))
}

/// Get installed npm plugins
/// Returns a list of plugins installed from npm marketplace
#[tauri::command]
pub fn get_installed_plugins(handle: AppHandle) -> Result<Vec<Plugin>, String> {
    println!("[Marketplace] ===== get_installed_plugins command called =====");

    let service = get_marketplace_service()
        .lock()
        .map_err(|e| {
            println!("[Marketplace] Failed to acquire lock: {}", e);
            format!("Failed to acquire lock: {}", e)
        })?;

    println!("[Marketplace] Calling list_installed_plugins...");
    let result = service.list_installed_plugins(&handle);

    match &result {
        Ok(plugins) => println!("[Marketplace] Successfully retrieved {} plugins", plugins.len()),
        Err(e) => println!("[Marketplace] Error retrieving plugins: {}", e),
    }

    result
}
