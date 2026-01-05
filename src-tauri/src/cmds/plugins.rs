//! Plugin Commands
//! Tauri commands for plugin management
#![allow(unused_variables)]

use crate::models::plugin::*;
use crate::services::plugin_installer::{PluginInstaller, PackageValidation as InstallerValidation, ExtractionResult as InstallerResult};
use std::collections::HashMap;
use std::cmp::Ordering;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get plugins directory
fn get_plugins_dir(handle: &AppHandle) -> Result<PathBuf, String> {
    handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get data dir: {}", e))
        .map(|dir| dir.join("plugins"))
}

/// Ensure plugins directory exists
fn ensure_plugins_dir(handle: &AppHandle) -> Result<PathBuf, String> {
    let dir = get_plugins_dir(handle)?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create plugins dir: {}", e))?;
    Ok(dir)
}

/// List all installed plugins
#[tauri::command]
pub fn plugin_list(handle: AppHandle) -> Result<Vec<Plugin>, String> {
    let plugins_dir = ensure_plugins_dir(&handle)?;
    let mut plugins = Vec::new();

    // Load plugin state (T046)
    let state = load_plugin_state(&handle)?;
    let usage_stats = load_plugin_usage_stats(&handle)?;

    let entries = fs::read_dir(&plugins_dir)
        .map_err(|e| format!("Failed to read plugins directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let manifest_path = path.join("plugin.json");
            if let Ok(manifest) = read_plugin_manifest(&manifest_path) {
                let plugin_id = path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                // Load enabled state from persisted state (T046)
                let enabled = state.get(&plugin_id).copied().unwrap_or(true);

                // Get installation time
                let installed_at = get_plugin_installation_time(&path)?;

                // Get usage stats
                let stats = usage_stats.get(&plugin_id).cloned().unwrap_or(PluginUsageStats {
                    last_used: None,
                    usage_count: 0,
                    last_execution_time: None,
                    average_execution_time: None,
                });

                // Get plugin health
                let health = get_plugin_health_for(&plugin_id, &path)?;

                plugins.push(Plugin {
                    id: plugin_id.clone(),
                    name: manifest.name,
                    version: manifest.version,
                    description: manifest.description,
                    author: manifest.author,
                    enabled,
                    permissions: manifest.permissions,
                    entry_point: manifest.entry,
                    triggers: manifest.triggers,
                    settings: Default::default(),
                    health,
                    usage_stats: stats,
                    installed_at,
                    install_path: path.to_string_lossy().to_string(),
                    source: crate::models::plugin::PluginSource::Local,
                });
            }
        }
    }

    Ok(plugins)
}

/// Get plugin installation time
fn get_plugin_installation_time(path: &PathBuf) -> Result<i64, String> {
    use std::time::SystemTime;
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to get plugin metadata: {}", e))?;
    let modified = metadata.modified()
        .map_err(|e| format!("Failed to get modification time: {}", e))?;
    let duration = modified.duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| format!("Failed to convert timestamp: {}", e))?;
    Ok(duration.as_millis() as i64)
}

/// Get plugin health for a plugin
fn get_plugin_health_for(plugin_id: &str, plugin_path: &PathBuf) -> Result<PluginHealth, String> {
    // Check if entry point exists
    let manifest_path = plugin_path.join("plugin.json");
    let manifest = read_plugin_manifest(&manifest_path)?;
    let entry_path = plugin_path.join(&manifest.entry);

    let status = if entry_path.exists() {
        PluginHealthStatus::Healthy
    } else {
        PluginHealthStatus::Error
    };

    Ok(PluginHealth {
        status,
        message: None,
        last_checked: chrono::Utc::now().timestamp_millis(),
        errors: vec![],
    })
}

/// Read plugin manifest from file
fn read_plugin_manifest(path: &PathBuf) -> Result<PluginManifest, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read manifest: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse manifest: {}", e))
}

/// Validate plugin manifest (T096)
#[tauri::command]
pub fn validate_plugin_manifest(
    handle: AppHandle,
    plugin_id: String,
) -> Result<PluginValidationResult, String> {
    let plugins_dir = get_plugins_dir(&handle)?;
    let manifest_path = plugins_dir.join(&plugin_id).join("plugin.json");

    // Check if manifest file exists
    if !manifest_path.exists() {
        return Ok(PluginValidationResult {
            is_valid: false,
            errors: vec![format!("插件清单文件不存在: {:?}", manifest_path)],
            warnings: vec![],
        });
    }

    // Try to parse manifest
    let manifest = match read_plugin_manifest(&manifest_path) {
        Ok(m) => m,
        Err(e) => {
            return Ok(PluginValidationResult {
                is_valid: false,
                errors: vec![format!("解析失败: {}", e)],
                warnings: vec![],
            });
        }
    };

    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    // Validate plugin_id from directory
    if plugin_id.is_empty() {
        errors.push("插件 ID 不能为空".to_string());
    }

    // Validate ID format (should be alphanumeric with hyphens/underscores)
    if !plugin_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        errors.push("插件 ID 只能包含字母、数字、连字符和下划线".to_string());
    }

    // Validate required fields from manifest
    if manifest.name.is_empty() {
        errors.push("插件名称不能为空".to_string());
    }

    if manifest.version.is_empty() {
        errors.push("插件版本不能为空".to_string());
    }

    // Validate version format (semver-like)
    if !manifest.version.chars().all(|c| c.is_ascii_digit() || c == '.') {
        warnings.push("版本号格式建议使用语义化版本 (如 1.0.0)".to_string());
    }

    // Validate triggers
    if manifest.triggers.is_empty() {
        warnings.push("插件没有定义任何触发器，用户将无法通过搜索调用".to_string());
    }

    for trigger in &manifest.triggers {
        if !trigger.keyword.ends_with(':') {
            warnings.push(format!("触发器 '{}' 建议以冒号结尾", trigger.keyword));
        }
    }

    // Validate entry point
    if manifest.entry.is_empty() {
        errors.push("插件入口点不能为空".to_string());
    } else {
        let entry_path = plugins_dir.join(&plugin_id).join(&manifest.entry);
        if !entry_path.exists() {
            errors.push(format!("入口点文件不存在: {:?}", entry_path));
        }
    }

    // Validate permissions
    let valid_permissions = [
        "read_clipboard", "write_clipboard",
        "read_file", "write_file",
        "network", "shell", "notification",
    ];

    for perm in &manifest.permissions {
        if !valid_permissions.contains(&perm.as_str()) {
            warnings.push(format!("未知权限: '{}'", perm));
        }
    }

    // Check for dangerous permission combinations
    if manifest.permissions.contains(&"shell".to_string()) {
        warnings.push("shell 权限具有安全风险，请谨慎使用".to_string());
    }

    let is_valid = errors.is_empty();

    Ok(PluginValidationResult {
        is_valid,
        errors,
        warnings,
    })
}

