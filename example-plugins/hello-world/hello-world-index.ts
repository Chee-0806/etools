/**
 * Hello World Plugin (T051)
 * A simple example plugin for Kaka
 */

import type { Plugin, PluginManifest } from '@/types/plugin';

// Plugin manifest
export const manifest: PluginManifest = {
  id: 'hello-world',
  name: 'Hello World',
  version: '1.0.0',
  description: 'A simple hello world plugin that greets the user',
  author: 'Kaka Team',
  permissions: [],
  entry: 'index.ts',
  triggers: [
    {
      keyword: 'hello:',
      description: 'Greets the user with a message',
      hotkey: null,
    },
  ],
};

// Plugin search handler
export async function onSearch(query: string) {
  const results: Array<{
    id: string;
    title: string;
    description?: string;
    icon?: string;
    action?: () => void | Promise<void>;
  }> = [];

  // Check if query starts with "hello:"
  if (query.toLowerCase().startsWith('hello:')) {
    const name = query.slice(6).trim() || 'World';

    results.push({
      id: `hello-${Date.now()}`,
      title: `Hello, ${name}!`,
      description: 'Click to display greeting',
      icon: '👋',
      action: async () => {
        alert(`Hello, ${name}! 👋`);
        console.log(`[HelloWorldPlugin] Greeted ${name}`);
      },
    });
  }

  return results;
}

// Plugin initialization
export async function init() {
  console.log('[HelloWorldPlugin] Initialized');
}

// Default export for plugin loader
const plugin: Plugin = {
  manifest,
  onSearch,
  init,
};

export default plugin;
