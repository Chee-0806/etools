# Frontend Service Contracts

**Feature**: 001-responsive-window
**Date**: 2025-01-08
**Status**: Draft

---

## Overview

This document defines the service layer interfaces for frontend components. Services encapsulate Tauri command invocations and provide type-safe APIs for React components.

---

## Service: screenService

**Purpose**: Abstraction layer for screen information queries and caching.

**Source**: `src/services/screenService.ts`

### Interface

```typescript
interface ScreenService {
  getScreenInfo(): Promise<ScreenInfo>;
  invalidateCache(): void;
  onScreenChanged(callback: (payload: ScreenChangedPayload) => void): UnlistenFn;
}
```

### Implementation

```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { ScreenInfo, ScreenChangedPayload } from '@/types';

class ScreenServiceImpl implements ScreenService {
  private cache: ScreenInfo | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5000; // 5 seconds (FR-032)

  async getScreenInfo(): Promise<ScreenInfo> {
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
      console.error('Screen detection failed, using defaults:', error);
      return {
        screenWidth: 1920,
        screenHeight: 1080,
        availableWidth: 1920,
        availableHeight: 1040,
        scaleFactor: 1.0,
      };
    }
  }

  invalidateCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  async onScreenChanged(
    callback: (payload: ScreenChangedPayload) => void
  ): Promise<UnlistenFn> {
    return listen<ScreenChangedPayload>('screen:changed', (event) => {
      // Invalidate cache when screen changes
      this.invalidateCache();
      callback(event.payload);
    });
  }
}

export const screenService = new ScreenServiceImpl();
```

### Usage in Components

```typescript
import { screenService } from '@/services/screenService';
import { useEffect, useState } from 'react';

function ScreenInfoDisplay() {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo | null>(null);

  useEffect(() => {
    screenService.getScreenInfo().then(setScreenInfo);

    const unlisten = screenService.onScreenChanged((payload) => {
      setScreenInfo(payload.newScreenInfo);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  if (!screenInfo) return <div>Loading...</div>;

  return (
    <div>
      Screen: {screenInfo.screenWidth}x{screenInfo.screenHeight}
      Scale: {screenInfo.scaleFactor}x
    </div>
  );
}
```

---

## Service: windowService

**Purpose**: Manages window resize operations and coordinates with view navigation.

**Source**: `src/services/windowService.ts`

### Interface

```typescript
interface WindowService {
  resizeToView(viewId: ViewType): Promise<CalculatedWindowLayout>;
  getCurrentLayout(): Promise<CalculatedWindowLayout>;
  onResizeStart(callback: (payload: ResizeStartPayload) => void): Promise<UnlistenFn>;
  onResizeComplete(callback: (payload: ResizeCompletePayload) => void): Promise<UnlistenFn>;
}
```

### Implementation

```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { ViewType, CalculatedWindowLayout, ResizeStartPayload, ResizeCompletePayload } from '@/types';

class WindowServiceImpl implements WindowService {
  async resizeToView(viewId: ViewType): Promise<CalculatedWindowLayout> {
    try {
      const layout = await invoke<CalculatedWindowLayout>('resize_window_smart', {
        viewId,
      });

      return layout;
    } catch (error) {
      const errorStr = error as string;

      if (errorStr.includes('ANIMATION_FAILED')) {
        // Animation failed but window was snapped to size (FR-036)
        console.warn('Resize animation failed, window snapped:', error);
      } else {
        console.error('Window resize failed:', error);
        throw error;
      }
    }
  }

  async getCurrentLayout(): Promise<CalculatedWindowLayout> {
    // This would require a new Tauri command to get current window size/position
    // For now, we'll track it locally
    throw new Error('Not implemented - requires backend support');
  }

  async onResizeStart(
    callback: (payload: ResizeStartPayload) => void
  ): Promise<UnlistenFn> {
    return listen<ResizeStartPayload>('window:resize_start', (event) => {
      callback(event.payload);
    });
  }

  async onResizeComplete(
    callback: (payload: ResizeCompletePayload) => void
  ): Promise<UnlistenFn> {
    return listen<ResizeCompletePayload>('window:resize_complete', (event) => {
      callback(event.payload);
    });
  }
}

export const windowService = new WindowServiceImpl();
```

### Usage in View Manager

```typescript
import { windowService } from '@/services/windowService';

// In viewManagerStore.ts
navigateToView: async (view: ViewType) => {
  // ... queue logic ...

  set({ isTransitioning: true });

  try {
    // Trigger window resize
    await windowService.resizeToView(view);

    // Content transition happens in parallel via event listeners
  } catch (error) {
    console.error('Navigation failed:', error);
    set({ isTransitioning: false });
  }
}
```

---

## Service: viewTransitionService

**Purpose**: Orchestrates content transitions (fade + slide) synchronized with window resize animations.

**Source**: `src/services/viewTransitionService.ts`

### Interface

```typescript
interface ViewTransitionService {
  startTransition(
    fromView: ViewType,
    toView: ViewType,
    direction: 'forward' | 'backward'
  ): Promise<void>;
  cancelTransition(): void;
}
```

### Implementation

