import { useCallback } from 'react';
import { useViewManagerStore } from '@/stores/viewManagerStore';
import type { ViewType } from '@/types';

export function useViewNavigation() {
  const { currentView, navigateToView, goBack, canGoBack, isTransitioning } = useViewManagerStore();

  const handleNavigate = useCallback(
    async (targetView: ViewType, skipResize: boolean = false) => {
      const direction = currentView === 'search' ? 'forward' : 'backward';

      console.log('[useViewNavigation] 导航请求:');
      console.log('  - 当前视图:', currentView);
      console.log('  - 目标视图:', targetView);
      console.log('  - 方向:', direction);
      console.log('  - 跳过窗口调整:', skipResize);

      try {
        await navigateToView(targetView, skipResize);
        console.log('[useViewNavigation] 导航成功');
      } catch (error) {
        console.error('[useViewNavigation] 导航失败:', error);
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
    isTransitioning,
  };
}
