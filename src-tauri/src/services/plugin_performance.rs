//! Plugin Performance Monitoring Service
//! Tracks performance metrics for plugin operations
#![allow(dead_code)]
#![allow(unused_imports)]

use std::collections::HashMap;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Performance metric for a single operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetric {
    pub operation: String,
    pub plugin_id: String,
    pub duration_ms: u64,
    pub timestamp: i64,
    pub success: bool,
    pub memory_usage_mb: Option<f64>,
    pub metadata: HashMap<String, String>,
}

/// Performance statistics for a plugin
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginPerformanceStats {
    pub plugin_id: String,
    pub total_operations: u64,
    pub successful_operations: u64,
    pub failed_operations: u64,
    pub average_duration_ms: f64,
    pub min_duration_ms: u64,
    pub max_duration_ms: u64,
    pub last_operation: Option<i64>,
    pub slow_operations: Vec<PerformanceMetric>,
}

/// Performance monitoring service
pub struct PluginPerformanceMonitor {
    metrics: Arc<Mutex<Vec<PerformanceMetric>>>,
    stats: Arc<Mutex<HashMap<String, PluginPerformanceStats>>>,
    max_metrics: usize,
    slow_threshold_ms: u64,
}

impl PluginPerformanceMonitor {
    /// Create a new performance monitor
    pub fn new(max_metrics: usize, slow_threshold_ms: u64) -> Self {
        Self {
            metrics: Arc::new(Mutex::new(Vec::with_capacity(max_metrics))),
            stats: Arc::new(Mutex::new(HashMap::new())),
            max_metrics,
            slow_threshold_ms,
        }
    }

    /// Start timing an operation
    pub fn start_operation(&self, operation: String, plugin_id: String) -> OperationTimer {
        OperationTimer {
            operation,
            plugin_id,
            start: Instant::now(),
            monitor: self.clone(),
            metadata: HashMap::new(),
        }
    }

    /// Record a performance metric
    pub fn record_metric(&self, metric: PerformanceMetric) {
        // Store metric
        let mut metrics = self.metrics.lock().unwrap();
        if metrics.len() >= self.max_metrics {
            metrics.remove(0); // Remove oldest
        }
        metrics.push(metric.clone());

        // Update stats
        let mut stats = self.stats.lock().unwrap();
        let plugin_stats = stats.entry(metric.plugin_id.clone()).or_insert_with(|| {
            PluginPerformanceStats {
                plugin_id: metric.plugin_id.clone(),
                total_operations: 0,
                successful_operations: 0,
                failed_operations: 0,
                average_duration_ms: 0.0,
                min_duration_ms: metric.duration_ms,
                max_duration_ms: metric.duration_ms,
                last_operation: None,
                slow_operations: Vec::new(),
            }
        });

        // Update statistics
        plugin_stats.total_operations += 1;
        if metric.success {
            plugin_stats.successful_operations += 1;
        } else {
            plugin_stats.failed_operations += 1;
        }

        // Update duration stats
        let total_ms = plugin_stats.average_duration_ms * (plugin_stats.total_operations - 1) as f64;
        plugin_stats.average_duration_ms = (total_ms + metric.duration_ms as f64) / plugin_stats.total_operations as f64;

        if metric.duration_ms < plugin_stats.min_duration_ms {
            plugin_stats.min_duration_ms = metric.duration_ms;
        }
        if metric.duration_ms > plugin_stats.max_duration_ms {
            plugin_stats.max_duration_ms = metric.duration_ms;
        }

        plugin_stats.last_operation = Some(metric.timestamp);

        // Track slow operations
        if metric.duration_ms > self.slow_threshold_ms {
            plugin_stats.slow_operations.push(metric);
            // Keep only last 10 slow operations
            if plugin_stats.slow_operations.len() > 10 {
                plugin_stats.slow_operations.remove(0);
            }
        }
    }

    /// Get all metrics for a plugin
    pub fn get_plugin_metrics(&self, plugin_id: &str) -> Vec<PerformanceMetric> {
        let metrics = self.metrics.lock().unwrap();
        metrics
            .iter()
            .filter(|m| m.plugin_id == plugin_id)
            .cloned()
            .collect()
    }

    /// Get performance statistics for a plugin
    pub fn get_plugin_stats(&self, plugin_id: &str) -> Option<PluginPerformanceStats> {
        let stats = self.stats.lock().unwrap();
        stats.get(plugin_id).cloned()
    }

    /// Get all performance statistics
    pub fn get_all_stats(&self) -> HashMap<String, PluginPerformanceStats> {
        let stats = self.stats.lock().unwrap();
        stats.clone()
    }

