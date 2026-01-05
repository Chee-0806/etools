//! Marketplace Service
//! Business logic for plugin marketplace
#![allow(unused_variables)]

use tauri::{AppHandle, Manager};
use crate::models::plugin::*;
use std::fs;
use std::time::SystemTime;

/// Error type for marketplace operations
pub type MarketplaceResult<T> = Result<T, String>;

/// Marketplace service
pub struct MarketplaceService {
    // Add any required fields here
}

impl MarketplaceService {
    /// Create a new marketplace service instance
    pub fn new() -> Self {
        Self {}
    }

    /// List marketplace plugins
    pub fn list_plugins(
        &self,
        category: Option<&str>,
        page: u32,
        page_size: u32,
        handle: &AppHandle,
    ) -> MarketplaceResult<MarketplacePluginPage> {
        let all_plugins = self.get_mock_plugins();

        // Filter by category if specified
        let filtered = if let Some(cat) = category {
            if cat == "all" {
                all_plugins
            } else {
                all_plugins
                    .into_iter()
                    .filter(|p| {
                        format!("{:?}", p.category).to_lowercase() == cat.to_lowercase()
                    })
                    .collect()
            }
        } else {
            all_plugins
        };

        let total = filtered.len() as u32;
        let start = (page.saturating_sub(1) * page_size) as usize;
        let end = std::cmp::min(start + page_size as usize, filtered.len());

        let plugins: Vec<MarketplacePlugin> = filtered
            .into_iter()
            .skip(start)
            .take(page_size as usize)
            .collect();

        let has_more = end < total as usize;

        Ok(MarketplacePluginPage {
            plugins,
            total,
            page,
            page_size,
            has_more,
        })
    }

    /// Search marketplace plugins
    pub fn search_plugins(
        &self,
        query: &str,
        category: Option<&str>,
        page: u32,
        page_size: u32,
        handle: &AppHandle,
    ) -> MarketplaceResult<MarketplacePluginPage> {
        let all_plugins = self.get_mock_plugins();
        let query_lower = query.to_lowercase();

        // Filter by search query
        let filtered: Vec<MarketplacePlugin> = all_plugins
            .into_iter()
            .filter(|p| {
                // Check if matches category filter
                let category_match = if let Some(cat) = category {
                    if cat == "all" {
                        true
                    } else {
                        format!("{:?}", p.category).to_lowercase() == cat.to_lowercase()
                    }
                } else {
                    true
                };

                // Check if matches search query
                let query_match = p.name.to_lowercase().contains(&query_lower)
                    || p.description.to_lowercase().contains(&query_lower)
                    || p.tags.iter().any(|t| t.to_lowercase().contains(&query_lower));

                category_match && query_match
            })
            .collect();

        let total = filtered.len() as u32;
        let start = (page.saturating_sub(1) * page_size) as usize;
        let end = std::cmp::min(start + page_size as usize, filtered.len());

        let plugins: Vec<MarketplacePlugin> = filtered
            .into_iter()
            .skip(start)
            .take(page_size as usize)
            .collect();

        let has_more = end < total as usize;

        Ok(MarketplacePluginPage {
            plugins,
            total,
            page,
            page_size,
            has_more,
        })
    }

