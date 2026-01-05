/**
 * SearchWindow - Main input-only window
 * This component runs in the "main" window and handles user input
 * Results are displayed in a separate "results" window
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';
import { useSearch } from '@/hooks/useSearch';
import { useAnnounce } from '@/hooks/useAnnounce';
import type { SearchResult } from '@/types/search';
import { Kbd } from './ui/Kbd';
import { logger, initLogger } from '@/lib/logger';

// Type declaration for Tauri environment detection
declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}

// Check if running in Tauri environment
const isTauri = () => typeof window !== 'undefined' && window.__TAURI__ !== undefined;

export function SearchWindow() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, search, isLoading } = useSearch();
  const { announce, announceResults, announceSelection, announceLoading } = useAnnounce();
  const isUserTypingRef = useRef(false);
  const isHidingRef = useRef(false); // Track if we're hiding windows

  // Initialize logger on mount
  useEffect(() => {
    if (isTauri()) {
      initLogger();
      logger.info('SearchWindow', 'Component mounted');
    }
  }, []);

  // Auto-focus input on mount and window show
  useEffect(() => {
    const focusInput = () => {
      // Only focus if not already focused AND user is not typing
      if (document.activeElement !== inputRef.current && !isUserTypingRef.current) {
        inputRef.current?.focus();
      }
    };

    focusInput();

    // 监听后端发送的窗口显示事件
    // 遵循架构原则：后端负责窗口管理，前端监听后端事件
    if (isTauri()) {
      const unlistenPromise = listen('window-shown', () => {
        if (!isUserTypingRef.current) {
          focusInput();
        }
      });
      return () => {
        unlistenPromise.then(fn => fn());
      };
    }
  }, []);

  // Reset typing flag after user stops typing
  useEffect(() => {
    if (!isUserTypingRef.current) return;

    const timer = setTimeout(() => {
      isUserTypingRef.current = false;
    }, 1000); // Reset flag after 1 second of no typing

    return () => clearTimeout(timer);
  }, [query]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, search]);

  // Send results to results window when results change
  useEffect(() => {
    const sendResultsToWindow = async () => {
      // Don't show results window if we're in the process of hiding
      if (isHidingRef.current) {
        logger.log('SearchWindow', 'Skipping show_results_window (hiding in progress)');
        return;
      }

      logger.log('SearchWindow', `Results changed: ${results.length} results, Query: "${query}"`);

      if (isTauri() && results.length > 0) {
        logger.log('SearchWindow', 'Calling show_results_window with results data');
        logger.log('SearchWindow', `Results data:`, results.map(r => r.title));
        logger.log('SearchWindow', `Query: "${query}", length: ${query.length}`);

        // Pass results directly to Rust command, which will forward to results window
        try {
          await invoke('show_results_window', {
            results: results,
            query: query,
          });
          logger.log('SearchWindow', 'show_results_window command completed successfully');
        } catch (error) {
          logger.error('SearchWindow', 'show_results_window command failed', error);
        }

        logger.log('SearchWindow', 'Results window should be visible now with data');
      } else if (isTauri() && results.length === 0 && query) {
        logger.log('SearchWindow', 'Hiding results window (no results)');
        // Hide results window if no results
        await invoke('hide_results_window');
      }
    };

    sendResultsToWindow().catch((error) => logger.error('SearchWindow', 'Failed to send results', error));
  }, [results, query]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Listen for selection changes from results window
  useEffect(() => {
    if (!isTauri()) return;

    const unlistenPromise = listen<{ selectedIndex: number }>('selection-changed', (event) => {
      setSelectedIndex(event.payload.selectedIndex);
    });

    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, []);

  // Listen for hide-results event
  useEffect(() => {
    if (!isTauri()) return;

    const unlistenPromise = listen('hide-results', async () => {
      try {
        await invoke('hide_results_window');
      } catch (error) {
        logger.error('SearchWindow', 'Failed to hide results window', error);
      }
    });

    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, []);

  // Listen for hide-main-window event (from results window)
  useEffect(() => {
    if (!isTauri()) return;

    const unlistenPromise = listen('hide-main-window', async () => {
      logger.log('SearchWindow', 'Received hide-main-window event');
      await hideWindow();
    });

    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = selectedIndex < results.length - 1 ? selectedIndex + 1 : selectedIndex;
        setSelectedIndex(nextIndex);
        // Notify results window of selection change
        await emit('update-selection', { selectedIndex: nextIndex });
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : 0;
        setSelectedIndex(prevIndex);
        // Notify results window of selection change
        await emit('update-selection', { selectedIndex: prevIndex });
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          await handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        // Set hiding flag to prevent results window from reappearing
        isHidingRef.current = true;
        // Hide both windows
        await Promise.allSettled([
          hideWindow(),
          invoke('hide_results_window').catch(err => {
            logger.error('SearchWindow', 'Failed to hide results window on Escape', err);
          })
        ]);
        // Reset hiding flag after a short delay
        setTimeout(() => {
          isHidingRef.current = false;
        }, 100);
        break;
    }
  };

  // Handle result selection
  const handleSelect = async (result: SearchResult) => {
    logger.log('SearchWindow', `Executing action for: ${result.title}`);

    // Check if action exists
    if (!result.action) {
      logger.error('SearchWindow', 'No action defined for result:', result);
      return;
    }

    try {
      await result.action();
      logger.log('SearchWindow', 'Action executed successfully');

      // Track usage if it's an app (only in Tauri)
      if (result.type === 'app' && isTauri()) {
        try {
          await invoke('track_app_usage', { appId: result.id });
        } catch (error) {
          console.warn('Failed to track app usage:', error);
        }
      }

      // CRITICAL: Set hiding flag to prevent results window from reappearing
      isHidingRef.current = true;

      // Hide both windows immediately after action
      await Promise.allSettled([
        hideWindow(),
        invoke('hide_results_window').catch(err => {
          logger.error('SearchWindow', 'Failed to hide results window', err);
        })
      ]);

      logger.log('SearchWindow', 'Windows hidden successfully');

      // Clear query for next launch (after windows are hidden)
      setQuery('');

      // Reset hiding flag after a short delay to ensure useEffect has run
      setTimeout(() => {
        isHidingRef.current = false;
        logger.log('SearchWindow', 'Hiding flag reset');
      }, 100);
    } catch (error) {
      logger.error('SearchWindow', 'Failed to execute action', error);
      console.error('Failed to execute action:', error);
      // Even if action fails, hide both windows
      isHidingRef.current = true;
      await Promise.allSettled([
        hideWindow().catch(() => {}),
        invoke('hide_results_window').catch(() => {})
      ]);
      setQuery('');
      setTimeout(() => {
        isHidingRef.current = false;
      }, 100);
    }
  };

  // Hide window - 使用后端命令而非直接操作窗口
  const hideWindow = async () => {
    if (isTauri()) {
      try {
        await invoke('hide_window');
        logger.log('SearchWindow', 'Main window hidden via backend command');
      } catch (error) {
        logger.error('SearchWindow', 'Failed to hide main window via backend command', error);
        console.error('Failed to hide window:', error);
      }
    }
  };

  return (
    <div
      className="search-window"
      onClick={() => inputRef.current?.focus()}
      role="search"
      aria-label="应用程序启动器搜索窗口"
    >
      <div className="search-container">
        {/* Search Input */}
        <div className="search-input-section">
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="search"
            className="search-input"
            placeholder="Search apps..."
            value={query}
            onChange={e => {
              isUserTypingRef.current = true;
              setQuery(e.target.value);
              // Hide results window when clearing input
              if (!e.target.value) {
                invoke('hide_results_window').catch(console.error);
              }
            }}
            onFocus={() => {
              isUserTypingRef.current = false;
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="搜索应用程序"
            aria-autocomplete="list"
          />
          {isLoading && (
            <div
              className="search-spinner"
              role="status"
              aria-live="polite"
              aria-label="正在搜索"
            >
              <svg
                className="spinner"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.25"
                />
                <path
                  d="M12 2A10 10 0 0 1 22 12"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="32"
                  strokeDashoffset="32"
                />
              </svg>
            </div>
          )}
          {query && (
            <button
              className={`clear-button ${query ? 'visible' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setQuery('');
                invoke('hide_results_window').catch(console.error);
              }}
              type="button"
              aria-label="清除搜索"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          <button
            className="settings-button"
            onClick={async () => {
              try {
                console.log('[SettingsButton] Opening settings window');
                await invoke('show_settings_window');
              } catch (error) {
                console.error('[SettingsButton] Failed to open settings:', error);
              }
            }}
            aria-label="打开设置"
            type="button"
            style={{
              border: '2px solid red',
              flexShrink: 0,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'transparent',
              color: 'inherit',
              padding: '0'
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="settings-icon"
            >
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Footer with keyboard shortcuts */}
        {!query && (
          <div className="search-footer" role="note" aria-label="键盘快捷键提示">
            <div className="shortcuts">
              <span className="shortcut-item">
                Type to search
              </span>
              <span className="shortcut-item">
                <Kbd>Esc</Kbd> to close
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
