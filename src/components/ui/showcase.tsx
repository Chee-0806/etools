/**
 * UI Component Showcase
 * 展示所有 UI 组件及其变体
 */

import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { Input } from './Input';
import { Spinner } from './Spinner';
import { Kbd } from './Kbd';
import { Skeleton } from './Skeleton';
import './showcase.css';

export function ComponentShowcase() {
  return (
    <div className="showcase">
      <header className="showcase__header">
        <h1 className="showcase__title">UI 组件展示</h1>
        <p className="showcase__subtitle">Productivity Launcher 设计系统组件库</p>
      </header>

      {/* Button Section */}
      <section className="showcase__section">
        <h2 className="showcase__section-title">Button 按钮</h2>
        <div className="showcase__subsection">
          <h3 className="showcase__subsection-title">Variants 变体</h3>
          <div className="showcase__row">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="gradient">Gradient</Button>
          </div>
        </div>
        <div className="showcase__subsection">
          <h3 className="showcase__subsection-title">Sizes 尺寸</h3>
          <div className="showcase__row">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </div>
        <div className="showcase__subsection">
          <h3 className="showcase__subsection-title">States 状态</h3>
          <div className="showcase__row">
            <Button variant="primary">Normal</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" isLoading>Loading</Button>
          </div>
        </div>
      </section>

      {/* Card Section */}
      <section className="showcase__section">
        <h2 className="showcase__section-title">Card 卡片</h2>
        <div className="showcase__subsection">
          <h3 className="showcase__subsection-title">Variants 变体</h3>
          <div className="showcase__card-grid">
            <Card variant="default" padding="md">
              <h4>Default</h4>
              <p>默认卡片样式</p>
            </Card>
            <Card variant="elevated" padding="md">
              <h4>Elevated</h4>
              <p>提升阴影卡片</p>
            </Card>
            <Card variant="outlined" padding="md">
              <h4>Outlined</h4>
              <p>描边卡片</p>
            </Card>
            <Card variant="filled" padding="md">
              <h4>Filled</h4>
              <p>填充背景卡片</p>
            </Card>
            <Card variant="glass" padding="md" hover>
              <h4>Glass</h4>
              <p>玻璃态效果卡片</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Input Section */}
      <section className="showcase__section">
        <h2 className="showcase__section-title">Input 输入框</h2>
        <div className="showcase__subsection">
          <h3 className="showcase__subsection-title">States 状态</h3>
          <div className="showcase__column">
            <Input placeholder="默认输入框" />
            <Input placeholder="聚焦状态" defaultValue="有内容" />
            <Input placeholder="禁用状态" disabled />
            <Input placeholder="错误状态" error="有错误" />
            <Input placeholder="带图标" leftIcon="🔍" />
          </div>
        </div>
      </section>

      {/* Badge Section */}
      <section className="showcase__section">
        <h2 className="showcase__section-title">Badge 徽章</h2>
        <div className="showcase__row">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
        </div>
        <div className="showcase__row" style={{ marginTop: 'var(--spacing-3)' }}>
          <Badge variant="primary" size="sm">Small</Badge>
          <Badge variant="primary" size="md">Medium</Badge>
        </div>
      </section>

      {/* Spinner Section */}
      <section className="showcase__section">
        <h2 className="showcase__section-title">Spinner 加载器</h2>
        <div className="showcase__row">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
        <div className="showcase__row" style={{ marginTop: 'var(--spacing-3)' }}>
          <Spinner size="md" color="primary" />
          <Spinner size="md" color="secondary" />
          <Spinner size="md" />
        </div>
      </section>

      {/* Keyboard Section */}
      <section className="showcase__section">
        <h2 className="showcase__section-title">Keyboard 键盘快捷键</h2>
        <div className="showcase__row">
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>⌫</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Esc</Kbd>
        </div>
        <div className="showcase__row" style={{ marginTop: 'var(--spacing-3)' }}>
          <Kbd>⌘K</Kbd>
          <Kbd>⇧⌘P</Kbd>
          <Kbd>⌫</Kbd> + <Kbd>⇧</Kbd>
        </div>
      </section>

      {/* Skeleton Section */}
      <section className="showcase__section">
        <h2 className="showcase__section-title">Skeleton 骨架屏</h2>
        <Card padding="lg" variant="outlined">
          <div className="showcase__skeleton">
            <Skeleton variant="circular" width={40} height={40} />
            <div style={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
        </Card>
      </section>

      {/* Animations Section */}
      <section className="showcase__section">
        <h2 className="showcase__section-title">Micro-interactions 微交互动画</h2>
        <p className="showcase__hint">
          💡 提示：悬停/点击按钮查看动画效果
        </p>
        <div className="showcase__row">
          <Button variant="primary">Ripple 波纹效果</Button>
          <Button variant="gradient">Gradient Hover 渐变过渡</Button>
          <Button variant="soft">Scale Hover 缩放效果</Button>
        </div>
      </section>

      <footer className="showcase__footer">
        <p>Productivity Launcher UI Design System</p>
        <p className="showcase__footer-note">
          基于 Design Tokens 构建 • 支持深色模式 • 无障碍友好
        </p>
      </footer>
    </div>
  );
}
