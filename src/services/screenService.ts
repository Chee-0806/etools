import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { ScreenInfo, ScreenChangedPayload } from '@/types';
import { errorHandler, ErrorCategory, withErrorHandling } from './errorHandler';

class ScreenServiceImpl {
  private cache: ScreenInfo | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5000; // 5 seconds (FR-032)
  private readonly DEFAULT_SCREEN_INFO: ScreenInfo = {
    screenWidth: 1920,
    screenHeight: 1080,
    availableWidth: 1920,
    availableHeight: 1040,
    scaleFactor: 1.0,
  };

  async getScreenInfo(): Promise<ScreenInfo> {
    return withErrorHandling(
      async () => {
        const now = Date.now();

        // Return cached if valid
        if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
          return this.cache;
        }

        // Fetch from backend
        try {
          const screenInfo = await invoke<ScreenInfo>('get_screen_info');
          this.cache = screenInfo;
          this.cacheTimestamp = now;

          // Auto-invalidate after TTL
          setTimeout(() => {
            this.cache = null;
          }, this.CACHE_TTL);

          return screenInfo;
        } catch (error) {
          // Fallback to defaults if detection fails (FR-033)
          errorHandler.logUnknown(error, ErrorCategory.SCREEN_DETECTION, {
            fallback: 'Using default screen info',
          });

          return this.DEFAULT_SCREEN_INFO;
        }
      },
      ErrorCategory.SCREEN_DETECTION,
      { method: 'getScreenInfo' }
    );
  }

  invalidateCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  async onScreenChanged(
    callback: (payload: ScreenChangedPayload) => void
  ): Promise<() => void> {
    return withErrorHandling(
      async () => {
        const unlisten = await listen<ScreenChangedPayload>('screen:changed', (event) => {
          // Invalidate cache when screen changes
          this.invalidateCache();
          callback(event.payload);
        });
        return unlisten;
      },
      ErrorCategory.SCREEN_DETECTION,
      { method: 'onScreenChanged' }
    );
  }
}

export const screenService = new ScreenServiceImpl();
