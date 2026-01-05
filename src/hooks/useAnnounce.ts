/**
 * Screen Reader Announcements Hook (T202)
 * Provides accessible announcements for screen readers
 */

import { useRef, useCallback } from 'react';

// Live region for announcements
let announceRegion: HTMLElement | null = null;

// Initialize announce region on module load
if (typeof document !== 'undefined') {
  announceRegion = document.createElement('div');
  announceRegion.setAttribute('role', 'status');
  announceRegion.setAttribute('aria-live', 'polite');
  announceRegion.setAttribute('aria-atomic', 'true');
  announceRegion.setAttribute('aria-hidden', 'false');
  announceRegion.style.position = 'absolute';
  announceRegion.style.left = '-10000px';
  announceRegion.style.width = '1px';
  announceRegion.style.height = '1px';
  announceRegion.style.overflow = 'hidden';
  document.body.appendChild(announceRegion);
}

/**
 * Hook for screen reader announcements
 */
export function useAnnounce() {
  const lastAnnouncement = useRef<string>('');

  const announce = useCallback((message: string) => {
    // Avoid duplicate announcements
    if (message === lastAnnouncement.current) {
      return;
    }

    lastAnnouncement.current = message;

    if (announceRegion) {
      announceRegion.textContent = '';
      // Small delay to ensure screen readers pick up the change
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (announceRegion) {
            announceRegion.textContent = message;
          }
        });
      });
    }
  }, []);

  const announceResults = useCallback((count: number, query: string) => {
    if (count === 0) {
      announce(`没有找到 "${query}" 的结果`);
    } else {
      announce(`找到 ${count} 个结果`);
    }
  }, [announce]);

  const announceSelection = useCallback((index: number, total: number, title: string) => {
    announce(`选中 ${index + 1} / ${total}: ${title}`);
  }, [announce]);

  const announceLoading = useCallback((isLoading: boolean) => {
    if (isLoading) {
      announce('正在搜索');
    }
  }, [announce]);

  return {
    announce,
    announceResults,
    announceSelection,
    announceLoading,
  };
}