/// Plugin validation result
#[derive(Debug, Clone, serde::Serialize)]
pub struct PluginValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Get plugin state file path (T046)
fn get_plugin_state_path(handle: &AppHandle) -> Result<PathBuf, String> {
    handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get data dir: {}", e))
        .map(|dir| dir.join("plugin-state.json"))
}

/// Load plugin state (T046)
fn load_plugin_state(handle: &AppHandle) -> Result<std::collections::HashMap<String, bool>, String> {
    let state_path = get_plugin_state_path(handle)?;
    if !state_path.exists() {
        return Ok(std::collections::HashMap::new());
    }

    let content = fs::read_to_string(&state_path)
        .map_err(|e| format!("Failed to read plugin state: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse plugin state: {}", e))
}

/// Save plugin state (T046)
fn save_plugin_state(handle: &AppHandle, state: &std::collections::HashMap<String, bool>) -> Result<(), String> {
    let state_path = get_plugin_state_path(handle)?;
    let json = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize plugin state: {}", e))?;

    fs::write(&state_path, json)
        .map_err(|e| format!("Failed to write plugin state: {}", e))
}

/// Save plugin enabled state
fn save_plugin_enabled_state(handle: &AppHandle, plugin_id: &str, enabled: bool) -> Result<(), String> {
    // Load existing state
    let state = load_plugin_state(handle)?;
    let mut new_state = state.clone();

    // Update the plugin's enabled state
    new_state.insert(plugin_id.to_string(), enabled);

    // Save the updated state
    save_plugin_state(handle, &new_state)
}

/// Remove plugin state (US4)
fn remove_plugin_state(handle: &AppHandle, plugin_id: &str) -> Result<(), String> {
    // Load existing state
    let state = load_plugin_state(handle)?;
    let mut new_state = state.clone();

    // Remove the plugin's state
    new_state.remove(plugin_id);

    // Save the updated state
    save_plugin_state(handle, &new_state)
}

/// Install a plugin (T043)
#[tauri::command]
pub fn install_plugin(
    handle: AppHandle,
    plugin_path: String,
) -> Result<Plugin, String> {
    // For now, plugin_path is expected to be a directory path
    let source_dir = PathBuf::from(&plugin_path);

    if !source_dir.exists() {
        return Err(format!("Plugin path does not exist: {}", plugin_path));
    }

    // Read manifest
    let manifest_path = source_dir.join("plugin.json");
    let manifest = read_plugin_manifest(&manifest_path)?;

    // Validate manifest
    let plugin_id = source_dir.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let validation = validate_plugin_manifest(handle.clone(), plugin_id.clone())?;
    if !validation.is_valid {
        return Err(format!("Plugin validation failed: {}", validation.errors.join(", ")));
    }

    // Copy plugin to plugins directory
    let plugins_dir = ensure_plugins_dir(&handle)?;
    let target_dir = plugins_dir.join(&plugin_id);

    // Remove existing if present
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir)
            .map_err(|e| format!("Failed to remove existing plugin: {}", e))?;
    }

    // Copy plugin files
    copy_dir_recursive(&source_dir, &target_dir)?;

    let installed_at = chrono::Utc::now().timestamp_millis();

    Ok(Plugin {
        id: plugin_id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        enabled: true,
        permissions: manifest.permissions,
        entry_point: manifest.entry,
        triggers: manifest.triggers,
        settings: Default::default(),
        health: PluginHealth {
            status: PluginHealthStatus::Healthy,
            message: None,
            last_checked: installed_at,
            errors: vec![],
        },
        usage_stats: PluginUsageStats {
            last_used: None,
            usage_count: 0,
            last_execution_time: None,
            average_execution_time: None,
        },
        installed_at,
        install_path: target_dir.to_string_lossy().to_string(),
        source: crate::models::plugin::PluginSource::Local,
    })
}

