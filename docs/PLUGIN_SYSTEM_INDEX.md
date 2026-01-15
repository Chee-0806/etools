# ETools 插件系统文档汇总

## 📚 文档目录

本文档汇总了 ETools 插件系统的所有相关文档。

### 核心文档

1. **[插件管理系统](./docs/plugin-management.md)** ⭐
   - 插件系统完整使用指南
   - NPM 命令和 API 说明
   - 前端和后端实现细节
   - 安全和性能优化

2. **[系统架构](./docs/NPM_ARCHITECTURE.md)** 🏗️
   - 完整的系统架构图
   - 工作流程详解（安装/更新/卸载）
   - 组件交互关系
   - 数据流向说明

3. **[NPM 插件规范](./docs/NPM_PLUGIN_SPEC.md)** 📦
   - 插件包结构规范
   - package.json 配置要求
   - etools 元数据字段
   - 权限和分类定义

4. **[开发指南](./docs/NPM_PLUGIN_DEV_GUIDE.md)** 🛠️
   - 开发环境搭建
   - 插件开发步骤
   - 构建和发布流程
   - 在 ETools 中测试插件

5. **[迁移指南](./docs/NPM_MIGRATION_GUIDE.md)** 🚀
   - 从自定义市场迁移到 NPM
   - 迁移完成清单
   - 成本对比分析
   - 使用说明

---

## 🎯 快速导航

### 我想...

#### 了解插件系统如何工作
→ 阅读 **[系统架构](./docs/NPM_ARCHITECTURE.md)**
- 了解 NPM Registry 如何集成
- 理解安装、更新、卸载流程
- 查看完整的架构图

#### 使用插件管理功能
→ 阅读 **[插件管理系统](./docs/plugin-management.md)**
- 了解如何安装插件
- 学习如何管理已安装插件
- 掌握批量操作技巧
- 理解权限系统

#### 开发自己的插件
→ 阅读 **[NPM 插件规范](./docs/NPM_PLUGIN_SPEC.md)**
→ 阅读 **[开发指南](./docs/NPM_PLUGIN_DEV_GUIDE.md)**
- 学习插件包结构
- 理解 package.json 配置
- 掌握插件代码规范
- 学习如何发布到 npm

#### 迁移旧插件
→ 阅读 **[迁移指南](./docs/NPM_MIGRATION_GUIDE.md)**
- 了解迁移原因和优势
- 学习迁移步骤
- 查看成本对比

---

## 🔑 核心概念

### NPM 插件系统

ETools 使用标准的 npm 生态系统来分发和管理插件。

**关键特性**：
- ✅ 基于 npm Registry
- ✅ 标准的 npm 包
- ✅ 使用 `@etools-plugin` 命名空间
- ✅ 语义化版本管理
- ✅ 自动依赖处理

### 插件包名

所有插件包名必须遵循以下格式：

```
@etools-plugin/<plugin-name>
```

示例：
- `@etools-plugin/devtools` - 开发工具
- `@etools-plugin/hello` - Hello World 示例
- `@etools-plugin/json-formatter` - JSON 格式化

### package.json etools 字段

在 npm 包的 `package.json` 中定义 ETools 特定字段：

```json
{
  "name": "@etools-plugin/hello",
  "etools": {
    "id": "hello",
    "title": "Hello Plugin",
    "description": "A greeting plugin",
    "icon": "./assets/icon.png",
    "triggers": ["hello:"],
    "permissions": [],
    "category": "productivity"
  }
}
```

---

## 📊 系统对比

| 特性 | 自建市场 | NPM 系统 |
|------|----------|----------|
| **服务器** | 需要多台服务器 | 零成本 |
| **数据库** | 需要 PostgreSQL | 零成本 |
| **CDN** | 需要 CloudFront | npm 免费提供 |
| **存储** | 需要 S3/OSS | npm 免费提供 |
| **带宽** | 按流量付费 | npm 承担 |
| **维护** | 需要 DevOps | npm 维护 |
| **分发** | 受限 | 全球 CDN |
| **月成本估算** | **$50-500+** | **$0** |

---

## 🚀 快速开始

### 安装现有插件

```bash
# 方法 1: 在 ETools 中安装
1. 打开 ETools
2. 进入设置 → 插件市场
3. 搜索或浏览插件
4. 点击"安装"
```

### 开发新插件

```bash
# 1. 创建插件目录
mkdir -p npm-packages/@etools-plugin/my-plugin
cd npm-packages/@etools-plugin/my-plugin

# 2. 初始化 npm 包
npm init -y

# 3. 添加依赖
npm install --save-dev typescript vite @etools/sdk

# 4. 编写插件代码
# 创建 src/index.ts 和配置 package.json

# 5. 构建和发布
npm run build
npm publish --access public
```

### 在 ETools 中测试

```bash
# 使用本地包测试
cd /path/to/etools
npm install file:./npm-packages/@etools-plugin/my-plugin

# 然后在 ETools 中测试
```

---

## 📖 Tauri 命令参考

### NPM 市场命令

| 命令 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `marketplace_list` | category?, page?, pageSize? | MarketplacePluginPage | 获取插件列表 |
| `marketplace_search` | query, category?, page?, pageSize? | MarketplacePluginPage | 搜索插件 |
| `marketplace_install` | packageName | Plugin | 安装插件 |
| `marketplace_uninstall` | packageName | () | 卸载插件 |
| `marketplace_update` | packageName | Plugin | 更新插件 |
| `marketplace_check_updates` | - | PluginUpdateInfo[] | 检查更新 |
| `marketplace_get_plugin` | packageName | MarketplacePlugin | 获取插件详情 |
| `get_installed_plugins` | - | Plugin[] | 获取已安装插件 |

