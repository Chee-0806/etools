/**
 * SidebarPanel - 弹出式侧边栏面板
 * 展示插件、组件、个人信息等页面
 */

import { useState, useEffect, useRef } from 'react';

type TabType = 'plugins' | 'components' | 'profile';

interface SidebarPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarPanel({ isOpen, onClose }: SidebarPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('plugins');
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="sidebar-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="sidebar-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="设置面板"
      >
        {/* 头部 */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">设置</h2>
          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* 标签页导航 */}
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${activeTab === 'plugins' ? 'active' : ''}`}
            onClick={() => setActiveTab('plugins')}
            aria-selected={activeTab === 'plugins'}
            role="tab"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2L2 6V12C2 12.6 2.4 13 3 13H15C15.6 13 16 12.6 16 12V6L9 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            插件
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'components' ? 'active' : ''}`}
            onClick={() => setActiveTab('components')}
            aria-selected={activeTab === 'components'}
            role="tab"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect
                x="2"
                y="2"
                width="14"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M6 6H12M6 9H12M6 12H9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            组件
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            aria-selected={activeTab === 'profile'}
            role="tab"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle
                cx="9"
                cy="6"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M3 16C3 13 5 11 9 11C13 11 15 13 15 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            个人信息
          </button>
        </div>

        {/* 内容区域 */}
        <div className="sidebar-content">
          {activeTab === 'plugins' && (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">插件管理</h3>
              <div className="sidebar-section-content">
                <p className="sidebar-empty">插件列表加载中...</p>
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">组件展示</h3>
              <div className="sidebar-section-content">
                <p className="sidebar-empty">组件列表加载中...</p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">个人信息</h3>
              <div className="sidebar-section-content">
                <div className="profile-info">
                  <div className="profile-avatar">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="20" fill="rgb(var(--color-accent-primary))" opacity="0.1"/>
                      <text x="20" y="26" textAnchor="middle" fill="rgb(var(--color-accent-primary))" fontSize="16" fontWeight="600">U</text>
                    </svg>
                  </div>
                  <div className="profile-details">
                    <p className="profile-name">用户</p>
                    <p className="profile-email">user@example.com</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