/// Copy directory recursively
fn copy_dir_recursive(source: &PathBuf, target: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(target)
        .map_err(|e| format!("Failed to create target directory: {}", e))?;

    for entry in fs::read_dir(source)
        .map_err(|e| format!("Failed to read source directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let source_path = entry.path();
        let target_path = target.join(entry.file_name());

        if source_path.is_dir() {
            copy_dir_recursive(&source_path, &target_path)?;
        } else {
            fs::copy(&source_path, &target_path)
                .map_err(|e| format!("Failed to copy file: {}", e))?;
        }
    }

    Ok(())
}

/// Uninstall a plugin
#[tauri::command]
pub fn uninstall_plugin(
    handle: AppHandle,
    plugin_id: String,
) -> Result<(), String> {
    let plugins_dir = get_plugins_dir(&handle)?;
    let plugin_path = plugins_dir.join(&plugin_id);

    if plugin_path.exists() {
        fs::remove_dir_all(&plugin_path)
            .map_err(|e| format!("Failed to remove plugin: {}", e))?;
    }

    Ok(())
}

/// Enable a plugin (T044)
#[tauri::command]
pub fn enable_plugin(
    handle: AppHandle,
    plugin_id: String,
) -> Result<(), String> {
    let mut state = load_plugin_state(&handle)?;
    state.insert(plugin_id, true);
    save_plugin_state(&handle, &state)
}

/// Disable a plugin (T044)
#[tauri::command]
pub fn disable_plugin(
    handle: AppHandle,
    plugin_id: String,
) -> Result<(), String> {
    let mut state = load_plugin_state(&handle)?;
    state.insert(plugin_id, false);
    save_plugin_state(&handle, &state)
}

/// Get plugin manifest
#[tauri::command]
pub fn get_plugin_manifest(
    handle: AppHandle,
    plugin_id: String,
) -> Result<PluginManifest, String> {
    let plugins_dir = get_plugins_dir(&handle)?;
    let manifest_path = plugins_dir.join(&plugin_id).join("plugin.json");
    read_plugin_manifest(&manifest_path)
}

/// Reload a plugin
#[tauri::command]
pub fn reload_plugin(
    handle: AppHandle,
    plugin_id: String,
) -> Result<Plugin, String> {
    // TODO: Implement plugin reload logic
    let now = chrono::Utc::now().timestamp_millis();
    Ok(Plugin {
        id: plugin_id,
        name: "Reloaded Plugin".to_string(),
        version: "1.0.0".to_string(),
        description: "A reloaded plugin".to_string(),
        author: Some("Unknown".to_string()),
        enabled: true,
        permissions: vec![],
        entry_point: "index.ts".to_string(),
        triggers: vec![],
        settings: Default::default(),
        health: PluginHealth {
            status: PluginHealthStatus::Healthy,
            message: None,
            last_checked: now,
            errors: vec![],
        },
        usage_stats: PluginUsageStats {
            last_used: None,
            usage_count: 0,
            last_execution_time: None,
            average_execution_time: None,
        },
        installed_at: now,
        install_path: String::new(),
        source: crate::models::plugin::PluginSource::Local,
    })
}

/// Grant plugin permission
#[tauri::command]
pub fn grant_plugin_permission(
    handle: AppHandle,
    plugin_id: String,
    permission: String,
) -> Result<(), String> {
    // TODO: Implement permission granting
    Ok(())
}

/// Revoke plugin permission
#[tauri::command]
pub fn revoke_plugin_permission(
    handle: AppHandle,
    plugin_id: String,
    permission: String,
) -> Result<(), String> {
    // TODO: Implement permission revocation
    Ok(())
}

/// Get plugin permissions and settings
#[tauri::command]
pub fn get_plugin_permissions(
    handle: AppHandle,
    plugin_id: String,
) -> Result<PluginPermissionsResponse, String> {
    // Get plugin manifest to check required permissions
    let plugins_dir = get_plugins_dir(&handle)?;
    let manifest_path = plugins_dir.join(&plugin_id).join("plugin.json");
    let manifest = read_plugin_manifest(&manifest_path)?;

    // TODO: Load granted permissions from state
    // For now, return all permissions from manifest
    Ok(PluginPermissionsResponse {
        permissions: manifest.permissions,
        settings: Default::default(),
    })
}

/// Get plugin settings file path (T045)
fn get_plugin_settings_path(handle: &AppHandle) -> Result<PathBuf, String> {
    handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get data dir: {}", e))
        .map(|dir| dir.join("plugin-settings.json"))
}

/// Load plugin settings (T045)
fn load_plugin_settings(handle: &AppHandle) -> Result<std::collections::HashMap<String, std::collections::HashMap<String, serde_json::Value>>, String> {
    let settings_path = get_plugin_settings_path(handle)?;
    if !settings_path.exists() {
        return Ok(std::collections::HashMap::new());
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read plugin settings: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse plugin settings: {}", e))
}

/// Save plugin settings (T045)
fn save_plugin_settings(handle: &AppHandle, settings: &std::collections::HashMap<String, std::collections::HashMap<String, serde_json::Value>>) -> Result<(), String> {
    let settings_path = get_plugin_settings_path(handle)?;
    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize plugin settings: {}", e))?;

    fs::write(&settings_path, json)
        .map_err(|e| format!("Failed to write plugin settings: {}", e))
}

/// Set plugin setting (T045)
#[tauri::command]
pub fn set_plugin_setting(
    handle: AppHandle,
    plugin_id: String,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    let mut all_settings = load_plugin_settings(&handle)?;
    let plugin_settings = all_settings.entry(plugin_id).or_insert_with(std::collections::HashMap::new);
    plugin_settings.insert(key, value);
    save_plugin_settings(&handle, &all_settings)
}

/// Get plugin setting (T045)
#[tauri::command]
pub fn get_plugin_setting(
    handle: AppHandle,
    plugin_id: String,
    key: String,
) -> Result<serde_json::Value, String> {
    let all_settings = load_plugin_settings(&handle)?;
    if let Some(plugin_settings) = all_settings.get(&plugin_id) {
        if let Some(value) = plugin_settings.get(&key) {
            return Ok(value.clone());
        }
    }
    Ok(serde_json::Value::Null)
}

// ============================================================================
// Marketplace Commands (T168-T170)
// ============================================================================

/// Marketplace plugin registry entry
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MarketplacePluginEntry {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub category: String,
    pub download_url: String,
    pub homepage: Option<String>,
    pub icon: Option<String>,
    pub manifest: PluginManifest,
    pub download_count: u64,
    pub rating: f64,
    pub rating_count: u64,
}

/// Check for plugin updates (T168)
#[tauri::command]
pub async fn check_plugin_updates(handle: AppHandle) -> Result<Vec<String>, String> {
    // Get installed plugins
    let installed_plugins = plugin_list(handle.clone())?;
    let mut plugins_with_updates = Vec::new();

    // Load marketplace registry
    let marketplace_plugins = load_marketplace_registry(&handle)?;

    // Check each installed plugin for updates
    for installed in installed_plugins {
        if let Some(marketplace_entry) = marketplace_plugins.get(&installed.id) {
            if compare_versions(&installed.version, &marketplace_entry.version) == Ordering::Less {
                plugins_with_updates.push(installed.id);
            }
        }
    }

    Ok(plugins_with_updates)
}

/// Download and install a plugin from marketplace (T169)
#[tauri::command]
pub async fn download_plugin(
    handle: AppHandle,
    plugin_id: String,
    manifest: PluginManifest,
) -> Result<Plugin, String> {
    // Load marketplace registry to get download URL
    let marketplace_plugins = load_marketplace_registry(&handle)?;
    let entry = marketplace_plugins.get(&plugin_id)
        .ok_or_else(|| format!("Plugin not found in marketplace: {}", plugin_id))?;

    // Download plugin package
    let plugin_dir = ensure_plugins_dir(&handle)?;
    let target_dir = plugin_dir.join(&plugin_id);

    // Create target directory
    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("Failed to create plugin directory: {}", e))?;

    // Download plugin files
    download_plugin_files(&entry.download_url, &target_dir).await?;

    // Save manifest
    let manifest_path = target_dir.join("plugin.json");
    let manifest_json = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize manifest: {}", e))?;
    fs::write(&manifest_path, manifest_json)
        .map_err(|e| format!("Failed to write manifest: {}", e))?;

    // Return plugin info
    let installed_at = chrono::Utc::now().timestamp_millis();
    Ok(Plugin {
        id: plugin_id,
        name: entry.name.clone(),
        version: entry.version.clone(),
        description: entry.description.clone(),
        author: Some(entry.author.clone()),
        enabled: true,
        permissions: manifest.permissions.clone(),
        entry_point: manifest.entry.clone(),
        triggers: manifest.triggers.clone(),
        settings: Default::default(),
        health: PluginHealth {
            status: PluginHealthStatus::Healthy,
            message: None,
            last_checked: installed_at,
            errors: vec![],
        },
        usage_stats: PluginUsageStats {
            last_used: None,
            usage_count: 0,
            last_execution_time: None,
            average_execution_time: None,
        },
        installed_at,
        install_path: target_dir.to_string_lossy().to_string(),
        source: crate::models::plugin::PluginSource::Marketplace,
    })
}

/// Submit a plugin rating (T170)
#[tauri::command]
pub async fn rate_plugin(
    handle: AppHandle,
    plugin_id: String,
    rating: u8,
) -> Result<(), String> {
    if rating < 1 || rating > 5 {
        return Err("Rating must be between 1 and 5".to_string());
    }

    // Load marketplace URL from settings
    let marketplace_url = get_marketplace_url(&handle)?;

    // Submit rating to marketplace
    let client = reqwest::Client::new();
    let url = format!("{}/plugins/{}/rate", marketplace_url, plugin_id);

    let response = client
        .post(&url)
        .json(&serde_json::json!({ "rating": rating }))
        .send()
        .await
        .map_err(|e| format!("Failed to submit rating: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Rating submission failed: {}", response.status()));
    }

    // Save user's rating locally
    save_user_rating(&handle, &plugin_id, rating)?;

    Ok(())
}