### 插件管理命令

| 命令 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `plugin_enable` | pluginId | Plugin | 启用插件 |
| `plugin_disable` | pluginId | Plugin | 禁用插件 |
| `plugin_uninstall` | pluginId | () | 卸载插件 |
| `bulk_enable_plugins` | pluginIds[] | BulkOperation | 批量启用 |
| `bulk_disable_plugins` | pluginIds[] | BulkOperation | 批量禁用 |
| `bulk_uninstall_plugins` | pluginIds[] | BulkOperation | 批量卸载 |
| `get_plugin_health` | pluginId | PluginHealth | 获取健康状态 |
| `check_plugin_health` | pluginId | PluginHealth | 检查健康 |
| `get_plugin_usage_stats` | pluginId | PluginUsageStats | 获取使用统计 |

---

## 🔐 权限系统

### 可用权限

| 权限 | 描述 | Tauri 命令 |
|--------|------|-------------|
| `read_clipboard` | 读取剪贴板 | `get_clipboard_history` |
| `write_clipboard` | 写入剪贴板 | `paste_clipboard_item` |
| `read_files` | 读取文件 | `read_file` |
| `write_files` | 写入文件 | `write_file` |
| `network` | 网络访问 | `fetch` |
| `shell` | Shell 命令 | `execute_shell` |
| `notifications` | 系统通知 | `send_notification` |

### 权限请求

插件需要在 `package.json` 的 `etools.permissions` 字段中声明所需的权限：

```json
{
  "etools": {
    "permissions": ["read_clipboard", "write_files"]
  }
}
```

用户首次使用需要权限的插件时，ETools 会提示用户授权。

---

## 🛡️ 安全最佳实践

### 1. 最小权限原则

只申请插件功能所需的权限，不要过度申请。

**错误示例**：
```json
{
  "etools": {
    "permissions": ["shell", "network", "read_clipboard", "write_files"]
    // 一个简单的格式化插件不应该需要 shell 权限！
  }
}
```

**正确示例**：
```json
{
  "etools": {
    "permissions": ["network"]  // 只申请网络权限
  }
}
```

### 2. 版本管理

遵循语义化版本（Semver）：

- `1.0.0` → `1.0.1` - Bug 修复
- `1.0.0` → `1.1.0` - 新功能，向后兼容
- `1.0.0` → `2.0.0` - 破坏性变更

### 3. 错误处理

始终提供友好的错误消息和恢复建议：

```typescript
try {
  await operation();
} catch (error) {
  console.error('操作失败:', error);
  // 提供恢复建议
  showUserMessage('请检查网络连接后重试');
}
```

---

## 🔍 故障排除

### 常见问题

**Q: 插件安装失败**
```
A: 检查：
1. 网络连接是否正常
2. npm 配置是否正确（npm config list）
3. package.json 是否包含必需字段
4. 插件包名是否以 @etools-plugin/ 开头
```

**Q: 插件更新后不生效**
```
A: 检查：
1. 是否需要重启 ETools
2. node_modules 中的插件是否已更新
3. 插件是否已启用
4. 查看控制台错误日志
```

**Q: 插件搜索结果为空**
```
A: 检查：
1. npm Registry 是否可访问
2. 插件是否正确添加了 etools-plugin 关键词
3. 网络代理设置是否正确
```

---

## 📝 贡献指南

### 提交插件

1. Fork ETools 仓库
2. 创建插件分支
3. 在 `npm-packages/` 下开发插件
4. 提交插件代码
5. 创建 Pull Request

### 报告问题

1. 在 GitHub Issues 中搜索相关问题
2. 如果不存在，创建新 Issue
3. 提供详细的错误描述和复现步骤
4. 包含日志和截图

---

## 📞 相关链接

### 官方资源

- **项目仓库**: https://github.com/your-org/etools
- **npm 组织**: https://www.npmjs.com/org/etools-plugin
- **示例插件**: https://github.com/etools-plugins

### 文档

- **插件管理**: [docs/plugin-management.md](./docs/plugin-management.md)
- **系统架构**: [docs/NPM_ARCHITECTURE.md](./docs/NPM_ARCHITECTURE.md)
- **插件规范**: [docs/NPM_PLUGIN_SPEC.md](./docs/NPM_PLUGIN_SPEC.md)
- **开发指南**: [docs/NPM_PLUGIN_DEV_GUIDE.md](./docs/NPM_PLUGIN_DEV_GUIDE.md)
- **迁移指南**: [docs/NPM_MIGRATION_GUIDE.md](./docs/NPM_MIGRATION_GUIDE.md)

---

## 📊 版本信息

- **当前版本**: 2.0.0
- **更新日期**: 2025-01-15
- **变更**: 统一到 NPM 分发系统，删除旧的自定义市场代码

---

## 🎉 总结

ETools 插件系统现在完全基于标准的 npm 生态系统：

- ✅ **零成本** - 无需服务器和基础设施
- ✅ **零维护** - npm 处理所有分发
- ✅ **全球分发** - npm 全球 CDN 加速
- ✅ **标准流程** - 开发者熟悉的 npm 工作流
- ✅ **版本管理** - npm 语义化版本管理
- ✅ **依赖管理** - npm 自动处理插件依赖

**从现在开始，所有 ETools 插件都是标准的 npm 包！** 🚀

---

**文档版本**: 1.0.0
**最后更新**: 2025-01-15
**维护者**: ETools Team
