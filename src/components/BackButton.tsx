import { useEffect } from 'react';
import { useViewManagerStore } from '@/stores/viewManagerStore';
import './BackButton.css';

/**
 * BackButton Component (T052-T054)
 *
 * Displays a back button when navigation history is available.
 * Automatically hides when there's no history to go back to.
 * Also handles Escape key (T055-T057) for going back.
 */
export function BackButton() {
  const { canGoBack, goBack, currentView, history } = useViewManagerStore();

  console.log('[BackButton] 渲染状态:');
  console.log('  - 当前视图:', currentView);
  console.log('  - 历史记录数量:', history.length);
  console.log('  - 可返回:', canGoBack());

  const handleClick = () => {
    console.log('[BackButton] 点击返回按钮');
    console.log('  - 历史记录:', history);
    goBack();
  };

  // Escape key listener (T055-T057)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger Escape if not in search view (FR-022)
      if (event.key === 'Escape' && currentView !== 'search') {
        console.log('[BackButton] 检测到 Escape 键');
        if (canGoBack()) {
          console.log('[BackButton] 执行返回');
          event.preventDefault();
          goBack();
        } else {
          console.log('[BackButton] 没有历史记录，忽略 Escape');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentView, canGoBack, goBack]);

  // Don't render if no history (FR-022: Hide when in root view)
  if (!canGoBack()) {
    console.log('[BackButton] 不渲染按钮（canGoBack = false）');
    return null;
  }

  console.log('[BackButton] 渲染返回按钮');

  return (
    <button
      className="back-button"
      onClick={handleClick}
      aria-label="返回"
      title="返回 (Escape)"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span>返回</span>
    </button>
  );
}
