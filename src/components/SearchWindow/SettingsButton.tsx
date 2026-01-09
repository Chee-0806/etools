/**
 * SettingsButton - 右侧圆形设置图标按钮
 * 点击切换到设置视图（单窗口架构，不调整窗口大小）
 */

import { useViewNavigation } from '@/hooks/useViewNavigation';

export function SettingsButton() {
  const { navigateTo } = useViewNavigation();

  const handleClick = async () => {
    try {
      console.log('[SettingsButton] ===== 开始导航到设置页面 =====');
      console.log('[SettingsButton] 参数: skipResize = true (保持窗口大小)');
      // 使用前端视图导航，不调整窗口大小
      await navigateTo('settings', true); // true = skip resize
      console.log('[SettingsButton] ===== 导航完成 =====');
    } catch (error) {
      console.error('[SettingsButton] 导航失败:', error);
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