```typescript
import { windowService } from './windowService';
import type { ViewType } from '@/types';

class ViewTransitionServiceImpl implements ViewTransitionService {
  private isTransitioning = false;
  private currentAnimation: Promise<void> | null = null;

  async startTransition(
    fromView: ViewType,
    toView: ViewType,
    direction: 'forward' | 'backward'
  ): Promise<void> {
    if (this.isTransitioning) {
      throw new Error('Transition already in progress');
    }

    this.isTransitioning = true;

    try {
      // Step 1: Listen for resize start event
      const unlistenStart = await windowService.onResizeStart((payload) => {
        console.log('Resize started:', payload);

        // Trigger content fade-out
        this.fadeOut(fromView, direction);
      });

      // Step 2: Trigger window resize
      this.currentAnimation = windowService.resizeToView(toView);

      // Step 3: Wait for animation to complete
      await this.currentAnimation;

      // Step 4: Clean up listeners
      const unlistenComplete = await windowService.onResizeComplete((payload) => {
        console.log('Resize complete:', payload);

        // Trigger content fade-in
        this.fadeIn(toView, direction);

        // Mark transition complete
        this.isTransitioning = false;
      });

      // Auto-unlisten after transition
      setTimeout(() => {
        unlistenStart();
        unlistenComplete.then(fn => fn());
      }, 500);
    } catch (error) {
      console.error('Transition failed:', error);
      this.isTransitioning = false;
      throw error;
    }
  }

  private fadeOut(view: ViewType, direction: 'forward' | 'backward'): void {
    // Apply fade-out and slide-out animations
    const element = document.querySelector(`[data-view="${view}"]`);
    if (!element) return;

    const slideX = direction === 'forward' ? '-20px' : '20px';

    element.animate(
      [
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: `translateX(${slideX})` },
      ],
      {
        duration: 100, // First half of 200ms animation
        easing: 'ease-out',
      }
    );
  }

  private fadeIn(view: ViewType, direction: 'forward' | 'backward'): void {
    // Apply fade-in and slide-in animations
    const element = document.querySelector(`[data-view="${view}"]`);
    if (!element) return;

    const slideX = direction === 'forward' ? '20px' : '-20px';

    element.animate(
      [
        { opacity: 0, transform: `translateX(${slideX})` },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      {
        duration: 100, // Second half of 200ms animation
        easing: 'ease-out',
      }
    );
  }

  cancelTransition(): void {
    this.isTransitioning = false;
    this.currentAnimation = null;
  }
}

export const viewTransitionService = new ViewTransitionServiceImpl();
```

### Usage in Navigation

```typescript
import { viewTransitionService } from '@/services/viewTransitionService';
import { useViewManagerStore } from '@/stores/viewManagerStore';

function NavigationButton({ targetView }: { targetView: ViewType }) {
  const { currentView, navigateToView } = useViewManagerStore();

  const handleClick = async () => {
    const direction = currentView === 'search' ? 'forward' : 'backward';

    try {
      await viewTransitionService.startTransition(currentView, targetView, direction);
      await navigateToView(targetView);
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  return <button onClick={handleClick}>Go to {targetView}</button>;
}
```

---

## Hook: useScreenInfo

**Purpose**: React hook for accessing screen information with automatic updates.

**Source**: `src/hooks/useScreenInfo.ts`

```typescript
import { useState, useEffect } from 'react';
import { screenService } from '@/services/screenService';
import type { ScreenInfo } from '@/types';

export function useScreenInfo(): ScreenInfo | null {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo | null>(null);

  useEffect(() => {
    let unlisten: Awaited<ReturnType<typeof screenService.onScreenChanged>>;

    // Load initial screen info
    screenService.getScreenInfo().then(setScreenInfo);

    // Listen for screen changes
    screenService.onScreenChanged((payload) => {
      setScreenInfo(payload.newScreenInfo);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  return screenInfo;
}
```

### Usage

```typescript
import { useScreenInfo } from '@/hooks/useScreenInfo';

function ScreenSizeDisplay() {
  const screenInfo = useScreenInfo();

  if (!screenInfo) {
    return <div>Detecting screen size...</div>;
  }

  return (
    <div>
      Current screen: {screenInfo.screenWidth}x{screenInfo.screenHeight}
      ({screenInfo.scaleFactor}x scaling)
    </div>
  );
}
```

---

## Hook: useViewNavigation

**Purpose**: React hook for view navigation with automatic window resizing.

**Source**: `src/hooks/useViewNavigation.ts`

```typescript
import { useCallback } from 'react';
import { useViewManagerStore } from '@/stores/viewManagerStore';
import { viewTransitionService } from '@/services/viewTransitionService';
import type { ViewType } from '@/types';

export function useViewNavigation() {
  const { currentView, navigateToView, goBack, canGoBack } = useViewManagerStore();

  const handleNavigate = useCallback(
    async (targetView: ViewType) => {
      const direction = currentView === 'search' ? 'forward' : 'backward';

      try {
        await viewTransitionService.startTransition(currentView, targetView, direction);
        await navigateToView(targetView);
      } catch (error) {
        console.error('Navigation failed:', error);
      }
    },
    [currentView, navigateToView]
  );

  const handleGoBack = useCallback(async () => {
    if (!canGoBack()) return;

    try {
      await goBack();
    } catch (error) {
      console.error('Go back failed:', error);
    }
  }, [goBack, canGoBack]);

  return {
    currentView,
    navigateTo: handleNavigate,
    goBack: handleGoBack,
    canGoBack,
    isTransitioning: useViewManagerStore((s) => s.isTransitioning),
  };
}
```

