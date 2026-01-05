//! Plugin Validator Service
//! Handles plugin manifest validation and security checks
#![allow(dead_code)]
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

use crate::models::plugin::PluginManifest;

/// Validation error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    pub code: String,
    pub message: String,
    pub field: Option<String>,
}

/// Validation warning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationWarning {
    pub code: String,
    pub message: String,
    pub field: Option<String>,
}

/// Permission definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
}

pub struct PluginValidator {
    allowed_permissions: HashSet<String>,
}

impl PluginValidator {
    pub fn new() -> Self {
        let mut allowed_permissions = HashSet::new();

        // Define allowed permissions
        let permissions = vec![
            "clipboard:read".to_string(),
            "clipboard:write".to_string(),
            "fs:read".to_string(),
            "fs:write".to_string(),
            "network".to_string(),
            "shell".to_string(),
            "notification".to_string(),
            "plugin:manage".to_string(),
        ];

        for permission in permissions {
            allowed_permissions.insert(permission);
        }

        Self {
            allowed_permissions,
        }
    }

    /// Validate plugin manifest
    pub fn validate_manifest(
        &self,
        manifest: &PluginManifest,
        plugin_id: Option<&str>,
    ) -> (Vec<ValidationError>, Vec<ValidationWarning>) {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        // Validate required fields
        self.validate_required_fields(&manifest, &mut errors, plugin_id);

        // Validate ID format if provided
        if let Some(id) = plugin_id {
            self.validate_plugin_id(id, &mut errors);
        }

        // Validate version format
        self.validate_version(&manifest.version, &mut errors);

        // Validate entry path
        self.validate_entry_path(&manifest.entry, &mut errors);

        // Validate permissions
        self.validate_permissions(&manifest.permissions, &mut errors, &mut warnings);

        // Validate triggers
        self.validate_triggers(&manifest.triggers, &mut errors);

        // Check for potential security issues
        self.validate_security(&manifest, &mut warnings);

        (errors, warnings)
    }

    /// Validate required fields are present
    fn validate_required_fields(
        &self,
        manifest: &PluginManifest,
        errors: &mut Vec<ValidationError>,
        plugin_id: Option<&str>,
    ) {
        // Validate plugin_id if provided
        if let Some(id) = plugin_id {
            if id.trim().is_empty() {
                errors.push(ValidationError {
                    code: "REQUIRED_FIELD_MISSING".to_string(),
                    message: "插件ID是必填项".to_string(),
                    field: Some("id".to_string()),
                });
            }
        }

        if manifest.name.trim().is_empty() {
            errors.push(ValidationError {
                code: "REQUIRED_FIELD_MISSING".to_string(),
                message: "插件名称是必填项".to_string(),
                field: Some("name".to_string()),
            });
        }

        if manifest.description.trim().is_empty() {
            errors.push(ValidationError {
                code: "REQUIRED_FIELD_MISSING".to_string(),
                message: "插件描述是必填项".to_string(),
                field: Some("description".to_string()),
            });
        }

        if manifest.author.as_ref().map(|a| a.trim()).unwrap_or_default().is_empty() {
            errors.push(ValidationError {
                code: "REQUIRED_FIELD_MISSING".to_string(),
                message: "插件作者是必填项".to_string(),
                field: Some("author".to_string()),
            });
        }

        if manifest.entry.trim().is_empty() {
            errors.push(ValidationError {
                code: "REQUIRED_FIELD_MISSING".to_string(),
                message: "入口文件路径是必填项".to_string(),
                field: Some("entry".to_string()),
            });
        }
    }

    /// Validate plugin ID format
    fn validate_plugin_id(&self, id: &str, errors: &mut Vec<ValidationError>) {
        // ID format: lowercase alphanumeric with hyphens, 3-50 chars
        if !is_valid_plugin_id(id) {
            errors.push(ValidationError {
                code: "INVALID_ID_FORMAT".to_string(),
                message: "插件ID格式无效：只能包含小写字母、数字和连字符，长度3-50字符".to_string(),
                field: Some("id".to_string()),
            });
        }

        // Check for reserved words
        let reserved_words = vec!["kaka", "system", "core", "admin", "root"];
        if reserved_words.iter().any(|word| id.contains(word)) {
            errors.push(ValidationError {
                code: "RESERVED_ID".to_string(),
                message: "插件ID包含保留字".to_string(),
                field: Some("id".to_string()),
            });
        }
    }

