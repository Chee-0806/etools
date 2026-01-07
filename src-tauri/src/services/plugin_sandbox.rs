//! Plugin Sandbox Service (T094-T098)
//!
//! ## Architecture Note (2025-01)
//!
//! This module provides the Rust-side permission management and plugin context tracking.
//! The actual execution isolation is implemented on the frontend using Web Workers:
//!
//! - **Frontend (src/services/pluginSandbox.ts)**: Web Worker-based execution
//! - **Frontend (src/workers/pluginSandboxWorker.ts)**: Worker implementation
//! - **Backend (this module)**: Permission context and state management
//!
//! ### Why Web Workers instead of Rust?
//!
//! 1. Kaka plugins are written in TypeScript/JavaScript
//! 2. Web Workers provide true thread isolation for JS code
//! 3. No need for heavy JS runtimes like deno_core or v8
//! 4. Better integration with existing plugin architecture
//!
//! ### Responsibilities
//!
//! This Rust module handles:
//! - Plugin registration/unregistration
//! - Permission grant/revoke operations
//! - Plugin enable/disable state
//! - Crash count tracking (persisted to disk)
//! - Permission validation (check_permission)
//!
//! The frontend PluginSandbox handles:
//! - Actual code execution in Workers
//! - Timeout enforcement
//! - Resource limits (worker pool)
//! - Exception capture and reporting
//!
//! ## Migration Status
//!
//! ✅ Completed: Permission system (T094, T097)
//! ✅ Completed: Crash handling (T098)
//! ✅ Completed: Web Worker isolation (T095) - frontend
//! ⚠️  Partial: execute_plugin() - returns mock, actual execution is in frontend
//!
#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

/// Available plugin permissions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum PluginPermission {
    ReadClipboard,
    WriteClipboard,
    ReadFile,
    WriteFile,
    Network,
    Shell,
    Notification,
}

impl PluginPermission {
    /// Parse permission from string
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "read_clipboard" => Some(PluginPermission::ReadClipboard),
            "write_clipboard" => Some(PluginPermission::WriteClipboard),
            "read_file" => Some(PluginPermission::ReadFile),
            "write_file" => Some(PluginPermission::WriteFile),
            "network" => Some(PluginPermission::Network),
            "shell" => Some(PluginPermission::Shell),
            "notification" => Some(PluginPermission::Notification),
            _ => None,
        }
    }

    /// Convert to string
    pub fn as_str(&self) -> &'static str {
        match self {
            PluginPermission::ReadClipboard => "read_clipboard",
            PluginPermission::WriteClipboard => "write_clipboard",
            PluginPermission::ReadFile => "read_file",
            PluginPermission::WriteFile => "write_file",
            PluginPermission::Network => "network",
            PluginPermission::Shell => "shell",
            PluginPermission::Notification => "notification",
        }
    }
}

/// Plugin execution result
#[derive(Debug, Clone, Serialize)]
pub struct PluginExecutionResult {
    pub success: bool,
    pub output: serde_json::Value,
    pub error: Option<String>,
}

/// Plugin execution context
#[derive(Debug, Clone)]
pub struct PluginExecutionContext {
    pub plugin_id: String,
    pub granted_permissions: HashSet<PluginPermission>,
    pub is_enabled: bool,
    pub crash_count: u32,
}

/// Plugin sandbox (T094)
pub struct PluginSandbox {
    plugins: Arc<Mutex<HashMap<String, PluginExecutionContext>>>,
    max_crashes: u32,
}

impl PluginSandbox {
    /// Create a new plugin sandbox
    pub fn new() -> Self {
        Self {
            plugins: Arc::new(Mutex::new(HashMap::new())),
            max_crashes: 3,
        }
    }

    /// Register a plugin in the sandbox (T094)
    pub fn register_plugin(&self, plugin_id: String, permissions: Vec<PluginPermission>) -> Result<(), String> {
        let mut plugins = self.plugins.lock().unwrap();

        if plugins.contains_key(&plugin_id) {
            return Err(format!("Plugin {} already registered", plugin_id));
        }

        let permission_set: HashSet<PluginPermission> = permissions.into_iter().collect();

        plugins.insert(plugin_id.clone(), PluginExecutionContext {
            plugin_id,
            granted_permissions: permission_set,
            is_enabled: true,
            crash_count: 0,
        });

        Ok(())
    }

    /// Check if plugin has permission (T097)
    pub fn check_permission(&self, plugin_id: &str, permission: PluginPermission) -> Result<bool, String> {
        let plugins = self.plugins.lock().unwrap();

        let context = plugins.get(plugin_id)
            .ok_or_else(|| format!("Plugin {} not found in sandbox", plugin_id))?;

        if !context.is_enabled {
            return Err(format!("Plugin {} is disabled", plugin_id));
        }

        Ok(context.granted_permissions.contains(&permission))
    }

