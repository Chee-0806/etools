/// Configuration for each view type's sizing and positioning behavior
#[derive(Debug, Clone)]
pub struct ViewConfig {
    pub view_id: String,
    pub width_percent: f64,
    pub height_percent: f64,
    pub min_width: u32,
    pub max_width: u32,
    pub min_height: u32,
    pub max_height: u32,
    pub vertical_offset: f64, // -1.0 to 1.0, where 0 is centered
    pub transition_duration: u64,
}

impl ViewConfig {
    pub fn search() -> Self {
        Self {
            view_id: "search".to_string(),
            width_percent: 0.50,
            height_percent: 0.50,
            min_width: 700,
            max_width: 1000,
            min_height: 500,
            max_height: 800,
            vertical_offset: 0.15, // Upper portion (15% from top)
            transition_duration: 200,
        }
    }

    pub fn settings() -> Self {
        Self {
            view_id: "settings".to_string(),
            width_percent: 0.40,
            height_percent: 0.50,
            min_width: 600,
            max_width: 900,
            min_height: 400,
            max_height: 700,
            vertical_offset: 0.0, // Centered
            transition_duration: 250,
        }
    }

    pub fn plugins() -> Self {
        Self {
            view_id: "plugins".to_string(),
            width_percent: 0.45,
            height_percent: 0.55,
            min_width: 650,
            max_width: 1000,
            min_height: 450,
            max_height: 750,
            vertical_offset: 0.0, // Centered
            transition_duration: 250,
        }
    }

    pub fn from_id(id: &str) -> Result<Self, String> {
        match id {
            "search" => Ok(Self::search()),
            "settings" => Ok(Self::settings()),
            "plugins" => Ok(Self::plugins()),
            _ => Err(format!("Invalid view ID: {}", id)),
        }
    }
}
