use serde::{Deserialize, Serialize};
use crate::models::ScreenInfo;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenChangedPayload {
    #[serde(rename = "oldScreenInfo")]
    pub old_screen_info: Option<ScreenInfo>,
    #[serde(rename = "newScreenInfo")]
    pub new_screen_info: ScreenInfo,
    #[serde(rename = "changeType")]
    pub change_type: String,
}
