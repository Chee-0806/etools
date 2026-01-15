# ETools 插件管理系统

## 概述

ETools 使用**统一的 NPM 插件管理系统**，所有插件都是标准的 npm 包，使用 `@etools-plugin` 命名空间。

### 核心特性

- ✅ **基于 npm Registry** - 使用官方 npm registry 作为插件市场
- ✅ **标准 npm 流程** - 安装、卸载、更新使用 `npm install/uninstall/update`
- ✅ **零成本分发** - npm 提供免费的 CDN、存储和带宽
- ✅ **语义化版本** - 遵循 Semver 版本管理
- ✅ **依赖管理** - npm 自动处理插件依赖
- ✅ **全局分发** - npm 全球 CDN 加速下载

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    NPM Registry                        │
│         https://registry.npmjs.org                   │
│  ┌────────────────────────────────────────────────┐   │
│  │  @etools-plugin/devtools (v1.2.0)      │   │
│  │  @etools-plugin/hello (v0.1.5)        │   │
│  │  @etools-plugin/json-formatter (v1.0.0) │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑ ↓
        ┌─────────────────┴───────────────────┐
        │    ETools Application          │
        │  (Frontend + Rust)           │
        └─────────────────┬───────────────────┘
                        │
        ┌───────────────┼───────────────────┐
        ↓               ↓                   ↓
   插件市场       已安装插件         插件更新
  (列表/搜索)   (package.json)      (check/update)
        │               │                   │
        ↓               ↓                   ↓
  NPM Search API   plugins/           npm update
                  node_modules/
```

---

## 文件结构

### 前端 (TypeScript)

```
src/
├── services/
│   └── pluginManager.ts              # 插件管理服务
├── components/
│   └── PluginManager/
│       ├── PluginManager.tsx          # 主管理器
│       ├── PluginList.tsx             # 插件列表
│       ├── InstalledPluginsView.tsx    # 已安装视图
│       └── MarketplaceView.tsx       # 插件市场
└── types/
    └── plugin.ts                      # 类型定义
```

### 后端 (Rust)

```
src-tauri/src/
├── services/
│   └── marketplace_service.rs       # NPM 市场服务
├── cmds/
│   ├── marketplace.rs                 # NPM 命令
│   └── plugins.rs                   # 插件管理命令
└── models/
    └── plugin.rs                      # 数据模型
```

### 插件目录结构

```
{AppData}/plugins/
├── package.json                  # 插件依赖清单（核心）
├── node_modules/
│   └── @etools-plugin/
│       ├── devtools/
│       │   ├── package.json       # 插件元数据
│       │   ├── dist/
│       │   │   └── index.js     # 插件入口
│       │   └── plugin.json      # 可选：ETools 配置
│       └── hello/
│           └── ...
└── plugin-state.json           # 插件启用状态
```

---

## Tauri 命令

### NPM 市场命令

| 命令 | 描述 | 文件 |
|--------|--------|------|
| `marketplace_list` | 从 npm 获取插件列表 | `cmds/marketplace.rs` |
| `marketplace_search` | 在 npm 搜索插件 | `cmds/marketplace.rs` |
| `marketplace_install` | 安装 npm 包 | `cmds/marketplace.rs` |
| `marketplace_uninstall` | 卸载 npm 包 | `cmds/marketplace.rs` |
| `marketplace_update` | 更新 npm 包 | `cmds/marketplace.rs` |
| `marketplace_check_updates` | 检查 npm 更新 | `cmds/marketplace.rs` |
| `marketplace_get_plugin` | 获取 npm 插件详情 | `cmds/marketplace.rs` |
| `get_installed_plugins` | 读取已安装插件 | `cmds/marketplace.rs` |

### 插件管理命令

| 命令 | 描述 | 文件 |
|--------|--------|------|
| `plugin_enable` | 启用插件 | `cmds/plugins.rs` |
| `plugin_disable` | 禁用插件 | `cmds/plugins.rs` |
| `plugin_uninstall` | 卸载插件 | `cmds/plugins.rs` |
| `bulk_enable_plugins` | 批量启用插件 | `cmds/plugins.rs` |
| `bulk_disable_plugins` | 批量禁用插件 | `cmds/plugins.rs` |
| `bulk_uninstall_plugins` | 批量卸载插件 | `cmds/plugins.rs` |
| `get_plugin_health` | 获取插件健康状态 | `cmds/plugins.rs` |
| `check_plugin_health` | 检查插件健康 | `cmds/plugins.rs` |
| `get_plugin_usage_stats` | 获取使用统计 | `cmds/plugins.rs` |

---

## 工作流程

### 安装插件流程

```
用户点击"安装"
    ↓
前端调用 marketplace_install(package_name)
    ↓
后端执行 npm install @etools-plugin/xxx
    ↓
npm 下载包到 node_modules/
    ↓
后端更新 plugins/package.json
    ↓
前端刷新插件列表
```

### 检查更新流程

```
用户点击"检查更新"
    ↓
前端调用 marketplace_check_updates()
    ↓
