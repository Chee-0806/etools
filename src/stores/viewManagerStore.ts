import { create } from 'zustand';
import type { ViewType, ViewHistoryEntry, Direction, ScreenChangedPayload } from '@/types';
import { screenService } from '@/services/screenService';
import { viewTransitionService } from '@/services/viewTransitionService';
import { performanceMonitor } from '@/services/performanceMonitor';
import { errorHandler, ErrorCategory } from '@/services/errorHandler';

interface ViewManagerState {
  // State
  currentView: ViewType;
  history: ViewHistoryEntry[];
  isTransitioning: boolean;
  direction: Direction;
  pendingNavigation: ViewType[];
  pluginViewData: { pluginId?: string; toolId?: string } | null; // Plugin UI view data

  // Actions
  navigateToView: (view: ViewType, skipResize?: boolean, pluginViewData?: { pluginId?: string; toolId?: string }) => Promise<void>;
  goBack: () => Promise<void>;
  canGoBack: () => boolean;
  clearHistory: () => void;
  setIsTransitioning: (transitioning: boolean) => void;
  handleScreenChanged: (payload: ScreenChangedPayload) => void;
  getPerformanceStats: () => any;
}

export const useViewManagerStore = create<ViewManagerState>((set, get) => ({
  // Initial state
  currentView: 'search',
  history: [],
  isTransitioning: false,
  direction: 'none',
  pendingNavigation: [],
  pluginViewData: null,

  // Navigate to a new view (T048: uses viewTransitionService)
  navigateToView: async (view: ViewType, skipResize: boolean = false, pluginViewData?: { pluginId?: string; toolId?: string }) => {
    const { isTransitioning, currentView, history } = get();

    console.log('[viewManagerStore] navigateToView 调用:');
    console.log('  - 从:', currentView);
    console.log('  - 到:', view);
    console.log('  - 跳过窗口调整:', skipResize);
    console.log('  - 正在过渡:', isTransitioning);

    // Queue if transitioning (FR-020: Navigation queue prevents rapid clicks)
    if (isTransitioning) {
      console.log('[viewManagerStore] 已加入队列（当前正在过渡中）');
      set({ pendingNavigation: [...get().pendingNavigation, view] });
      return;
    }

    performanceMonitor.startTimer('navigateToView', 'view_transition');

    try {
      // Push to history
      const entry: ViewHistoryEntry = {
        viewId: currentView,
        timestamp: Date.now(),
        stateData: {
          scrollPosition: window.scrollY,
          focusedInputId: (document.activeElement as HTMLInputElement)?.id,
        },
      };

      console.log('[viewManagerStore] 更新状态:');
      console.log('  - 设置当前视图:', view);
      console.log('  - 设置方向: forward');
      console.log('  - 设置过渡中: true');

      set({
        history: [...history, entry].slice(-50), // FR-019: Max 50 entries
        direction: 'forward',
        isTransitioning: true,
        currentView: view,
        pluginViewData: pluginViewData || null,
      });

      // Trigger smooth transition (T048: coordinates fade + resize)
      // Pass skipResize parameter to skip window resize if needed
      console.log('[viewManagerStore] 调用 viewTransitionService.transition');
      console.log('  - 视图:', view);
      console.log('  - 方向: forward');
      console.log('  - 跳过调整:', skipResize);

      await viewTransitionService.transition(view, 'forward', undefined, skipResize);

      console.log('[viewManagerStore] 过渡服务完成');

      // 重置过渡状态
      set({ isTransitioning: false });
    } catch (error) {
      console.error('[viewManagerStore] 导航错误:', error);
      errorHandler.logUnknown(error, ErrorCategory.VIEW_TRANSITION, {
        from: currentView,
        to: view,
      });
      set({ isTransitioning: false });
    } finally {
      performanceMonitor.endTimer('navigateToView', 'view_transition', {
        from: currentView,
        to: view,
      });
    }
  },

  // Go back to previous view (T048: uses viewTransitionService)
  goBack: async () => {
    const { history, isTransitioning } = get();

    console.log('[viewManagerStore] ===== goBack 调用 =====');
    console.log('  - 历史记录:', history);
    console.log('  - 历史记录数量:', history.length);
    console.log('  - 正在过渡:', isTransitioning);

    if (history.length === 0) {
      console.log('[viewManagerStore] 没有历史记录，返回');
      return;
    }

    if (isTransitioning) {
      console.log('[viewManagerStore] 正在过渡中，加入队列');
      // Queue if transitioning (FR-020)
      return;
    }

    performanceMonitor.startTimer('goBack', 'view_transition');

    try {
      const previousEntry = history[history.length - 1];
      const newHistory = history.slice(0, -1);

      console.log('[viewManagerStore] 上一个视图:', previousEntry.viewId);

      set({
        history: newHistory,
        direction: 'backward',
        isTransitioning: true,
        currentView: previousEntry.viewId,
      });

      console.log('[viewManagerStore] 调用 viewTransitionService.transition');
      console.log('  - 视图:', previousEntry.viewId);
      console.log('  - 方向: backward');
      console.log('  - 跳过调整: true (返回时保持窗口大小)');

      // Trigger smooth transition with backward direction (T048)
      // Skip resize when going back to maintain window size
      await viewTransitionService.transition(previousEntry.viewId, 'backward', undefined, true);

      console.log('[viewManagerStore] goBack 过渡完成');

      // 重置过渡状态
      set({ isTransitioning: false });
    } catch (error) {
      console.error('[viewManagerStore] goBack 错误:', error);
      errorHandler.logUnknown(error, ErrorCategory.VIEW_TRANSITION, {
        action: 'goBack',
      });
      set({ isTransitioning: false });
    } finally {
      performanceMonitor.endTimer('goBack', 'view_transition');
    }
  },

  // Check if back navigation is possible
  canGoBack: () => {
    return get().history.length > 0;
  },

  // Clear navigation history
  clearHistory: () => {
    set({ history: [] });
  },

  // Set transitioning state (called by animation system)
  setIsTransitioning: (transitioning: boolean) => {
    const { pendingNavigation } = get();

    set({ isTransitioning: transitioning });

    // Process next queued navigation (FR-020)
    if (!transitioning && pendingNavigation.length > 0) {
      const next = pendingNavigation[0];
      set({ pendingNavigation: pendingNavigation.slice(1) });
      get().navigateToView(next);
    }
  },

  // Handle screen size changes
  handleScreenChanged: (payload: ScreenChangedPayload) => {
    const { currentView, isTransitioning } = get();

    console.log('Screen changed:', payload.changeType, payload.newScreenInfo);

    // If not transitioning, resize window to fit new screen dimensions
    if (!isTransitioning) {
      const { windowService } = require('@/services/windowService');
      windowService.resizeToView(currentView).catch((error: Error) => {
        errorHandler.logUnknown(error, ErrorCategory.WINDOW_RESIZE, {
          trigger: 'screen_changed',
        });
      });
    }
    // If transitioning, the resize will happen automatically after animation completes
  },

  // Get performance statistics
  getPerformanceStats: () => {
    return {
      navigation: performanceMonitor.getStats('navigateToView'),
      back: performanceMonitor.getStats('goBack'),
      transition: performanceMonitor.getStats('view_transition'),
      summary: performanceMonitor.getSummary(),
    };
  },
}));

// Initialize screen change listener
// 暂时禁用以避免初始化问题
// screenService.onScreenChanged((payload) => {
//   useViewManagerStore.getState().handleScreenChanged(payload);
// }).catch((error) => {
//   console.error('Failed to setup screen change listener:', error);
// });
