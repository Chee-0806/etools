/**
 * Sandbox Demo Plugin - v2 API
 *
 * This plugin demonstrates the plugin sandbox capabilities:
 * - Worker isolation
 * - Timeout protection
 * - Exception handling
 * - Permission checks
 * - Data computation in Worker, actions on main thread
 */

import type {
  PluginV2,
  PluginManifest,
  PluginSearchResultV2,
} from '../../plugin-sdk/v2-types';

export const manifest: PluginManifest = {
  id: 'sandbox-demo',
  name: 'Sandbox Demo',
  version: '2.0.0',
  description: 'Demonstrates plugin sandbox features (v2 API)',
  author: 'Kaka Team',
  permissions: ['notifications'],
  triggers: ['demo:'],
  icon: '🧪',
};

/**
 * onSearch - Executes in Worker
 * Returns PluginSearchResultV2[] with actionData (serializable, no functions)
 */
export async function onSearch(query: string): Promise<PluginSearchResultV2[]> {
  const results: PluginSearchResultV2[] = [];

  if (!query.toLowerCase().startsWith('demo:')) {
    return results;
  }

  const command = query.slice(5).trim().toLowerCase();

  // Demo 1: Quick operation (normal execution)
  if (command === 'quick') {
    results.push({
      id: `demo-quick-${Date.now()}`,
      title: '✅ Quick Operation',
      description: 'Executes instantly in Worker, shows result in popup',
      icon: '⚡',
      score: 0.95,
      actionData: {
        type: 'popup',
        description: 'Show quick operation result',
        data: {
          popup: {
            title: 'Quick Operation Complete',
            message: 'This was computed in the Worker and executed on main thread!',
            icon: '⚡',
            style: 'success',
          },
        },
        metadata: {
          executionLocation: 'Worker (computation) → Main Thread (action)',
          executionTime: '< 100ms',
        },
      },
    });
  }

  // Demo 2: Async operation demonstration
  if (command === 'async') {
    results.push({
      id: `demo-async-${Date.now()}`,
      title: '🔄 Async Operation',
      description: 'Non-blocking async execution demonstration',
      icon: '🔀',
      score: 0.9,
      actionData: {
        type: 'popup',
        description: 'Show async operation result',
        data: {
          popup: {
            title: 'Async Operation',
            message: 'Async operations complete! UI remained responsive during computation.',
            icon: '🔀',
            style: 'info',
          },
        },
      },
    });
  }

  // Demo 3: Permission check
  if (command === 'permission') {
    results.push({
      id: `demo-perm-${Date.now()}`,
      title: '🔐 Permission Check',
      description: 'Tests notification permission',
      icon: '🔑',
      score: 0.9,
      actionData: {
        type: 'popup',
        description: 'Test notification permission',
        data: {
          popup: {
            title: 'Permission Check',
            message: 'This action requires "notifications" permission. ActionExecutor will verify it.',
            icon: '🔑',
            style: 'success',
          },
        },
      },
    });
  }

  // Demo 4: Exception handling
  if (command === 'error') {
    results.push({
      id: `demo-error-${Date.now()}`,
      title: '💥 Exception Test',
      description: 'Demonstrates exception isolation',
      icon: '⚠️',
      score: 0.85,
      actionData: {
        type: 'popup',
        description: 'Show exception test result',
        data: {
          popup: {
            title: 'Exception Test',
            message: 'Exceptions in Worker are caught and logged. Plugin is disabled after crashes.',
            icon: '⚠️',
            style: 'warning',
          },
        },
      },
    });
  }

  // Demo 5: Worker info
  if (command === 'info') {
    const info = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Worker',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'en',
      workerType: 'Web Worker',
      timestamp: new Date().toISOString(),
    };

    results.push({
      id: `demo-info-${Date.now()}`,
      title: 'ℹ️ Worker Information',
      description: `Platform: ${info.platform} | Language: ${info.language}`,
      icon: '📊',
      score: 0.9,
      actionData: {
        type: 'popup',
        description: 'Show Worker information',
        data: {
          popup: {
            title: 'Worker Information',
            message: `Running in: ${info.workerType}\nTimestamp: ${info.timestamp}`,
            icon: '📊',
            style: 'info',
          },
        },
        metadata: info,
      },
    });
  }

  // Demo 6: Heavy computation (performed in Worker)
  if (command === 'compute') {
    // Perform computation in Worker
    const start = Date.now();
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += Math.sqrt(i);
    }
    const elapsed = Date.now() - start;
    const result = sum.toFixed(2);

    results.push({
      id: `demo-compute-${Date.now()}`,
      title: '🧮 Heavy Computation',
      description: `Computed √∑(0..1,000,000) = ${result} in ${elapsed}ms`,
      icon: '⚙️',
      score: 0.9,
      actionData: {
        type: 'popup',
        description: 'Show computation result',
        data: {
          popup: {
            title: 'Computation Complete',
            message: `Result: ${result}\nTime: ${elapsed}ms\nComputed in Worker, action on main thread`,
            icon: '⚙️',
            style: 'success',
          },
        },
        metadata: {
          result,
          computationTime: `${elapsed}ms`,
          iterations: '1,000,000',
        },
      },
    });
  }

  // Demo 7: Memory test (data created in Worker)
  if (command === 'memory') {
    // Create large object in Worker
    const largeObject = {
      dataSize: 100000,
      timestamp: Date.now(),
      estimatedSize: '~1MB',
    };

    results.push({
      id: `demo-memory-${Date.now()}`,
      title: '💾 Memory Test',
      description: `Created ${largeObject.dataSize.toLocaleString()} items in Worker memory`,
      icon: '🧠',
      score: 0.9,
      actionData: {
        type: 'popup',
        description: 'Show memory test result',
        data: {
          popup: {
            title: 'Memory Test',
            message: `Created ${largeObject.dataSize.toLocaleString()} items\nMemory isolated in Worker`,
            icon: '🧠',
            style: 'info',
          },
        },
        metadata: largeObject,
      },
    });
  }

  // Default: Show all demo options
  if (command === '' || command === 'help') {
    const demos = [
      { cmd: 'demo:quick', title: '⚡ Quick Operation', desc: 'Instant execution', icon: '⚡' },
      { cmd: 'demo:async', title: '🔄 Async Operation', desc: 'Non-blocking async', icon: '🔀' },
      { cmd: 'demo:permission', title: '🔐 Permission Check', desc: 'Test permissions', icon: '🔑' },
      { cmd: 'demo:error', title: '💥 Exception Test', desc: 'Exception isolation', icon: '⚠️' },
      { cmd: 'demo:info', title: 'ℹ️ Worker Info', desc: 'Show Worker details', icon: '📊' },
      { cmd: 'demo:compute', title: '🧮 Computation', desc: 'Heavy calculation', icon: '⚙️' },
      { cmd: 'demo:memory', title: '💾 Memory Test', desc: 'Large object creation', icon: '🧠' },
    ];

    for (const demo of demos) {
      results.push({
        id: `demo-help-${demo.cmd}`,
        title: demo.title,
        description: demo.desc,
        icon: demo.icon,
        score: 0.8,
        actionData: {
          type: 'none',
          description: `Type "${demo.cmd}" to run this demo`,
        },
      });
    }
  }

  return results;
}

export async function init() {
  console.log('[SandboxDemo] Plugin initialized (v2 API)');
  console.log('[SandboxDemo] Available commands: demo:quick, demo:async, demo:permission, demo:error, demo:info, demo:compute, demo:memory');
  console.log('[SandboxDemo] v2 Architecture: Computation in Worker, Actions on Main Thread');
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