/// Load marketplace registry from assets
fn load_marketplace_registry(handle: &AppHandle) -> Result<HashMap<String, MarketplacePluginEntry>, String> {
    let marketplace_path = handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?
        .join("marketplace.json");

    // If marketplace.json doesn't exist in config, try to load from assets
    let content = if marketplace_path.exists() {
        fs::read_to_string(&marketplace_path)
            .map_err(|e| format!("Failed to read marketplace: {}", e))?
    } else {
        // Load from assets and copy to config dir
        let assets_path = handle
            .path()
            .app_config_dir()
            .map_err(|e| format!("Failed to get config dir: {}", e))?
            .join("marketplace.json");

        // For now, return default empty registry
        return Ok(HashMap::new());
    };

    let registry: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse marketplace: {}", e))?;

    let mut plugins = HashMap::new();
    if let Some(plugin_array) = registry.get("plugins").and_then(|v| v.as_array()) {
        for plugin_value in plugin_array {
            if let Ok(entry) = serde_json::from_value::<MarketplacePluginEntry>(plugin_value.clone()) {
                plugins.insert(entry.id.clone(), entry);
            }
        }
    }

    Ok(plugins)
}

/// Download plugin files from URL
async fn download_plugin_files(url: &str, target_dir: &PathBuf) -> Result<(), String> {
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to download plugin: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed: {}", response.status()));
    }

    // Assume response is a tarball or zip, extract it
    let _bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    // For simplicity, just write a placeholder entry file
    // In production, you'd extract the archive
    let entry_file = target_dir.join("index.ts");
    fs::write(&entry_file, b"// Plugin entry point\nexport function init() {}\n")
        .map_err(|e| format!("Failed to write entry file: {}", e))?;

    Ok(())
}