    /// Validate semantic version
    fn validate_version(&self, version: &str, errors: &mut Vec<ValidationError>) {
        if !is_valid_semver(version) {
            errors.push(ValidationError {
                code: "INVALID_VERSION_FORMAT".to_string(),
                message: "版本号格式无效：应符合语义化版本 (x.y.z)".to_string(),
                field: Some("version".to_string()),
            });
        }
    }

    /// Validate entry file path
    fn validate_entry_path(&self, entry: &str, errors: &mut Vec<ValidationError>) {
        // Check for path traversal attempts
        if entry.contains("..") || entry.starts_with('/') {
            errors.push(ValidationError {
                code: "INVALID_ENTRY_PATH".to_string(),
                message: "入口文件路径包含非法字符".to_string(),
                field: Some("entry".to_string()),
            });
        }

        // Check for suspicious file extensions
        let suspicious_extensions = vec![".exe", ".bat", ".sh", ".cmd", ".ps1"];
        if suspicious_extensions
            .iter()
            .any(|ext| entry.to_lowercase().ends_with(ext))
        {
            errors.push(ValidationError {
                code: "SUSPICIOUS_ENTRY".to_string(),
                message: "入口文件使用了可疑的文件扩展名".to_string(),
                field: Some("entry".to_string()),
            });
        }
    }

    /// Validate permissions
    fn validate_permissions(
        &self,
        permissions: &[String],
        errors: &mut Vec<ValidationError>,
        warnings: &mut Vec<ValidationWarning>,
    ) {
        for permission in permissions {
            // Check if permission is allowed
            if !self.allowed_permissions.contains(permission) {
                errors.push(ValidationError {
                    code: "UNAUTHORIZED_PERMISSION".to_string(),
                    message: format!("未授权的权限: {}", permission),
                    field: Some("permissions".to_string()),
                });
            }

            // Warn about dangerous permissions
            if is_dangerous_permission(permission) {
                warnings.push(ValidationWarning {
                    code: "DANGEROUS_PERMISSION".to_string(),
                    message: format!("权限具有潜在风险: {}", permission),
                    field: Some("permissions".to_string()),
                });
            }
        }
    }

    /// Validate triggers
    fn validate_triggers(
        &self,
        triggers: &[crate::models::plugin::PluginTrigger],
        errors: &mut Vec<ValidationError>,
    ) {
        for trigger in triggers {
            if trigger.keyword.trim().is_empty() {
                errors.push(ValidationError {
                    code: "INVALID_TRIGGER".to_string(),
                    message: "触发器关键字不能为空".to_string(),
                    field: Some("triggers".to_string()),
                });
            }

            // Check for reserved trigger keywords
            let reserved_triggers = vec!["kaka:", "help:", "about:", "settings:"];
            if reserved_triggers
                .iter()
                .any(|reserved| trigger.keyword.to_lowercase().starts_with(reserved))
            {
                errors.push(ValidationError {
                    code: "RESERVED_TRIGGER".to_string(),
                    message: format!("触发器关键字与保留字冲突: {}", trigger.keyword),
                    field: Some("triggers".to_string()),
                });
            }
        }
    }

    /// Validate for security issues
    fn validate_security(&self, manifest: &PluginManifest, warnings: &mut Vec<ValidationWarning>) {
        // Warn if plugin has too many permissions
        if manifest.permissions.len() > 5 {
            warnings.push(ValidationWarning {
                code: "MANY_PERMISSIONS".to_string(),
                message: "插件请求的权限数量较多，建议最小化权限".to_string(),
                field: Some("permissions".to_string()),
            });
        }

        // Warn about network access
        if manifest.permissions.contains(&"network".to_string()) {
            warnings.push(ValidationWarning {
                code: "NETWORK_ACCESS".to_string(),
                message: "插件请求网络访问权限，请确保来源可信".to_string(),
                field: Some("permissions".to_string()),
            });
        }

        // Warn about shell access
        if manifest.permissions.contains(&"shell".to_string()) {
            warnings.push(ValidationWarning {
                code: "SHELL_ACCESS".to_string(),
                message: "插件请求Shell执行权限，具有安全风险".to_string(),
                field: Some("permissions".to_string()),
            });
        }
    }

