use serde::{Deserialize, Serialize};
use super::screen_info::ScreenInfo;

/// Result of window size calculation with final dimensions and position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalculatedWindowLayout {
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    #[serde(rename = "animationRequired")]
    pub animation_required: bool,
}

impl CalculatedWindowLayout {
    pub fn new(
        width: u32,
        height: u32,
        x: i32,
        y: i32,
        current_width: Option<u32>,
    ) -> Self {
        let animation_required = match current_width {
            Some(current) => (current as i32 - width as i32).abs() > 10,
            None => true,
        };

        Self {
            width,
            height,
            x,
            y,
            animation_required,
        }
    }

    pub fn validate(&self, screen_info: &ScreenInfo) -> Result<(), String> {
        // Check if window fits within screen
        if self.width > screen_info.available_width {
            return Err(format!(
                "Window width {} exceeds available width {}",
                self.width, screen_info.available_width
            ));
        }
        if self.height > screen_info.available_height {
            return Err(format!(
                "Window height {} exceeds available height {}",
                self.height, screen_info.available_height
            ));
        }

        // Check if window is positioned on screen
        if self.x < 0 || self.x + self.width as i32 > screen_info.screen_width as i32 {
            return Err("Window X position is off-screen".to_string());
        }
        if self.y < 0 || self.y + self.height as i32 > screen_info.screen_height as i32 {
            return Err("Window Y position is off-screen".to_string());
        }

        Ok(())
    }
}
