/**
 * Plugin Sandbox Monitor
 *
 * Development tool for monitoring and debugging plugin sandbox execution.
 * Tracks worker pool usage, execution times, and plugin health.
 */

import type { PluginSandbox } from '@/services/pluginSandbox';

export interface SandboxMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  workerPoolUtilization: number;
  activePlugins: number;
  disabledPlugins: number;
}

export interface PluginMetrics {
  pluginId: string;
  executions: number;
  crashes: number;
  isEnabled: boolean;
  lastExecutionTime?: number;
  averageExecutionTime?: number;
}

export class SandboxMonitor {
  private sandbox: PluginSandbox;
  private executionHistory: Map<string, number[]> = new Map();

  constructor(sandbox: PluginSandbox) {
    this.sandbox = sandbox;
  }

  /**
   * Get overall sandbox metrics
   */
  getMetrics(): SandboxMetrics {
    const plugins = this.sandbox.getRegisteredPlugins();
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;
    let totalTime = 0;
    let activePlugins = 0;
    let disabledPlugins = 0;

    for (const pluginId of plugins) {
      const context = this.sandbox.getPluginContext(pluginId);
      if (!context) continue;

      if (context.isEnabled) {
        activePlugins++;
      } else {
        disabledPlugins++;
      }

      const times = this.executionHistory.get(pluginId) || [];
      totalExecutions += times.length;
      successfulExecutions += times.filter(t => t > 0).length;
      failedExecutions += times.filter(t => t < 0).length;

      for (const time of times) {
        if (time > 0) {
          totalTime += time;
        }
      }
    }

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime: totalExecutions > 0 ? totalTime / totalExecutions : 0,
      workerPoolUtilization: 0, // TODO: Implement actual pool utilization tracking
      activePlugins,
      disabledPlugins,
    };
  }

  /**
   * Get metrics for a specific plugin
   */
  getPluginMetrics(pluginId: string): PluginMetrics | null {
    const context = this.sandbox.getPluginContext(pluginId);
    if (!context) {
      return null;
    }

    const times = this.executionHistory.get(pluginId) || [];
    const successfulTimes = times.filter(t => t > 0);

    return {
      pluginId,
      executions: times.length,
      crashes: context.crashCount,
      isEnabled: context.isEnabled,
      lastExecutionTime: context.lastExecutionTime,
      averageExecutionTime: successfulTimes.length > 0
        ? successfulTimes.reduce((a, b) => a + b, 0) / successfulTimes.length
        : undefined,
    };
  }

  /**
   * Record an execution time for a plugin
   */
  recordExecution(pluginId: string, executionTime: number, success: boolean) {
    const times = this.executionHistory.get(pluginId) || [];
    times.push(success ? executionTime : -executionTime);
    this.executionHistory.set(pluginId, times);
  }

  /**
   * Get a formatted report of sandbox status
   */
  getReport(): string {
    const metrics = this.getMetrics();
    const plugins = this.sandbox.getRegisteredPlugins();

    let report = '=== Plugin Sandbox Status ===\n\n';

    report += `Overall Metrics:\n`;
    report += `  Total Executions: ${metrics.totalExecutions}\n`;
    report += `  Successful: ${metrics.successfulExecutions}\n`;
    report += `  Failed: ${metrics.failedExecutions}\n`;
    report += `  Avg Execution Time: ${metrics.averageExecutionTime.toFixed(2)}ms\n`;
    report += `  Active Plugins: ${metrics.activePlugins}\n`;
    report += `  Disabled Plugins: ${metrics.disabledPlugins}\n\n`;

    report += 'Plugin Details:\n';
    for (const pluginId of plugins) {
      const pluginMetrics = this.getPluginMetrics(pluginId);
      if (!pluginMetrics) continue;

      report += `  ${pluginId}:\n`;
      report += `    Status: ${pluginMetrics.isEnabled ? '✅ Active' : '❌ Disabled'}\n`;
      report += `    Executions: ${pluginMetrics.executions}\n`;
      report += `    Crashes: ${pluginMetrics.crashCount}\n`;
      if (pluginMetrics.averageExecutionTime) {
        report += `    Avg Time: ${pluginMetrics.averageExecutionTime.toFixed(2)}ms\n`;
      }
      if (pluginMetrics.lastExecutionTime) {
        report += `    Last Run: ${new Date(pluginMetrics.lastExecutionTime).toISOString()}\n`;
      }
    }

    return report;
  }

  /**
   * Log the report to console
   */
  logReport() {
    console.log(this.getReport());
  }

  /**
   * Clear execution history for a plugin
   */
  clearPluginHistory(pluginId: string) {
    this.executionHistory.delete(pluginId);
  }

  /**
   * Clear all execution history
   */
  clearAllHistory() {
    this.executionHistory.clear();
  }
}

// Global monitor instance
let monitorInstance: SandboxMonitor | null = null;

/**
 * Get the global sandbox monitor instance
 */
export function getSandboxMonitor(sandbox: PluginSandbox): SandboxMonitor {
  if (!monitorInstance) {
    monitorInstance = new SandboxMonitor(sandbox);
  }
  return monitorInstance;
}

/**
 * Reset the monitor (mainly for testing)
 */
export function resetSandboxMonitor() {
  monitorInstance = null;
}