    /// Get all allowed permissions
    pub fn get_allowed_permissions(&self) -> Vec<PermissionDefinition> {
        vec![
            PermissionDefinition {
                id: "clipboard:read".to_string(),
                name: "剪贴板读取".to_string(),
                description: "读取系统剪贴板内容".to_string(),
                category: "剪贴板".to_string(),
            },
            PermissionDefinition {
                id: "clipboard:write".to_string(),
                name: "剪贴板写入".to_string(),
                description: "写入内容到系统剪贴板".to_string(),
                category: "剪贴板".to_string(),
            },
            PermissionDefinition {
                id: "fs:read".to_string(),
                name: "文件读取".to_string(),
                description: "读取用户文件系统".to_string(),
                category: "文件系统".to_string(),
            },
            PermissionDefinition {
                id: "fs:write".to_string(),
                name: "文件写入".to_string(),
                description: "写入文件到用户文件系统".to_string(),
                category: "文件系统".to_string(),
            },
            PermissionDefinition {
                id: "network".to_string(),
                name: "网络访问".to_string(),
                description: "访问网络资源".to_string(),
                category: "网络".to_string(),
            },
            PermissionDefinition {
                id: "shell".to_string(),
                name: "Shell执行".to_string(),
                description: "执行系统命令".to_string(),
                category: "系统".to_string(),
            },
            PermissionDefinition {
                id: "notification".to_string(),
                name: "系统通知".to_string(),
                description: "显示系统通知".to_string(),
                category: "系统".to_string(),
            },
            PermissionDefinition {
                id: "plugin:manage".to_string(),
                name: "插件管理".to_string(),
                description: "管理其他插件".to_string(),
                category: "插件".to_string(),
            },
        ]
    }

    // ========================================================================
    // Security Enhancement (T056, T064)
    // ========================================================================

    /// Validate plugin for security vulnerabilities (enhanced)
    pub fn validate_security_enhanced(&self, manifest: &PluginManifest) -> (Vec<ValidationError>, Vec<ValidationWarning>) {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        // Validate permission combinations for security risks
        self.validate_permission_combinations(&manifest.permissions, &mut warnings);

        // Check for potentially dangerous keywords
        self.validate_dangerous_keywords(manifest, &mut errors);

        // Validate plugin integrity
        self.validate_integrity(manifest, &mut warnings);

        (errors, warnings)
    }

    /// Validate permission combinations for security risks
    fn validate_permission_combinations(&self, permissions: &[String], warnings: &mut Vec<ValidationWarning>) {
        // Check for dangerous permission combinations
        let has_network = permissions.contains(&"network".to_string());
        let has_shell = permissions.contains(&"shell".to_string());
        let has_fs_write = permissions.contains(&"fs:write".to_string());
        let has_plugin_manage = permissions.contains(&"plugin:manage".to_string());

        // Network + Shell is especially dangerous
        if has_network && has_shell {
            warnings.push(ValidationWarning {
                code: "DANGEROUS_PERMISSION_COMBO".to_string(),
                message: "插件同时拥有网络访问和Shell执行权限,具有极高风险".to_string(),
                field: Some("permissions".to_string()),
            });
        }

        // File write + Plugin manage can modify other plugins
        if has_fs_write && has_plugin_manage {
            warnings.push(ValidationWarning {
                code: "DANGEROUS_PERMISSION_COMBO".to_string(),
                message: "插件可以修改系统文件和其他插件,具有极高风险".to_string(),
                field: Some("permissions".to_string()),
            });
        }

        // Too many dangerous permissions
        let dangerous_count = [has_network, has_shell, has_fs_write, has_plugin_manage]
            .iter()
            .filter(|&&x| x)
            .count();

        if dangerous_count >= 3 {
            warnings.push(ValidationWarning {
                code: "EXCESSIVE_DANGEROUS_PERMISSIONS".to_string(),
                message: format!("插件拥有 {} 个高风险权限,建议仔细审查", dangerous_count),
                field: Some("permissions".to_string()),
            });
        }
    }

