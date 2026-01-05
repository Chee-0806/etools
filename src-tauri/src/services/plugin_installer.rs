/**
 * Plugin Installer Service
 * Handles plugin package extraction, validation, and installation
 */

use std::fs;
use std::path::{Path, PathBuf};
use zip::ZipArchive;
use flate2::read::GzDecoder;
use tar::Archive;
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};
use tempfile::TempDir;

use crate::models::plugin::PluginManifest;

/// Plugin installation progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallProgress {
    pub stage: String,
    pub progress: u8,
    pub message: String,
}

/// Package validation result
#[derive(Debug, Serialize, Deserialize)]
pub struct PackageValidation {
    pub is_valid: bool,
    pub manifest: Option<PluginManifest>,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Extraction result
#[derive(Debug, Serialize, Deserialize)]
pub struct ExtractionResult {
    pub path: String,
    pub manifest: PluginManifest,
    pub files: Vec<ExtractedFile>,
}

/// Extracted file information
#[derive(Debug, Serialize, Deserialize)]
pub struct ExtractedFile {
    pub path: String,
    pub size: u64,
    pub file_type: String, // "file" or "directory"
}

pub struct PluginInstaller {
    temp_dir: PathBuf,
    plugins_dir: PathBuf,
}

impl PluginInstaller {
    pub fn new(temp_dir: PathBuf, plugins_dir: PathBuf) -> Self {
        Self { 
            temp_dir,
            plugins_dir,
        }
    }

    /// Validate a plugin package before installation
    pub async fn validate_package(&self, file_path: &str) -> Result<PackageValidation> {
        let mut errors = Vec::new();
        let warnings = Vec::new();
        
        let path = Path::new(file_path);
        
        // Check file extension
        if !self.is_supported_format(&path) {
            errors.push("不支持的文件格式，请使用 .zip 或 .tar.gz 文件".to_string());
            return Ok(PackageValidation {
                is_valid: false,
                manifest: None,
                errors,
                warnings,
            });
        }

        // Extract and validate manifest
        let manifest = match self.extract_and_validate_manifest(&path).await {
            Ok(manifest) => manifest,
            Err(e) => {
                errors.push(format!("插件清单验证失败: {}", e));
                return Ok(PackageValidation {
                    is_valid: false,
                    manifest: None,
                    errors,
                    warnings,
                });
            }
        };

        // Validate manifest fields
        if let Some(manifest_errors) = self.validate_manifest_fields(&manifest, None) {
            errors.extend(manifest_errors);
        }

        Ok(PackageValidation {
            is_valid: errors.is_empty(),
            manifest: Some(manifest),
            errors,
            warnings,
        })
    }

    /// Extract plugin package to temporary directory
    pub async fn extract_package(&self, file_path: &str) -> Result<ExtractionResult> {
        let path = Path::new(file_path);
        
        // Create temporary extraction directory
        let extract_dir = self.temp_dir.join(Uuid::new_v4().to_string());
        fs::create_dir_all(&extract_dir)?;
        
        // Extract based on file format
        match path.extension().and_then(|s| s.to_str()) {
            Some("zip") => self.extract_zip(&path, &extract_dir).await?,
            Some("gz") => {
                if let Some(parent) = path.parent() {
                    if let Some(file_stem) = parent.file_stem() {
                        if let Some(file_stem_str) = file_stem.to_str() {
                            // Handle .tar.gz files
                            let tar_path = parent.join(format!("{}.tar", file_stem_str));
                            if tar_path.exists() {
                                self.extract_tar(&tar_path, &extract_dir).await?;
                            } else {
                                return Err(anyhow!("Invalid .tar.gz format: missing .tar file"));
                            }
                        }
                    }
                } else {
                    return Err(anyhow!("Invalid .tar.gz format"));
                }
            }
            _ => return Err(anyhow!("不支持的文件格式")),
        }

        // Load and validate manifest
        let manifest = self.load_manifest(&extract_dir).await?;
        
        // Collect file list
        let files = self.collect_files(&extract_dir)?;
        
        Ok(ExtractionResult {
            path: extract_dir.to_string_lossy().to_string(),
            manifest,
            files,
        })
    }

    /// Install plugin from extracted directory
    pub async fn install_plugin(
        &self,
        extracted_path: &str,
        plugin_id: &str,
    ) -> Result<()> {
        let extract_path = Path::new(extracted_path);
        let plugin_dir = self.plugins_dir.join(plugin_id);
        
        // Check if plugin already exists
        if plugin_dir.exists() {
            return Err(anyhow!("插件已存在: {}", plugin_id));
        }

        // Create plugin directory
        fs::create_dir_all(&plugin_dir)?;
        
        // Move extracted files to plugin directory
        self.move_directory(&extract_path, &plugin_dir).await?;

        // Load and validate manifest
        let manifest = self.load_manifest(&plugin_dir).await?;
        if let Some(errors) = self.validate_manifest_fields(&manifest, Some(plugin_id)) {
            return Err(anyhow!("插件验证失败: {}", errors.join(", ")));
        }

        Ok(())
    }

