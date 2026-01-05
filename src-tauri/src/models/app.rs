/**
 * Application Entry Model
 * Represents an installed desktop application
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationEntry {
    pub id: String,
    pub name: String,
    pub executable_path: String,
    /// Path to the .app bundle (macOS) or application directory
    /// Used for icon extraction and other operations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_path: Option<String>,
    pub icon: Option<String>,
    pub usage_count: u32,
    pub last_launched: Option<i64>,
    pub platform: String,
    /// Alternate names for search (e.g., .app filename, aliases)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alternate_names: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchAppRequest {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchAppResponse {
    pub success: bool,
    pub pid: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetInstalledAppsRequest {
    pub refresh: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetInstalledAppsResponse {
    pub apps: Vec<ApplicationEntry>,
    pub scan_time: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackAppUsageRequest {
    pub app_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackAppUsageResponse {
    pub success: bool,
    pub usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetAppIconResponse {
    pub icon: Option<String>,
    pub icon_data_url: Option<String>,
}
