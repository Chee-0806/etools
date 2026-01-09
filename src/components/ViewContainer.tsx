import { useEffect } from 'react';
import { useViewManagerStore } from '@/stores/viewManagerStore';
import { SearchView } from './views/SearchView';
import { SettingsView } from './views/SettingsView';
import { PluginsView } from './views/PluginsView';
// ViewContainer.css 已在 App.tsx 中导入，这里不需要重复导入

export function ViewContainer() {
  const { currentView, direction } = useViewManagerStore();

  useEffect(() => {
    console.log('[ViewContainer] Current view:', currentView, 'Direction:', direction);
  }, [currentView, direction]);

  return (
    <div className="view-container">
      {currentView === 'search' && (
        <div
          data-view="search"
          className={`view view--${direction}`}
        >
          <SearchView />
        </div>
      )}
      {currentView === 'settings' && (
        <div
          data-view="settings"
          className={`view view--${direction}`}
        >
          <SettingsView />
        </div>
      )}
      {currentView === 'plugins' && (
        <div
          data-view="plugins"
          className={`view view--${direction}`}
        >
          <PluginsView />
        </div>
      )}
    </div>
  );
}