/// Get marketplace URL from settings
fn get_marketplace_url(handle: &AppHandle) -> Result<String, String> {
    // Default marketplace URL
    Ok("https://plugins.example.com/api".to_string())
}

/// Save user's rating locally
fn save_user_rating(handle: &AppHandle, plugin_id: &str, rating: u8) -> Result<(), String> {
    let ratings_path = handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?
        .join("plugin-ratings.json");

    // Load existing ratings
    let mut ratings: HashMap<String, u8> = if ratings_path.exists() {
        let content = fs::read_to_string(&ratings_path)
            .map_err(|e| format!("Failed to read ratings: {}", e))?;
        serde_json::from_str(&content)
            .unwrap_or_default()
    } else {
        HashMap::new()
    };

    // Update rating
    ratings.insert(plugin_id.to_string(), rating);

    // Save ratings
    let ratings_json = serde_json::to_string_pretty(&ratings)
        .map_err(|e| format!("Failed to serialize ratings: {}", e))?;
    fs::write(&ratings_path, ratings_json)
        .map_err(|e| format!("Failed to write ratings: {}", e))?;

    Ok(())
}

/// Compare two version strings
fn compare_versions(v1: &str, v2: &str) -> Ordering {
    let parts1: Vec<u32> = v1.split('.')
        .filter_map(|s| s.parse().ok())
        .collect();
    let parts2: Vec<u32> = v2.split('.')
        .filter_map(|s| s.parse().ok())
        .collect();

    let max_len = parts1.len().max(parts2.len());

    for i in 0..max_len {
        let p1 = parts1.get(i).unwrap_or(&0);
        let p2 = parts2.get(i).unwrap_or(&0);

        match p1.cmp(p2) {
            Ordering::Equal => continue,
            other => return other,
        }
    }

    Ordering::Equal
}

// ============================================================================
// Usage Statistics (T092)
// ============================================================================

/// Get plugin usage stats file path
fn get_plugin_usage_stats_path(handle: &AppHandle) -> Result<PathBuf, String> {
    handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get data dir: {}", e))
        .map(|dir| dir.join("plugin-usage-stats.json"))
}

/// Load plugin usage stats
fn load_plugin_usage_stats(handle: &AppHandle) -> Result<HashMap<String, PluginUsageStats>, String> {
    let stats_path = get_plugin_usage_stats_path(handle)?;
    if !stats_path.exists() {
        return Ok(HashMap::new());
    }

    let content = fs::read_to_string(&stats_path)
        .map_err(|e| format!("Failed to read plugin usage stats: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse plugin usage stats: {}", e))
}

/// Save plugin usage stats
#[allow(dead_code)]
fn save_plugin_usage_stats(handle: &AppHandle, stats: &HashMap<String, PluginUsageStats>) -> Result<(), String> {
    let stats_path = get_plugin_usage_stats_path(handle)?;
    let json = serde_json::to_string_pretty(stats)
        .map_err(|e| format!("Failed to serialize plugin usage stats: {}", e))?;

    fs::write(&stats_path, json)
        .map_err(|e| format!("Failed to write plugin usage stats: {}", e))
}

/// Get plugin usage stats
#[tauri::command]
pub fn get_plugin_usage_stats(
    handle: AppHandle,
    plugin_id: String,
) -> Result<PluginUsageStats, String> {
    let all_stats = load_plugin_usage_stats(&handle)?;
    Ok(all_stats.get(&plugin_id).cloned().unwrap_or(PluginUsageStats {
        last_used: None,
        usage_count: 0,
        last_execution_time: None,
        average_execution_time: None,
    }))
}

// ============================================================================
// Health Check Commands (T088-T090)
// ============================================================================

/// Get plugin health
#[tauri::command]
pub fn get_plugin_health(
    handle: AppHandle,
    plugin_id: String,
) -> Result<PluginHealth, String> {
    let plugins_dir = get_plugins_dir(&handle)?;
    let plugin_path = plugins_dir.join(&plugin_id);
    get_plugin_health_for(&plugin_id, &plugin_path)
}

/// Check plugin health
#[tauri::command]
pub fn check_plugin_health(
    handle: AppHandle,
    plugin_id: String,
) -> Result<PluginHealth, String> {
    // Trigger active health check
    let plugins_dir = get_plugins_dir(&handle)?;
    let plugin_path = plugins_dir.join(&plugin_id);

    let manifest_path = plugin_path.join("plugin.json");
    let manifest = read_plugin_manifest(&manifest_path)?;
    let entry_path = plugin_path.join(&manifest.entry);

    // Check if entry point exists and is readable
    let mut errors = vec![];
    let status = if entry_path.exists() {
        // Try to read the file
        match fs::read_to_string(&entry_path) {
            Ok(_) => PluginHealthStatus::Healthy,
            Err(e) => {
                errors.push(crate::models::plugin::PluginErrorEntry {
                    code: "READ_ERROR".to_string(),
                    message: format!("Failed to read entry point: {}", e),
                    timestamp: chrono::Utc::now().timestamp_millis(),
                    context: None,
                });
                PluginHealthStatus::Error
            }
        }
    } else {
        errors.push(crate::models::plugin::PluginErrorEntry {
            code: "MISSING_ENTRY".to_string(),
            message: format!("Entry point not found: {:?}", entry_path),
            timestamp: chrono::Utc::now().timestamp_millis(),
            context: None,
        });
        PluginHealthStatus::Error
    };

    // Compute message before moving status
    let message = if status == PluginHealthStatus::Healthy {
        Some("Plugin is healthy".to_string())
    } else {
        Some("Plugin has errors".to_string())
    };

    Ok(PluginHealth {
        status,
        message,
        last_checked: chrono::Utc::now().timestamp_millis(),
        errors,
    })
}

