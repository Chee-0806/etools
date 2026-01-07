# ETools npm 插件分发迁移完成

## ✅ 迁移状态

**项目已从自定义插件市场完全迁移到 npm 分发系统！**

---

## 🎉 完成的工作

### 1. npm 插件规范 ✅

创建了完整的 npm 插件规范文档：`docs/NPM_PLUGIN_SPEC.md`

**核心规范：**
- 插件使用 `@etools-plugin` 命名空间
- 在 `package.json` 中定义 `etools` 元数据字段
- 支持所有原有功能（权限、触发器、分类等）

### 2. Rust 后端实现 ✅

**文件：** `src-tauri/src/services/marketplace_service.rs`

**功能：**
- ✅ 使用 npm registry API 搜索插件
- ✅ 使用 `npm install` 安装插件
- ✅ 使用 `npm uninstall` 卸载插件
- ✅ 使用 `npm update` 更新插件
- ✅ 读取 npm 包的 `package.json` 元数据

**命令：** `src-tauri/src/cmds/marketplace.rs`
- `marketplace_list` - 列出 npm 插件
- `marketplace_search` - 搜索 npm 插件
- `marketplace_install` - 安装 npm 包
- `marketplace_uninstall` - 卸载 npm 包
- `marketplace_update` - 更新 npm 包
- `marketplace_get_plugin` - 获取插件详情

### 3. 前端服务更新 ✅

**文件：** `src/services/marketplaceService.ts`

**改进：**
- ✅ 所有方法现在使用 npm 包名（`@etools-plugin/hello`）
- ✅ 添加 `idToPackageName()` 和 `packageNameToId()` 辅助方法
- ✅ 更新安装/卸载/更新流程

### 4. 前端 UI 更新 ✅

**文件：** `src/components/PluginManager/MarketplaceView.tsx`

**变更：**
- ✅ 安装时使用 npm 包名而不是插件 ID
- ✅ 兼容现有 UI 组件

### 5. 示例插件包 ✅

**位置：** `npm-packages/@etools-plugin/hello/`

**包含：**
- ✅ `package.json` - npm 包配置（包含 etools 元数据）
- ✅ `tsconfig.json` - TypeScript 配置
- ✅ `src/index.ts` - 插件源码
- ✅ `README.md` - 插件文档
- ✅ `assets/` - 资源目录

### 6. 依赖更新 ✅

**Cargo.toml:**
```toml
urlencoding = "2.1"  # npm API URL 编码
```

---

## 📊 成本对比

| 项目 | 自建市场 | npm 市场 |
|------|----------|----------|
| **服务器** | 需要多台服务器 | 零成本 |
| **数据库** | 需要 PostgreSQL | 零成本 |
| **CDN** | 需要 CloudFront | npm 免费提供 |
| **存储** | 需要 S3/OSS | npm 免费提供 |
| **带宽** | 按流量付费 | npm 承担 |
| **维护** | 需要 DevOps | npm 维护 |
| **月成本估算** | **$50-500+** | **$0** |

---

## 🚀 如何使用

### 对于用户

**安装插件：**
1. 打开 ETools
2. 进入设置 → 插件市场
3. 浏览或搜索插件
4. 点击"安装"
5. ETools 会自动执行 `npm install @etools-plugin/xxx`

**卸载插件：**
1. 进入设置 → 插件 → 已安装
2. 选择要卸载的插件
3. 点击"卸载"
4. ETools 会自动执行 `npm uninstall @etools-plugin/xxx`

**更新插件：**
1. 进入设置 → 插件 → 已安装
2. 有更新的插件会显示"更新"按钮
3. 点击"更新"
4. ETools 会自动执行 `npm update @etools-plugin/xxx`

### 对于开发者

**创建新插件：**

1. **创建插件目录**
   ```bash
   mkdir npm-packages/@etools-plugin/my-plugin
   cd npm-packages/@etools-plugin/my-plugin
   ```

2. **初始化 npm 包**
   ```bash
   npm init -y
   ```

