/**
 * SettingsWindow - 设置窗口组件
 * 在独立的settings窗口中渲染，包含插件、热键两个标签页
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import PluginManager from './PluginManager/PluginManager';
import { HotkeySettingsPanel } from './HotkeySettingsPanel';

type TabType = 'plugins' | 'hotkeys';

export function SettingsWindow() {
  const [activeTab, setActiveTab] = useState<TabType>('plugins');

  // 监听主窗口的关闭事件，关闭设置窗口
  // 使用后端命令而非直接操作窗口
  useEffect(() => {
    const unlistenPromise = listen('close-settings', async () => {
      try {
        await invoke('hide_settings_window');
      } catch (error) {
        console.error('[SettingsWindow] Failed to hide via backend command:', error);
      }
    });
    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, []);

  const handleClose = async () => {
    try {
      // 使用后端命令来正确处理窗口切换
      await invoke('hide_settings_window');
    } catch (error) {
      console.error('[SettingsWindow] Failed to close settings:', error);
      // 不再降级到前端窗口管理，而是显示错误
      // TODO: 可以添加用户可见的错误提示
    }
  };

  return (
    <div className="settings-window">
      {/* 头部 */}
      <div className="settings-header">
        <h2 className="settings-title">设置</h2>
        <button className="settings-close" onClick={handleClose} aria-label="关闭">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* 标签页导航 */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'plugins' ? 'active' : ''}`}
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
          className={`settings-tab ${activeTab === 'hotkeys' ? 'active' : ''}`}
          onClick={() => setActiveTab('hotkeys')}
          aria-selected={activeTab === 'hotkeys'}
          role="tab"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 14V16M9 14V16M13 14V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5 7H13M5 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          热键
        </button>
      </div>

      {/* 内容区域 */}
      <div className="settings-content">
        {activeTab === 'plugins' && (
          <div className="settings-section settings-section--full">
            <PluginManager
              showMarketplace={true}
              initialView="installed"
            />
          </div>
        )}

        {activeTab === 'hotkeys' && (
          <div className="settings-section settings-section--full">
            <HotkeySettingsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
