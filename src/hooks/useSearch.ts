/**
 * useSearch Hook - Manages search state and queries
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { SearchResult, SearchResponse } from '@/types/search';
import { getSearchService } from '@/services/searchService';
import { getActionService } from '@/services/actionService';
import { pluginLoader } from '@/services/pluginLoader';
import { abbreviationService } from '@/services/abbreviationService';
import { pluginAbbreviationService } from '@/services/pluginAbbreviationService';

// Type declaration for Tauri environment detection
declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}

// Check if running in Tauri environment
const isTauri = () => typeof window !== 'undefined' && window.__TAURI__ !== undefined;

// Mock data for browser development
const mockApps = [
  { id: '1', name: 'Visual Studio Code', executablePath: '/usr/bin/code', icon: '📝', usageCount: 45 },
  { id: '2', name: 'Chrome', executablePath: '/usr/bin/google-chrome', icon: '🌐', usageCount: 120 },
  { id: '3', name: 'Finder', executablePath: '/usr/bin/finder', icon: '📁', usageCount: 89 },
  { id: '4', name: 'Terminal', executablePath: '/usr/bin/terminal', icon: '⌨️', usageCount: 67 },
  { id: '5', name: 'Spotify', executablePath: '/usr/bin/spotify', icon: '🎵', usageCount: 34 },
  { id: '6', name: 'Notes', executablePath: '/usr/bin/notes', icon: '📝', usageCount: 23 },
  { id: '7', name: 'Calendar', executablePath: '/usr/bin/calendar', icon: '📅', usageCount: 18 },
  { id: '8', name: 'Photoshop', executablePath: '/usr/bin/photoshop', icon: '🎨', usageCount: 12 },
];

interface SearchState {
  results: SearchResult[];
  query: string;
  selectedIndex: number;
  isLoading: boolean;
  error: string | null;
  // T088-T089: Clipboard trigger mode
  clipboardMode: boolean;
}

interface UseSearchOptions {
  debounceMs?: number;
  maxResults?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 150, maxResults = 50 } = options;

  const [state, setState] = useState<SearchState>({
    results: [],
    query: '',
    selectedIndex: 0,
    isLoading: false,
    error: null,
    clipboardMode: false,
  });

  const searchService = getSearchService();
  const actionService = getActionService();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Perform search with debouncing
   */
  const search = useCallback(async (query: string) => {
    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Update query immediately for UI
    setState((prev) => ({ ...prev, query }));

    if (!query.trim()) {
      setState((prev) => ({ ...prev, results: [], selectedIndex: 0, isLoading: false, clipboardMode: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Debounce the search
    debounceRef.current = setTimeout(async () => {
      try {
        // Cancel any previous search
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        let searchResults: SearchResult[] = [];

        // T088-T089: Check for clipboard trigger "clip:"
        const clipboardTrigger = query.match(/^clip:\s*(.*)$/i);
        if (clipboardTrigger) {
          const clipQuery = clipboardTrigger[1];
          setState((prev) => ({ ...prev, clipboardMode: true }));

          if (isTauri()) {
            try {
              const clipboardItems = await invoke<Array<{
                id: string;
                content: string;
                timestamp: number;
                is_sensitive: boolean;
              }>>('search_clipboard', {
                query: clipQuery,
                limit: maxResults,
              });

              searchResults = clipboardItems.map((item) => ({
                id: item.id,
                title: item.content.substring(0, 50) + (item.content.length > 50 ? '...' : ''),
                subtitle: new Date(item.timestamp).toLocaleString(),
                icon: '📋',
                type: 'clipboard' as const,
                score: 1,
                action: async () => {
                  await invoke('paste_clipboard_item', { id: item.id });
                },
                metadata: {
                  isSensitive: item.is_sensitive,
                  fullContent: item.content,
                },
              }));
            } catch (e) {
              console.error('Clipboard search error:', e);
            }
          }
        } else {
          setState((prev) => ({ ...prev, clipboardMode: false }));

          // Check for quick actions first (highest priority)
          const actionResult = actionService.detectAction(query);
          if (actionResult) {
            searchResults = [actionResult];
          } else if (isTauri()) {
            // Use backend unified search
            // Note: Backend uses #[serde(rename = "type")] so the field is "type" in JSON
            const response = await invoke<{
              results: Array<{
                id: string;
                title: string;
                subtitle: string;
                icon?: string;
                type: string;
                score: number;
                path: string;
                frequency: number;
              }>;
              total: number;
              query_time: number;
            }>('unified_search', {
              query: { query, limit: maxResults, sources: null },
            });

            searchResults = response.results.map(r => ({
              id: r.id,
              title: r.title,
              subtitle: r.subtitle,
              icon: r.icon,
              type: r.type as SearchResult['type'],
              score: r.score,
              path: r.path,
              action: async () => {
                await invoke('launch_app', { path: r.path });
              },
            }));

            // T155: Integrate file search
            try {
              const fileResults = await invoke<Array<{
                id: string;
                filename: string;
                path: string;
                extension: string | null;
                size: number;
                indexed: number;
              }>>('search_files', {
                query,
                limit: Math.floor(maxResults / 3),
              });

              const fileSearchResults = fileResults.map((file) =>
                searchService.createFileResult(
                  file.id,
                  file.filename,
                  file.path,
                  file.extension || undefined,
                  file.size
                )
              );

              searchResults = [...searchResults, ...fileSearchResults];
            } catch (e) {
              console.error('File search error:', e);
            }

            // T156: Integrate browser search
            try {
              const browserResults = await invoke<Array<{
                id: string;
                title: string;
                url: string;
                browser: string;
                entry_type: string;
                favicon: string | null;
                last_visited: number;
              }>>('search_browser_data', {
                query,
                limit: Math.floor(maxResults / 3),
              });

              const browserSearchResults = browserResults.map((item) =>
                searchService.createBrowserResult(
                  item.id,
                  item.title,
                  item.url,
                  item.browser,
                  item.entry_type === 'bookmark' ? 'bookmark' : 'history',
                  item.favicon || undefined
                )
              );

              searchResults = [...searchResults, ...browserSearchResults];
            } catch (e) {
              console.error('Browser search error:', e);
            }

            // Re-rank combined results
            const rankedResults = searchService.search(searchResults, query, {
              limit: maxResults,
            });
            searchResults = rankedResults.results;

            try {
              await abbreviationService.loadConfig();
              const abbrResults = abbreviationService.searchAbbreviations(query);
              const abbrSearchResults: SearchResult[] = abbrResults.map((abbr) => {
                const category = abbreviationService.getCategoryById(abbr.category || '');
                return {
                  id: `abbr-${abbr.id}`,
                  title: `${abbr.abbr}: ${abbr.expansion}`,
                  subtitle: abbr.description || `缩写展开为 ${abbr.expansion}`,
                  icon: category?.icon || '🔗',
                  type: 'plugin' as const,
                  score: 0.95,
                  action: async () => {
                    if (isTauri()) {
                      await invoke('open_url', { url: abbr.expansion });
                    } else {
                      window.open(abbr.expansion, '_blank');
                    }
                  },
                };
              });

              if (query.endsWith(':')) {
                const abbrWithoutColon = query.slice(0, -1);
                const expansion = abbreviationService.expandAbbreviation(abbrWithoutColon);
                if (expansion) {
                  const config = abbreviationService.getConfig();
                  if (config?.autoOpenSingle) {
                    if (isTauri()) {
                      await invoke('open_url', { url: expansion });
                    } else {
                      window.open(expansion, '_blank');
                    }
                    searchResults = [];
                    setState((prev) => ({ 
                      ...prev, 
                      results: [], 
                      isLoading: false,
                      selectedIndex: 0,
                    }));
                    return;
                  }
                }
              }

              searchResults = [...abbrSearchResults, ...searchResults];
            } catch (e) {
              console.error('Abbreviation search error:', e);
            }

            // Plugin abbreviation search (user-defined shortcuts for plugins)
            try {
              await pluginAbbreviationService.loadConfig();
              const plugins = await pluginLoader.getAllPlugins();
              const abbrMatches = pluginAbbreviationService.searchPluginsByAbbreviation(query, plugins);

              if (abbrMatches.length > 0) {
                const pluginAbbrResults: SearchResult[] = abbrMatches.map(({ plugin, abbreviation, matchType }) => {
                  // Calculate score based on match type
                  const scoreByMatchType = { exact: 0.98, prefix: 0.96, contains: 0.94 };
                  const score = scoreByMatchType[matchType];

                  return {
                    id: `plugin-abbr-${plugin.manifest.id}-${abbreviation.keyword}`,
                    title: `${abbreviation.keyword}: ${plugin.manifest.name}`,
                    subtitle: `触发插件${matchType === 'exact' ? ' (精确匹配)' : ''}`,
                    icon: plugin.manifest.icon || '🔌',
                    type: 'plugin' as const,
                    score,
                    action: async () => {
                      // Trigger the plugin's search with empty query to show its options
                      const pluginResults = await pluginLoader.searchByTrigger(abbreviation.keyword);
                      if (pluginResults.length > 0 && pluginResults[0].action) {
                        await pluginResults[0].action();
                      }
                    },
                  };
                });

                // Insert plugin abbreviation results at the beginning (highest priority)
                searchResults = [...pluginAbbrResults, ...searchResults];
              }
            } catch (e) {
              console.error('Plugin abbreviation search error:', e);
            }

            // T115: Integrate plugin search results
            try {
              console.log('[useSearch] Calling pluginLoader.searchByTrigger with query:', query);
              const pluginResults = await pluginLoader.searchByTrigger(query);
              console.log('[useSearch] Plugin results received:', pluginResults);
              console.log('[useSearch] Plugin results count:', pluginResults.length);

              const pluginSearchResults: SearchResult[] = pluginResults
                .filter(pr => pr.action)
                .map((pr) => {
                  console.log('[useSearch] Mapping plugin result:', pr.id);
                  return {
                    id: pr.id,
                    title: pr.title,
                    subtitle: pr.description,
                    icon: pr.icon,
                    type: 'plugin' as const,
                    score: 0.9,
                    action: async () => {
                      console.log('[useSearch] Executing plugin action for:', pr.id);
                      if (pr.action) {
                        await pr.action();
                      }
                    },
                  };
                });

              console.log('[useSearch] Plugin search results mapped:', pluginSearchResults);
              searchResults = [...searchResults, ...pluginSearchResults];
            } catch (e) {
              console.error('[useSearch] Plugin search error:', e);
            }
          } else {
            // Use mock data in browser
            const apps = mockApps;
            // Simulate network delay for better UX
            await new Promise(resolve => setTimeout(resolve, 100));

            const allItems: SearchResult[] = apps.map((app) =>
              searchService.createAppResult(
                app.id,
                app.name,
                app.executablePath,
                app.icon,
                app.usageCount
              )
            );

            // Perform search
            const response: SearchResponse = searchService.search(allItems, query, {
              limit: maxResults,
            });

            searchResults = response.results;
          }
        }

        setState((prev) => ({
          ...prev,
          results: searchResults,
          selectedIndex: 0,
          isLoading: false,
        }));
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setState((prev) => ({
            ...prev,
            error: error.message,
            isLoading: false,
          }));
        }
      }
    }, debounceMs);
  }, [debounceMs, maxResults, searchService, actionService]);

  /**
   * Select the next result
   */
  const selectNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1),
    }));
  }, []);

  /**
   * Select the previous result
   */
  const selectPrevious = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIndex: Math.max(prev.selectedIndex - 1, 0),
    }));
  }, []);

  /**
   * Select a specific result by index
   */
  const selectIndex = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      selectedIndex: Math.max(0, Math.min(index, prev.results.length - 1)),
    }));
  }, []);

  /**
   * Execute the selected result's action
   */
  const executeSelected = useCallback(async () => {
    const { results, selectedIndex } = state;
    if (results.length === 0 || selectedIndex >= results.length) {
      return;
    }

    const selected = results[selectedIndex];
    try {
      await selected.action();

      // Track usage if it's an app (only in Tauri)
      if (selected.type === 'app' && isTauri()) {
        await invoke('track_app_usage', { appId: selected.id });
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to execute action',
      }));
    }
  }, [state]);

  /**
   * Clear search state
   */
  const clear = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      results: [],
      query: '',
      selectedIndex: 0,
      isLoading: false,
      error: null,
      clipboardMode: false,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    search,
    selectNext,
    selectPrevious,
    selectIndex,
    executeSelected,
    clear,
  };
}
