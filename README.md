# etools

每个人的工具 - 生产力启动器

etools 是一个基于 Tauri + React + TypeScript 构建的桌面生产力启动器，通过全局快捷键快速打开搜索窗口，支持应用程序搜索、文件系统搜索、浏览器书签搜索、剪贴板历史等功能。

## 功能特性

- ⌨️ **全局快捷键** - 使用 `Cmd+Space` (macOS) 或 `Alt+Space` (Windows/Linux) 快速启动
- 🔍 **应用程序搜索** - 快速查找并启动已安装的应用程序
- 📁 **文件系统搜索** - 即时搜索电脑中的文件
- 🔖 **浏览器书签** - 搜索和打开浏览器书签
- 📋 **剪贴板历史** - 访问最近的剪贴板记录
- 🔌 **插件系统** - 支持自定义插件扩展功能

## 安装

### 下载最新版本

访问 [Releases 页面](https://github.com/Chee-0806/etools/releases) 下载最新的 `.dmg` 安装包。

### macOS 安装说明

由于应用未使用 Apple Developer 证书签名，首次打开时可能会提示"已损坏"。

**解决方法：**

**方法 1：右键打开（推荐）**
1. 右键点击 `etools.app`
2. 选择"打开"
3. 在弹出的对话框中点击"打开"

**方法 2：移除隔离属性**
```bash
xattr -cr /Applications/etools.app
```

**方法 3：允许任何来源的应用**
```bash
sudo spctl --master-disable
```
⚠️ 注意：方法 3 会降低系统安全性，不推荐。

## 开发

### 环境要求

- Node.js 20+
- Rust 1.75+
- pnpm

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

### 构建生产版本

```bash
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

## 技术栈

- **前端**: React 19 + TypeScript 5.8 + Vite 7
- **后端**: Tauri 2.0 + Rust
- **状态管理**: Zustand
- **搜索**: Fuse.js
- **构建工具**: Tauri CLI + Vite

## 许可证

MIT

## 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [React](https://react.dev/) - UI 框架

