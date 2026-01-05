/**
 * Plugin SDK Types
 * Core type definitions for the plugin system
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Plugin permission types
 */
export type PluginPermission =
  | 'read_clipboard'
  | 'write_clipboard'
  | 'read_files'
  | 'write_files'
  | 'network'
  | 'shell'
  | 'notifications'
  | 'settings';

/**
 * Plugin manifest structure
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  triggers: string[];
  settings?: PluginSetting[];
  icon?: string;
  homepage?: string;
  repository?: string;
}

/**
 * Plugin setting definition
 */
export interface PluginSetting {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  default: string | number | boolean;
  options?: { label: string; value: string | number }[];
  description?: string;
}

/**
 * Plugin search result
 */
export interface PluginSearchResult {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  action: () => void | Promise<void>;
}

/**
 * Plugin context - provides plugin with runtime capabilities
 */
export interface PluginContext {
  // Plugin info
  manifest: PluginManifest;

  // Storage API
  storage: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    delete: (key: string) => Promise<void>;
    list: () => Promise<string[]>;
  };

  // Settings API
  settings: {
    get: (key: string) => Promise<string | number | boolean>;
    set: (key: string, value: string | number | boolean) => Promise<void>;
  };

  // Clipboard API (requires permission)
  clipboard?: {
    readText: () => Promise<string>;
    writeText: (text: string) => Promise<void>;
  };

  // File API (requires permission)
  fs?: {
    readText: (path: string) => Promise<string>;
    writeText: (path: string, content: string) => Promise<void>;
  };

  // Network API (requires permission)
  http?: {
    get: (url: string) => Promise<string>;
    post: (url: string, body: string) => Promise<string>;
  };

  // Shell API (requires permission)
  shell?: {
    open: (path: string) => Promise<void>;
    exec: (command: string) => Promise<string>;
  };

  // Notification API
  notify?: (title: string, message: string) => Promise<void>;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  // Called when plugin is loaded
  onLoad?: (context: PluginContext) => void | Promise<void>;

  // Called when plugin is unloaded
  onUnload?: () => void | Promise<void>;

  // Called when plugin is enabled
  onEnable?: () => void | Promise<void>;

  // Called when plugin is disabled
  onDisable?: () => void | Promise<void>;

  // Called when search query matches plugin trigger
  onSearch?: (query: string) => PluginSearchResult[] | Promise<PluginSearchResult[]>;
}

/**
 * Complete plugin definition
 */
export interface Plugin extends PluginHooks {
  manifest: PluginManifest;
  ui?: {
    component: React.ComponentType<any>;
  };
}

/**
 * Plugin SDK interface
 */
export interface PluginSDK {
  // Register a plugin
  register: (plugin: Plugin) => Promise<void>;

  // Unregister a plugin
  unregister: (pluginId: string) => Promise<void>;

  // Check if plugin has permission
  hasPermission: (pluginId: string, permission: PluginPermission) => Promise<boolean>;

  // Request permission from user
  requestPermission: (pluginId: string, permission: PluginPermission) => Promise<boolean>;

  // Get list of installed plugins
  listPlugins: () => Promise<PluginManifest[]>;

  // Enable/disable plugin
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
}

/**
 * Tauri command wrappers for plugin SDK
 */
export const PluginCommands = {
  // List installed plugins
  list: () => invoke<PluginManifest[]>('plugin:list'),

  // Install plugin
  install: (path: string) => invoke<void>('plugin:install', { path }),

  // Uninstall plugin
  uninstall: (id: string) => invoke<void>('plugin:uninstall', { id }),

  // Enable plugin
  enable: (id: string) => invoke<void>('plugin:enable', { id }),

  // Disable plugin
  disable: (id: string) => invoke<void>('plugin:disable', { id }),

  // Get plugin manifest
  getManifest: (id: string) => invoke<PluginManifest>('plugin:get_manifest', { id }),

  // Reload plugin
  reload: (id: string) => invoke<void>('plugin:reload', { id }),

  // Grant permission
  grantPermission: (id: string, permission: PluginPermission) => invoke<void>('plugin:grant_permission', { id, permission }),

  // Revoke permission
  revokePermission: (id: string, permission: PluginPermission) => invoke<void>('plugin:revoke_permission', { id, permission }),
};
