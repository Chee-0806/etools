/**
 * Search types for Productivity Launcher
 */

export type SearchResultType =
  | 'app'              // Application
  | 'file'             // Local file
  | 'clipboard'        // Clipboard history
  | 'bookmark'         // Browser bookmark
  | 'history'          // Browser history
  | 'plugin'           // Plugin result
  | 'action'           // Quick action (calculator, etc.)
  | 'url'              // Direct URL
  | 'color';           // Color conversion (T037-T042)

export interface ColorData {
  hex: string;
  rgb: string;
  hsl: string;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  type: SearchResultType;
  score: number;          // Relevance score (0-1)
  source?: string;        // Source plugin/app ID
  action: () => void | Promise<void>;
  metadata?: Record<string, unknown>; // Additional metadata for specific result types
  colorData?: ColorData;  // Color conversion data (T040)
}

export interface SearchOptions {
  limit?: number;
  sources?: SearchResultType[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  queryTime: number;
}

// Scoring algorithm configuration
export interface ScoringConfig {
  fuzzyWeight: number;     // Text match score weight (default: 0.5)
  frequencyWeight: number; // Usage frequency weight (default: 0.3)
  typeWeight: number;      // Type priority weight (default: 0.2)
}

// Type priority boosts
export const TYPE_PRIORITY: Record<SearchResultType, number> = {
  app: 1.0,
  clipboard: 0.9,
  bookmark: 0.8,
  history: 0.7,
  file: 0.6,
  plugin: 0.5,
  action: 0.55,
  url: 0.5,
  color: 0.95,  // Color conversions have high priority (T037-T042)
};