后端读取 plugins/package.json
    ↓
对每个已安装插件:
  1. 从 npm Registry 获取最新版本
  2. 读取 node_modules 中的当前版本
  3. 对比版本号
    ↓
返回有更新的插件列表
```

### 更新插件流程

```
用户点击"更新"
    ↓
前端调用 marketplace_update(package_name)
    ↓
后端执行 npm update @etools-plugin/xxx
    ↓
npm 下载新版本到 node_modules/
    ↓
前端刷新插件列表
```

### 卸载插件流程

```
用户点击"卸载"
    ↓
前端调用 marketplace_uninstall(package_name)
    ↓
后端执行 npm uninstall @etools-plugin/xxx
    ↓
npm 从 node_modules/ 删除包
    ↓
后端从 plugins/package.json 移除依赖
    ↓
前端刷新插件列表
```

---

## NPM API 集成

### 搜索 API

```rust
GET https://registry.npmjs.org/-/v1/search?text=keywords:etools-plugin
```

**响应格式:**
```json
{
  "objects": [
    {
      "package": {
        "name": "@etools-plugin/devtools",
        "version": "1.2.0",
        "description": "Developer tools for ETools",
        "keywords": ["etools-plugin", "developer"]
      },
      "score": {
        "final": 12.5,
        "detail": {
          "quality": 0.9,
          "popularity": 0.7,
          "maintenance": 1.0
        }
      }
    }
  ],
  "total": 1
}
```

### 包信息 API

```rust
GET https://registry.npmjs.org/@etools-plugin/devtools
```

**响应格式:**
```json
{
  "name": "@etools-plugin/devtools",
  "versions": {
    "1.0.0": { ... },
    "1.1.0": { ... },
    "1.2.0": { ... }
  },
  "dist-tags": {
    "latest": "1.2.0",
    "beta": "1.3.0-beta"
  }
}
```

---

## 插件元数据

### package.json etools 字段

```json
{
  "etools": {
    "id": "devtools",                  // 必需：插件唯一 ID
    "title": "Devtools",               // 必需：显示名称
    "description": "插件描述",         // 必需：简短说明
    "icon": "./assets/icon.png",        // 可选：图标路径
    "triggers": ["dev:"],             // 必需：触发词列表
    "permissions": [],                  // 可选：权限列表
    "category": "developer",            // 可选：分类
    "homepage": "https://..."          // 可选：主页 URL
  }
}
```

### 可用权限

- `read_clipboard` - 读取剪贴板
- `write_clipboard` - 写入剪贴板
- `read_files` - 读取文件
- `write_files` - 写入文件
- `network` - 网络访问
- `shell` - Shell 命令
- `notifications` - 系统通知

### 可用分类

- `productivity` - 生产力工具
- `developer` - 开发者工具
- `utilities` - 实用工具
- `search` - 搜索增强
- `media` - 媒体处理
- `integration` - 集成服务

---

## 数据模型

### Plugin (Rust)

```rust
pub struct Plugin {
    pub id: String,                          // 插件 ID
    pub name: String,                        // 插件名称
    pub version: String,                      // 版本号
    pub description: String,                   // 描述
    pub author: Option<String>,                // 作者
    pub enabled: bool,                        // 是否启用
    pub permissions: Vec<String>,               // 权限列表
    pub entry_point: String,                  // 入口文件路径
    pub triggers: Vec<PluginTrigger>,          // 触发器列表
    pub settings: HashMap<String, Value>,       // 设置
    pub health: PluginHealth,                 // 健康状态
    pub usage_stats: PluginUsageStats,         // 使用统计
    pub installed_at: i64,                    // 安装时间戳
    pub install_path: String,                 // 安装路径
    pub source: PluginSource,                  // 来源 (Marketplace/Local)
}
```

### PluginUpdateInfo (Rust)

```rust
pub struct PluginUpdateInfo {
    pub package_name: String,        // npm 包名
    pub current_version: String,   // 当前版本
    pub latest_version: String,    // 最新版本
    pub has_update: bool,          // 是否有更新
}
```

---

## 插件状态管理

### 启用/禁用状态

插件启用/禁用状态存储在 `{AppData}/plugin-state.json`：

```json
{
  "@etools-plugin/devtools": true,
  "@etools-plugin/hello": false
}
```

### 状态操作

```rust
// 启用插件
pub fn plugin_enable(plugin_id: String) -> Result<(), String>

// 禁用插件
pub fn plugin_disable(plugin_id: String) -> Result<(), String>

// 获取插件状态
pub fn get_plugin_enabled_state(plugin_id: String) -> Result<bool, String>
```

---

## 前端使用示例

### 安装插件

```typescript
import { marketplaceService } from '@/services/pluginManager';

const install = async (packageName: string) => {
  try {
    const plugin = await marketplaceService.installPlugin(packageName);
    console.log('插件安装成功:', plugin);
  } catch (error) {
    console.error('安装失败:', error);
  }
};

