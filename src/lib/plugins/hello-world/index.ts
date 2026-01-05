import type { Plugin, PluginManifest, PluginSearchResult } from './plugin-sdk/types';

export const manifest: PluginManifest = {
  id: 'hello-world',
  name: 'Hello World',
  version: '1.0.0',
  description: 'A simple hello world plugin that greets user',
  author: 'Kaka Team',
  permissions: [],
  triggers: ['hello:'],
};

export async function onSearch(query: string): Promise<PluginSearchResult[]> {
  console.log('[HelloWorldPlugin] onSearch called with query:', query);
  const results: PluginSearchResult[] = [];

  if (query.toLowerCase().startsWith('hello:')) {
    const name = query.slice(6).trim() || 'World';
    console.log('[HelloWorldPlugin] Query matches hello: trigger, name:', name);

    results.push({
      id: `hello-${Date.now()}`,
      title: `Hello, ${name}!`,
      description: 'Click to display greeting',
      icon: '👋',
      action: async () => {
        const message = `Hello, ${name}! 👋`;
        console.log('[HelloWorldPlugin] Executing action with message:', message);

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
            console.log('[HelloWorldPlugin] Popup shown successfully');
          } catch (error) {
            console.error('[HelloWorldPlugin] Failed to show popup:', error);
            // Fallback to alert
            alert(message);
          }
        } else {
          // Browser mode - use alert
          alert(message);
        }
      },
    });

    console.log('[HelloWorldPlugin] Created result:', results[0]);
  }

  console.log('[HelloWorldPlugin] Returning results:', results);
  return Promise.resolve(results);
}

export async function init() {
  console.log('[HelloWorldPlugin] Initialized');
}

const plugin: Plugin = {
  manifest,
  onSearch,
  init,
};

export default plugin;
