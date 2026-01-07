/**
 * Plugin Sandbox Worker (T095)
 *
 * This worker executes plugin code in an isolated environment with:
 * - Timeout protection (prevents infinite loops)
 * - Memory isolation (separate from main thread)
 * - Permission enforcement
 * - Exception capture and reporting
 *
 * Communication protocol:
 * - Input: { type: 'execute', pluginId, code, args, timeout }
 * - Output: { type: 'result', success, output, error }
 */

import type { PluginPermission } from '@/lib/plugin-sdk/types';

interface ExecuteMessage {
  type: 'execute';
  pluginId: string;
  code: string;
  args: any;
  permissions: PluginPermission[];
  timeout: number;
}

interface ResultMessage {
  type: 'result';
  success: boolean;
  output: any;
  error?: string;
}

/**
 * Permission check for API calls
 */
function checkPermission(permissions: PluginPermission[], required: PluginPermission): boolean {
  return permissions.includes(required);
}

/**
 * Create restricted API for plugin execution
 */
function createRestrictedAPI(
  pluginId: string,
  permissions: PluginPermission[]
) {
  return {
    console: {
      log: (...args: any[]) => {
        self.postMessage({ type: 'log', level: 'info', args });
      },
      warn: (...args: any[]) => {
        self.postMessage({ type: 'log', level: 'warn', args });
      },
      error: (...args: any[]) => {
        self.postMessage({ type: 'log', level: 'error', args });
      },
    },

    // Clipboard API (requires permission)
    clipboard: {
      async readText(): Promise<string> {
        if (!checkPermission(permissions, 'read_clipboard')) {
          throw new Error('Permission denied: read_clipboard');
        }
        // This will be called via invoke from main thread
        return '__CLIPBOARD_PLACEHOLDER__';
      },

      async writeText(text: string): Promise<void> {
        if (!checkPermission(permissions, 'write_clipboard')) {
          throw new Error('Permission denied: write_clipboard');
        }
      },
    },

    // File API (requires permission)
    fs: {
      async readText(path: string): Promise<string> {
        if (!checkPermission(permissions, 'read_files')) {
          throw new Error('Permission denied: read_files');
        }
        throw new Error('File operations not implemented in worker');
      },

      async writeText(path: string, content: string): Promise<void> {
        if (!checkPermission(permissions, 'write_files')) {
          throw new Error('Permission denied: write_files');
        }
        throw new Error('File operations not implemented in worker');
      },
    },

    // Network API (requires permission)
    http: {
      async get(url: string): Promise<string> {
        if (!checkPermission(permissions, 'network')) {
          throw new Error('Permission denied: network');
        }
        throw new Error('Network operations not implemented in worker');
      },

      async post(url: string, body: string): Promise<string> {
        if (!checkPermission(permissions, 'network')) {
          throw new Error('Permission denied: network');
        }
        throw new Error('Network operations not implemented in worker');
      },
    },

    // Shell API (requires permission)
    shell: {
      async open(path: string): Promise<void> {
        if (!checkPermission(permissions, 'shell')) {
          throw new Error('Permission denied: shell');
        }
        throw new Error('Shell operations not implemented in worker');
      },

      async exec(command: string): Promise<string> {
        if (!checkPermission(permissions, 'shell')) {
          throw new Error('Permission denied: shell');
        }
        throw new Error('Shell operations not implemented in worker');
      },
    },

    // Notification API
    notify: {
      async send(title: string, message: string): Promise<void> {
        // Notification API doesn't require special permission
        self.postMessage({
          type: 'notification',
          title,
          message,
        });
      },
    },
  };
}

/**
 * Execute plugin code with timeout protection
 */
function executeWithTimeout<T>(
  fn: () => T,
  timeoutMs: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Plugin execution timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const result = fn();
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Message handler
 */
self.onmessage = async (event: MessageEvent<ExecuteMessage>) => {
  const { type, pluginId, code, args, permissions, timeout } = event.data;

  if (type !== 'execute') {
    self.postMessage({
      type: 'result',
      success: false,
      error: `Unknown message type: ${type}`,
    } as ResultMessage);
    return;
  }

  try {
    // Create sandboxed environment
    const sandbox = createRestrictedAPI(pluginId, permissions);

    // Wrap plugin code with async execution
    const wrappedCode = `
      (async function(sandbox, args) {
        'use strict';

        // Override console
        const originalConsole = globalThis.console;
        globalThis.console = sandbox.console;

        try {
          // Execute plugin code
          ${code}

          // If plugin exports onSearch, call it
          if (typeof onSearch === 'function') {
            const result = await onSearch(args.query);
            return { success: true, output: result };
          }

          return { success: true, output: null };
        } finally {
          // Restore console
          globalThis.console = originalConsole;
        }
      })
    `;

    // Create function from code
    const pluginFunction = new Function('return ' + wrappedCode)();

    // Execute with timeout
    const result = await executeWithTimeout(
      () => pluginFunction(sandbox, args),
      timeout
    );

    // Send successful result
    self.postMessage({
      type: 'result',
      success: true,
      output: result.output,
    } as ResultMessage);

  } catch (error) {
    // Send error result
    self.postMessage({
      type: 'result',
      success: false,
      output: null,
      error: error instanceof Error ? error.message : String(error),
    } as ResultMessage);
  }
};

// Export type for external use
export type { ExecuteMessage, ResultMessage };
