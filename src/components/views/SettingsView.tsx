/**
 * SettingsView - 设置视图
 * 单窗口架构下的设置界面
 */

import { useState, useCallback } from 'react';
import { BackButton } from '../BackButton';
import { HotkeySettingsPanel } from '../HotkeySettingsPanel';
import PluginManager from '../PluginManager/PluginManager';

type SettingsTab = 'plugins' | 'hotkeys';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('plugins');

  const handleTabClick = useCallback((tab: SettingsTab) => {
    console.log('[SettingsView] 切换 tab:', tab);
    setActiveTab(tab);
  }, []);

  return (
    <div className="settings-window">
      <div className="settings-header">
        <BackButton />
        <h2>设置</h2>
      </div>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'plugins' ? 'active' : ''}`}
          onClick={() => handleTabClick('plugins')}
        >
          插件
        </button>
        <button
          className={`settings-tab ${activeTab === 'hotkeys' ? 'active' : ''}`}
          onClick={() => handleTabClick('hotkeys')}
        >
          热键
        </button>
      </div>

      <div className="settings-content">
        <div
          className="settings-section settings-section--full"
          style={{
            display: activeTab === 'plugins' ? 'block' : 'none'
          }}
        >
          <PluginManager
            showMarketplace={true}
            initialView="installed"
          />
        </div>
        <div
          className="settings-section settings-section--full"
          style={{
            display: activeTab === 'hotkeys' ? 'block' : 'none'
          }}
        >
          <HotkeySettingsPanel />
        </div>
      </div>
    </div>
  );
}
