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

import { useEffect } from 'react';
import { PluginStoreProvider } from '@/services/pluginStateStore';
import NotificationSystem from '@/components/PluginManager/NotificationSystem';
import { pluginLoader } from '@/services/pluginLoader';
import { initSandboxDevTools } from '@/services/sandboxDevTools';
import { ViewContainer } from '@/components/ViewContainer';

// Styles
import '@/components/BackButton.css';
import '@/i18n';
import '@/styles/design-tokens.css';
import '@/styles/global.css';
import '@/styles/theme-light.css';
import '@/styles/theme-dark.css';
import '@/styles/components/ViewContainer.css';
import '@/styles/components/SearchView.css';
import '@/styles/components/SettingsView.css';
import '@/styles/components/ResultList.css';
import '@/styles/components/PluginManager/PluginManager.css';
import '@/styles/components/PluginUIView.css';

function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await pluginLoader.loadInstalledPlugins();
        console.log('[App] Installed plugins loaded successfully');
      } catch (error) {
        console.error('[App] Failed to load installed plugins:', error);
      }

      initSandboxDevTools();
    };

    initializeApp();
  }, []);

  return (
    <PluginStoreProvider>
      <NotificationSystem />
      <ViewContainer />
    </PluginStoreProvider>
  );
}

export default App;
