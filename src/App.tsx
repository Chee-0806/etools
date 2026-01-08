/**
 * Productivity Launcher Main App
 * Quick app/file/web search with plugin support
 *
 * Optimized with:
 * - Modern design system
 * - Performance optimizations (memo, useMemo, useCallback)
 * - Enhanced accessibility
 * - Smooth animations and transitions
 */

import React, { useEffect, useState, useMemo } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SearchWindow } from "@/components/SearchWindow";
import { SettingsWindow } from "@/components/SettingsWindow";
import { PluginPopupWindow } from "@/components/PluginPopupWindow";
import { ComponentShowcase } from "@/components/ui";
import { PluginStoreProvider } from "@/services/pluginStateStore";
import { useTheme } from "@/hooks/useTheme";
import NotificationSystem from "@/components/PluginManager/NotificationSystem";
import { pluginLoader } from "@/services/pluginLoader";
import { initSandboxDevTools } from "@/services/sandboxDevTools";
import "@/i18n"; // Initialize i18n
import "@/styles/design-tokens.css";
import "@/styles/global.css";
import "@/styles/theme-light.css";
import "@/styles/theme-dark.css";
import "@/styles/components/SearchWindow.css";
import "@/styles/components/SettingsWindow.css";
import "@/styles/components/PluginPopupWindow.css";
import "@/styles/components/PluginManager/PluginManager.css";
import "@/styles/components/SidebarPanel.css";

// Check if running in Tauri environment
const isTauri = () => typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

// Type declaration for Tauri environment detection
declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}

function App() {
  const [viewMode, setViewMode] = useState<'search' | 'showcase' | 'plugins'>('search');

  // CRITICAL: 窗口路由逻辑
  // NOTE: 这是 Tauri 框架的特殊情况，不符合架构原则但属于例外
  // Tauri 的设计是多个窗口共享同一个前端入口（App.tsx）
  // 因此必须在前端通过 window label 判断当前是哪个窗口来渲染对应的 UI
  // 这是 Tauri 官方推荐的做法，不是窗口管理操作
  const [windowLabel, setWindowLabel] = useState<string>(() => {
    if (isTauri()) {
      return getCurrentWindow().label;
    }
    return 'main';
  });
  const { resolvedTheme } = useTheme();

  /**
   * Lazy load PluginManager component
   */
  const PluginManagerComponent = useMemo(() => {
    return React.lazy(() => import('@/components/PluginManager/PluginManager'));
  }, []);

  useEffect(() => {
    const loadBuiltInPlugins = async () => {
      try {
        await pluginLoader.loadBuiltInPlugins();
      } catch (error) {
        console.error('[App] Failed to load built-in plugins:', error);
      }
    };

    loadBuiltInPlugins();

    // Initialize sandbox developer tools in development mode
    initSandboxDevTools();
  }, []);

  useEffect(() => {
    if (isTauri()) {
      // NOTE: Global shortcut is now registered in Rust backend (lib.rs)
      // The frontend registration has been removed to avoid conflicts.
    }
  }, [windowLabel]);

  // Render based on window label
  // - 'main' window: SearchWindow (unified search input + results)
  // - 'settings' window: SettingsWindow (settings panel)
  // - 'plugin-popup' window: PluginPopupWindow (universal popup for plugins)
  // - Others: ComponentShowcase (dev mode)
  if (windowLabel === 'settings') {
    return (
      <PluginStoreProvider>
        <SettingsWindow />
      </PluginStoreProvider>
    );
  }

  if (windowLabel === 'plugin-popup') {
    return <PluginPopupWindow />;
  }

  return (
    <PluginStoreProvider>
      <NotificationSystem />
      <div className="app">
        {/* View mode toggle - only show in main window */}
        {/* DISABLED: These buttons were blocking the search input
        {windowLabel === 'main' && (
          <div className="view-toggles">
            <button
              className={`view-toggle ${viewMode === 'search' ? 'active' : ''}`}
              onClick={() => setViewMode('search')}
              aria-label="搜索视图"
            >
              🔍 搜索
            </button>
            <button
              className={`view-toggle ${viewMode === 'plugins' ? 'active' : ''}`}
              onClick={() => setViewMode('plugins')}
              aria-label="插件管理"
            >
              🧩 插件
            </button>
            <button
              className={`view-toggle ${viewMode === 'showcase' ? 'active' : ''}`}
              onClick={() => setViewMode('showcase')}
              aria-label="组件展示"
            >
              🎨 组件
            </button>
          </div>
        )}
        */}

        {viewMode === 'search' && <SearchWindow />}
        {viewMode === 'plugins' && (
          <React.Suspense fallback={<div className="loading">加载中...</div>}>
            <PluginManagerComponent
              showMarketplace={false}
              showInstall={false}
              initialView="installed"
            />
          </React.Suspense>
        )}
        {viewMode === 'showcase' && <ComponentShowcase />}
      </div>
    </PluginStoreProvider>
  );
}

export default App;
