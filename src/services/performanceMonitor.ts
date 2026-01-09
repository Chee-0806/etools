/**
 * Performance Monitor Service
 * Tracks and reports performance metrics for responsive window features
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  category: 'window_resize' | 'view_transition' | 'screen_detection' | 'render';
  metadata?: Record<string, any>;
}

class PerformanceMonitorImpl {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;
  private timers: Map<string, number> = new Map();

  /**
   * Start a performance timer
   */
  startTimer(name: string, category: PerformanceMetric['category']): void {
    this.timers.set(`${category}:${name}`, performance.now());
  }

  /**
   * End a performance timer and record the metric
   */
  endTimer(
    name: string,
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ): number {
    const key = `${category}:${name}`;
    const startTime = this.timers.get(key);

    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;

    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      category,
      metadata,
    });

    this.timers.delete(key);

    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow operations
    const thresholds: Record<PerformanceMetric['category'], number> = {
      window_resize: 250,
      view_transition: 300,
      screen_detection: 100,
      render: 16, // 60fps = 16.67ms
    };

    const threshold = thresholds[metric.category];
    if (duration > threshold) {
      console.warn(
        `[Performance] Slow ${metric.category}: ${metric.name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
        metric.metadata
      );
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter((m) => m.category === category);
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get statistics for a specific metric
   */
  getStats(name: string) {
    const metrics = this.getMetricsByName(name);

    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map((m) => m.duration);
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const p50 = this.percentile(durations, 50);
    const p95 = this.percentile(durations, 95);
    const p99 = this.percentile(durations, 99);

    return {
      count: metrics.length,
      avg: avg,
      min: min,
      max: max,
      p50: p50,
      p95: p95,
      p99: p99,
    };
  }

  /**
   * Get summary statistics for all metrics
   */
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    const categories: PerformanceMetric['category'][] = [
      'window_resize',
      'view_transition',
      'screen_detection',
      'render',
    ];

    for (const category of categories) {
      const metrics = this.getMetricsByCategory(category);

      if (metrics.length > 0) {
        const durations = metrics.map((m) => m.duration);
        summary[category] = {
          count: metrics.length,
          avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
          min: Math.min(...durations),
          max: Math.max(...durations),
        };
      }
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Export metrics as JSON for analysis
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getSummary(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Check if performance meets requirements (FR-015: <250ms transitions)
   */
  checkRequirements(): { passed: boolean; details: Record<string, boolean> } {
    const details: Record<string, boolean> = {};

    // Window resize should be <250ms
    const resizeStats = this.getStats('resize_window_smart');
    if (resizeStats) {
      details.window_resize = resizeStats.p95 < 250;
    }

    // View transition should be <300ms
    const transitionStats = this.getStats('view_transition');
    if (transitionStats) {
      details.view_transition = transitionStats.p95 < 300;
    }

    // Screen detection should be <100ms
    const screenStats = this.getStats('get_screen_info');
    if (screenStats) {
      details.screen_detection = screenStats.p95 < 100;
    }

    const passed = Object.values(details).every((v) => v === true);

    return { passed, details };
  }
}

export const performanceMonitor = new PerformanceMonitorImpl();

/**
 * Utility: Decorator to measure function performance
 */
export function measurePerformance(
  category: PerformanceMetric['category'],
  name?: string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || propertyKey;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startTimer(metricName, category);

      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endTimer(metricName, category);
        return result;
      } catch (error) {
        performanceMonitor.endTimer(metricName, category, { error: true });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Utility: Measure a block of code
 */
export async function measure<T>(
  name: string,
  category: PerformanceMetric['category'],
  fn: () => Promise<T>
): Promise<T> {
  performanceMonitor.startTimer(name, category);

  try {
    const result = await fn();
    performanceMonitor.endTimer(name, category);
    return result;
  } catch (error) {
    performanceMonitor.endTimer(name, category, { error: true });
    throw error;
  }
}
