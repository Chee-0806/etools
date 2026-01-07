/**
 * @etools-plugin/hello
 * Hello World Plugin for ETools
 *
 * A simple greeting plugin that demonstrates the ETools plugin system.
 */

// Plugin SDK Types
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  triggers: string[];
}

export interface PluginSearchResult {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  action: () => void | Promise<void>;
}

export interface Plugin {
  manifest: PluginManifest;
  onSearch: (query: string) => Promise<PluginSearchResult[]>;
  init?: () => Promise<void>;
}

// Plugin Manifest
export const manifest: PluginManifest = {
  id: 'hello-world',
  name: 'Hello World',
  version: '1.0.0',
  description: 'A simple hello world plugin that greets user',
  author: 'ETools Team',
  permissions: [],
  triggers: ['hello:'],
};

/**
 * Search function - called when user types in the search box
 */
export async function onSearch(query: string): Promise<PluginSearchResult[]> {
  console.log('[HelloPlugin] onSearch called with query:', query);
  const results: PluginSearchResult[] = [];

  if (query.toLowerCase().startsWith('hello:')) {
    const name = query.slice(6).trim() || 'World';
    console.log('[HelloPlugin] Query matches hello: trigger, name:', name);

    results.push({
      id: `hello-${Date.now()}`,
      title: `Hello, ${name}!`,
      description: 'Click to display greeting',
      icon: '👋',
      action: async () => {
        const message = `Hello, ${name}! 👋`;
        console.log('[HelloPlugin] Executing action with message:', message);

        // Check if running in Tauri environment
        const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

        if (isTauri) {
          try {
            // Use universal plugin popup API
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('show_plugin_popup', {
              pluginId: 'hello-world',
              title: 'Hello World',
              message: message,
              icon: '👋',
              style: 'success',
              buttons: [
                { label: '确定', value: 'ok', isPrimary: true }
              ]
            });
            console.log('[HelloPlugin] Popup shown successfully');
          } catch (error) {
            console.error('[HelloPlugin] Failed to show popup:', error);
            // Fallback to alert
            alert(message);
          }
        } else {
          // Browser mode - use alert
          alert(message);
        }
      },
    });

    console.log('[HelloPlugin] Created result:', results[0]);
  }

  console.log('[HelloPlugin] Returning results:', results);
  return Promise.resolve(results);
}

/**
 * Initialize function - called when plugin is loaded
 */
export async function init() {
  console.log('[HelloPlugin] Initialized');
}

// Default export
const plugin: Plugin = {
  manifest,
  onSearch,
  init,
};

export default plugin;