### Usage

```typescript
import { useViewNavigation } from '@/hooks/useViewNavigation';

function SettingsButton() {
  const { navigateTo, isTransitioning } = useViewNavigation();

  return (
    <button
      onClick={() => navigateTo('settings')}
      disabled={isTransitioning}
    >
      Open Settings
    </button>
  );
}

function BackButton() {
  const { goBack, canGoBack, isTransitioning } = useViewNavigation();

  if (!canGoBack()) return null;

  return (
    <button
      onClick={goBack}
      disabled={isTransitioning}
    >
      ← Back
    </button>
  );
}
```

---

## Component: ViewContainer

**Purpose**: Container component that renders the current view with transition animations.

**Source**: `src/components/ViewContainer.tsx`

```typescript
import { lazy, Suspense } from 'react';
import { useViewManagerStore } from '@/stores/viewManagerStore';
import { windowService } from '@/services/windowService';
import './ViewContainer.css';

// Lazy load views
const SearchView = lazy(() => import('./views/SearchView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const PluginsView = lazy(() => import('./views/PluginsView'));

export function ViewContainer() {
  const { currentView, direction } = useViewManagerStore();

  useEffect(() => {
    // Listen for resize events to trigger transitions
    let unlistenStart: Awaited<ReturnType<typeof windowService.onResizeStart>>;
    let unlistenComplete: Awaited<ReturnType<typeof windowService.onResizeComplete>>;

    windowService.onResizeStart((payload) => {
      console.log('Window resize started:', payload);
    }).then((fn) => {
      unlistenStart = fn;
    });

    windowService.onResizeComplete((payload) => {
      console.log('Window resize complete:', payload);
    }).then((fn) => {
      unlistenComplete = fn;
    });

    return () => {
      unlistenStart?.();
      unlistenComplete?.();
    };
  }, []);

  return (
    <div className="view-container">
      <Suspense fallback={<Spinner />}>
        {currentView === 'search' && (
          <div data-view="search" className={`view view--${direction}`}>
            <SearchView />
          </div>
        )}
        {currentView === 'settings' && (
          <div data-view="settings" className={`view view--${direction}`}>
            <SettingsView />
          </div>
        )}
        {currentView === 'plugins' && (
          <div data-view="plugins" className={`view view--${direction}`}>
            <PluginsView />
          </div>
        )}
      </Suspense>
    </div>
  );
}

function Spinner() {
  return <div className="loading-spinner">Loading...</div>;
}
```

**Styles** (`ViewContainer.css`):

```css
.view-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 1;
  transition: opacity 100ms ease-out;
}

.view--forward {
  animation: slideInRight 100ms ease-out;
}

.view--backward {
  animation: slideInLeft 100ms ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
```

---

## Testing Utilities

### Mock Service Implementations

```typescript
// __tests__/mocks/screenService.mock.ts
export const mockScreenService = {
  getScreenInfo: async (): Promise<ScreenInfo> => ({
    screenWidth: 1920,
    screenHeight: 1080,
    availableWidth: 1920,
    availableHeight: 1040,
    scaleFactor: 1.0,
  }),
  invalidateCache: () => {},
  onScreenChanged: async (callback: any) => {
    return () => {};
  },
};

// __tests__/mocks/windowService.mock.ts
export const mockWindowService = {
  resizeToView: async (viewId: ViewType): Promise<CalculatedWindowLayout> => ({
    width: viewId === 'search' ? 800 : 900,
    height: viewId === 'search' ? 600 : 700,
    x: 560,
    y: 190,
    animationRequired: true,
  }),
  getCurrentLayout: async () => ({ /* ... */ }),
  onResizeStart: async (callback: any) => () => {},
  onResizeComplete: async (callback: any) => () => {},
};
```

### Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewNavigation } from '@/hooks/useViewNavigation';
import { mockWindowService } from '../mocks/windowService.mock';

vi.mock('@/services/windowService', () => ({
  windowService: mockWindowService,
}));

describe('useViewNavigation', () => {
  it('should navigate to settings view', async () => {
    const { result } = renderHook(() => useViewNavigation());

    await act(async () => {
      await result.current.navigateTo('settings');
    });

    expect(result.current.currentView).toBe('settings');
  });

  it('should disable navigation during transition', async () => {
    const { result } = renderHook(() => useViewNavigation());

    // Start transition
    const promise = act(() => result.current.navigateTo('settings'));

    // While transitioning, isTransitioning should be true
    expect(result.current.isTransitioning).toBe(true);

    await promise;
  });
});
```

---

## Next Steps

1. **Phase 1**: Generate quickstart.md for developer onboarding
2. **Phase 2**: Generate tasks.md with implementation steps