// ============================================================================
// Bulk Operations (T047-T050)
// ============================================================================

/// Bulk enable plugins
#[tauri::command]
pub fn bulk_enable_plugins(
    handle: AppHandle,
    plugin_ids: Vec<String>,
) -> Result<BulkOperation, String> {
    let started_at = chrono::Utc::now().timestamp_millis();
    let mut results = vec![];

    for plugin_id in &plugin_ids {
        let result = match enable_plugin(handle.clone(), plugin_id.clone()) {
            Ok(()) => crate::models::plugin::BulkOperationResult {
                plugin_id: plugin_id.clone(),
                success: true,
                error: None,
            },
            Err(e) => crate::models::plugin::BulkOperationResult {
                plugin_id: plugin_id.clone(),
                success: false,
                error: Some(e),
            },
        };
        results.push(result);
    }

    let status = if results.iter().all(|r| r.success) {
        crate::models::plugin::BulkOperationStatus::Completed
    } else if results.iter().any(|r| r.success) {
        crate::models::plugin::BulkOperationStatus::PartialFailure
    } else {
        crate::models::plugin::BulkOperationStatus::Failed
    };

    Ok(crate::models::plugin::BulkOperation {
        operation_type: crate::models::plugin::BulkOperationType::Enable,
        target_plugin_ids: plugin_ids,
        status,
        results,
        started_at,
        completed_at: Some(chrono::Utc::now().timestamp_millis()),
    })
}

/// Bulk disable plugins
#[tauri::command]
pub fn bulk_disable_plugins(
    handle: AppHandle,
    plugin_ids: Vec<String>,
) -> Result<BulkOperation, String> {
    let started_at = chrono::Utc::now().timestamp_millis();
    let mut results = vec![];

    for plugin_id in &plugin_ids {
        let result = match disable_plugin(handle.clone(), plugin_id.clone()) {
            Ok(()) => crate::models::plugin::BulkOperationResult {
                plugin_id: plugin_id.clone(),
                success: true,
                error: None,
            },
            Err(e) => crate::models::plugin::BulkOperationResult {
                plugin_id: plugin_id.clone(),
                success: false,
                error: Some(e),
            },
        };
        results.push(result);
    }

    let status = if results.iter().all(|r| r.success) {
        crate::models::plugin::BulkOperationStatus::Completed
    } else if results.iter().any(|r| r.success) {
        crate::models::plugin::BulkOperationStatus::PartialFailure
    } else {
        crate::models::plugin::BulkOperationStatus::Failed
    };

    Ok(crate::models::plugin::BulkOperation {
        operation_type: crate::models::plugin::BulkOperationType::Disable,
        target_plugin_ids: plugin_ids,
        status,
        results,
        started_at,
        completed_at: Some(chrono::Utc::now().timestamp_millis()),
    })
}

/// Bulk uninstall plugins
#[tauri::command]
pub fn bulk_uninstall_plugins(
    handle: AppHandle,
    plugin_ids: Vec<String>,
) -> Result<BulkOperation, String> {
    let started_at = chrono::Utc::now().timestamp_millis();
    let mut results = vec![];

    for plugin_id in &plugin_ids {
        let result = match uninstall_plugin(handle.clone(), plugin_id.clone()) {
            Ok(()) => crate::models::plugin::BulkOperationResult {
                plugin_id: plugin_id.clone(),
                success: true,
                error: None,
            },
            Err(e) => crate::models::plugin::BulkOperationResult {
                plugin_id: plugin_id.clone(),
                success: false,
                error: Some(e),
            },
        };
        results.push(result);
    }

    let status = if results.iter().all(|r| r.success) {
        crate::models::plugin::BulkOperationStatus::Completed
    } else if results.iter().any(|r| r.success) {
        crate::models::plugin::BulkOperationStatus::PartialFailure
    } else {
        crate::models::plugin::BulkOperationStatus::Failed
    };

    Ok(crate::models::plugin::BulkOperation {
        operation_type: crate::models::plugin::BulkOperationType::Uninstall,
        target_plugin_ids: plugin_ids,
        status,
        results,
        started_at,
        completed_at: Some(chrono::Utc::now().timestamp_millis()),
    })
}

/// Cancel installation response
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CancelInstallResponse {
    pub success: bool,
    pub message: String,
    pub cleanup_required: bool,
}

/// Validate plugin package from file (US1-T004)
#[tauri::command]
pub async fn plugin_validate_package(
    handle: AppHandle,
    file_path: String,
    _source: String,
) -> Result<InstallerValidation, String> {
    let temp_dir = handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get temp dir: {}", e))?
        .join("temp");
    
    let installer = PluginInstaller::new(temp_dir, get_plugins_dir(&handle)?);
    installer
        .validate_package(&file_path)
        .await
        .map_err(|e| e.to_string())
}

