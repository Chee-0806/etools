/**
 * SettingsButton - 右侧圆形设置图标按钮
 * 点击打开独立的设置窗口
 */

import { invoke } from '@tauri-apps/api/core';

export function SettingsButton() {
  const handleClick = async () => {
    try {
      console.log('[SettingsButton] Opening settings window');
      await invoke('show_settings_window');
    } catch (error) {
      console.error('[SettingsButton] Failed to open settings:', error);
    }
  };

  return (
    <button
      className="settings-button"
      onClick={handleClick}
      aria-label="打开设置"
      type="button"
      style={{ border: '2px solid red' }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="settings-icon"
      >
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
