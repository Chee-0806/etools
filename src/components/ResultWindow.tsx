/**
 * ResultWindow - Dedicated window for displaying search results
 * This component runs in the separate "results" window
 */

import { useState, useEffect, useCallback } from 'react';
import { listen, emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { ResultList } from './ResultList';
import type { SearchResult } from '@/types/search';
import "@/styles/components/ResultWindow.css";
import { logger, initLogger } from '@/lib/logger';

// Type declaration for Tauri environment detection
declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}

// Check if running in Tauri environment
const isTauri = () => typeof window !== 'undefined' && window.__TAURI__ !== undefined;

// Event types for window communication
export interface ShowResultsEvent {
  results: SearchResult[];
  query: string;
}

export interface UpdateSelectionEvent {
  selectedIndex: number;
}

export function ResultWindow() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState('');

  // Debug: Log component mount and initialize logger
  useEffect(() => {
    if (isTauri()) {
      initLogger();
      logger.info('ResultWindow', 'Component mounted');
    }
  }, []);

  // Dynamic window size adjustment
  useEffect(() => {
    if (!isTauri()) return;

    let resizeTimer: NodeJS.Timeout | null = null;
    let lastHeight = 0;

    const updateWindowSize = async () => {
      try {
        const container = document.querySelector('.result-window-container');
        if (!container) return;

        // Wait for DOM updates
        await new Promise(resolve => setTimeout(resolve, 20));

        const containerRect = container.getBoundingClientRect();
        const contentHeight = containerRect.height;

        // If height hasn't changed significantly, skip update
        if (Math.abs(contentHeight - lastHeight) < 3) {
          return;
        }
        lastHeight = contentHeight;

        // Calculate new height with constraints
        const minHeight = 200;
        const maxHeight = 600;
        const newHeight = Math.max(minHeight, Math.min(maxHeight, Math.ceil(contentHeight)));

        // Update results window size
        await invoke('update_results_window_size', { height: newHeight });
      } catch (error) {
        logger.error('ResultWindow', 'Failed to update window size', error);
      }
    };

    const debouncedUpdate = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => {
        updateWindowSize();
      }, 50);
    };

    // Use ResizeObserver to monitor container height changes
    const container = document.querySelector('.result-window-container');
    if (container) {
      const resizeObserver = new ResizeObserver(debouncedUpdate);
      resizeObserver.observe(container);

      // Initial update
      const initTimer = setTimeout(() => {
        updateWindowSize();
      }, 150);

      return () => {
        if (resizeTimer) {
          clearTimeout(resizeTimer);
        }
        clearTimeout(initTimer);
        resizeObserver.disconnect();
      };
    }
  }, [results]);

  // Listen for search results from main window
  useEffect(() => {
    logger.info('ResultWindow', 'Setting up show-results listener');
    let unlistenFn: (() => void) | null = null;

    const unlistenPromise = listen<ShowResultsEvent>('show-results', (event) => {
      logger.log('ResultWindow', `Received show-results event: ${event.payload.results.length} results`);
      logger.log('ResultWindow', `Query: "${event.payload.query}"`);
      setResults(event.payload.results);
      setQuery(event.payload.query);
      setSelectedIndex(0);
    });

    unlistenPromise.then((fn) => {
      unlistenFn = fn;
      logger.info('ResultWindow', 'show-results listener ready');
    }).catch((error) => {
      logger.error('ResultWindow', 'Failed to set up show-results listener', error);
    });

    return () => {
      if (unlistenFn) {
        logger.info('ResultWindow', 'Cleaning up show-results listener');
        unlistenFn();
      } else {
        logger.warn('ResultWindow', 'Cleanup called but unlistenFn is null');
      }
    };
  }, []);

  // Listen for selection updates from main window
  useEffect(() => {
    const unlistenPromise = listen<UpdateSelectionEvent>('update-selection', (event) => {
      setSelectedIndex(event.payload.selectedIndex);
    });

    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, []);

  // Handle result selection
  const handleExecute = useCallback(async (index: number) => {
    const result = results[index];
    if (!result) return;

    logger.log('ResultWindow', `Executing action for: ${result.title}`);

    try {
      // Execute the action
      await result.action();
      logger.log('ResultWindow', 'Action executed successfully');

      // CRITICAL: Hide both windows immediately after action
      // 1. Send event to main window to hide itself
      await emit('hide-main-window');

      // 2. Hide results window
      await invoke('hide_results_window');
      logger.log('ResultWindow', 'Windows hidden successfully');

      // 3. Notify main window to clear query
      await emit('result-selected', { clearQuery: true });
    } catch (error) {
      logger.error('ResultWindow', 'Failed to execute action', error);
      // Even if action fails, hide both windows
      await Promise.allSettled([
        emit('hide-main-window').catch(() => {}),
        invoke('hide_results_window').catch(() => {})
      ]);
    }
  }, [results]);

  // Always render container to ensure window has content when shown
  // The results window visibility is controlled by the Rust backend

  return (
    <div
      className="result-window-container"
      role="region"
      aria-label="搜索结果"
    >
      {results.length === 0 ? (
        <div className="results-empty-state" role="status" aria-live="polite">
          <div className="empty-state-content">
            <div className="empty-state-icon">🔍</div>
            <p className="empty-state-text">正在搜索...</p>
          </div>
        </div>
      ) : (
        <ResultList
          results={results}
          selectedIndex={selectedIndex}
          onSelectIndex={(index) => {
            setSelectedIndex(index);
            // Notify main window of selection change
            invoke('emit', { event: 'selection-changed', payload: { selectedIndex: index } }).catch(console.error);
          }}
          onExecute={handleExecute}
          query={query}
          id="search-results"
        />
      )}
    </div>
  );
}

export default ResultWindow;
