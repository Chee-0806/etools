/**
 * Vitest Test Setup
 * Global test configuration and mocks
 */

import { vi, beforeEach } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Create a global mock invoke function with default implementation
const createMockInvoke = () => vi.fn().mockImplementation((cmd: string, ...args: any[]) => {
  // Default implementation - returns empty array for search commands
  if (cmd === 'search_files' || cmd === 'search_browser_data' || cmd === 'search_clipboard') {
    return Promise.resolve([] as any[]);
  }
  if (cmd === 'unified_search') {
    return Promise.resolve({ results: [], total: 0, query_time: 0 });
  }
  return Promise.resolve(undefined);
});

let mockInvoke = createMockInvoke();

// Mock Tauri API - using hoisted mock to ensure it's applied before imports
vi.mock('@tauri-apps/api/core', async () => {
  const actual = await vi.importActual<typeof import('@tauri-apps/api/core')>('@tauri-apps/api/core');
  return {
    ...actual,
    invoke: (...args: any[]) => mockInvoke(...args),
  };
});

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(),
}));

// Mock Tauri plugins
vi.mock('@tauri-apps/plugin-global-shortcut', () => ({
  register: vi.fn(),
  unregister: vi.fn(),
  unregisterAll: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-opener', () => ({
  open: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(),
}));

// Export the mock invoke function for tests to use
export { mockInvoke };

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia for theme detection
const mockMatchMedia = vi.fn().mockImplementation((query) => ({
  matches: query === '(prefers-color-scheme: dark)' ? false : true,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock all CSS files
vi.mock('*.css', () => ({}));
vi.mock('*.module.css', () => () => ({}));
vi.mock('*.scss', () => ({}));
vi.mock('*.sass', () => ({}));

// Mock SVG imports
vi.mock('*.svg', () => ({
  default: '📄',
  ReactComponent: () => '📄',
}));

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear();
  // Don't reset mockInvoke - let tests control their own implementation
  // mockInvoke.mockClear();
  // Note: Don't clear matchMedia mock as it's set up globally
});
