/**
 * Help Modal Component
 * Displays keyboard shortcuts and feature documentation
 */

import { useEffect } from 'react';
import { Kbd } from './ui/Kbd';
import './HelpModal.css';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Option', 'Space'], description: '打开/关闭搜索窗口', category: '全局' },
  { keys: ['Esc'], description: '关闭窗口/清空输入', category: '全局' },
  { keys: ['↑', '↓'], description: '在结果中导航', category: '搜索' },
  { keys: ['Enter'], description: '执行选中项', category: '搜索' },
  { keys: ['Tab'], description: '切换搜索类型', category: '搜索' },
  { keys: ['Cmd', 'C'], description: '复制选中内容', category: '剪贴板' },
  { keys: ['Cmd', 'V'], description: '粘贴剪贴板历史', category: '剪贴板' },
  { keys: ['Cmd', 'Shift', 'V'], description: '打开剪贴板管理器', category: '剪贴板' },
];

const FEATURES = [
  {
    title: '快速搜索',
    description: '输入关键词即可搜索应用程序、文件、浏览器书签等',
    examples: ['输入 "chrome" 启动浏览器', '输入 "README.md" 查找文件'],
  },
  {
    title: '智能计算',
    description: '直接输入数学表达式即可计算',
    examples: ['输入 "2+2" 显示结果 4', '输入 "100*5%" 计算 5%'],
  },
  {
    title: '颜色转换',
    description: '输入颜色代码进行格式转换',
    examples: ['#ff0000 → rgb(255, 0, 0)', 'hsl(0, 100%, 50%) → #ff0000'],
  },
  {
    title: '网页搜索',
    description: '使用快捷前缀直接搜索',
    examples: ['g: keyword → Google 搜索', 'ddg: keyword → DuckDuckGo', 'gh: keyword → GitHub'],
  },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutsByCategory = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal__header">
          <h2 className="help-modal__title">键盘快捷键与功能</h2>
          <button
            className="help-modal__close"
            onClick={onClose}
            aria-label="关闭"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="help-modal__content">
          {/* Shortcuts Section */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">快捷键</h3>
            {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
              <div key={category} className="help-modal__category">
                <h4 className="help-modal__category-title">{category}</h4>
                <div className="help-modal__shortcuts">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="help-modal__shortcut">
                      <div className="help-modal__shortcut-keys">
                        {shortcut.keys.map((key, i) => (
                          <span key={i} className="help-modal__key-wrapper">
                            <Kbd>{key}</Kbd>
                            {i < shortcut.keys.length - 1 && (
                              <span className="help-modal__key-plus">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                      <span className="help-modal__shortcut-desc">
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Features Section */}
          <section className="help-modal__section">
            <h3 className="help-modal__section-title">功能说明</h3>
            <div className="help-modal__features">
              {FEATURES.map((feature, index) => (
                <div key={index} className="help-modal__feature">
                  <h4 className="help-modal__feature-title">{feature.title}</h4>
                  <p className="help-modal__feature-desc">{feature.description}</p>
                  {feature.examples && (
                    <ul className="help-modal__feature-examples">
                      {feature.examples.map((example, i) => (
                        <li key={i}>{example}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="help-modal__footer">
          <button className="help-modal__btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