    // Private helper methods
    
    /// Check if file format is supported
    fn is_supported_format(&self, path: &Path) -> bool {
        match path.extension().and_then(|s| s.to_str()) {
            Some("zip") | Some("gz") => true,
            _ => false,
        }
    }

    /// Extract ZIP archive
    async fn extract_zip(&self, zip_path: &Path, extract_dir: &Path) -> Result<()> {
        let file = fs::File::open(zip_path)
            .map_err(|e| anyhow!("无法打开ZIP文件: {}", e))?;
        let mut archive = ZipArchive::new(file)
            .map_err(|e| anyhow!("无法读取ZIP存档: {}", e))?;
        
        for i in 0..archive.len() {
            let mut file = archive.by_index(i)
                .map_err(|e| anyhow!("ZIP文件读取错误: {}", e))?;
            let outpath = extract_dir.join(file.name());
            
            if file.name().ends_with('/') {
                fs::create_dir_all(&outpath)?;
            } else {
                if let Some(parent) = outpath.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut outfile = fs::File::create(&outpath)
                    .map_err(|e| anyhow!("无法创建文件: {}", e))?;
                std::io::copy(&mut file, &mut outfile)?;
            }
        }
        
        Ok(())
    }

    /// Extract TAR archive
    async fn extract_tar(&self, tar_path: &Path, extract_dir: &Path) -> Result<()> {
        let file = fs::File::open(tar_path)
            .map_err(|e| anyhow!("无法打开TAR文件: {}", e))?;
        let decoder = GzDecoder::new(file);
        let mut archive = Archive::new(decoder);
        
        archive.unpack(extract_dir)
            .map_err(|e| anyhow!("TAR解压失败: {}", e))?;
        
        Ok(())
    }

    /// Extract and validate plugin manifest
    async fn extract_and_validate_manifest(&self, package_path: &Path) -> Result<PluginManifest> {
        // Create temporary directory for extraction
        let temp_dir = TempDir::new()?;
        let extract_dir = temp_dir.path();
        
        // Extract just enough to get manifest
        match package_path.extension().and_then(|s| s.to_str()) {
            Some("zip") => self.extract_zip_manifest(package_path, extract_dir).await?,
            Some("gz") => self.extract_tar_manifest(package_path, extract_dir).await?,
            _ => return Err(anyhow!("不支持的文件格式")),
        }

        // Load and validate manifest
        self.load_manifest(extract_dir).await
    }

    /// Extract manifest from ZIP (optimized for small extraction)
    async fn extract_zip_manifest(&self, zip_path: &Path, extract_dir: &Path) -> Result<()> {
        let file = fs::File::open(zip_path)?;
        let mut archive = ZipArchive::new(file)?;

        // Only extract plugin.json
        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            if file.name().ends_with("plugin.json") ||
               file.name().ends_with("plugin.toml") {
                let outpath = extract_dir.join(file.name());
                if let Some(parent) = outpath.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut outfile = fs::File::create(&outpath)?;
                std::io::copy(&mut file, &mut outfile)?;
                break;
            }
        }

        Ok(())
    }

    /// Extract manifest from TAR (optimized for small extraction)
    async fn extract_tar_manifest(&self, tar_path: &Path, extract_dir: &Path) -> Result<()> {
        // Handle .tar.gz files
        let tar_file = if tar_path.extension().and_then(|s| s.to_str()) == Some("gz") {
            if let Some(parent) = tar_path.parent() {
                if let Some(file_stem) = parent.file_stem() {
                    parent.join(format!("{}.tar", file_stem.to_string_lossy()))
                } else {
                    return Err(anyhow!("无效的.tar.gz格式"));
                }
            } else {
                return Err(anyhow!("无效的.tar.gz格式"));
            }
        } else {
            tar_path.to_path_buf()
        };

        let file = fs::File::open(&tar_file)?;
        let decoder = GzDecoder::new(file);
        let mut archive = Archive::new(decoder);
        
        // Only extract manifest files
        for entry in archive.entries()? {
            let mut entry = entry?;
            let path = entry.path()?;
            if let Some(path_str) = path.to_str() {
                if path_str.ends_with("plugin.json") ||
                   path_str.ends_with("plugin.toml") {
                    // Extract just the filename, not the full path
                    if let Some(file_name) = PathBuf::from(path_str).file_name() {
                        let outpath = extract_dir.join(file_name);
                        let mut outfile = fs::File::create(&outpath)?;
                        std::io::copy(&mut entry, &mut outfile)?;
                    }
                    break;
                }
            }
        }
        
        Ok(())
    }