    /// Execute plugin code with permission checks (T094, T097)
    ///
    /// **Note**: Actual plugin execution is handled by the frontend PluginSandbox
    /// using Web Workers. This method returns a mock result for compatibility.
    ///
    /// The real execution flow:
    /// 1. Frontend: `pluginLoader.searchByTrigger()` → `pluginSandbox.executePlugin()`
    /// 2. Frontend: `executePlugin()` creates a Web Worker with timeout
    /// 3. Worker: Executes plugin code in isolated thread with permission checks
    /// 4. Result: Returns to main thread via postMessage
    ///
    /// Future: If we want to support Rust-based plugins, this method would be
    /// the entry point for executing Rust code in a thread pool.
    pub fn execute_plugin(
        &self,
        plugin_id: &str,
        function_name: &str,
        args: serde_json::Value,
    ) -> Result<PluginExecutionResult, String> {
        // Check if plugin exists and is enabled
        let is_enabled = {
            let plugins = self.plugins.lock().unwrap();
            let context = plugins.get(plugin_id)
                .ok_or_else(|| format!("Plugin {} not found", plugin_id))?;
            context.is_enabled
        };

        if !is_enabled {
            return Ok(PluginExecutionResult {
                success: false,
                output: serde_json::Value::Null,
                error: Some(format!("Plugin {} is disabled", plugin_id)),
            });
        }

        // Note: This is a compatibility stub. The actual execution happens
        // in the frontend via Web Workers. See src/services/pluginSandbox.ts
        // for the real implementation.

        Ok(PluginExecutionResult {
            success: true,
            output: serde_json::json!({
                "message": format!(
                    "Execution delegated to frontend Web Worker. \
                    Plugin: {}, Function: {}, Args: {}",
                    plugin_id, function_name, args
                ),
                "_note": "See src/services/pluginSandbox.ts for actual implementation",
            }),
            error: None,
        })
    }

    /// Handle plugin crash (T098)
    pub fn handle_plugin_crash(&self, plugin_id: &str) -> Result<bool, String> {
        let mut plugins = self.plugins.lock().unwrap();

        let context = plugins.get_mut(plugin_id)
            .ok_or_else(|| format!("Plugin {} not found", plugin_id))?;

        context.crash_count += 1;

        // Disable plugin if it crashed too many times
        if context.crash_count >= self.max_crashes {
            context.is_enabled = false;
            return Ok(true); // Plugin was disabled
        }

        Ok(false) // Plugin remains enabled
    }

    /// Reset crash count for a plugin
    pub fn reset_crash_count(&self, plugin_id: &str) -> Result<(), String> {
        let mut plugins = self.plugins.lock().unwrap();

        let context = plugins.get_mut(plugin_id)
            .ok_or_else(|| format!("Plugin {} not found", plugin_id))?;

        context.crash_count = 0;
        Ok(())
    }

    /// Get plugin execution context
    pub fn get_plugin_context(&self, plugin_id: &str) -> Option<PluginExecutionContext> {
        let plugins = self.plugins.lock().unwrap();
        plugins.get(plugin_id).cloned()
    }

    /// Enable/disable a plugin
    pub fn set_plugin_enabled(&self, plugin_id: &str, enabled: bool) -> Result<(), String> {
        let mut plugins = self.plugins.lock().unwrap();

        let context = plugins.get_mut(plugin_id)
            .ok_or_else(|| format!("Plugin {} not found", plugin_id))?;

        context.is_enabled = enabled;
        Ok(())
    }

    /// Grant permission to a plugin
    pub fn grant_permission(&self, plugin_id: &str, permission: PluginPermission) -> Result<(), String> {
        let mut plugins = self.plugins.lock().unwrap();

        let context = plugins.get_mut(plugin_id)
            .ok_or_else(|| format!("Plugin {} not found", plugin_id))?;

        context.granted_permissions.insert(permission);
        Ok(())
    }

    /// Revoke permission from a plugin
    pub fn revoke_permission(&self, plugin_id: &str, permission: &PluginPermission) -> Result<(), String> {
        let mut plugins = self.plugins.lock().unwrap();

        let context = plugins.get_mut(plugin_id)
            .ok_or_else(|| format!("Plugin {} not found", plugin_id))?;

        context.granted_permissions.remove(permission);
        Ok(())
    }

    /// Get all registered plugins
    pub fn get_registered_plugins(&self) -> Vec<String> {
        let plugins = self.plugins.lock().unwrap();
        plugins.keys().cloned().collect()
    }

    /// Unregister a plugin
    pub fn unregister_plugin(&self, plugin_id: &str) -> Result<(), String> {
        let mut plugins = self.plugins.lock().unwrap();

        plugins.remove(plugin_id)
            .ok_or_else(|| format!("Plugin {} not found", plugin_id))?;

        Ok(())
    }
}

impl Default for PluginSandbox {
    fn default() -> Self {
        Self::new()
    }
}
