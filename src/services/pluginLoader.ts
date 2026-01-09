/**
 * Plugin Loader Service (T111)
 * Handles plugin discovery, loading, and lifecycle management
 *
 * Integrated with Plugin Sandbox (T094-T098) for isolated execution
 * v2 API Only: All plugins execute in Worker with actionData architecture
 */

import type { Plugin, PluginManifest } from '@/types/plugin';
import type { PluginPermission } from '@/lib/plugin-sdk/types';
import type { PluginSearchResultV2, PluginActionData } from '@/lib/plugin-sdk/v2-types';
import { invoke } from '@tauri-apps/api/core';
import { getPluginSandbox } from './pluginSandbox';
import { ActionExecutor, createActionFromData } from './actionExecutor';

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
   * Supports both built-in plugins (src/lib/plugins/) and npm plugins (node_modules/@etools-plugin/*)
   */
  async loadPlugin(modulePath: string): Promise<PluginLoadResult> {
    try {
      console.log(`[PluginLoader] Loading plugin from: ${modulePath}`);

      // Normalize the module path for both main thread and Worker execution
      let normalizedPath = modulePath;
      let useBlobUrl = false;

      if (modulePath.startsWith('../lib/plugins/')) {
        // Built-in plugin: Convert relative path to absolute for Vite
        // Extract plugin ID from path like "../lib/plugins/hello-world/index.ts"
        const parts = modulePath.split('/').filter(Boolean);
        const pluginId = parts[parts.length - 2]; // Get second-to-last part
        normalizedPath = `/src/lib/plugins/${pluginId}/index.ts`;
        console.log(`[PluginLoader] Built-in plugin path: ${normalizedPath}`);
      } else if (modulePath.includes('Application Support') || modulePath.includes('node_modules/@etools-plugin')) {
        // npm plugin from system directory: Use Tauri API to read file
        console.log(`[PluginLoader] Detected system directory plugin, using Tauri API`);

        // Read file content using Tauri API
        const fileContent = await invoke<string>('read_file', { path: modulePath });
        console.log(`[PluginLoader] Read plugin file: ${fileContent.length} bytes`);

        // Create Blob URL for the plugin code
        const blob = new Blob([fileContent], { type: 'application/javascript' });
        normalizedPath = URL.createObjectURL(blob);
        useBlobUrl = true;
        console.log(`[PluginLoader] Created Blob URL: ${normalizedPath}`);
      } else if (modulePath.startsWith('@etools-plugin/')) {
        // npm plugin: Extract package name and convert to node_modules path
        const packageName = modulePath.split('@etools-plugin/')[1]?.split('/')[0];
        normalizedPath = `/node_modules/@etools-plugin/${packageName}/dist/index.js`;
        console.log(`[PluginLoader] NPM plugin path: ${normalizedPath}`);
      }

      // Dynamic import of plugin module
      console.log(`[PluginLoader] Attempting to import: ${normalizedPath}`);
      const module = await import(/* @vite-ignore */ normalizedPath);

      // Support both default export and named exports
      // - Default export: export default { manifest, search }
      // - Named exports: export const manifest = {...}; export async function search() {...}
      const plugin: Plugin = module.default || {
        manifest: module.manifest,
        search: module.search,
      };

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

      // Register plugin with sandbox (T094)
      // Pass the normalized module path for true Worker isolation
      getPluginSandbox().registerPlugin(
        manifest.id,
        manifest.permissions,
        normalizedPath // Use normalized path for Worker execution
      );

      console.log(`[PluginLoader] Loaded plugin: ${manifest.id} v${manifest.version} with path: ${normalizedPath}`);

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
   * Load an npm-installed plugin by package name
   * @param packageName - npm package name (e.g., "@etools-plugin/hello")
   */
  async loadNpmPlugin(packageName: string): Promise<PluginLoadResult> {
    console.log(`[PluginLoader] Loading npm plugin: ${packageName}`);
    return this.loadPlugin(packageName);
  }

  /**
   * Load all installed plugins (alias for loadInstalledNpmPlugins)
   */
  async loadInstalledPlugins(): Promise<PluginLoadResult[]> {
    return this.loadInstalledNpmPlugins();
  }

  /**
   * Load all installed npm plugins
   * Queries the backend for list of installed npm packages
   */
  async loadInstalledNpmPlugins(): Promise<PluginLoadResult[]> {
    try {
      console.log('[PluginLoader] ===== loadInstalledNpmPlugins called =====');
      // Get list of installed plugins from backend
      const installedPlugins = await invoke<any[]>('get_installed_plugins');
      console.log('[PluginLoader] Retrieved plugins from backend:', installedPlugins.length, installedPlugins);
      const results: PluginLoadResult[] = [];

      for (const pluginInfo of installedPlugins) {
        console.log('[PluginLoader] Processing plugin:', pluginInfo.id, 'source:', pluginInfo.source);
        // Skip built-in plugins (they're loaded separately)
        // Load both Marketplace and Local plugins
        if (pluginInfo.source !== 'marketplace' && pluginInfo.source !== 'local') {
          console.log('[PluginLoader] Skipping plugin (invalid source):', pluginInfo.id);
          continue;
        }

        // npm plugins are installed in app data dir's node_modules
        // install_path format: "/path/to/app/data/node_modules/@etools-plugin/hello"
        const installPath = pluginInfo.install_path || '';
        const packageName = pluginInfo.id; // Should be like "hello-world"

        if (!packageName) {
          continue;
        }

        console.log(`[PluginLoader] Loading npm plugin: ${packageName} from ${installPath}`);
        console.log(`[PluginLoader] Plugin enabled state: ${pluginInfo.enabled}`);

        // For npm plugins, we need to load them from their install path
        // The plugin should have a dist/index.js file
        try {
          // Use the install_path directly - it should point to the plugin directory
          const entryPoint = `${installPath}/dist/index.js`;
          const result = await this.loadPlugin(entryPoint);

          // Set plugin enabled state based on backend info
          if (result.plugin && !pluginInfo.enabled) {
            console.log(`[PluginLoader] Disabling plugin: ${packageName}`);
            const { getPluginSandbox } = await import('./pluginSandbox');
            getPluginSandbox().setPluginEnabled(packageName, false);
          }

          results.push(result);
        } catch (error) {
          console.error(`[PluginLoader] Failed to load npm plugin ${packageName}:`, error);
          results.push({
            manifest: {
              id: packageName,
              name: packageName,
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
    } catch (error) {
      console.error('[PluginLoader] Failed to load installed npm plugins:', error);
      return [];
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

    // Unregister from sandbox (T094)
    getPluginSandbox().unregisterPlugin(pluginId);

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
   * Load built-in plugins and installed npm plugins
   * Skips plugins that are already loaded to avoid redundant operations
   */
  async loadBuiltInPlugins(): Promise<PluginLoadResult[]> {
    const builtInPlugins = [
      'hello-world',
      'timestamp',
      'json-formatter',
      'regex-tester',
      'sandbox-demo', // Demo plugin for sandbox features
    ];

    const results: PluginLoadResult[] = [];

    // 1. Load built-in plugins from src/lib/plugins/
    for (const pluginId of builtInPlugins) {
      // Skip if already loaded
      if (this.isLoaded(pluginId)) {
        console.log(`[PluginLoader] Skipping already loaded plugin: ${pluginId}`);
        continue;
      }

      try {
        const result = await this.loadPlugin(`../lib/plugins/${pluginId}/index.ts`);
        results.push(result);
      } catch (error) {
        console.error(`[PluginLoader] Failed to load built-in plugin ${pluginId}:`, error);
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

    // 2. Load installed npm plugins
    try {
      const npmPluginResults = await this.loadInstalledNpmPlugins();
      results.push(...npmPluginResults);
    } catch (error) {
      console.error('[PluginLoader] Failed to load npm plugins:', error);
    }

    return results;
  }

  /**
   * Search plugins by trigger - v2 Architecture
   *
   * All plugins MUST use v2 API:
   * - Plugins execute in Worker (isolated, safe)
   * - Worker returns PluginSearchResultV2[] with actionData (no functions)
   * - Main thread creates action functions from actionData
   *
   * This solves the clone issue: functions can't be cloned, but data can.
   */
  async searchByTrigger(query: string): Promise<PluginSearchResult[]> {
    const results: PluginSearchResult[] = [];
    const sandbox = getPluginSandbox();
    const lowerQuery = query.toLowerCase();

    console.log('[PluginLoader] searchByTrigger called with query:', query);

    for (const [pluginId, plugin] of this.loadedPlugins.entries()) {
      // Check if query matches any trigger
      const matchesTrigger = plugin.manifest.triggers.some((trigger: string) =>
        lowerQuery.startsWith(trigger.toLowerCase())
      );

      if (!matchesTrigger) {
        continue;
      }

      // Check if plugin is enabled in sandbox
      const context = sandbox.getPluginContext(pluginId);
      if (!context || !context.isEnabled) {
        console.log(`[PluginLoader] Skipping disabled plugin: ${pluginId}`);
        continue;
      }

      // All plugins MUST have a registered module path for Worker execution
      if (!context.pluginPath) {
        console.error(`[PluginLoader] Plugin ${pluginId} has no module path - cannot execute in Worker`);
        console.error(`[PluginLoader] Plugins MUST use v2 API with Worker execution`);
        continue;
      }

      try {
        console.log(`[PluginLoader] Executing plugin ${pluginId} in isolated Worker`);

        // Execute in isolated Worker
        const result = await sandbox.executePluginModule(pluginId, query);

        if (result.success) {
          // Convert PluginSearchResultV2[] to PluginSearchResult[]
          // Create action functions on main thread from actionData
          const actionExecutor = new ActionExecutor(plugin.manifest.permissions);

          const convertedResults = result.results.map((v2Result: PluginSearchResultV2) => {
            console.log(`[PluginLoader] Converting v2 result: ${v2Result.id}`);

            // Create action function from actionData
            const action = createActionFromData(v2Result.actionData, actionExecutor);

            return {
              id: v2Result.id,
              title: v2Result.title,
              description: v2Result.description,
              icon: v2Result.icon,
              action,
              score: v2Result.score || 0.9,
            };
          });

          results.push(...convertedResults);
          console.log(`[PluginLoader] Plugin ${pluginId} returned ${convertedResults.length} results`);
        } else {
          console.error(`[PluginLoader] Plugin ${pluginId} execution failed:`, result.error);
        }

      } catch (error) {
        console.error(`[PluginLoader] Plugin ${pluginId} search error:`, error);

        // Handle crash in sandbox
        const wasDisabled = sandbox.handlePluginCrash?.(pluginId);
        if (wasDisabled) {
          console.error(`[PluginLoader] Plugin ${pluginId} disabled after crash`);
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
