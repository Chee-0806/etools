/**
 * Plugin Loader Service (T111)
 * Handles plugin discovery, loading, and lifecycle management
 */

import type { Plugin, PluginManifest } from '@/types/plugin';
import type { PluginPermission } from '@/lib/plugin-sdk/types';
import { invoke } from '@tauri-apps/api/core';

/**
 * Permission mapping for Tauri commands (T006, T047)
 * Maps Tauri command names to required plugin permissions
 */
const PERMISSION_MAP: Record<string, PluginPermission> = {
  'get_clipboard_history': 'read_clipboard',
  'paste_clipboard_item': 'write_clipboard',
  'read_file': 'read_files',
  'write_file': 'write_files',
  'http_request': 'network',
  'execute_shell': 'shell',
  'send_notification': 'notifications',
};

/**
 * Check if plugin has required permission for a command (T047)
 */
function hasPermission(permissions: PluginPermission[], cmd: string): boolean {
  const required = PERMISSION_MAP[cmd];
  return required ? permissions.includes(required) : true;
}

/**
 * Restricted API wrapper for plugins (T048)
 * Wraps Tauri invoke calls with permission checking
 */
export function createRestrictedAPI(pluginId: string, permissions: PluginPermission[]) {
  return {
    invoke: async (cmd: string, args?: Record<string, unknown>) => {
      // Check permission before invoking command
      if (!hasPermission(permissions, cmd)) {
        throw new Error(`Plugin ${pluginId} lacks required permission for ${cmd}`);
      }

      // Log the API call for audit
      console.log(`[PluginAPI] ${pluginId} invoking ${cmd}`, args);

      // Invoke the actual Tauri command
      return invoke(cmd, args);
    },

    clipboard: {
      getHistory: (limit?: number) => {
        return createRestrictedAPI(pluginId, permissions).invoke('get_clipboard_history', { limit });
      },
      paste: (id: string) => {
        return createRestrictedAPI(pluginId, permissions).invoke('paste_clipboard_item', { id });
      },
    },

    file: {
      read: (path: string) => {
        return createRestrictedAPI(pluginId, permissions).invoke('read_file', { path });
      },
      write: (path: string, content: string) => {
        return createRestrictedAPI(pluginId, permissions).invoke('write_file', { path, content });
      },
    },

    shell: {
      execute: (command: string) => {
        return createRestrictedAPI(pluginId, permissions).invoke('execute_shell', { command });
      },
    },

    network: {
      request: async (url: string, options?: RequestInit) => {
        // Network requests use fetch directly
        // NOTE: 这是插件的受限 API，允许插件发起网络请求
        // TODO: 未来应该通过后端命令 plugin_http_request 实现，以遵循架构原则
        // 但需要先在后端实现相应的命令
        if (!permissions.includes('network')) {
          throw new Error(`Plugin ${pluginId} lacks network permission`);
        }
        return fetch(url, options);
      },
    },

    notification: {
      send: (title: string, body: string) => {
        return createRestrictedAPI(pluginId, permissions).invoke('send_notification', { title, body });
      },
    },
  };
}

export interface PluginLoadResult {
  manifest: PluginManifest;
  plugin?: Plugin;
  error?: string;
}

/**
 * Plugin Loader class
 */
export class PluginLoader {
  private loadedPlugins = new Map<string, Plugin>();
  private pluginManifests = new Map<string, PluginManifest>();

  /**
   * Load a plugin from a module
   */
  async loadPlugin(modulePath: string): Promise<PluginLoadResult> {
    try {
      // Dynamic import of plugin module
      const module = await import(/* @vite-ignore */ modulePath);
      const plugin: Plugin = module.default;

      // Validate plugin structure
      if (!plugin.manifest) {
        throw new Error('Plugin missing manifest');
      }

      const { manifest } = plugin;

      // Validate manifest
      if (!manifest.id || !manifest.name || !manifest.version) {
        throw new Error('Plugin manifest missing required fields');
      }

      // Register plugin with SDK
      // TODO: await pluginSDK.register(plugin);

      // Store plugin
      this.loadedPlugins.set(manifest.id, plugin);
      this.pluginManifests.set(manifest.id, manifest);

      console.log(`[PluginLoader] Loaded plugin: ${manifest.id} v${manifest.version}`);

      return { manifest, plugin };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[PluginLoader] Failed to load plugin from ${modulePath}:`, errorMessage);

      return {
        manifest: {
          id: 'unknown',
          name: 'Unknown',
          version: '0.0.0',
          description: 'Failed to load',
          author: 'Unknown',
          permissions: [],
          triggers: [],
        },
        plugin: null as any,
        error: errorMessage,
      };
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not loaded`);
    }

    // Unregister from SDK
    // TODO: await pluginSDK.unregister(pluginId);

    // Remove from storage
    this.loadedPlugins.delete(pluginId);
    this.pluginManifests.delete(pluginId);

    console.log(`[PluginLoader] Unloaded plugin: ${pluginId}`);
  }

  /**
   * Get loaded plugin
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Get plugin manifest
   */
  getManifest(pluginId: string): PluginManifest | undefined {
    return this.pluginManifests.get(pluginId);
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get all manifests
   */
  getAllManifests(): PluginManifest[] {
    return Array.from(this.pluginManifests.values());
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }

  /**
   * Load built-in plugins
   */
  async loadBuiltInPlugins(): Promise<PluginLoadResult[]> {
    const builtInPlugins = [
      'hello-world',
      'timestamp',
      'json-formatter',
      'regex-tester',
    ];

    const results: PluginLoadResult[] = [];

    for (const pluginId of builtInPlugins) {
      try {
        // Try to load from plugins directory
        const result = await this.loadPlugin(`../lib/plugins/${pluginId}/index.ts`);
        results.push(result);
      } catch (error) {
        console.error(`[PluginLoader] Failed to load built-in plugin ${pluginId}:`, error);
        // Add error result
        results.push({
          manifest: {
            id: pluginId,
            name: pluginId,
            version: '0.0.0',
            description: 'Failed to load',
            author: 'Unknown',
            permissions: [],
            triggers: [],
          },
          plugin: null as any,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Search plugins by trigger
   */
  async searchByTrigger(query: string): Promise<PluginSearchResult[]> {
    const results: PluginSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    console.log('[PluginLoader] searchByTrigger called with query:', query);
    console.log('[PluginLoader] Loaded plugins count:', this.loadedPlugins.size);

    for (const plugin of this.loadedPlugins.values()) {
      console.log('[PluginLoader] Checking plugin:', plugin.manifest.id, 'triggers:', plugin.manifest.triggers);

      // Check if query matches any trigger
      const matchesTrigger = plugin.manifest.triggers.some((trigger: string) =>
        lowerQuery.startsWith(trigger.toLowerCase())
      );

      if (matchesTrigger && plugin.onSearch) {
        try {
          console.log('[PluginLoader] Matched trigger for plugin:', plugin.manifest.id, 'calling onSearch');
          const pluginResults = await Promise.resolve(plugin.onSearch(query));
          console.log('[PluginLoader] Plugin returned', pluginResults.length, 'results');
          results.push(...pluginResults);
        } catch (error) {
          console.error(`[PluginLoader] Plugin ${plugin.manifest.id} search error:`, error);
        }
      }
    }

    console.log('[PluginLoader] Total results:', results.length);
    return results;
  }
}

// Create singleton instance
export const pluginLoader = new PluginLoader();

// Plugin search result interface
export interface PluginSearchResult {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  action?: () => void | Promise<void>;
}
