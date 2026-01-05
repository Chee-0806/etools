/**
 * useFileIndex Hook (T025)
 * Manages file indexing operations
 */

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface FileIndexStats {
  total_files: number;
  last_indexed: string | null;
  indexed_paths: string[];
}

export interface FileSearchResult {
  id: string;
  filename: string;
  path: string;
  extension: string | null;
  size: number;
  indexed: number;
}

export interface UseFileIndexReturn {
  stats: FileIndexStats | null;
  isIndexing: boolean;
  error: string | null;
  startIndexer: (paths?: string[]) => Promise<void>;
  stopIndexer: () => Promise<void>;
  indexFiles: (paths: string[]) => Promise<number>;
  searchFiles: (query: string, limit?: number) => Promise<FileSearchResult[]>;
  refreshStats: () => Promise<void>;
}

export function useFileIndex(): UseFileIndexReturn {
  const [stats, setStats] = useState<FileIndexStats | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startIndexer = useCallback(async (paths?: string[]) => {
    try {
      setIsIndexing(true);
      setError(null);
      await invoke('start_file_indexer', { paths });
      await refreshStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setIsIndexing(false);
    }
  }, []);

  const stopIndexer = useCallback(async () => {
    try {
      setError(null);
      await invoke('stop_file_indexer');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    }
  }, []);

  const indexFiles = useCallback(async (paths: string[]) => {
    try {
      setIsIndexing(true);
      setError(null);
      const count = await invoke<number>('index_files', { paths });
      await refreshStats();
      return count;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setIsIndexing(false);
    }
  }, []);

  const searchFiles = useCallback(async (query: string, limit: number = 50) => {
    try {
      setError(null);
      const results = await invoke<FileSearchResult[]>('search_files', { query, limit });
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setError(null);
      const result = await invoke<FileIndexStats>('get_file_index_stats');
      setStats(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    }
  }, []);

  return {
    stats,
    isIndexing,
    error,
    startIndexer,
    stopIndexer,
    indexFiles,
    searchFiles,
    refreshStats,
  };
}
