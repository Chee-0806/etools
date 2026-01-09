import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { ViewType, CalculatedWindowLayout, ResizeStartPayload, ResizeCompletePayload } from '@/types';
import { errorHandler, ErrorCategory, withErrorHandling } from './errorHandler';

class WindowServiceImpl {
  async resizeToView(viewId: ViewType): Promise<CalculatedWindowLayout> {
    console.log('[windowService] resizeToView 调用');
    console.log('  - 视图ID:', viewId);

    return withErrorHandling(
      async () => {
        try {
          console.log('[windowService] 调用后端命令 resize_window_smart');
          const layout = await invoke<CalculatedWindowLayout>('resize_window_smart', {
            viewId,
          });

          console.log('[windowService] 后端返回结果:');
          console.log('  - 目标宽度:', layout.targetWidth);
          console.log('  - 目标高度:', layout.targetHeight);
          console.log('  - 目标X:', layout.targetX);
          console.log('  - 目标Y:', layout.targetY);
          console.log('  - 需要动画:', layout.animationRequired);
          console.log('  - 实际耗时:', layout.actualDuration, 'ms');

          return layout;
        } catch (error) {
          console.error('[windowService] 窗口调整错误:', error);
          const errorStr = error as string;

          if (errorStr.includes('ANIMATION_FAILED')) {
            // Animation failed but window was snapped to size (FR-036)
            console.log('[windowService] 动画失败，但窗口已调整到目标大小');
            errorHandler.logUnknown(error, ErrorCategory.WINDOW_RESIZE, {
              viewId,
              fallback: 'Window snapped to target size',
            });

            // Return a partial layout result
            return {
              targetWidth: 0,
              targetHeight: 0,
              targetX: 0,
              targetY: 0,
              animationRequired: false,
              actualDuration: 0,
            };
          } else {
            // Critical resize failure
            console.error('[windowService] 严重窗口调整错误');
            errorHandler.logUnknown(error, ErrorCategory.WINDOW_RESIZE, {
              viewId,
              severity: 'critical',
            });
            throw error;
          }
        }
      },
      ErrorCategory.WINDOW_RESIZE,
      { method: 'resizeToView', viewId }
    );
  }

  async onResizeStart(
    callback: (payload: ResizeStartPayload) => void
  ): Promise<() => void> {
    return withErrorHandling(
      async () => {
        const unlisten = await listen<ResizeStartPayload>('window:resize_start', (event) => {
          callback(event.payload);
        });
        return unlisten;
      },
      ErrorCategory.WINDOW_RESIZE,
      { method: 'onResizeStart' }
    );
  }

  async onResizeComplete(
    callback: (payload: ResizeCompletePayload) => void
  ): Promise<() => void> {
    return withErrorHandling(
      async () => {
        const unlisten = await listen<ResizeCompletePayload>('window:resize_complete', (event) => {
          callback(event.payload);
        });
        return unlisten;
      },
      ErrorCategory.WINDOW_RESIZE,
      { method: 'onResizeComplete' }
    );
  }
}

export const windowService = new WindowServiceImpl();
