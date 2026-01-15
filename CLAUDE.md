# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目结构

etools-lab 是一个 monorepo，包含以下子项目：

- **etools/** - 主应用程序（Tauri + React 桌面应用）
- **etools-devtools-plugin/** - 开发工具插件示例（独立的 NPM 包）

**工作目录**：
- 主应用开发在 `etools/` 目录进行
- 插件开发在 `etools-devtools-plugin/` 目录进行
- 大多数命令需要在 `etools/` 目录下执行

## 项目概述

etools 是一个基于 Tauri + React + TypeScript 构建的桌面生产力启动器。它通过全局快捷键快速打开搜索窗口，支持应用程序搜索、文件系统搜索、浏览器书签搜索、剪贴板历史等功能。

## 常用命令

### 开发与构建

**注意**：以下命令需要在 `etools/` 目录下执行。

```bash
# 启动开发服务器（前端 + Tauri 后端）
pnpm tauri dev

# 仅启动前端开发服务器
pnpm dev

# 构建生产版本
pnpm tauri build

# 仅构建前端
pnpm build

# 构建前端并检查类型
pnpm build:check
```

### 测试

**注意**：以下命令需要在 `etools/` 目录下执行。

```bash
# 单元测试（Vitest）
pnpm test                    # 运行所有单元测试
pnpm test:ui                 # 运行测试并打开 UI 界面
pnpm test:coverage           # 生成测试覆盖率报告

# E2E 测试（Playwright）
pnpm test:e2e                # 运行 E2E 测试
pnpm test:e2e:ui             # 运行 E2E 测试并打开 UI 界面

# 运行所有测试
pnpm test:all
```

### Rust 后端

**注意**：以下命令需要在 `etools/src-tauri/` 目录下执行。

```bash
cargo test                   # 运行 Rust 单元测试
cargo clippy                 # 代码检查
cargo fmt                    # 代码格式化
```

### 代码检查

**注意**：以下命令需要在 `etools/` 目录下执行。

```bash
# 前端代码检查
pnpm lint                    # ESLint 检查
pnpm lint:fix                # 自动修复问题

# Rust 代码检查（在 src-tauri 目录下）
cd src-tauri && cargo clippy
```

### 单个测试运行

**注意**：以下命令需要在 `etools/` 目录下执行。

```bash
# 运行单个测试文件
pnpm test <file-name>

# 运行匹配模式的测试
pnpm test -- <pattern>
```

### 插件开发

在 `etools-devtools-plugin/` 目录下：

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建插件
npm run build

# 发布前构建
npm run prepublishOnly
```

## 代码架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Components │  │    Hooks     │  │   Services   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬───────────────────────────────┘
                              │ Tauri IPC
                              │ invoke / events
┌─────────────────────────────┴───────────────────────────────┐
│                      Backend (Rust/Tauri)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Commands   │  │   Services   │  │  DB / Models │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**关键架构原则**：
- **前端仅负责 UI**：组件渲染、用户交互、状态管理
- **后端负责系统功能**：窗口管理、文件访问、全局快捷键、系统托盘
- **严格分离**：通过 Tauri IPC 通信，不要在前端使用 `@tauri-apps/api/window` 等管理窗口

### 前端架构（src/）

**组件层 (components/)**
- `SearchWindow.tsx` - 主搜索窗口组件
- `SettingsPanel.tsx` - 设置面板
- `PluginManager/` - 插件管理器组件群
  - `PluginManager.tsx` - 主管理器入口
  - `InstalledPluginsView.tsx` - 已安装插件视图
  - `MarketplaceView.tsx` - 插件市场视图
  - `PluginDetailPanel.tsx` - 插件详情面板
  - `BulkActionsToolbar.tsx` - 批量操作工具栏
  - `NotificationSystem.tsx` - 通知系统
- `ui/` - 可复用 UI 基础组件（Button, Input, Badge, Spinner, Kbd 等）

**服务层 (services/)**
- `searchService.ts` - 搜索服务，统一处理各种搜索源
- `actionService.ts` - 快捷操作服务（计算器、颜色转换、网页搜索）
- `pluginManager.ts` - 插件管理服务
- `pluginStateStore.ts` - 插件状态存储（基于 Zustand）
- `marketplaceService.ts` - 插件市场服务
- `errorLogger.ts` - 全局错误日志服务

**Hooks (hooks/)**
- `useSearch.ts` - 搜索逻辑 Hook（防抖、Fuse.js 模糊搜索）
- `useTheme.ts` - 主题管理 Hook（支持跟随系统）
- `useKeyboardShortcuts.ts` - 键盘快捷键处理
- `usePluginState.ts` - 插件状态管理
- `useBulkSelection.ts` - 批量选择功能

**类型定义 (types/)**
- `plugin.ts` - 插件相关类型定义
- `search.ts` - 搜索结果类型定义
- `clipboard.ts` - 剪贴板相关类型

### 后端架构（src-tauri/src/）

**命令层 (cmds/)**
每个文件对应一类 Tauri 命令，通过 `invoke_handler` 暴露给前端：

- `app.rs` - 应用程序发现、启动、图标获取
- `search.rs` - 文件搜索、文件索引、浏览器数据搜索
- `clipboard.rs` - 剪贴板历史管理
- `plugins.rs` - 插件生命周期管理（安装、启用、禁用、卸载）
- `marketplace.rs` - 插件市场功能
- `settings.rs` - 用户设置管理
- `window.rs` - 窗口状态管理
- `shell.rs` - Shell 操作（打开 URL 等）
- `abbreviation.rs` - 缩写词管理
- `files.rs` - 文件操作
- `debug.rs` - 调试工具
- `performance.rs` - 性能监控

**添加新命令**：
1. 在 `src-tauri/src/cmds/` 创建新文件
2. 在 `src-tauri/src/cmds/mod.rs` 导出模块
3. 在 `src-tauri/src/lib.rs` 的 `invoke_handler` 注册命令

**服务层 (services/)**
- `app_monitor.rs` - 监控已安装应用程序
- `file_indexer.rs` - 文件系统索引服务（使用 notify 监控文件变化）
- `browser_reader.rs` - 浏览器数据读取（书签、历史）
- `clipboard_watcher.rs` - 剪贴板监控服务
- `plugin_sandbox.rs` - 插件沙箱环境
- `plugin_service.rs` - 插件管理核心逻辑
- `marketplace_service.rs` - 插件市场服务
- `performance.rs` - 性能监控服务

**数据库层 (db/)**
使用 SQLite 存储：
- `files.rs` - 文件索引数据库
- `browser.rs` - 浏览器缓存数据库

**数据模型 (models/)**
- `plugin.rs` - 插件数据模型
- `app.rs` - 应用程序数据模型
- `clipboard.rs` - 剪贴板数据模型
- `preferences.rs` - 用户偏好设置

### 插件系统

etools 作为一个干净的容器，不包含任何内置插件。所有插件都需要用户手动安装。

**插件安装位置**
- 插件安装在用户数据目录的 `plugins/` 文件夹中
- 通过插件管理器或命令行安装

**插件类型**
1. **本地插件**：从文件系统加载的插件
2. **NPM 插件**：从 npm registry 安装的插件（如 `@etools-plugin/devtools`）
3. **URL 插件**：从远程 URL 加载的插件

**插件结构**
每个插件包含：
- `index.ts` - 插件入口，导出 `manifest` 和 `search` 函数
- `ui.tsx` - 可选的自定义 UI 组件
- `package.json` - NPM 插件必需，包含元数据

**插件 API**
```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  triggers: string[];
  settings: PluginSetting[];
}

interface PluginSearchResult {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  action: () => void | Promise<void>;
}
```

**插件加载**
前端通过 `pluginLoader.ts` 动态加载插件，后端通过 `plugin_service.rs` 管理插件生命周期。

**开发插件**：
- 参考 `etools-devtools-plugin/` 作为示例
- NPM 插件需要构建为 ESM 格式（使用 `tsup` 或类似工具）
- 插件包名应使用 `@etools-plugin/*` 命名空间

## 关键技术决策

### 搜索架构
- 使用 Fuse.js 进行前端模糊搜索
- 文件索引由 Rust 后端维护（SQLite + notify 文件监控）
- 浏览器数据定期缓存到 SQLite（避免频繁读取浏览器文件）

### 状态管理
- 主题设置：`localStorage`
- 插件状态：Zustand store (`pluginStateStore.ts`)
- Tauri 状态：通过 `app.manage()` 管理全局状态

### 窗口管理
- **主窗口 (`main`)**：搜索窗口，800x600，透明无边框，置顶
- 所有窗口使用透明效果和无边框设计（macOS 需要启用私有 API）
- 窗口状态持久化：`windowState` 保存位置和大小
- **重要**：窗口管理必须在 Rust 后端完成，不要在前端使用 `@tauri-apps/api/window`

### 主题系统
- 支持：浅色、深色、跟随系统
- 使用 CSS Variables (Design Tokens)
- 主题切换通过 `data-theme` 属性

### 性能优化
- 搜索防抖（150ms）
- 文件索引增量更新
- 插件延迟加载（React.lazy）
- 性能监控 (`services/performance.rs`)
- 代码分割（Vite）：React、Tauri API、UI 组件、Services、Hooks、Plugin SDK 分别打包

## 重要约定

### Tauri 命令命名
- 后端命令使用 snake_case：`get_installed_apps`
- 前端调用时保持一致：`invoke('get_installed_apps')`

### 错误处理
- 前端：全局 ErrorBoundary (`components/ErrorBoundary.tsx`)
- 后端：使用 `Result<T, E>` 返回错误
- 错误日志：`services/errorLogger.ts`

### 测试约定
- 单元测试文件：`.test.ts` 或 `.test.tsx`
- 测试文件与源文件同目录
- E2E 测试位于 `e2e/` 目录
- 覆盖率阈值：行 70%、函数 70%、分支 60%、语句 70%

### 文件索引排除目录
默认排除：`node_modules`, `.git`, `target`, `dist`, `build`, `.cache`

### macOS 特殊配置
- 透明窗口需要启用私有 API：`tauri.conf.json` 中 `macOSPrivateApi: true`

### Tauri 应用架构原则（核心）

**职责分工：**
- **Rust 后端 (Tauri)**：负责所有桌面软件功能
  - 窗口管理（创建、显示、隐藏、关闭）
  - 全局快捷键、系统托盘
  - 文件系统访问、系统调用
  - 与操作系统的交互
- **前端 (React)**：仅负责 UI 渲染和用户交互
  - 组件渲染
  - 用户输入处理
  - 通过 `invoke()` 调用后端命令

**关键规则：**
1. **窗口管理必须用 Tauri**：不要在前端使用 `@tauri-apps/api/window` 管理窗口，应该在 Rust 后端通过 `app.get_webview_window(label)` 操作
2. **桌面功能优先考虑 Tauri 原生 API**：全局快捷键、系统托盘、通知等都应该在 Rust 实现
3. **前端只负责 UI**：不要让前端承担系统级功能的职责

**错误示例：**
```typescript
// ❌ 在前端管理窗口和快捷键
import { getCurrentWindow } from '@tauri-apps/api/window';
import { register } from '@tauri-apps/plugin-global-shortcut';

const window = getCurrentWindow();
await register('Cmd+Shift+K', () => {
  window.show(); // 职责混乱
});
```

**正确示例：**
```rust
// ✅ 在 Rust 后端管理窗口和快捷键
let window = app.get_webview_window("main").unwrap();
app.global_shortcut().on_shortcut(shortcut, move |_, _, _| {
    let _ = window.show();
})?;
```

**配置文件位置**：
- `src-tauri/tauri.conf.json` - Tauri 配置（窗口定义、权限、构建设置）
- `vite.config.ts` - Vite 构建配置（代码分割、开发服务器、路径别名）
- `tsconfig.json` - TypeScript 配置（路径别名 `@/*` 指向 `./src/*`）

## 开发工作流

1. **添加新功能**
   - 前端：在 `components/` 添加组件，`services/` 添加服务逻辑
   - 后端：在 `src-tauri/src/cmds/` 添加命令处理器，`src-tauri/src/services/` 添加业务逻辑
   - 在 `src-tauri/src/lib.rs` 的 `invoke_handler` 注册新命令
   - 在 `src-tauri/src/cmds/mod.rs` 导出命令模块

2. **添加新插件**
   - NPM 插件：在独立目录开发，参考 `etools-devtools-plugin/` 结构
   - 本地插件：在 `example-plugins/` 创建插件目录
   - 实现 `manifest` 和 `search` 导出
   - 前端自动发现并加载

3. **修改主题**
   - 修改 `src/styles/design-tokens.css`（设计变量）
   - 修改 `src/styles/theme-light.css` 或 `theme-dark.css`

4. **数据库迁移**
   - 直接在 `src-tauri/src/db/` 模块中修改表结构
   - SQLite 位于应用数据目录

5. **添加新窗口**
   - 在 `src-tauri/tauri.conf.json` 的 `app.windows` 数组中添加窗口配置
   - 在 `src/components/` 创建对应的 React 组件
   - 在 `src/App.tsx` 中注册新窗口组件
   - 在 Rust 后端使用 `app.get_webview_window(label)` 控制窗口

## 调试技巧

### 前端调试
- 开发模式下自动打开浏览器 DevTools
- 使用 `write_debug_log` 命令输出日志

### 后端调试
- 使用 `println!` 或 `log::info!` 输出到终端
- 检查 `src-tauri/target/debug/` 中的日志

### Tauri IPC 调试
- 在 `lib.rs` 的 `invoke_handler` 中添加日志
- 使用 Tauri DevTools 监控 IPC 调用

## 相关文档

- **README.md** - 项目概述和功能说明
- **CONTRIBUTING.md** - 贡献指南，包含详细的代码规范和开发流程
- **specs/001-productivity-launcher/** - 功能规格和设计方案
- **src-tauri/tauri.conf.json** - Tauri 配置（窗口定义、权限、构建设置）
- **vite.config.ts** - Vite 构建配置（代码分割、开发服务器、路径别名）
- **tsconfig.json** - TypeScript 配置（路径别名 `@/*` 指向 `./src/*`）
- **etools-devtools-plugin/README.md** - 插件开发示例文档

## Active Technologies

### 核心技术栈
- **前端**：Rust 1.75+, TypeScript 5.8+, Tauri 2.0, React 19, Vite 7
- **后端**：Rust 1.75+, Tauri 2.0, SQLite (rusqlite 0.32), Tokio
- **搜索**：Fuse.js 7.0（前端模糊搜索）
- **状态管理**：Zustand 5.0
- **国际化**：i18next 25.7

### 关键依赖
- `@tauri-apps/plugin-global-shortcut` - 全局快捷键
- `@tauri-apps/plugin-shell` - Shell 集成
- `@tauri-apps/plugin-opener` - URL 打开
- `@tauri-apps/plugin-clipboard-manager` - 剪贴板管理
- `notify` - 文件系统监控（Rust）
- `rusqlite` - SQLite 数据库（Rust）

## 快速参考

### 重要路径
- 前端源码：`etools/src/`
- Rust 后端：`etools/src-tauri/src/`
- 插件示例：`etools-devtools-plugin/`
- 配置文件：`etools/src-tauri/tauri.conf.json`
- 构建配置：`etools/vite.config.ts`

### 常见任务
- 启动开发：`cd etools && pnpm tauri dev`
- 运行测试：`cd etools && pnpm test`
- 代码检查：`cd etools && pnpm lint`
- 构建应用：`cd etools && pnpm tauri build`
- 开发插件：`cd etools-devtools-plugin && npm run dev`

### 核心架构原则
1. **前端仅负责 UI** - 不管理窗口、不访问文件系统
2. **后端负责系统功能** - 窗口、快捷键、文件访问都在 Rust
3. **严格分离** - 通过 Tauri IPC 通信，职责明确
