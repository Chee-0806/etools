import { useState, useEffect } from 'react';
import { screenService } from '@/services/screenService';
import type { ScreenInfo, ScreenChangedPayload } from '@/types';

interface UseScreenInfoResult {
  screenInfo: ScreenInfo | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for accessing and reacting to screen information changes.
 *
 * Features:
 * - Fetches screen info on mount
 * - Automatically listens for screen:changed events
 * - Provides refresh function for manual updates
 * - Handles loading and error states
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { screenInfo, isLoading, error } = useScreenInfo();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <div>Screen: {screenInfo?.screenWidth}x{screenInfo?.screenHeight}</div>;
 * }
 * ```
 */
export function useScreenInfo(): UseScreenInfoResult {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch screen info
  const fetchScreenInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const info = await screenService.getScreenInfo();
      setScreenInfo(info);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Failed to fetch screen info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh function for manual updates
  const refresh = async () => {
    await fetchScreenInfo();
  };

  useEffect(() => {
    // Initial fetch
    fetchScreenInfo();

    // Listen for screen changes
    let unlisten: (() => void) | undefined;

    screenService
      .onScreenChanged((payload: ScreenChangedPayload) => {
        console.log('Screen changed:', payload);
        setScreenInfo(payload.newScreenInfo);
      })
      .then((fn) => {
        unlisten = fn;
      })
      .catch((err) => {
        console.error('Failed to listen for screen changes:', err);
      });

    // Cleanup
    return () => {
      unlisten?.();
    };
  }, []);

  return {
    screenInfo,
    isLoading,
    error,
    refresh,
  };
}