    /// Load manifest from directory
    async fn load_manifest(&self, dir: &Path) -> Result<PluginManifest> {
        // Try plugin.json first
        let manifest_path = dir.join("plugin.json");
        if manifest_path.exists() {
            let content = fs::read_to_string(&manifest_path)?;
            return serde_json::from_str(&content)
                .map_err(|e| anyhow!("JSON解析失败: {}", e));
        }
        
        // Try plugin.toml
        let manifest_path = dir.join("plugin.toml");
        if manifest_path.exists() {
            let content = fs::read_to_string(&manifest_path)?;
            // For now, assume TOML format will be similar to JSON structure
            // In real implementation, you'd use toml crate
            return serde_json::from_str(&content)
                .map_err(|e| anyhow!("配置文件解析失败: {}", e));
        }
        
        Err(anyhow!("找不到插件清单文件"))
    }

    /// Validate manifest fields
    fn validate_manifest_fields(&self, manifest: &PluginManifest, plugin_id: Option<&str>) -> Option<Vec<String>> {
        let mut errors = Vec::new();

        // Validate ID format if provided
        if let Some(id) = plugin_id {
            if id.is_empty() {
                errors.push("插件ID不能为空".to_string());
            } else if !id.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
                errors.push("插件ID只能包含小写字母、数字和连字符".to_string());
            }
        }

        // Validate version
        if manifest.version.is_empty() {
            errors.push("版本号不能为空".to_string());
        }

        // Validate required fields
        if manifest.name.is_empty() {
            errors.push("插件名称不能为空".to_string());
        }

        if manifest.description.is_empty() {
            errors.push("插件描述不能为空".to_string());
        }

        if manifest.entry.is_empty() {
            errors.push("入口文件路径不能为空".to_string());
        }

        if errors.is_empty() {
            None
        } else {
            Some(errors)
        }
    }

    /// Collect all files in directory recursively
    fn collect_files(&self, dir: &Path) -> Result<Vec<ExtractedFile>> {
        let mut files = Vec::new();
        self.collect_files_recursive(dir, &mut files, "")?;
        Ok(files)
    }

    /// Recursive file collection helper
    fn collect_files_recursive(&self, dir: &Path, files: &mut Vec<ExtractedFile>, base_path: &str) -> Result<()> {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            let relative_path = path.strip_prefix(dir)
                .map_err(|_| anyhow!("路径计算错误"))?;
            let relative_str = relative_path.to_string_lossy();
            let full_relative = if base_path.is_empty() {
                relative_str.to_string()
            } else {
                format!("{}/{}", base_path, relative_str)
            };

            let metadata = fs::metadata(&path)?;
            let file_type = if path.is_dir() { "directory" } else { "file" };

            files.push(ExtractedFile {
                path: full_relative.clone(),
                size: metadata.len(),
                file_type: file_type.to_string(),
            });

            if path.is_dir() {
                self.collect_files_recursive(&path, files, &full_relative)?;
            }
        }
        Ok(())
    }

    /// Move directory contents
    async fn move_directory(&self, src: &Path, dst: &Path) -> Result<()> {
        for entry in fs::read_dir(src)? {
            let entry = entry?;
            let src_path = entry.path();
            let file_name_os = entry.file_name();
            let file_name = file_name_os
                .to_str()
                .ok_or_else(|| anyhow!("无效的文件名"))?;
            let dst_path = dst.join(file_name);

            if src_path.is_dir() {
                fs::create_dir_all(&dst_path)?;
                // Use a non-recursive approach by iterating
                self.move_directory_recursive(&src_path, &dst_path)?;
            } else {
                fs::rename(&src_path, &dst_path)?;
            }
        }

        // Clean up source directory
        fs::remove_dir_all(src)?;
        Ok(())
    }

    /// Helper for recursive directory moving
    fn move_directory_recursive(&self, src: &Path, dst: &Path) -> Result<()> {
        for entry in fs::read_dir(src)? {
            let entry = entry?;
            let src_path = entry.path();
            let file_name_os = entry.file_name();
            let file_name = file_name_os
                .to_str()
                .ok_or_else(|| anyhow!("无效的文件名"))?;
            let dst_path = dst.join(file_name);

            if src_path.is_dir() {
                fs::create_dir_all(&dst_path)?;
                self.move_directory_recursive(&src_path, &dst_path)?;
            } else {
                fs::rename(&src_path, &dst_path)?;
            }
        }
        Ok(())
    }
}