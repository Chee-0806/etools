import { windowService } from './windowService';
import { errorHandler, ErrorCategory, withErrorHandling } from './errorHandler';
import type { Direction } from '@/types';

/**
 * View Transition Service
 * Coordinates window resize with content fade animations for smooth view transitions
 */

export interface TransitionConfig {
  duration: number; // Total transition duration in ms
  fadeOutDelay: number; // Delay before starting fade out
  fadeOutDuration: number; // Duration of fade out
  fadeInDelay: number; // Delay before starting fade in (after resize completes)
  fadeInDuration: number; // Duration of fade in
  skipResize?: boolean; // Skip window resize (optional, defaults to false)
}

export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
  duration: 150, // 更快的过渡，150ms 总时长
  fadeOutDelay: 0,
  fadeOutDuration: 75, // 快速淡出 75ms
  fadeInDelay: 0,
  fadeInDuration: 75, // 快速淡入 75ms
};

class ViewTransitionServiceImpl {
  private currentTransition: Promise<void> | null = null;
  private transitionQueue: Array<() => void> = [];
  private transitionHistory: Array<{ timestamp: number; targetView: string; duration: number }> = [];
  private readonly MAX_HISTORY = 50;

  /**
   * Perform a smooth view transition with coordinated fade and resize
   *
   * @param targetView - Target view ID
   * @param direction - Navigation direction ('forward' | 'backward' | 'none')
   * @param config - Transition configuration
   * @param skipResize - Skip window resize (optional, defaults to false)
   * @returns Promise that resolves when transition completes
   */
  async transition(
    targetView: string,
    direction: Direction,
    config: TransitionConfig = DEFAULT_TRANSITION_CONFIG,
    skipResize: boolean = false
  ): Promise<void> {
    console.log('[viewTransitionService] ===== 开始过渡 =====');
    console.log('  - 目标视图:', targetView);
    console.log('  - 方向:', direction);
    console.log('  - 跳过窗口调整:', skipResize);
    console.log('  - 配置:', config);

    return withErrorHandling(
      async () => {
        // If transition is in progress, queue this one (FR-020)
        if (this.currentTransition) {
          console.log('[viewTransitionService] 当前已有过渡进行中，加入队列');
          return new Promise((resolve) => {
            this.transitionQueue.push(() => {
              this.transition(targetView, direction, config, skipResize).then(resolve);
            });
          });
        }

        const startTime = performance.now();

        // Create transition promise
        console.log('[viewTransitionService] 创建过渡任务');
        this.currentTransition = this.performTransition(targetView, direction, config, skipResize);

        try {
          await this.currentTransition;
        } finally {
          const duration = performance.now() - startTime;

          console.log('[viewTransitionService] 过渡完成，耗时:', duration.toFixed(0), 'ms');

          // Record transition history
          this.transitionHistory.push({
            timestamp: Date.now(),
            targetView,
            duration,
          });

          // Keep only last MAX_HISTORY transitions
          if (this.transitionHistory.length > this.MAX_HISTORY) {
            this.transitionHistory = this.transitionHistory.slice(-this.MAX_HISTORY);
          }

          // Log slow transitions (>300ms)
          if (duration > 300) {
            errorHandler.log({
              category: ErrorCategory.VIEW_TRANSITION,
              severity: 'low' as const,
              message: `Slow transition detected: ${duration.toFixed(0)}ms`,
              timestamp: Date.now(),
              context: { targetView, direction, duration },
            });
          }

          this.currentTransition = null;

          // Process next queued transition
          if (this.transitionQueue.length > 0) {
            const next = this.transitionQueue.shift();
            if (next) {
              next();
            }
          }
        }
      },
      ErrorCategory.VIEW_TRANSITION,
      { method: 'transition', targetView, direction }
    );
  }

  /**
   * Internal method to perform the actual transition
   */
  private async performTransition(
    targetView: string,
    direction: Direction,
    config: TransitionConfig,
    skipResize: boolean
  ): Promise<void> {
    const startTime = performance.now();

    console.log('[viewTransitionService] performTransition 开始');
    console.log('  - 步骤1: 发送淡出事件');

    // Step 1: Emit fade out event (FR-014)
    this.emitFadeOut(direction);

    console.log('  - 步骤2: 等待淡出完成 (', config.fadeOutDuration, 'ms)');

    // Step 2: Wait for fade out to complete
    await this.wait(config.fadeOutDuration);

    console.log('  - 步骤3: 窗口调整');
    console.log('    - skipResize =', skipResize);

    // Step 3: Resize window (FR-015 - coordinates with content fade)
    // Skip resize if skipResize is true
    if (skipResize) {
      console.log('    - 跳过窗口调整（skipResize = true）');
    } else {
      console.log('    - 执行窗口调整，目标视图:', targetView);
      await windowService.resizeToView(targetView);
      console.log('    - 窗口调整完成');
    }

    console.log('  - 步骤4: 发送淡入事件');

    // Step 4: Wait for resize to complete (windowService emits event when done)
    // Then emit fade in event
    this.emitFadeIn(direction);

    const elapsed = performance.now() - startTime;

    console.log('  - 步骤5: 等待淡入完成');
    console.log('    - 已用时:', elapsed.toFixed(0), 'ms');

    // Step 5: Wait for fade in to complete
    const remainingTime = config.fadeInDuration - Math.max(0, elapsed - config.fadeOutDuration);
    if (remainingTime > 0) {
      console.log('    - 剩余等待时间:', remainingTime.toFixed(0), 'ms');
      await this.wait(remainingTime);
    }

    console.log('[viewTransitionService] performTransition 完成');
  }

  /**
   * Emit fade out event to trigger content opacity animation
   */
  private emitFadeOut(direction: Direction): void {
    const event = new CustomEvent('view:fadeout', {
      detail: { direction },
    });
    window.dispatchEvent(event);
  }

  /**
   * Emit fade in event to trigger content opacity animation
   */
  private emitFadeIn(direction: Direction): void {
    const event = new CustomEvent('view:fadein', {
      detail: { direction },
    });
    window.dispatchEvent(event);
  }

  /**
   * Check if a transition is currently in progress
   */
  isTransitioning(): boolean {
    return this.currentTransition !== null;
  }

  /**
   * Get the number of queued transitions
   */
  getQueueLength(): number {
    return this.transitionQueue.length;
  }

  /**
   * Clear all queued transitions (except current)
   */
  clearQueue(): void {
    this.transitionQueue = [];
  }

  /**
   * Get transition history for debugging
   */
  getHistory(): Array<{ timestamp: number; targetView: string; duration: number }> {
    return [...this.transitionHistory];
  }

  /**
   * Get average transition duration
   */
  getAverageDuration(): number {
    if (this.transitionHistory.length === 0) {
      return 0;
    }

    const total = this.transitionHistory.reduce((sum, entry) => sum + entry.duration, 0);
    return total / this.transitionHistory.length;
  }

  /**
   * Utility: Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const viewTransitionService = new ViewTransitionServiceImpl();
