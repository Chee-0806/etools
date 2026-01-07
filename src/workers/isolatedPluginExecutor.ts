/**
 * Isolated Plugin Executor Worker (T095) - v2 Architecture
 *
 * This worker executes plugins in a truly isolated environment.
 * New architecture (v2): Plugins return PluginSearchResultV2 with actionData instead of action functions.
 * This allows safe postMessage communication without cloning issues.
 *
 * Communication protocol:
 * - Input: { type: 'execute', pluginId, pluginPath, query, permissions, timeout }
 * - Output: { type: 'result', success, results: PluginSearchResultV2[], error, executionTime }
 */

import type { PluginPermission } from '@/lib/plugin-sdk/types';
import type { PluginSearchResult, PluginManifest } from '@/lib/plugin-sdk/types';
import type { PluginSearchResultV2, PluginActionData } from '@/lib/plugin-sdk/v2-types';

interface ExecuteMessage {
  type: 'execute';
  pluginId: string;
  pluginPath: string;
  query: string;
  permissions: PluginPermission[];
  timeout: number;
}

interface ResultMessage {
  type: 'result';
  success: boolean;
  results: PluginSearchResultV2[];  // Changed to v2
  error?: string;
  executionTime: number;
}

interface LogMessage {
  type: 'log';
  level: 'info' | 'warn' | 'error';
  args: any[];
  pluginId: string;
}

/**
 * Permission checker
 */
function checkPermission(permissions: PluginPermission[], required: PluginPermission): boolean {
  return permissions.includes(required);
}

/**
 * Create a sandboxed invoke function that checks permissions
 */
function createSandboxedInvoke(
  pluginId: string,
  permissions: PluginPermission[]
) {
  return async (cmd: string, args?: Record<string, unknown>) => {
    // Permission map for Tauri commands
    const PERMISSION_MAP: Record<string, PluginPermission> = {
      'get_clipboard_history': 'read_clipboard',
      'paste_clipboard_item': 'write_clipboard',
      'read_file': 'read_files',
      'write_file': 'write_files',
      'execute_shell': 'shell',
      'send_notification': 'notifications',
    };

    const required = PERMISSION_MAP[cmd];
    if (required && !checkPermission(permissions, required)) {
      throw new Error(`Plugin ${pluginId} lacks required permission for ${cmd}`);
    }

    // Import Tauri API dynamically
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke(cmd, args);
  };
}

/**
 * Create a sandboxed environment for the plugin
 */
function createSandboxEnvironment(
  pluginId: string,
  permissions: PluginPermission[]
) {
  return {
    console: {
      log: (...args: any[]) => {
        self.postMessage({
          type: 'log',
          level: 'info',
          args,
          pluginId,
        } as LogMessage);
      },
      warn: (...args: any[]) => {
        self.postMessage({
          type: 'log',
          level: 'warn',
          args,
          pluginId,
        } as LogMessage);
      },
      error: (...args: any[]) => {
        self.postMessage({
          type: 'log',
          level: 'error',
          args,
          pluginId,
        } as LogMessage);
      },
    },
  };
}

/**
 * Execute plugin code with timeout protection
 */
async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Plugin execution timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([
      fn(),
      timeoutPromise,
    ]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * Message handler
 */
self.onmessage = async (event: MessageEvent<ExecuteMessage>) => {
  const { type, pluginId, pluginPath, query, permissions, timeout } = event.data;

  if (type !== 'execute') {
    self.postMessage({
      type: 'result',
      success: false,
      results: [],
      error: `Unknown message type: ${type}`,
      executionTime: 0,
    } as ResultMessage);
    return;
  }

  const startTime = performance.now();

  try {
    console.log(`[IsolatedPluginExecutor] Loading plugin ${pluginId} from ${pluginPath}`);

    // Normalize the plugin path for Vite Worker environment
    // In Worker context, we need to use absolute imports from project root
    let importPath = pluginPath;

    if (pluginPath.startsWith('/src/')) {
      // Already absolute path from src root - this is what we want
      importPath = pluginPath;
    } else if (pluginPath.startsWith('../')) {
      // Relative path - convert to absolute
      // Remove leading ../ and add /src/ prefix
      const pathParts = pluginPath.split('/').filter(Boolean);
      // Find the 'lib' or 'plugins' directory
      const libIndex = pathParts.findIndex(p => p === 'lib' || p === 'plugins');
      if (libIndex !== -1 && pathParts[libIndex] === 'lib') {
        // Path was like ../lib/plugins/xyz -> /src/lib/plugins/xyz
        importPath = '/src/' + pathParts.slice(libIndex).join('/');
      } else {
        // Fallback: assume it's a plugin path
        const pluginId = pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1];
        importPath = `/src/lib/plugins/${pluginId}/index.ts`;
      }
    }

    console.log(`[IsolatedPluginExecutor] Importing from: ${importPath}`);

    // Create sandboxed environment
    const sandbox = createSandboxEnvironment(pluginId, permissions);

    // Save original console
    const originalConsole = globalThis.console;
    globalThis.console = sandbox.console as any;

    try {
      // Dynamic import of the plugin module
      // Use @vite-ignore to prevent Vite from analyzing the dynamic import at build time
      const pluginModule = await import(/* @vite-ignore */ importPath);

      // Extract the plugin object
      const plugin = pluginModule.default || pluginModule;

      if (!plugin) {
        throw new Error(`Plugin ${pluginId} does not export a default object`);
      }

      if (!plugin.manifest) {
        throw new Error(`Plugin ${pluginId} missing manifest`);
      }

      if (typeof plugin.onSearch !== 'function') {
        throw new Error(`Plugin ${pluginId} does not export a valid onSearch function`);
      }

      console.log(`[IsolatedPluginExecutor] Plugin loaded: ${plugin.manifest.name} v${plugin.manifest.version}`);
      console.log(`[IsolatedPluginExecutor] Executing onSearch for plugin ${pluginId} with query: "${query}"`);

      // Execute onSearch with timeout
      const results = await executeWithTimeout(
        () => plugin.onSearch(query),
        timeout
      );

      const executionTime = performance.now() - startTime;

      console.log(`[IsolatedPluginExecutor] Plugin ${pluginId} executed successfully in ${executionTime.toFixed(2)}ms`);
      console.log(`[IsolatedPluginExecutor] Results count: ${Array.isArray(results) ? results.length : 0}`);

      // Send successful result
      self.postMessage({
        type: 'result',
        success: true,
        results: results || [],
        executionTime,
      } as ResultMessage);

    } finally {
      // Restore original console
      globalThis.console = originalConsole;
    }

  } catch (error) {
    const executionTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[IsolatedPluginExecutor] Plugin ${pluginId} execution failed:`, errorMessage);
    if (errorStack) {
      console.error(`[IsolatedPluginExecutor] Stack trace:`, errorStack);
    }

    // Send error result
    self.postMessage({
      type: 'result',
      success: false,
      results: [],
      error: errorMessage,
      executionTime,
    } as ResultMessage);
  }
};

// Export types
export type { ExecuteMessage, ResultMessage };
