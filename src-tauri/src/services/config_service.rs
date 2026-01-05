//! Config Service
//! Manages application configuration
#![allow(dead_code)]

use std::path::PathBuf;
use tauri::Config;

use crate::cmds::abbreviation::AbbreviationConfig;

pub struct ConfigService {
    app_config: Config,
}

impl ConfigService {
    pub fn new(app_config: Config) -> Self {
        Self { app_config }
    }

    async fn get_config_path(&self) -> Result<PathBuf, String> {
        let home = std::env::var("HOME")
            .map_err(|_| "Failed to get HOME directory")?;
        let app_data_dir = PathBuf::from(home).join(".config");

        let config_dir = app_data_dir.join("kaka");
        std::fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;

        Ok(config_dir.join("abbreviations.json"))
    }

    pub async fn get_abbreviation_config(&self) -> Result<AbbreviationConfig, String> {
        let config_path = self.get_config_path().await?;
        
        if !config_path.exists() {
            let default_config = AbbreviationConfig::default();
            self.save_abbreviation_config(&default_config).await?;
            return Ok(default_config);
        }

        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config file: {}", e))
    }

    pub async fn save_abbreviation_config(&self, config: &AbbreviationConfig) -> Result<(), String> {
        let config_path = self.get_config_path().await?;

        let content = serde_json::to_string_pretty(config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        std::fs::write(config_path, content)
            .map_err(|e| format!("Failed to write config file: {}", e))?;

        Ok(())
    }
}