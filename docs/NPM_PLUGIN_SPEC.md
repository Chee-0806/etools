# ETools npm 插件规范

## 概述

ETools 使用 npm 作为插件分发渠道，所有插件都是标准的 npm 包，使用 `@etools-plugin` 命名空间。

## 插件包结构

```
@etools-plugin/hello/
├── package.json              # npm 包配置（包含 ETools 元数据）
├── README.md                 # 插件文档
├── src/
│   └── index.ts             # 插件源码
├── dist/                     # 编译输出
│   ├── index.js
│   └── index.d.ts
└── assets/                   # 可选：资源文件
    └── icon.png
```

## package.json 规范

```json
{
  "name": "@etools-plugin/hello",
  "version": "1.0.0",
  "description": "Hello world plugin for ETools",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "keywords": [
    "etools-plugin",
    "etools",
    "productivity"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/etools-plugin-hello.git"
  },
  "files": [
    "dist",
    "assets",
    "README.md"
  ],
  "peerDependencies": {
    "etools": ">=0.1.0"
  },
  "etools": {
    "id": "hello-world",
    "title": "Hello Plugin",
    "description": "A simple greeting plugin",
    "icon": "./assets/icon.png",
    "triggers": ["hello:"],
    "permissions": [],
    "category": "productivity",
    "homepage": "https://github.com/your-org/etools-plugin-hello"
  }
}
```

## ETools 元数据字段

在 `package.json` 的 `etools` 字段中定义：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 插件唯一标识符 |
| `title` | string | ✅ | 插件显示名称 |
| `description` | string | ✅ | 插件简短描述 |
| `icon` | string | ❌ | 图标路径（相对于包根目录） |
| `triggers` | string[] | ✅ | 搜索触发词列表 |
| `permissions` | string[] | ❌ | 权限列表（默认空） |
| `category` | string | ❌ | 分类（默认：utilities） |
| `homepage` | string | ❌ | 主页 URL |

### 可用权限

- `read_clipboard` - 读取剪贴板
- `write_clipboard` - 写入剪贴板
- `read_files` - 读取文件
- `write_files` - 写入文件
- `network` - 网络访问
- `shell` - Shell 命令
- `notifications` - 系统通知
- `settings` - 设置访问

### 可用分类

- `productivity` - 生产力工具
- `developer` - 开发者工具
- `utilities` - 实用工具
- `search` - 搜索增强
- `media` - 媒体处理
- `integration` - 集成服务

## 插件代码规范

### 必需导出

```typescript
import type { Plugin, PluginManifest, PluginSearchResult } from 'etools-plugin-sdk';

// 1. 元数据
export const manifest: PluginManifest = {
  id: 'hello-world',
  name: 'Hello World',
  version: '1.0.0',
  description: 'A simple hello world plugin',
  author: 'Your Name',
  permissions: [],
  triggers: ['hello:'],
};

// 2. 搜索函数
export async function onSearch(query: string): Promise<PluginSearchResult[]> {
  // 返回搜索结果
  return [{
    id: 'result-1',
    title: 'Result Title',
    description: 'Result description',
    icon: '🎯',
    action: async () => {
      // 执行操作
    },
  }];
}

// 3. 初始化函数（可选）
export async function init() {
  console.log('[Plugin] Initialized');
}

// 4. 默认导出
const plugin: Plugin = {
  manifest,
  onSearch,
  init,
};

export default plugin;
```

## 发布流程

### 1. 开发插件

```bash
# 创建插件目录
mkdir etools-plugin-hello
cd etools-plugin-hello

# 初始化 npm 包
npm init -y

# 安装依赖
npm install --save-dev typescript vite @etools/sdk

# 创建源码文件
mkdir src
# 编写 src/index.ts
```

### 2. 配置构建

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "strict": true
  },
  "include": ["src"]
}
```

```json
// package.json scripts
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build"
  }
}
```

### 3. 发布到 npm

```bash
# 构建
npm run build

# 登录 npm（首次）
npm login

# 发布
npm publish --access public
```

### 4. 在 ETools 中使用

用户在 ETools 插件市场搜索并安装：

```bash
# ETools 会执行
npm install @etools-plugin/hello
```

## 插件发现

ETools 通过 npm API 搜索带有 `etools-plugin` 关键字的包：

```typescript
// 搜索 API
https://registry.npmjs.org/-/v1/search?text=keywords:etools-plugin
```

因此，**务必在 package.json 的 keywords 中包含 `etools-plugin`**。

## 版本管理

使用语义化版本（Semver）：

- `1.0.0` → `1.0.1` - Bug 修复
- `1.0.0` → `1.1.0` - 新功能，向后兼容
- `1.0.0` → `2.0.0` - 破坏性变更

ETools 会自动检查更新并提示用户。

## 最佳实践

### 1. 命名规范

- 包名：`@etools-plugin/<name>`（小写，连字符）
- 插件 ID：`<name>`（小写，连字符）
- 类名：`PascalCase`
- 函数名：`camelCase`

### 2. 错误处理

```typescript
export async function onSearch(query: string): Promise<PluginSearchResult[]> {
  try {
    // 插件逻辑
    return results;
  } catch (error) {
    console.error('[Plugin] Error:', error);
    return []; // 失败时返回空数组
  }
}
```

### 3. 性能优化

```typescript
// 使用缓存
const cache = new Map<string, PluginSearchResult[]>();

export async function onSearch(query: string): Promise<PluginSearchResult[]> {
  if (cache.has(query)) {
    return cache.get(query)!;
  }

  const results = await computeResults(query);
  cache.set(query, results);
  return results;
}
```

### 4. 权限声明

只声明必需的权限，避免过度申请：

```json
{
  "etools": {
    "permissions": ["read_clipboard"]  // 只申请需要的权限
  }
}
```

### 5. 图标资源

- 提供高分辨率图标（至少 256x256）
- 支持透明背景的 PNG
- 大小不超过 100KB

## 示例插件

查看官方示例插件：

- `@etools-plugin/hello` - Hello World 示例
- `@etools-plugin/timestamp` - 时间戳工具
- `@etools-plugin/json-formatter` - JSON 格式化

更多示例：https://github.com/etools-plugins

## 相关链接

- npm 组织：https://www.npmjs.com/org/etools-plugin
- 插件市场：https://etools.dev/plugins
- 开发文档：https://docs.etools.dev/plugin-development
- SDK 文档：https://docs.etools.dev/plugin-sdk

## 版本历史

- **1.0.0** (2025-01-06) - 初始版本