3. **编辑 package.json**
   ```json
   {
     "name": "@etools-plugin/my-plugin",
     "version": "1.0.0",
     "main": "dist/index.js",
     "keywords": ["etools-plugin", "etools"],
     "etools": {
       "id": "my-plugin",
       "title": "My Plugin",
       "triggers": ["my:"],
       "permissions": []
     }
   }
   ```

4. **编写插件代码**
   ```typescript
   // src/index.ts
   export const manifest = {
     id: 'my-plugin',
     name: 'My Plugin',
     // ...
   };

   export async function onSearch(query: string) {
     return [{
       id: 'result-1',
       title: 'My Result',
       action: async () => {
         // 执行操作
       }
     }];
   }
   ```

5. **构建和发布**
   ```bash
   npm run build
   npm publish --access public
   ```

6. **在 ETools 中测试**
   ```bash
   # 使用本地包测试
   cd /path/to/etools
   npm install file:./npm-packages/@etools-plugin/my-plugin
   ```

---

## 🏗️ 架构变更

### 之前（自定义市场）

```
用户 → ETools → 自定义市场 API → 下载插件 → 安装到 plugins/
              ↑
              需要服务器、数据库、CDN
```

### 现在（npm 分发）

```
用户 → ETools → npm registry API → npm install → node_modules/
                              ↑
                              npm 基础设施（免费）
```

---

## 📝 插件元数据字段

在 `package.json` 的 `etools` 字段中定义：

```json
{
  "etools": {
    "id": "plugin-id",              // 必需：插件唯一 ID
    "title": "插件标题",             // 必需：显示名称
    "description": "插件描述",      // 必需：简短说明
    "icon": "./assets/icon.png",    // 可选：图标路径
    "triggers": ["trigger:"],       // 必需：触发词列表
    "permissions": [],              // 可选：权限列表
    "category": "productivity",     // 可选：分类
    "homepage": "https://..."       // 可选：主页 URL
  }
}
```

---

## 🎯 下一步

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

---

## 🔗 相关文档

- **npm 插件规范**: `docs/NPM_PLUGIN_SPEC.md`
- **示例插件**: `npm-packages/@etools-plugin/hello/`
- **Rust 后端**: `src-tauri/src/services/marketplace_service.rs`
- **前端服务**: `src/services/marketplaceService.ts`

---

## 📊 技术细节

### npm API 使用

**搜索 API:**
```
GET https://registry.npmjs.org/-/v1/search?text=keywords:etools-plugin
```

**响应格式:**
```json
{
  "objects": [
    {
      "package": {
        "name": "@etools-plugin/hello",
        "version": "1.0.0",
        "description": "...",
        "keywords": ["etools-plugin"]
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

### 插件安装流程

1. ETools 调用 Rust 命令 `marketplace_install`
2. Rust 执行 `npm install @etools-plugin/hello --prefix <data_dir>/node_modules`
3. npm 下载包到 `node_modules/@etools-plugin/hello/`
4. Rust 读取 `node_modules/@etools-plugin/hello/package.json`
5. 提取 `etools` 元数据字段
6. 返回 Plugin 对象给前端
7. 前端注册插件到插件沙箱

---

## ✅ 验证清单

- [x] npm 插件规范文档完成
- [x] Rust 后端 npm API 集成完成
- [x] Rust npm install/uninstall/update 命令完成
- [x] 前端 MarketplaceService 更新完成
- [x] 前端 UI 组件更新完成
- [x] 示例插件包创建完成
- [x] Cargo.toml 依赖更新完成
- [x] 迁移文档完成

---

## 🎊 总结

**ETools 插件系统已成功迁移到 npm 分发！**

- ✅ **零成本** - 使用 npm 基础设施
- ✅ **零维护** - npm 处理所有服务器、CDN、存储
- ✅ **全球分发** - npm 全球 CDN 加速
- ✅ **标准流程** - 开发者熟悉的 npm 工作流
- ✅ **版本管理** - npm 语义化版本管理
- ✅ **依赖管理** - npm 自动处理依赖

**从现在开始，所有 ETools 插件都是标准的 npm 包！** 🚀

---

**版本：** 1.0.0
**完成日期：** 2025-01-06
**项目名称：** ETools
**迁移状态：** ✅ 完成
