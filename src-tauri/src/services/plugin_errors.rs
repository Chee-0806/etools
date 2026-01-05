//! Plugin Error Handling
//! Comprehensive error types and user-friendly error messages for plugin operations
#![allow(dead_code)]

use std::fmt;

/// Plugin error types with user-friendly messages
#[derive(Debug, Clone)]
pub enum PluginError {
    /// Plugin not found
    PluginNotFound {
        plugin_id: String,
    },

    /// Invalid plugin package
    InvalidPackage {
        reason: String,
    },

    /// Plugin installation failed
    InstallationFailed {
        plugin_id: String,
        stage: String,
        reason: String,
    },

    /// Plugin validation failed
    ValidationFailed {
        errors: Vec<String>,
        warnings: Vec<String>,
    },

    /// Plugin operation not permitted
    PermissionDenied {
        operation: String,
        reason: String,
    },

    /// Plugin is a core plugin and cannot be modified
    CorePluginProtected {
        plugin_id: String,
    },

    /// Plugin already installed
    AlreadyInstalled {
        plugin_id: String,
        version: String,
    },

    /// Plugin dependencies not met
    DependenciesNotMet {
        missing: Vec<String>,
    },

    /// Plugin file system error
    FileSystemError {
        operation: String,
        path: String,
        reason: String,
    },

    /// Plugin state error
    StateError {
        operation: String,
        reason: String,
    },

    /// Network error (for marketplace)
    NetworkError {
        operation: String,
        reason: String,
    },

    /// Generic error with custom message
    Custom {
        message: String,
    },
}

impl PluginError {
    /// Get user-friendly error message in Chinese
    pub fn user_message(&self) -> String {
        match self {
            PluginError::PluginNotFound { plugin_id } => {
                format!("插件不存在: {}", plugin_id)
            }

            PluginError::InvalidPackage { reason } => {
                format!("无效的插件包: {}", reason)
            }

            PluginError::InstallationFailed { plugin_id, stage, reason } => {
                format!(
                    "插件安装失败 ({}) - {}: {}",
                    plugin_id, stage, reason
                )
            }

            PluginError::ValidationFailed { errors, warnings } => {
                let mut msg = String::from("插件验证失败:\n");
                if !errors.is_empty() {
                    msg.push_str("错误:\n");
                    for error in errors {
                        msg.push_str(&format!("  • {}\n", error));
                    }
                }
                if !warnings.is_empty() {
                    msg.push_str("警告:\n");
                    for warning in warnings {
                        msg.push_str(&format!("  • {}\n", warning));
                    }
                }
                msg
            }

            PluginError::PermissionDenied { operation, reason } => {
                format!("权限被拒绝 - {}: {}", operation, reason)
            }

            PluginError::CorePluginProtected { plugin_id } => {
                format!(
                    "无法修改核心插件: {} (核心插件受保护)",
                    plugin_id
                )
            }

            PluginError::AlreadyInstalled { plugin_id, version } => {
                format!(
                    "插件已安装: {} (版本: {})",
                    plugin_id, version
                )
            }

            PluginError::DependenciesNotMet { missing } => {
                format!(
                    "插件依赖未满足，缺少: {}",
                    missing.join(", ")
                )
            }

            PluginError::FileSystemError { operation, path, reason } => {
                format!(
                    "文件系统错误 - {} '{}': {}",
                    operation, path, reason
                )
            }

            PluginError::StateError { operation, reason } => {
                format!("状态错误 - {}: {}", operation, reason)
            }

            PluginError::NetworkError { operation, reason } => {
                format!("网络错误 - {}: {}", operation, reason)
            }

            PluginError::Custom { message } => message.clone(),
        }
    }

