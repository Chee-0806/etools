//! Performance Monitoring Service (T200)
//! Tracks application performance metrics
#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    /// Window appearance time (ms)
    pub window_show_time: u64,
    /// Search query time (ms)
    pub search_time: u64,
    /// Memory usage (MB)
    pub memory_usage: f64,
    /// CPU usage percentage
    pub cpu_usage: f64,
    /// Total active connections
    pub active_connections: u32,
}

/// Performance event
#[derive(Debug, Clone, PartialEq)]
pub enum PerformanceEvent {
    WindowShown { duration_ms: u64 },
    SearchCompleted { duration_ms: u64, result_count: usize },
    AppLaunched { app_id: String, duration_ms: u64 },
    MemoryUsed { mb: f64 },
}

/// Performance monitor
pub struct PerformanceMonitor {
    metrics: Arc<Mutex<PerformanceMetrics>>,
    start_time: Instant,
    event_history: Arc<Mutex<Vec<PerformanceEvent>>>,
}

impl PerformanceMonitor {
    /// Create a new performance monitor
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(Mutex::new(PerformanceMetrics {
                window_show_time: 0,
                search_time: 0,
                memory_usage: 0.0,
                cpu_usage: 0.0,
                active_connections: 0,
            })),
            start_time: Instant::now(),
            event_history: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Record a performance event
    pub fn record_event(&self, event: PerformanceEvent) {
        let mut history = self.event_history.lock().unwrap();
        history.push(event.clone());

        // Keep only last 1000 events
        if history.len() > 1000 {
            history.remove(0);
        }

        // Update metrics based on event
        let mut metrics = self.metrics.lock().unwrap();
        match &event {
            PerformanceEvent::WindowShown { duration_ms } => {
                metrics.window_show_time = *duration_ms;
            }
            PerformanceEvent::SearchCompleted { duration_ms, .. } => {
                metrics.search_time = *duration_ms;
            }
            PerformanceEvent::MemoryUsed { mb } => {
                metrics.memory_usage = *mb;
            }
            _ => {}
        }
    }

    /// Get current metrics
    pub fn get_metrics(&self) -> PerformanceMetrics {
        self.metrics.lock().unwrap().clone()
    }

    /// Get event history
    pub fn get_event_history(&self) -> Vec<PerformanceEvent> {
        self.event_history.lock().unwrap().clone()
    }

    /// Get average search time for last N searches
    pub fn get_avg_search_time(&self, n: usize) -> Option<f64> {
        let history = self.event_history.lock().unwrap();
        let search_times: Vec<u64> = history
            .iter()
            .rev()
            .filter_map(|e| match e {
                PerformanceEvent::SearchCompleted { duration_ms, .. } => Some(*duration_ms),
                _ => None,
            })
            .take(n)
            .collect();

        if search_times.is_empty() {
            return None;
        }

        let sum: u64 = search_times.iter().sum();
        Some(sum as f64 / search_times.len() as f64)
    }

    /// Check if performance requirements are met
    pub fn check_requirements(&self) -> PerformanceReport {
        let metrics = self.get_metrics();
        let mut issues = Vec::new();

        // Window show time should be < 100ms
        if metrics.window_show_time > 100 {
            issues.push(format!(
                "窗口显示时间过长: {}ms (要求 < 100ms)",
                metrics.window_show_time
            ));
        }

        // Search time should be < 200ms
        if metrics.search_time > 200 {
            issues.push(format!(
                "搜索时间过长: {}ms (要求 < 200ms)",
                metrics.search_time
            ));
        }

        // Memory usage warning (> 200MB)
        if metrics.memory_usage > 200.0 {
            issues.push(format!(
                "内存使用过高: {:.1}MB (建议 < 200MB)",
                metrics.memory_usage
            ));
        }

        PerformanceReport {
            meets_requirements: issues.is_empty(),
            metrics,
            issues,
        }
    }

    /// Get uptime
    pub fn uptime(&self) -> Duration {
        self.start_time.elapsed()
    }
}

/// Performance report
#[derive(Debug, Clone, Serialize)]
pub struct PerformanceReport {
    pub meets_requirements: bool,
    pub metrics: PerformanceMetrics,
    pub issues: Vec<String>,
}

impl Default for PerformanceMonitor {
    fn default() -> Self {
        Self::new()
    }
}
