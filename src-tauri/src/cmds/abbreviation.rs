use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{State, Config};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Abbreviation {
    pub id: String,
    pub abbr: String,
    pub expansion: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbbreviationCategory {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbbreviationConfig {
    pub abbreviations: Vec<Abbreviation>,
    pub categories: Vec<AbbreviationCategory>,
    pub global_enabled: bool,
    pub auto_open_single: bool,
    pub show_in_search: bool,
    pub case_sensitive: bool,
}

impl Default for AbbreviationConfig {
    fn default() -> Self {
        Self {
            abbreviations: vec![
                Abbreviation {
                    id: "1".to_string(),
                    abbr: "gh".to_string(),
                    expansion: "https://github.com".to_string(),
                    description: Some("GitHub".to_string()),
                    category: Some("dev".to_string()),
                    enabled: true,
                    created_at: chrono::Utc::now().to_rfc3339(),
                    updated_at: chrono::Utc::now().to_rfc3339(),
                },
                Abbreviation {
                    id: "2".to_string(),
                    abbr: "ggl".to_string(),
                    expansion: "https://google.com".to_string(),
                    description: Some("Google".to_string()),
                    category: Some("search".to_string()),
                    enabled: true,
                    created_at: chrono::Utc::now().to_rfc3339(),
                    updated_at: chrono::Utc::now().to_rfc3339(),
                },
                Abbreviation {
                    id: "3".to_string(),
                    abbr: "so".to_string(),
                    expansion: "https://stackoverflow.com".to_string(),
                    description: Some("Stack Overflow".to_string()),
                    category: Some("dev".to_string()),
                    enabled: true,
                    created_at: chrono::Utc::now().to_rfc3339(),
                    updated_at: chrono::Utc::now().to_rfc3339(),
                },
            ],
            categories: vec![
                AbbreviationCategory {
                    id: "dev".to_string(),
                    name: "开发工具".to_string(),
                    description: Some("编程和开发相关".to_string()),
                    icon: Some("💻".to_string()),
                    color: Some("#007acc".to_string()),
                },
                AbbreviationCategory {
                    id: "search".to_string(),
                    name: "搜索引擎".to_string(),
                    description: Some("搜索和查询".to_string()),
                    icon: Some("🔍".to_string()),
                    color: Some("#4285f4".to_string()),
                },
            ],
            global_enabled: true,
            auto_open_single: false,
            show_in_search: true,
            case_sensitive: false,
        }
    }
}

async fn get_config_path(_app_config: &Config) -> Result<PathBuf, String> {
    let home = std::env::var("HOME")
        .map_err(|_| "Failed to get HOME directory")?;
    let app_data_dir = PathBuf::from(home).join(".config");

    let config_dir = app_data_dir.join("kaka");
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    Ok(config_dir.join("abbreviations.json"))
}

#[tauri::command]
pub async fn get_abbreviation_config(
    app_config: State<'_, Config>,
) -> Result<AbbreviationConfig, String> {
    let config_path = get_config_path(&app_config).await?;
    
    if !config_path.exists() {
        let default_config = AbbreviationConfig::default();
        let content = serde_json::to_string_pretty(&default_config)
            .map_err(|e| format!("Failed to serialize default config: {}", e))?;
        std::fs::write(&config_path, content)
            .map_err(|e| format!("Failed to write default config: {}", e))?;
        return Ok(default_config);
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config file: {}", e))
}

#[tauri::command]
pub async fn save_abbreviation_config(
    config: AbbreviationConfig,
    app_config: State<'_, Config>,
) -> Result<(), String> {
    let config_path = get_config_path(&app_config).await?;
    
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn add_abbreviation(
    abbreviation: Abbreviation,
    app_config: State<'_, Config>,
) -> Result<Abbreviation, String> {
    let config_path = get_config_path(&app_config).await?;
    
    let mut config = if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config file: {}", e))?
    } else {
        AbbreviationConfig::default()
    };
    
    let new_abbr = Abbreviation {
        id: chrono::Utc::now().timestamp_millis().to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
        ..abbreviation
    };
    
    config.abbreviations.push(new_abbr.clone());
    
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(new_abbr)
}

#[tauri::command]
pub async fn update_abbreviation(
    id: String,
    updates: Abbreviation,
    app_config: State<'_, Config>,
) -> Result<Abbreviation, String> {
    let config_path = get_config_path(&app_config).await?;
    
    let mut config = if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config file: {}", e))?
    } else {
        AbbreviationConfig::default()
    };
    
    let index = config.abbreviations.iter()
        .position(|abbr| abbr.id == id)
        .ok_or("Abbreviation not found".to_string())?;
    
    let mut updated_abbr = updates;
    updated_abbr.id = id.clone();
    updated_abbr.updated_at = chrono::Utc::now().to_rfc3339();
    
    config.abbreviations[index] = updated_abbr.clone();
    
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(updated_abbr)
}

#[tauri::command]
pub async fn delete_abbreviation(
    id: String,
    app_config: State<'_, Config>,
) -> Result<(), String> {
    let config_path = get_config_path(&app_config).await?;
    
    let mut config = if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config file: {}", e))?
    } else {
        AbbreviationConfig::default()
    };
    
    let index = config.abbreviations.iter()
        .position(|abbr| abbr.id == id)
        .ok_or("Abbreviation not found".to_string())?;
    
    config.abbreviations.remove(index);
    
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn export_abbreviation_config(
    app_config: State<'_, Config>,
) -> Result<String, String> {
    let config_path = get_config_path(&app_config).await?;
    
    let config = if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config file: {}", e))?
    } else {
        AbbreviationConfig::default()
    };
    
    serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))
}

#[tauri::command]
pub async fn import_abbreviation_config(
    config_json: String,
    app_config: State<'_, Config>,
) -> Result<(), String> {
    let imported: AbbreviationConfig = serde_json::from_str(&config_json)
        .map_err(|e| format!("Invalid configuration format: {}", e))?;
    
    let config_path = get_config_path(&app_config).await?;
    let content = serde_json::to_string_pretty(&imported)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(())
}