// 使用示例
install('@etools-plugin/devtools');
```

### 检查更新

```typescript
import { marketplaceService } from '@/services/pluginManager';

const checkUpdates = async () => {
  try {
    const updates = await marketplaceService.checkUpdates();
    console.log('可用更新:', updates);
    // updates: PluginUpdateInfo[]
  } catch (error) {
    console.error('检查更新失败:', error);
  }
};
```

### 更新插件

```typescript
import { marketplaceService } from '@/services/pluginManager';

const update = async (packageName: string) => {
  try {
    const plugin = await marketplaceService.updatePlugin(packageName);
    console.log('插件更新成功:', plugin);
  } catch (error) {
    console.error('更新失败:', error);
  }
};

// 使用示例
update('@etools-plugin/devtools');
```

---

## 性能优化

### 前端优化

- **React.memo** - 防止不必要的重渲染
- **防抖搜索** - 300ms 防抖延迟
- **虚拟滚动** - 处理大量插件列表
- **懒加载** - 按需加载插件详情

### 后端优化

- **异步操作** - 所有 npm 操作异步执行
- **并发限制** - 控制同时进行的 npm 操作
- **缓存机制** - 插件列表和搜索结果缓存
- **增量更新** - 只更新变更的插件

---

## 错误处理

### 常见错误

| 错误类型 | 描述 | 解决方案 |
|----------|------|----------|
| `npm install failed` | npm 安装失败 | 检查网络连接和 npm 配置 |
| `package not found` | 包不存在 | 检查包名是否正确 |
| `version conflict` | 版本冲突 | 检查依赖兼容性 |
| `permission denied` | 权限被拒绝 | 检查文件系统权限 |
| `network error` | 网络错误 | 检查网络连接和代理设置 |

### 错误消息格式

```rust
Err(format!("Failed to install plugin: {}", error))
```

---

## 安全考虑

### 权限验证

- **白名单机制** - 只允许预定义的权限
- **权限组合检查** - 检测危险的权限组合
- **用户确认** - 高风险权限需要明确授权

### 插件验证

- **包名验证** - 必须使用 `@etools-plugin` 命名空间
- **清单验证** - 检查必需字段
- **版本验证** - 遵循 Semver 格式

### 核心插件保护

```rust
pub const CORE_PLUGINS: &[&str] = &["core", "system"];

if CORE_PLUGINS.contains(&plugin_id) {
    return Err("不能卸载核心插件".to_string());
}
```

---

## 故障排除

### 常见问题

**Q: 插件安装后不显示**
```
A: 检查：
1. plugins/package.json 是否已更新
2. node_modules 目录是否存在
3. 插件是否正确启用
4. 查看浏览器控制台错误
```

**Q: 检查更新失败**
```
A: 检查：
1. 网络连接是否正常
2. npm registry 是否可访问
3. 插件包名是否正确
```

**Q: 更新失败**
```
A: 检查：
1. npm 命令是否可用
2. node_modules 目录权限
3. 新版本是否兼容
```

---

## 成本对比

| 项目 | 自建市场 | NPM 市场 |
|------|----------|----------|
| **服务器** | 需要多台服务器 | 零成本 |
| **数据库** | 需要 PostgreSQL | 零成本 |
| **CDN** | 需要 CloudFront | npm 免费提供 |
| **存储** | 需要 S3/OSS | npm 免费提供 |
| **带宽** | 按流量付费 | npm 承担 |
| **维护** | 需要 DevOps | npm 维护 |
| **月成本估算** | **$50-500+** | **$0** |

---

## 相关文档

- **NPM 插件规范**: `docs/NPM_PLUGIN_SPEC.md`
- **开发指南**: `docs/NPM_PLUGIN_DEV_GUIDE.md`
- **迁移指南**: `docs/NPM_MIGRATION_GUIDE.md`
- **Rust 后端**: `src-tauri/src/services/marketplace_service.rs`
- **前端服务**: `src/services/pluginManager.ts`

---

## 版本信息

- **版本**: 2.0.0
- **更新日期**: 2025-01-15
- **变更**: 统一到 NPM 分发系统

---

## 下一步

### 立即可做

1. **发布第一个插件**
   ```bash
   cd npm-packages/@etools-plugin/hello
   npm install
   npm run build
   npm publish --access public
   ```

2. **在 ETools 中测试**
   - 运行 `pnpm tauri dev`
   - 打开设置 → 插件市场
   - 搜索 "hello"
   - 安装并测试

3. **创建更多插件**
   - 使用 `npm-packages/@etools-plugin/hello` 作为模板
   - 复制目录结构
   - 修改 `package.json` 和 `src/index.ts`

### 未来增强

- [ ] 插件开发 CLI 工具（`npm create etools-plugin`）
- [ ] 插件模板仓库
- [ ] 自动化测试流程
- [ ] CI/CD 自动发布
- [ ] 插件审核流程
- [ ] 官方插件组织（@etools-plugins）
- [ ] 插件评分和评论系统
- [ ] 插件统计和下载次数

---

## 许可证

遵循项目主许可证。