    /// Validate for dangerous keywords
    fn validate_dangerous_keywords(&self, manifest: &PluginManifest, errors: &mut Vec<ValidationError>) {
        let dangerous_keywords = vec![
            "password", "token", "secret", "key", "credential",
            "bitcoin", "crypto", "wallet", "mining",
        ];

        let check_field = |value: &str| {
            let value_lower = value.to_lowercase();
            for keyword in &dangerous_keywords {
                if value_lower.contains(keyword) {
                    return true;
                }
            }
            false
        };

        if check_field(&manifest.name) || check_field(&manifest.description) {
            errors.push(ValidationError {
                code: "DANGEROUS_KEYWORDS".to_string(),
                message: "插件包含潜在危险的敏感关键词".to_string(),
                field: Some("general".to_string()),
            });
        }
    }

    /// Validate plugin integrity
    fn validate_integrity(&self, manifest: &PluginManifest, warnings: &mut Vec<ValidationWarning>) {
        // Check if author field is suspicious
        if let Some(author) = &manifest.author {
            if author.is_empty() || author.len() < 2 {
                warnings.push(ValidationWarning {
                    code: "INVALID_AUTHOR".to_string(),
                    message: "插件作者信息不完整或无效".to_string(),
                    field: Some("author".to_string()),
                });
            }
        }

        // Check version for suspicious patterns
        if manifest.version.contains("malware") ||
           manifest.version.contains("hack") ||
           manifest.version.contains("crack") {
            warnings.push(ValidationWarning {
                code: "SUSPICIOUS_VERSION".to_string(),
                message: "插件版本号包含可疑关键词".to_string(),
                field: Some("version".to_string()),
            });
        }

        // Warn if plugin has no description
        if manifest.description.trim().is_empty() {
            warnings.push(ValidationWarning {
                code: "NO_DESCRIPTION".to_string(),
                message: "插件缺少描述信息,无法确认其用途".to_string(),
                field: Some("description".to_string()),
            });
        }
    }

    /// Calculate security score (0-100)
    pub fn calculate_security_score(&self, manifest: &PluginManifest) -> u8 {
        let mut score = 100u8;

        // Deduct points for permissions
        let permission_count = manifest.permissions.len();
        if permission_count > 5 {
            score -= (permission_count - 5) as u8 * 5;
        }

        // Deduct for dangerous permissions
        if manifest.permissions.contains(&"shell".to_string()) {
            score -= 15;
        }
        if manifest.permissions.contains(&"network".to_string()) {
            score -= 10;
        }
        if manifest.permissions.contains(&"fs:write".to_string()) {
            score -= 10;
        }

        // Deduct for missing metadata
        if manifest.author.as_ref().map_or(true, |a| a.trim().is_empty()) {
            score -= 10;
        }
        if manifest.description.trim().is_empty() {
            score -= 10;
        }

        // Ensure score doesn't go below 0
        score.max(0)
    }
}

/// Helper function to validate plugin ID format
fn is_valid_plugin_id(id: &str) -> bool {
    if id.len() < 3 || id.len() > 50 {
        return false;
    }

    id.chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

/// Helper function to validate semantic version
fn is_valid_semver(version: &str) -> bool {
    let parts: Vec<&str> = version.split('.').collect();
    if parts.len() != 3 {
        return false;
    }

    for (i, part) in parts.iter().enumerate() {
        if part.is_empty() {
            return false;
        }

        // Check if part contains only digits (major, minor) or digits with optional suffix (patch)
        if i == 2 {
            // Allow things like "1.0.0-beta" - patch version must start with at least one digit
            if !part.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false) {
                return false;
            }
        } else if !part.chars().all(|c| c.is_ascii_digit()) {
            return false;
        }
    }

    true
}

/// Helper function to check for dangerous permissions
fn is_dangerous_permission(permission: &str) -> bool {
    permission == "shell" || permission == "fs:write" || permission == "network"
}