    /// Get slow operations across all plugins
    pub fn get_slow_operations(&self) -> Vec<PerformanceMetric> {
        let metrics = self.metrics.lock().unwrap();
        metrics
            .iter()
            .filter(|m| m.duration_ms > self.slow_threshold_ms)
            .cloned()
            .collect()
    }

    /// Clear all metrics
    pub fn clear_metrics(&self) {
        let mut metrics = self.metrics.lock().unwrap();
        metrics.clear();

        let mut stats = self.stats.lock().unwrap();
        stats.clear();
    }

    /// Get performance summary
    pub fn get_summary(&self) -> PerformanceSummary {
        let metrics = self.metrics.lock().unwrap();
        let stats = self.stats.lock().unwrap();

        let total_operations = metrics.len() as u64;
        let successful_operations = metrics.iter().filter(|m| m.success).count() as u64;
        let failed_operations = total_operations - successful_operations;

        let avg_duration = if metrics.is_empty() {
            0.0
        } else {
            metrics.iter().map(|m| m.duration_ms).sum::<u64>() as f64 / metrics.len() as f64
        };

        PerformanceSummary {
            total_operations,
            successful_operations,
            failed_operations,
            average_duration_ms: avg_duration,
            plugin_count: stats.len(),
            slow_operation_count: metrics.iter().filter(|m| m.duration_ms > self.slow_threshold_ms).count() as u64,
        }
    }
}

impl Clone for PluginPerformanceMonitor {
    fn clone(&self) -> Self {
        Self {
            metrics: Arc::clone(&self.metrics),
            stats: Arc::clone(&self.stats),
            max_metrics: self.max_metrics,
            slow_threshold_ms: self.slow_threshold_ms,
        }
    }
}

/// Timer for tracking operation duration
pub struct OperationTimer {
    operation: String,
    plugin_id: String,
    start: Instant,
    monitor: PluginPerformanceMonitor,
    metadata: HashMap<String, String>,
}

impl OperationTimer {
    /// Add metadata to the operation
    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }

    /// Complete the operation and record metric
    pub fn complete(self, success: bool) {
        let duration = self.start.elapsed();
        let metric = PerformanceMetric {
            operation: self.operation,
            plugin_id: self.plugin_id,
            duration_ms: duration.as_millis() as u64,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as i64,
            success,
            memory_usage_mb: None, // TODO: Add memory tracking if needed
            metadata: self.metadata,
        };
        self.monitor.record_metric(metric);
    }

    /// Complete the operation with custom duration
    pub fn complete_with_duration(self, duration_ms: u64, success: bool) {
        let metric = PerformanceMetric {
            operation: self.operation,
            plugin_id: self.plugin_id,
            duration_ms,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as i64,
            success,
            memory_usage_mb: None,
            metadata: self.metadata,
        };
        self.monitor.record_metric(metric);
    }
}

/// Performance summary for all plugins
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSummary {
    pub total_operations: u64,
    pub successful_operations: u64,
    pub failed_operations: u64,
    pub average_duration_ms: f64,
    pub plugin_count: usize,
    pub slow_operation_count: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_tracking() {
        let monitor = PluginPerformanceMonitor::new(100, 100);

        let timer = monitor.start_operation("test_op".to_string(), "test_plugin".to_string());
        std::thread::sleep(Duration::from_millis(10));
        timer.complete(true);

        let stats = monitor.get_plugin_stats("test_plugin");
        assert!(stats.is_some());
        assert_eq!(stats.unwrap().total_operations, 1);
    }

    #[test]
    fn test_slow_operations() {
        let monitor = PluginPerformanceMonitor::new(100, 50);

        let timer = monitor.start_operation("slow_op".to_string(), "test_plugin".to_string());
        timer.complete_with_duration(100, true);

        let slow_ops = monitor.get_slow_operations();
        assert_eq!(slow_ops.len(), 1);
    }

    #[test]
    fn test_performance_summary() {
        let monitor = PluginPerformanceMonitor::new(100, 100);

        let timer = monitor.start_operation("op1".to_string(), "plugin1".to_string());
        timer.complete_with_duration(10, true);

        let timer = monitor.start_operation("op2".to_string(), "plugin2".to_string());
        timer.complete_with_duration(20, true);

        let summary = monitor.get_summary();
        assert_eq!(summary.total_operations, 2);
        assert_eq!(summary.successful_operations, 2);
        assert_eq!(summary.plugin_count, 2);
    }
}
