/**
 * Hello World Plugin - v2 API
 *
 * Demonstrates the new plugin architecture:
 * - onSearch returns PluginSearchResultV2 with actionData (no functions)
 * - Action is created on main thread by ActionExecutor
 * - Can be safely executed in Web Worker
 */

import type {
  PluginV2,
  PluginManifest,
  PluginSearchResultV2,
} from '../../plugin-sdk/v2-types';

export const manifest: PluginManifest = {
  id: 'hello-world',
  name: 'Hello World',
  version: '2.0.0',
  description: 'A simple hello world plugin that greets user (v2 API)',
  author: 'ETools Team',
  permissions: [],  // No permissions needed for basic popup
  triggers: ['hello:'],
  icon: '👋',
};

/**
 * onSearch - Executes in Worker
 * Returns PluginSearchResultV2[] with actionData (serializable, no functions)
 */
export async function onSearch(query: string): Promise<PluginSearchResultV2[]> {
  console.log('[HelloWorldPlugin] onSearch called with query:', query);

  const results: PluginSearchResultV2[] = [];

  // Check if query matches trigger
  if (query.toLowerCase().startsWith('hello:')) {
    // Extract name from query (after "hello:")
    const name = query.slice(6).trim() || 'World';
    console.log('[HelloWorldPlugin] Query matches hello: trigger, name:', name);

    // Create result with actionData instead of action function
    results.push({
      id: `hello-${Date.now()}`,
      title: `Hello, ${name}!`,
      description: 'Click to display greeting',
      icon: '👋',
      score: 0.95,
      actionData: {
        type: 'popup',
        description: `Show greeting for ${name}`,
        data: {
          popup: {
            title: 'Hello World',
            message: `Hello, ${name}! 👋`,
            icon: '👋',
            style: 'success',
            buttons: [
              { label: '确定', value: 'ok', isPrimary: true }
            ]
          }
        }
      }
    });

    console.log('[HelloWorldPlugin] Created result:', results[0]);
  }

  console.log('[HelloWorldPlugin] Returning results:', results);
  return results;
}

/**
 * Initialize plugin
 */
export async function init(): Promise<void> {
  console.log('[HelloWorldPlugin] Initialized (v2 API)');
}

/**
 * Plugin export
 */
const plugin: PluginV2 = {
  manifest,
  onSearch,
  init,
};

export default plugin;
