/**
 * Plugin Sandbox Developer Tools
 *
 * Provides debugging commands and utilities for plugin sandbox development.
 * These tools are only available in development mode.
 */

import { getPluginSandbox } from './pluginSandbox';

/**
 * Check if running in development mode
 */
function isDevMode(): boolean {
  return import.meta.env.DEV;
}

/**
 * Developer commands for sandbox debugging
 */
export const sandboxDevCommands = {
  /**
   * Get sandbox status report
   * Usage: sandbox.status()
   */
  status: () => {
    if (!isDevMode()) {
      console.warn('[Sandbox DevTools] Only available in development mode');
      return;
    }

    const sandbox = getPluginSandbox();
    sandbox.logReport();
  },

  /**
   * Get sandbox metrics
   * Usage: sandbox.metrics()
   */
  metrics: () => {
    if (!isDevMode()) {
      console.warn('[Sandbox DevTools] Only available in development mode');
      return;
    }

    const sandbox = getPluginSandbox();
    const metrics = sandbox.getMetrics();
    console.log('[Sandbox Metrics]', metrics);
    return metrics;
  },

  /**
   * Get plugin-specific metrics
   * Usage: sandbox.pluginMetrics('hello-world')
   */
  pluginMetrics: (pluginId: string) => {
    if (!isDevMode()) {
      console.warn('[Sandbox DevTools] Only available in development mode');
      return;
    }

    const sandbox = getPluginSandbox();
    const context = sandbox.getPluginContext(pluginId);

    if (!context) {
      console.warn(`[Sandbox DevTools] Plugin ${pluginId} not found`);
      return;
    }

    console.log(`[Sandbox Plugin: ${pluginId}]`, {
      enabled: context.isEnabled,
      crashes: context.crashCount,
      permissions: context.grantedPermissions,
      lastExecution: context.lastExecutionTime,
      hasModulePath: !!context.pluginPath,
      modulePath: context.pluginPath,
    });

    return context;
  },

  /**
   * List all registered plugins
   * Usage: sandbox.list()
   */
  list: () => {
    if (!isDevMode()) {
      console.warn('[Sandbox DevTools] Only available in development mode');
      return;
    }

    const sandbox = getPluginSandbox();
    const plugins = sandbox.getRegisteredPlugins();

    console.log('[Sandbox Plugins]', plugins);
    console.log(`Total: ${plugins.length} plugins`);

    const details = plugins.map(pluginId => {
      const context = sandbox.getPluginContext(pluginId);
      return {
        id: pluginId,
        enabled: context?.isEnabled ?? false,
        crashes: context?.crashCount ?? 0,
        permissions: context?.grantedPermissions.length ?? 0,
      };
    });

    console.table(details);
    return plugins;
  },

  /**
   * Enable a plugin
   * Usage: sandbox.enable('hello-world')
   */
  enable: (pluginId: string) => {
    if (!isDevMode()) {
      console.warn('[Sandbox DevTools] Only available in development mode');
      return;
    }

    const sandbox = getPluginSandbox();
    sandbox.enablePlugin(pluginId);
    console.log(`[Sandbox DevTools] Enabled plugin: ${pluginId}`);
  },

  /**
   * Disable a plugin
   * Usage: sandbox.disable('hello-world')
   */
  disable: (pluginId: string) => {
    if (!isDevMode()) {
      console.warn('[Sandbox DevTools] Only available in development mode');
      return;
    }

    const sandbox = getPluginSandbox();
    sandbox.disablePlugin(pluginId);
    console.log(`[Sandbox DevTools] Disabled plugin: ${pluginId}`);
  },

  /**
   * Reset crash count for a plugin
   * Usage: sandbox.resetCrashes('hello-world')
   */
  resetCrashes: (pluginId: string) => {
    if (!isDevMode()) {
      console.warn('[Sandbox DevTools] Only available in development mode');
      return;
    }

    const sandbox = getPluginSandbox();
    sandbox.resetCrashCount(pluginId);
    console.log(`[Sandbox DevTools] Reset crash count for: ${pluginId}`);
  },

  /**
   * Test plugin execution
   * Usage: sandbox.test('hello-world', 'hello: test')
   */
  test: async (pluginId: string, query: string) => {
    if (!isDevMode()) {
      console.warn('[Sandbox DevTools] Only available in development mode');
      return;
    }

    console.log(`[Sandbox DevTools] Testing plugin: ${pluginId} with query: "${query}"`);

    const sandbox = getPluginSandbox();
    const startTime = performance.now();

    try {
      const result = await sandbox.executePluginModule(pluginId, query);
      const totalTime = performance.now() - startTime;

      console.log(`[Sandbox DevTools] Test result:`, {
        success: result.success,
        resultsCount: result.results.length,
        executionTime: result.executionTime,
        totalTime,
        error: result.error,
      });

      if (result.results.length > 0) {
        console.log('[Sandbox DevTools] Results:', result.results);
      }

      return result;
    } catch (error) {
      const totalTime = performance.now() - startTime;
      console.error('[Sandbox DevTools] Test failed:', error);
      console.error(`[Sandbox DevTools] Total time: ${totalTime.toFixed(2)}ms`);
      throw error;
    }
  },

  /**
   * Show help
   * Usage: sandbox.help()
   */
  help: () => {
    console.log(`
🔌 Plugin Sandbox Developer Tools

Available commands:

  sandbox.status()           - Show sandbox status report
  sandbox.metrics()          - Get sandbox metrics
  sandbox.list()             - List all registered plugins
  sandbox.pluginMetrics(id)  - Get plugin-specific metrics
  sandbox.enable(id)         - Enable a plugin
  sandbox.disable(id)        - Disable a plugin
  sandbox.resetCrashes(id)   - Reset crash count
  sandbox.test(id, query)    - Test plugin execution
  sandbox.help()             - Show this help message

Examples:
  sandbox.status()
  sandbox.list()
  sandbox.test('hello-world', 'hello: test')
  sandbox.pluginMetrics('sandbox-demo')
    `);
  },
};

/**
 * Initialize developer tools
 * Attaches sandbox commands to global window object in development
 */
export function initSandboxDevTools() {
  if (!isDevMode()) {
    return;
  }

  // Type declaration for global sandbox object
  declare global {
    interface Window {
      sandbox: typeof sandboxDevCommands;
    }
  }

  // Attach to window for easy console access
  if (typeof window !== 'undefined') {
    window.sandbox = sandboxDevCommands;
    console.log('[Sandbox DevTools] Initialized. Type sandbox.help() for commands.');
  }
}
