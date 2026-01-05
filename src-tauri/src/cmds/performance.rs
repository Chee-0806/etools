/**
 * Performance Commands
 * Tauri commands for performance monitoring and validation (T206)
 */

use crate::services::performance::{PerformanceMonitor, PerformanceEvent};
use std::sync::{Arc, Mutex};
use tauri::State;

/// Global performance monitor state
pub struct PerformanceState {
    pub monitor: Arc<Mutex<PerformanceMonitor>>,
}

/// Get current performance metrics
#[tauri::command]
pub fn get_performance_metrics(state: State<PerformanceState>) -> Result<crate::services::performance::PerformanceMetrics, String> {
    let monitor = state.monitor.lock().map_err(|e| e.to_string())?;
    Ok(monitor.get_metrics())
}

/// Get performance report with requirements check (T206)
#[tauri::command]
pub fn check_performance_requirements(state: State<PerformanceState>) -> Result<crate::services::performance::PerformanceReport, String> {
    let monitor = state.monitor.lock().map_err(|e| e.to_string())?;
    Ok(monitor.check_requirements())
}

/// Record a performance event
#[tauri::command]
pub fn record_performance_event(
    state: State<PerformanceState>,
    event_type: String,
    data: serde_json::Value,
) -> Result<(), String> {
    let monitor = state.monitor.lock().map_err(|e| e.to_string())?;

    let event = match event_type.as_str() {
        "window_shown" => {
            let duration_ms = data["duration_ms"]
                .as_u64()
                .ok_or("Invalid duration_ms")?;
            PerformanceEvent::WindowShown { duration_ms }
        }
        "search_completed" => {
            let duration_ms = data["duration_ms"]
                .as_u64()
                .ok_or("Invalid duration_ms")?;
            let result_count = data["result_count"]
                .as_u64()
                .ok_or("Invalid result_count")? as usize;
            PerformanceEvent::SearchCompleted { duration_ms, result_count }
        }
        "app_launched" => {
            let app_id = data["app_id"]
                .as_str()
                .ok_or("Invalid app_id")?
                .to_string();
            let duration_ms = data["duration_ms"]
                .as_u64()
                .ok_or("Invalid duration_ms")?;
            PerformanceEvent::AppLaunched { app_id, duration_ms }
        }
        "memory_used" => {
            let mb = data["mb"]
                .as_f64()
                .ok_or("Invalid mb")?;
            PerformanceEvent::MemoryUsed { mb }
        }
        _ => return Err(format!("Unknown event type: {}", event_type)),
    };

    monitor.record_event(event);
    Ok(())
}

/// Get average search time for last N searches
#[tauri::command]
pub fn get_average_search_time(
    state: State<PerformanceState>,
    n: usize,
) -> Result<Option<f64>, String> {
    let monitor = state.monitor.lock().map_err(|e| e.to_string())?;
    Ok(monitor.get_avg_search_time(n))
}