/// Extract plugin package (US1-T005)
#[tauri::command]
pub async fn plugin_extract_package(
    handle: AppHandle,
    file_path: String,
) -> Result<InstallerResult, String> {
    let temp_dir = handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get temp dir: {}", e))?
        .join("temp");
    
    let installer = PluginInstaller::new(temp_dir, get_plugins_dir(&handle)?);
    installer
        .extract_package(&file_path)
        .await
        .map_err(|e| e.to_string())
}

/// Install plugin from extracted directory (US1-T006)
#[tauri::command]
pub async fn plugin_install(
    handle: AppHandle,
    extracted_path: String,
    plugin_id: String,
    _permissions: Vec<String>,
    auto_enable: Option<bool>,
) -> Result<Plugin, String> {
    let plugins_dir = get_plugins_dir(&handle)?;
    let temp_dir = handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get temp dir: {}", e))?
        .join("temp");

    let installer = PluginInstaller::new(temp_dir, plugins_dir.clone());

    // Install plugin
    installer
        .install_plugin(&extracted_path, &plugin_id)
        .await
        .map_err(|e| e.to_string())?;

    // Set enabled state
    let enabled = auto_enable.unwrap_or(false);
    save_plugin_enabled_state(&handle, &plugin_id, enabled)
        .map_err(|e| format!("Failed to save plugin state: {}", e))?;

    // Load and return installed plugin
    let manifest_path = plugins_dir.join(&plugin_id).join("plugin.json");
    let manifest = read_plugin_manifest(&manifest_path)
        .map_err(|e| format!("Failed to read installed manifest: {}", e))?;

    let health = get_plugin_health_for(&plugin_id, &plugins_dir.join(&plugin_id))?;
    let stats = PluginUsageStats {
        last_used: None,
        usage_count: 0,
        last_execution_time: None,
        average_execution_time: None,
    };

    let installed_at = get_plugin_installation_time(&plugins_dir.join(&plugin_id))
        .map_err(|e| format!("Failed to get installation time: {}", e))?;

    let plugin_path = plugins_dir.join(&plugin_id);

    Ok(Plugin {
        id: plugin_id.clone(),
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        enabled,
        permissions: manifest.permissions,
        entry_point: manifest.entry,
        triggers: manifest.triggers,
        settings: HashMap::new(),
        health,
        usage_stats: stats,
        installed_at,
        install_path: plugin_path.to_string_lossy().to_string(),
        source: crate::models::plugin::PluginSource::Local,
    })
}

/// Get plugin installation status (US1-T007)
#[tauri::command]
pub async fn plugin_get_install_status(
    _handle: AppHandle,
    install_id: String,
) -> Result<InstallProgress, String> {
    // For now, return a simulated progress
    // In real implementation, you'd track actual installation progress
    Ok(InstallProgress {
        install_id,
        stage: "complete".to_string(),
        progress: 100,
        message: "Installation completed".to_string(),
    })
}

/// Cancel installation (US1-T008)
#[tauri::command]
pub async fn plugin_cancel_install(
    _handle: AppHandle,
    _install_id: String,
    cleanup: Option<bool>,
) -> Result<CancelInstallResponse, String> {
    // For now, just return success
    // In real implementation, you'd clean up temp files and cancel operations
    Ok(CancelInstallResponse {
        success: true,
        message: "Installation cancelled".to_string(),
        cleanup_required: cleanup.unwrap_or(true),
    })
}

// ============================================================================
// Buffer-based Plugin Installation (for drag-and-drop from web)
// ============================================================================

/// Validate plugin package from buffer (US1-T004)
#[tauri::command]
pub async fn plugin_validate_package_from_buffer(
    handle: AppHandle,
    buffer: Vec<u8>,
    file_name: String,
    _source: String,
) -> Result<InstallerValidation, String> {
    let temp_dir = handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get temp dir: {}", e))?
        .join("temp");
    
    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp dir: {}", e))?;
    
    // Write buffer to temp file
    let temp_file = temp_dir.join(&file_name);
    fs::write(&temp_file, &buffer)
        .map_err(|e| format!("Failed to write buffer to file: {}", e))?;
    
    let installer = PluginInstaller::new(temp_dir, get_plugins_dir(&handle)?);
    installer
        .validate_package(temp_file.to_string_lossy().as_ref())
        .await
        .map_err(|e| e.to_string())
}

/// Extract plugin package from buffer (US1-T005)
#[tauri::command]
pub async fn plugin_extract_package_from_buffer(
    handle: AppHandle,
    buffer: Vec<u8>,
    file_name: String,
) -> Result<InstallerResult, String> {
    let temp_dir = handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get temp dir: {}", e))?
        .join("temp");
    
    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp dir: {}", e))?;
    
    // Write buffer to temp file
    let temp_file = temp_dir.join(&file_name);
    fs::write(&temp_file, &buffer)
        .map_err(|e| format!("Failed to write buffer to file: {}", e))?;

    let installer = PluginInstaller::new(temp_dir, get_plugins_dir(&handle)?);
    installer
        .extract_package(temp_file.to_string_lossy().as_ref())
        .await
        .map_err(|e| e.to_string())
}

// ============================================================================
// Enable/Disable Commands (US3)
// ============================================================================