    /// Get error code for programmatic handling
    pub fn error_code(&self) -> &'static str {
        match self {
            PluginError::PluginNotFound { .. } => "PLUGIN_NOT_FOUND",
            PluginError::InvalidPackage { .. } => "INVALID_PACKAGE",
            PluginError::InstallationFailed { .. } => "INSTALLATION_FAILED",
            PluginError::ValidationFailed { .. } => "VALIDATION_FAILED",
            PluginError::PermissionDenied { .. } => "PERMISSION_DENIED",
            PluginError::CorePluginProtected { .. } => "CORE_PLUGIN_PROTECTED",
            PluginError::AlreadyInstalled { .. } => "ALREADY_INSTALLED",
            PluginError::DependenciesNotMet { .. } => "DEPENDENCIES_NOT_MET",
            PluginError::FileSystemError { .. } => "FILESYSTEM_ERROR",
            PluginError::StateError { .. } => "STATE_ERROR",
            PluginError::NetworkError { .. } => "NETWORK_ERROR",
            PluginError::Custom { .. } => "CUSTOM_ERROR",
        }
    }

    /// Check if error is recoverable
    pub fn is_recoverable(&self) -> bool {
        match self {
            PluginError::NetworkError { .. } => true,
            PluginError::FileSystemError { .. } => true,
            PluginError::StateError { .. } => true,
            _ => false,
        }
    }

    /// Get suggested actions for the user
    pub fn suggested_actions(&self) -> Vec<String> {
        match self {
            PluginError::PluginNotFound { .. } => vec![
                "检查插件ID是否正确".to_string(),
                "尝试重新安装插件".to_string(),
            ],

            PluginError::InvalidPackage { .. } => vec![
                "确保插件包文件完整".to_string(),
                "尝试重新下载插件包".to_string(),
                "检查插件包格式是否支持 (.zip 或 .tar.gz)".to_string(),
            ],

            PluginError::InstallationFailed { stage, .. } => vec![
                format!("检查 {} 阶段是否有足够权限", stage),
                "确保磁盘空间充足".to_string(),
                "查看详细错误日志".to_string(),
            ],

            PluginError::ValidationFailed { .. } => vec![
                "修复插件清单中的错误".to_string(),
                "联系插件作者".to_string(),
            ],

            PluginError::PermissionDenied { .. } => vec![
                "确保你有执行此操作的权限".to_string(),
                "检查插件权限设置".to_string(),
            ],

            PluginError::CorePluginProtected { .. } => vec![
                "核心插件不能被修改或删除".to_string(),
            ],

            PluginError::AlreadyInstalled { .. } => vec![
                "如需更新插件，请使用更新功能".to_string(),
                "如需重新安装，请先卸载现有版本".to_string(),
            ],

            PluginError::DependenciesNotMet { .. } => vec![
                "安装缺少的依赖".to_string(),
                "更新系统到最新版本".to_string(),
            ],

            PluginError::FileSystemError { .. } => vec![
                "检查文件系统权限".to_string(),
                "确保目标路径可访问".to_string(),
                "尝试以管理员权限运行".to_string(),
            ],

            PluginError::StateError { .. } => vec![
                "尝试重新加载插件".to_string(),
                "重启应用程序".to_string(),
            ],

            PluginError::NetworkError { .. } => vec![
                "检查网络连接".to_string(),
                "稍后重试".to_string(),
                "检查防火墙设置".to_string(),
            ],

            PluginError::Custom { .. } => vec![
                "查看详细错误信息".to_string(),
            ],
        }
    }
}

impl fmt::Display for PluginError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.user_message())
    }
}

impl std::error::Error for PluginError {}

/// Convert PluginError to String for Tauri commands
impl From<PluginError> for String {
    fn from(error: PluginError) -> String {
        error.user_message()
    }
}

/// Result type for plugin operations
pub type PluginResult<T> = Result<T, PluginError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_message_formatting() {
        let error = PluginError::PluginNotFound {
            plugin_id: "test-plugin".to_string(),
        };
        assert_eq!(
            error.user_message(),
            "插件不存在: test-plugin"
        );
    }

    #[test]
    fn test_error_code() {
        let error = PluginError::PluginNotFound {
            plugin_id: "test".to_string(),
        };
        assert_eq!(error.error_code(), "PLUGIN_NOT_FOUND");
    }

    #[test]
    fn test_recoverable_check() {
        assert!(PluginError::NetworkError {
            operation: "download".to_string(),
            reason: "timeout".to_string(),
        }
        .is_recoverable());

        assert!(!PluginError::CorePluginProtected {
            plugin_id: "core".to_string(),
        }
        .is_recoverable());
    }

    #[test]
    fn test_suggested_actions() {
        let error = PluginError::PluginNotFound {
            plugin_id: "test".to_string(),
        };
        let actions = error.suggested_actions();
        assert!(!actions.is_empty());
        assert!(actions[0].contains("检查"));
    }
}
