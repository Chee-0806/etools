# 贡献指南

感谢你有兴趣为 etools 做出贡献！我们欢迎所有形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交 Pull Request](#提交-pull-request)
- [报告问题](#报告问题)

## 🤝 行为准则

参与本项目即表示你同意遵守我们的行为准则：
- 尊重不同的观点和经验
- 使用欢迎和包容的语言
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 🚀 如何贡献

### 报告 Bug

如果你发现了 bug，请：
1. 检查 [Issues](https://github.com/Chee-0806/etools/issues) 确认问题未被报告
2. 创建一个 Issue 并使用 Bug Report 模板
3. 提供详细的重现步骤、预期行为和实际行为

### 提出新功能

1. 先检查是否有类似的 Feature Request
2. 创建一个 Feature Request Issue
3. 说明用例和预期行为
4. 等待维护者讨论和批准

### 提交代码

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建一个 Pull Request

## 💻 开发流程

### 环境准备

```bash
# 克隆仓库
git clone https://github.com/Chee-0806/etools.git
cd etools

# 安装依赖
pnpm install

# 启动开发服务器
pnpm tauri dev
```

### 项目结构

```
etools/
├── src/                    # 前端源码 (React + TypeScript)
│   ├── components/         # React 组件
│   ├── hooks/             # 自定义 Hooks
│   ├── services/          # 业务逻辑服务
│   ├── lib/              # 工具库
│   └── styles/           # 样式文件
├── src-tauri/            # 后端源码 (Rust)
│   ├── src/
│   │   ├── cmds/         # Tauri 命令
│   │   ├── services/     # 业务服务
│   │   ├── models/       # 数据模型
│   │   └── db/           # 数据库
│   └── tauri.conf.json   # Tauri 配置
└── example-plugins/      # 示例插件
```

### 代码规范

#### TypeScript/React

- 使用函数组件和 Hooks
- 遵循 ESLint 配置
- 组件使用 PascalCase 命名
- 函数使用 camelCase 命名
- 添加适当的类型注解

```tsx
// ✅ 好的示例
interface Props {
  title: string;
  onClick: () => void;
}

export function MyButton({ title, onClick }: Props) {
  return <button onClick={onClick}>{title}</button>;
}
```

#### Rust

- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 检查代码
- 函数使用 snake_case 命名
- 添加适当的文档注释

```rust
// ✅ 好的示例
/// 获取已安装的应用程序
///
/// # Arguments
///
/// * `refresh` - 是否刷新缓存
///
/// # Returns
///
/// 返回应用列表和扫描耗时
#[tauri::command]
pub fn get_installed_apps(refresh: bool) -> Result<Vec<App>, String> {
    // ...
}
```

### 提交信息规范

我们使用 [约定式提交](https://www.conventionalcommits.org/zh-hans/) 规范：

```
<类型>[可选 范围]: <描述>

[可选 正文]

[可选 脚注]
```

**类型 (Type)**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI 配置文件和脚本的变动

**示例**:
```
feat(search): 添加模糊搜索功能

- 实现 Fuse.js 模糊搜索算法
- 添加搜索结果高亮
- 支持拼音搜索

Closes #123
```

## 📝 提交 Pull Request

### PR 检查清单

提交 PR 前，请确保：

- [ ] 代码通过 `pnpm test` 测试
- [ ] 前端通过 `pnpm lint` 检查
- [ ] Rust 代码通过 `cargo clippy` 检查
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 遵循代码规范
- [ ] 提交信息符合规范

### PR 标题格式

使用约定式提交格式：

```
feat: 添加用户认证功能
fix: 修复窗口关闭时的内存泄漏
docs: 更新 README 安装说明
```

### PR 描述模板

创建 PR 时，请包含：

- **变更类型**: feat / fix / docs / refactor 等
- **变更说明**: 这个 PR 做了什么
- **相关 Issue**: 关联的 Issue 编号
- **测试说明**: 如何测试这些变更
- **截图**: 如果是 UI 变更，添加截图

## 🐛 报告问题

### Bug Report

使用 Bug Report 模板创建 Issue，包含：

- **环境信息**: OS、应用版本
- **重现步骤**: 详细的重现步骤
- **预期行为**: 你期望发生什么
- **实际行为**: 实际发生了什么
- **日志**: 相关的错误日志

### Feature Request

使用 Feature Request 模板，说明：

- **功能描述**: 你想要什么功能
- **用例**: 为什么需要这个功能
- **替代方案**: 你考虑过的替代方案
- **附加信息**: 其他相关信息

## 📧 联系方式

- GitHub Issues: https://github.com/Chee-0806/etools/issues
- Discussions: https://github.com/Chee-0806/etools/discussions

## 📄 许可证

提交贡献即表示你同意你的贡献将在 [MIT License](LICENSE) 下发布。

---

再次感谢你的贡献！🎉
