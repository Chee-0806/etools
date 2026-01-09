# Third-Party Notices

本文档列出 etools 项目使用的所有第三方库及其许可证信息。

## 核心框架

### Tauri 2.0
- **许可证**: Apache License 2.0 / MIT License
- **版权所有**: Tauri Contributors
- **源代码**: https://github.com/tauri-apps/tauri
- **说明**: 跨平台桌面应用框架

### React 19
- **许可证**: MIT License
- **版权所有**: Meta Platforms, Inc.
- **源代码**: https://github.com/facebook/react
- **说明**: UI 框架

### TypeScript 5.8+
- **许可证**: Apache License 2.0
- **版权所有**: Microsoft Corporation
- **源代码**: https://github.com/microsoft/TypeScript
- **说明**: 编程语言

## 前端库

### Fuse.js 7.0
- **许可证**: Apache License 2.0
- **版权所有**: Kiro Mehe (kirollos+git@gmail.com)
- **源代码**: https://github.com/krisk/Fuse
- **说明**: 模糊搜索库

### Zustand 5.0+
- **许可证**: MIT License
- **版权所有**: Daishi Kato
- **源代码**: https://github.com/pmndrs/zustand
- **说明**: 状态管理库

### color-convert 2.0+
- **许可证**: MIT License
- **版权所有**: Heather Arthur
- **源代码**: https://github.com/Qix-/color-convert
- **说明**: 颜色转换库

### qrcode 1.5+
- **许可证**: MIT License
- **版权所有**: Ryan Day
- **源代码**: https://github.com/soldair/node-qrcode
- **说明**: 二维码生成库

### react-dropzone 14.3+
- **许可证**: MIT License
- **版权所有**: Transloadit (Paramagic)
- **源代码**: https://github.com/react-dropzone/react-dropzone
- **说明**: 文件拖放组件

### i18next / react-i18next
- **许可证**: MIT License
- **版权所有**: i18next
- **源代码**: https://github.com/i18next/i18next
- **说明**: 国际化库

## 开发工具

### Vitest 4.0+
- **许可证**: MIT License
- **版权所有**: Anthony Fu & Matias Capeletto
- **源代码**: https://github.com/vitest-dev/vitest
- **说明**: 测试框架

### Testing Library
- **@testing-library/react**: MIT License - Copyright 2017 Kent C. Dodds
- **@testing-library/jest-dom**: MIT License - Copyright 2018 Kent C. Dodds
- **源代码**: https://github.com/testing-library
- **说明**: React 测试工具

### ESLint 插件
- **typescript-eslint**: MIT License - Copyright 2023 TypeScript ESLint
- **eslint-plugin-react-hooks**: MIT License - Copyright 2019 Meta Platforms, Inc.
- **源代码**: https://github.com/typescript-eslint
- **说明**: 代码检查工具

### jsdom 27.4+
- **许可证**: MIT License
- **版权所有**: jsdom project contributors
- **源代码**: https://github.com/jsdom/jsdom
- **说明**: DOM 实现（用于测试）

## 构建工具

### Vite 7.0+
- **许可证**: MIT License
- **版权所有**: Evan You (yyx990803@gmail.com)
- **源代码**: https://github.com/vitejs/vite
- **说明**: 构建工具

## Rust 依赖 (部分)

### rusqlite 0.32+
- **许可证**: MIT License
- **版权所有**: John Gallagher
- **源代码**: https://github.com/rusqlite/rusqlite
- **说明**: SQLite 绑定

### notify 6.1+
- **许可证**: CC0-1.0 OR Apache-2.0 OR MIT
- **版权所有**: Ferhat Kurtulmuş
- **源代码**: https://github.com/notify-rs/notify
- **说明**: 文件系统监控

### serde 1.0+
- **许可证**: MIT OR Apache-2.0
- **版权所有**: Serde Contributors
- **源代码**: https://github.com/serde-rs/serde
- **说明**: 序列化/反序列化框架

## 完整依赖列表

完整的依赖列表及其许可证可以在以下位置找到：

- **Node.js 依赖**: 查看 `package.json` 和 `node_modules/<package>/LICENSE`
- **Rust 依赖**: 查看 `src-tauri/Cargo.lock` 和 `~/.cargo/registry/src/`

## 许可证兼容性

所有依赖库的许可证均为以下之一：
- ✅ MIT License (最宽松)
- ✅ Apache License 2.0 (与 MIT 兼容)
- ✅ BSD License (与 MIT 兼容)
- ✅ CC0-1.0 (公共领域，无限制)

所有许可证均与 MIT License 兼容，可以合法地在 MIT 项目中使用。

## 用户义务

使用本软件时，您必须：
1. 保留所有版权声明和许可证声明
2. 遵守各第三方库的许可证条款
3. 在分发的副本中包含此 NOTICES 文件

## 免责声明

本软件按"原样"提供，不提供任何形式的明示或暗示保证。详见 LICENSE 文件。

---

**最后更新**: 2026-01-09
