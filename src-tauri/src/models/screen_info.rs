use serde::{Deserialize, Serialize};

/// Screen information detected from the OS
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenInfo {
    #[serde(rename = "screenWidth")]
    pub screen_width: u32,
    #[serde(rename = "screenHeight")]
    pub screen_height: u32,
    #[serde(rename = "availableWidth")]
    pub available_width: u32,
    #[serde(rename = "availableHeight")]
    pub available_height: u32,
    #[serde(rename = "scaleFactor")]
    pub scale_factor: f64,
}

impl ScreenInfo {
    pub fn validate(&self) -> Result<(), String> {
        if self.screen_width == 0 || self.screen_height == 0 {
            return Err("Screen dimensions cannot be zero".to_string());
        }
        if self.available_width > self.screen_width {
            return Err("Available width cannot exceed screen width".to_string());
        }
        if self.available_height > self.screen_height {
            return Err("Available height cannot exceed screen height".to_string());
        }
        if self.scale_factor <= 0.0 {
            return Err("Scale factor must be positive".to_string());
        }
        Ok(())
    }
}