    /// Install plugin from marketplace
    pub fn install_plugin(&self, plugin_id: &str, handle: &AppHandle) -> MarketplaceResult<Plugin> {
        // 1. Find plugin in mock marketplace
        let mock_plugins = self.get_mock_plugins();
        let market_plugin = mock_plugins
            .iter()
            .find(|p| p.id == plugin_id)
            .ok_or_else(|| format!("Plugin not found in marketplace: {}", plugin_id))?;

        // 2. Get plugins directory
        let plugins_dir = handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get data dir: {}", e))?
            .join("plugins");

        fs::create_dir_all(&plugins_dir)
            .map_err(|e| format!("Failed to create plugins directory: {}", e))?;

        let plugin_dir = plugins_dir.join(plugin_id);
        fs::create_dir_all(&plugin_dir)
            .map_err(|e| format!("Failed to create plugin directory: {}", e))?;

        // 3. Create plugin manifest (plugin.json)
        let manifest = serde_json::json!({
            "name": market_plugin.name,
            "version": market_plugin.version,
            "description": market_plugin.description,
            "author": market_plugin.author,
            "permissions": market_plugin.permissions,
            "triggers": market_plugin.triggers.iter().map(|t| {
                serde_json::json!({
                    "keyword": t,
                    "description": ""
                })
            }).collect::<Vec<_>>(),
            "entry": "index.js"
        });

        let manifest_path = plugin_dir.join("plugin.json");
        fs::write(&manifest_path, serde_json::to_string_pretty(&manifest).unwrap())
            .map_err(|e| format!("Failed to write plugin.json: {}", e))?;

        // 4. Create minimal index.js file
        let index_js = r#"
// Plugin entry point
export async function init() {
  console.log('Plugin initialized');
}

export async function search(query) {
  return [];
}
"#;
        let index_path = plugin_dir.join("index.js");
        fs::write(&index_path, index_js)
            .map_err(|e| format!("Failed to write index.js: {}", e))?;

        // 5. Get current timestamp
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .map_err(|e| format!("Failed to get timestamp: {}", e))?
            .as_millis() as i64;

        // 6. Return Plugin object
        Ok(Plugin {
            id: plugin_id.to_string(),
            name: market_plugin.name.clone(),
            version: market_plugin.version.clone(),
            description: market_plugin.description.clone(),
            author: Some(market_plugin.author.clone()),
            enabled: true,
            permissions: market_plugin.permissions.clone(),
            entry_point: "index.js".to_string(),
            triggers: market_plugin.triggers.iter().map(|t| PluginTrigger {
                keyword: t.clone(),
                description: "".to_string(),
                hotkey: None,
            }).collect(),
            settings: Default::default(),
            health: PluginHealth {
                status: PluginHealthStatus::Unknown,
                message: None,
                last_checked: 0,
                errors: vec![],
            },
            usage_stats: PluginUsageStats {
                last_used: None,
                usage_count: 0,
                last_execution_time: None,
                average_execution_time: None,
            },
            installed_at: now,
            install_path: plugin_dir.to_string_lossy().to_string(),
            source: crate::models::plugin::PluginSource::Marketplace,
        })
    }

    /// Check for plugin updates
    pub fn check_updates(&self, handle: &AppHandle) -> MarketplaceResult<Vec<String>> {
        // TODO: Implement update checking logic
        // Compare installed versions with marketplace versions
        Ok(vec![])
    }

    /// Get mock marketplace plugins for development
    pub fn get_mock_plugins(&self) -> Vec<MarketplacePlugin> {
        vec![
            MarketplacePlugin {
                id: "qrcode-generator".to_string(),
                name: "QR 码生成器".to_string(),
                version: "1.0.0".to_string(),
                description: "快速生成二维码，支持文本、URL等多种内容".to_string(),
                author: "Kaka Team".to_string(),
                permissions: vec![],
                triggers: vec!["qr:".to_string(), "qrcode:".to_string()],
                icon: None,
                homepage: None,
                repository: None,
                download_count: 12345,
                rating: 4.8,
                rating_count: 42,
                category: PluginCategory::Utilities,
                installed: false,
                installed_version: None,
                update_available: false,
                latest_version: "1.0.0".to_string(),
                screenshots: None,
                tags: vec!["qr".to_string(), "generator".to_string()],
                published_at: 1704067200000, // 2024-01-01
                updated_at: 1704067200000,
            },
            MarketplacePlugin {
                id: "color-converter".to_string(),
                name: "颜色转换器".to_string(),
                version: "1.2.0".to_string(),
                description: "支持 HEX、RGB、HSL 等多种颜色格式转换".to_string(),
                author: "Kaka Team".to_string(),
                permissions: vec![],
                triggers: vec!["#".to_string(), "rgb:".to_string(), "hsl:".to_string()],
                icon: None,
                homepage: None,
                repository: None,
                download_count: 8765,
                rating: 4.6,
                rating_count: 28,
                category: PluginCategory::Developer,
                installed: false,
                installed_version: None,
                update_available: false,
                latest_version: "1.2.0".to_string(),
                screenshots: None,
                tags: vec!["color".to_string(), "converter".to_string()],
                published_at: 1703980800000,
                updated_at: 1703980800000,
            },
        ]
    }
}
