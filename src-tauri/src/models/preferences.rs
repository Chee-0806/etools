/**
 * User Preference Model
 * Represents user settings and preferences
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreference {
    pub key: String,
    pub value: serde_json::Value,
    pub value_type: PreferenceType,
    pub category: PreferenceCategory,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PreferenceType {
    String,
    Number,
    Boolean,
    Array,
    Object,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PreferenceCategory {
    General,
    Appearance,
    Features,
    Privacy,
    Advanced,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    // General
    #[serde(default)]
    pub startup_behavior: StartupBehavior,
    #[serde(default = "default_language")]
    pub language: String,
    #[serde(default = "default_global_hotkey")]
    pub global_hotkey: String,

    // Appearance
    #[serde(default)]
    pub theme: Theme,
    #[serde(default = "default_window_opacity")]
    pub window_opacity: f32,
    #[serde(default = "default_show_menubar_icon")]
    pub show_menubar_icon: bool,

    // Features
    #[serde(default = "default_enable_clipboard")]
    pub enable_clipboard: bool,
    #[serde(default)]
    pub enable_file_search: bool,
    #[serde(default)]
    pub enable_browser_search: bool,

    // Privacy
    #[serde(default = "default_anonymize_usage")]
    pub anonymize_usage: bool,
    #[serde(default)]
    pub crash_reports: bool,

    // Advanced
    #[serde(default = "default_search_debounce_ms")]
    pub search_debounce_ms: u64,
    #[serde(default = "default_max_results")]
    pub max_results: usize,
    #[serde(default)]
    pub excluded_apps: Vec<String>,
    #[serde(default)]
    pub file_index_paths: Vec<String>,
}

// Default functions for serde
fn default_language() -> String {
    "en".to_string()
}

fn default_global_hotkey() -> String {
    #[cfg(target_os = "macos")]
    return "Cmd+Shift+K".to_string();
    #[cfg(not(target_os = "macos"))]
    return "Ctrl+Shift+K".to_string();
}

fn default_window_opacity() -> f32 {
    0.95
}

fn default_show_menubar_icon() -> bool {
    true
}

fn default_enable_clipboard() -> bool {
    true
}

fn default_anonymize_usage() -> bool {
    true
}

fn default_search_debounce_ms() -> u64 {
    150
}

fn default_max_results() -> usize {
    50
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum StartupBehavior {
    AutoStart,
    OnDemand,
    Minimized,
}

impl Default for StartupBehavior {
    fn default() -> Self {
        StartupBehavior::OnDemand
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Theme {
    System,
    Light,
    Dark,
}

impl Default for Theme {
    fn default() -> Self {
        Theme::System
    }
}

impl Default for AppSettings {
    fn default() -> Self {
        // Set default hotkey based on platform
        #[cfg(target_os = "macos")]
        let default_hotkey = "Cmd+Space".to_string();
        #[cfg(not(target_os = "macos"))]
        let default_hotkey = "Alt+Space".to_string();

        Self {
            startup_behavior: StartupBehavior::OnDemand,
            language: "en".to_string(),
            global_hotkey: default_hotkey,
            theme: Theme::System,
            window_opacity: 0.95,
            show_menubar_icon: true,
            enable_clipboard: true,
            enable_file_search: false,
            enable_browser_search: false,
            anonymize_usage: true,
            crash_reports: false,
            search_debounce_ms: 150,
            max_results: 50,
            excluded_apps: vec![],
            file_index_paths: vec![],
        }
    }
}