/// Enable a plugin
#[tauri::command]
pub async fn plugin_enable(handle: AppHandle, plugin_id: String) -> Result<Plugin, String> {
    let plugins_dir = ensure_plugins_dir(&handle)?;
    let plugin_path = plugins_dir.join(&plugin_id);

    // Check if plugin exists
    if !plugin_path.exists() {
        return Err(format!("插件不存在: {}", plugin_id));
    }

    // Update enabled state
    save_plugin_enabled_state(&handle, &plugin_id, true)?;

    // Load and return updated plugin
    let manifest_path = plugin_path.join("plugin.json");
    let manifest = read_plugin_manifest(&manifest_path)
        .map_err(|e| format!("Failed to read manifest: {}", e))?;

    let health = get_plugin_health_for(&plugin_id, &plugin_path)?;
    let stats = load_plugin_usage_stats(&handle)?
        .get(&plugin_id)
        .cloned()
        .unwrap_or_default();

    let installed_at = get_plugin_installation_time(&plugin_path)
        .map_err(|e| format!("Failed to get installation time: {}", e))?;

    Ok(Plugin {
        id: plugin_id.clone(),
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        enabled: true,
        permissions: manifest.permissions,
        entry_point: manifest.entry,
        triggers: manifest.triggers,
        settings: HashMap::new(),
        health,
        usage_stats: stats,
        install_path: plugin_path.to_string_lossy().to_string(),
        source: crate::models::plugin::PluginSource::Local,
        installed_at,
    })
}

/// Disable a plugin
#[tauri::command]
pub async fn plugin_disable(handle: AppHandle, plugin_id: String) -> Result<Plugin, String> {
    let plugins_dir = ensure_plugins_dir(&handle)?;
    let plugin_path = plugins_dir.join(&plugin_id);

    // Check if plugin exists
    if !plugin_path.exists() {
        return Err(format!("插件不存在: {}", plugin_id));
    }

    // Update enabled state
    save_plugin_enabled_state(&handle, &plugin_id, false)?;

    // Load and return updated plugin
    let manifest_path = plugin_path.join("plugin.json");
    let manifest = read_plugin_manifest(&manifest_path)
        .map_err(|e| format!("Failed to read manifest: {}", e))?;

    let health = get_plugin_health_for(&plugin_id, &plugin_path)?;
    let stats = load_plugin_usage_stats(&handle)?
        .get(&plugin_id)
        .cloned()
        .unwrap_or_default();

    let installed_at = get_plugin_installation_time(&plugin_path)
        .map_err(|e| format!("Failed to get installation time: {}", e))?;

    Ok(Plugin {
        id: plugin_id.clone(),
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        enabled: false,
        permissions: manifest.permissions,
        entry_point: manifest.entry,
        triggers: manifest.triggers,
        settings: HashMap::new(),
        health,
        usage_stats: stats,
        install_path: plugin_path.to_string_lossy().to_string(),
        source: crate::models::plugin::PluginSource::Local,
        installed_at,
    })
}

// ============================================================================
// Uninstall Command (US4)
// ============================================================================

/// Uninstall a plugin
#[tauri::command]
pub async fn plugin_uninstall(handle: AppHandle, plugin_id: String) -> Result<(), String> {
    let plugins_dir = ensure_plugins_dir(&handle)?;
    let plugin_path = plugins_dir.join(&plugin_id);

    // Check if plugin exists
    if !plugin_path.exists() {
        return Err(format!("插件不存在: {}", plugin_id));
    }

    // TODO: Check if it's a core plugin that should not be uninstalled
    let core_plugins = vec!["core", "system"];
    if core_plugins.contains(&plugin_id.as_str()) {
        return Err(format!("不能卸载核心插件: {}", plugin_id));
    }

    // Remove plugin directory
    fs::remove_dir_all(&plugin_path)
        .map_err(|e| format!("Failed to remove plugin directory: {}", e))?;

    // Remove plugin state
    remove_plugin_state(&handle, &plugin_id)?;

    Ok(())
}

// ============================================================================
// Plugin Abbreviation Commands
// ============================================================================

/// Plugin abbreviation structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PluginAbbreviation {
    pub keyword: String,
    pub enabled: bool,
}

/// Get plugin abbreviations configuration file path
fn get_abbreviations_config_path(handle: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get data dir: {}", e))?;

    Ok(data_dir.join("plugin_abbreviations.json"))
}

/// Get all plugin abbreviations
#[tauri::command]
pub fn get_plugin_abbreviations(handle: AppHandle) -> Result<HashMap<String, Vec<PluginAbbreviation>>, String> {
    let config_path = get_abbreviations_config_path(&handle)?;

    if !config_path.exists() {
        return Ok(HashMap::new());
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read abbreviations config: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse abbreviations config: {}", e))
}

/// Save plugin abbreviations
#[tauri::command]
pub fn save_plugin_abbreviations(
    handle: AppHandle,
    config: HashMap<String, Vec<PluginAbbreviation>>,
) -> Result<(), String> {
    let config_path = get_abbreviations_config_path(&handle)?;

    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize abbreviations config: {}", e))?;

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write abbreviations config: {}", e))?;

    Ok(())
}

/// Set abbreviation for a plugin
#[tauri::command]
pub fn set_plugin_abbreviation(
    handle: AppHandle,
    plugin_id: String,
    abbreviation: PluginAbbreviation,
) -> Result<(), String> {
    let mut config = get_plugin_abbreviations(handle.clone())?;

    config.entry(plugin_id.clone())
        .or_insert_with(Vec::new)
        .push(abbreviation);

    save_plugin_abbreviations(handle, config)
}

/// Remove abbreviation from a plugin
#[tauri::command]
pub fn remove_plugin_abbreviation(
    handle: AppHandle,
    plugin_id: String,
    keyword: String,
) -> Result<(), String> {
    let mut config = get_plugin_abbreviations(handle.clone())?;

    if let Some(abbreviations) = config.get_mut(&plugin_id) {
        abbreviations.retain(|abbr| abbr.keyword != keyword);
    }

    save_plugin_abbreviations(handle, config)
}

