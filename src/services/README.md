# 插件市场数据管理

## 📦 数据源

**方案**: 内嵌数据（Embedded Data）
- ✅ 无需服务器
- ✅ 无需后端
- ✅ 零配置
- ✅ 离线可用

数据位置：`src/services/mockMarketplaceData.ts`

## ➕ 添加新插件

### 步骤 1: 编辑 Mock 数据文件

打开 `src/services/mockMarketplaceData.ts`，找到对应分类的数组：

```typescript
/**
 * 生产力工具分类数据
 */
const productivityPlugins: MarketplacePlugin[] = [
  {
    name: '@etools-plugin/my-plugin',        // npm 包名
    pluginName: '我的插件',                   // 显示名称
    description: '插件描述',                  // 简短描述
    logo: 'https://...',                     // 图标 URL
    author: 'Your Name',                     // 作者
    homepage: 'https://...',                 // 项目主页（可选）
    version: '1.0.0',                        // 版本号
    features: ['特性1', '特性2'],            // 功能列表
    keywords: ['keyword1', 'keyword2'],     // 搜索关键词
    category: 'productivity',               // 分类
    tags: ['标签1', '标签2'],              // 标签
    permissions: [],                        // 所需权限
  },
  // ... 更多插件
];
```

### 步骤 2: 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | npm 包名，格式：`@etools-plugin/xxx` |
| `pluginName` | string | ✅ | 显示名称 |
| `description` | string | ✅ | 简短描述（1-2 句话） |
| `logo` | string | ✅ | 图标 URL（64x64 推荐） |
| `author` | string | ✅ | 作者名称 |
| `homepage` | string | ❌ | 项目主页 URL |
| `version` | string | ✅ | 版本号（semver 格式） |
| `features` | string[] | ✅ | 功能特性列表（3-5 个） |
| `keywords` | string[] | ✅ | 搜索关键词（用于搜索） |
| `category` | string | ✅ | 分类（见下方） |
| `tags` | string[] | ❌ | 标签（用于展示） |
| `permissions` | string[] | ❌ | 所需权限列表 |

### 步骤 3: 分类选择

可用分类：
- `productivity` - 生产力工具
- `developer` - 开发工具
- `utilities` - 实用工具
- `search` - 搜索增强
- `media` - 媒体处理
- `integration` - 第三方集成

将新插件添加到对应分类的数组中。

### 步骤 4: 图标建议

- 使用 placeholder 服务（开发测试）：`https://via.placeholder.com/64/COLOR/text`
- 使用实际图标 URL（生产）：GitHub README 图片、CDN 等
- 推荐尺寸：64x64 像素
- 推荐格式：PNG、SVG

### 示例：添加新插件

```typescript
const developerPlugins: MarketplacePlugin[] = [
  // ... 现有插件

  // 新插件
  {
    name: '@etools-plugin/base64-encoder',
    pluginName: 'Base64 编解码',
    description: '快速编码和解码 Base64 格式',
    logo: 'https://via.placeholder.com/64/6C5CE7/ffffff?text=B64',
    author: 'Your Name',
    version: '1.0.0',
    features: [
      'Base64 编码',
      'Base64 解码',
      '支持大文件',
      '剪贴板集成',
    ],
    keywords: ['base64', 'encode', 'decode', '编码', '解码'],
    category: 'developer',
    tags: ['开发', '工具', '编码'],
    permissions: ['clipboard:read', 'clipboard:write'],
  },
];
```

## 🔄 更新现有插件

直接修改 `mockMarketplaceData.ts` 中对应的插件对象即可：

```typescript
{
  name: '@etools-plugin/hello',
  pluginName: 'Hello World',         // ← 修改显示名称
  version: '2.0.0',                  // ← 更新版本号
  features: [                        // ← 更新功能列表
    '新特性 1',
    '新特性 2',
  ],
  // ... 其他字段
}
```

## 🗑️ 删除插件

直接从数组中移除对应的插件对象：

```typescript
const productivityPlugins: MarketplacePlugin[] = [
  {
    name: '@etools-plugin/hello',
    // ...
  },
  // 删除下面的插件
  // {
  //   name: '@etools-plugin/old-plugin',
  //   ...
  // },
];
```

## ✅ 验证

1. **保存文件**
2. **重启应用**（如果正在运行）
   ```bash
   # 应用会自动热重载，或者手动重启
   pnpm tauri dev
   ```

3. **检查插件市场**
   - 打开应用
   - 进入设置 → 插件 → 插件市场
   - 查看新插件是否显示

## 📝 注意事项

### npm 包要求

插件必须先发布到 npm：

```bash
# 检查包是否存在
npm view @etools-plugin/my-plugin

# 如果不存在，先发布
cd my-plugin
npm publish
```

### 版本号

- 使用 semver 格式：`1.0.0`、`1.2.3`、`2.0.0-beta.1`
- 更新插件时同步更新版本号

### 搜索关键词

- 选择用户容易搜索的词
- 包含同义词、别名
- 示例：`['todo', '任务', '待办', 'task']`

### 分类选择

- 根据主要功能选择分类
- 如果不确定，选择 `utilities`（实用工具）

## 🚀 部署

内嵌数据会随应用一起打包，无需额外部署步骤。

构建生产版本：

```bash
pnpm tauri build
```

生成的 `.app` 或 `.exe` 文件中已包含所有插件数据。

## 📚 相关文件

- **数据定义**: `src/services/mockMarketplaceData.ts`
- **数据服务**: `src/services/marketplaceData.ts`
- **类型定义**: `src/types/plugin.ts`
- **UI 组件**: `src/components/PluginManager/MarketplaceView.tsx`
- **存档数据**: `marketplace-data-archive/`（JSON 格式，仅供参考）

## ❓ 常见问题

### Q: 修改数据后没有生效？

**A**:
1. 确保保存了 `mockMarketplaceData.ts`
2. 重启应用（Cmd+R 或 Ctrl+R）
3. 清除浏览器缓存（如果使用浏览器预览）

### Q: 如何批量导入插件？

**A**: 编辑 `mockMarketplaceData.ts`，在对应分类数组中添加多个插件对象。参考 `marketplace-data-archive/` 中的 JSON 文件格式。

### Q: 图标不显示？

**A**:
1. 检查 URL 是否正确
2. 确保图片可以被公开访问
3. 使用 placeholder 测试：`https://via.placeholder.com/64`

### Q: 如何排序插件？

**A**: 数组中的顺序即为显示顺序，直接调整数组元素位置即可。

---

**总结**: 所有插件数据都在 `mockMarketplaceData.ts` 中，直接编辑即可。零服务器、零配置、零依赖！
