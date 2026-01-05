/**
 * Tauri API Mocks
 * Mock implementations for Tauri commands and APIs
 */

import { vi } from 'vitest';

// Mock invoke function that can be configured in tests
export const mockInvoke = vi.fn();

// Tauri core API mock
export const tauriCoreMock = {
  invoke: mockInvoke,
};

// Helper to set up mock responses
export function setupMockInvoke(response: any) {
  mockInvoke.mockResolvedValue(response);
}

// Helper to set up mock errors
export function setupMockInvokeError(message: string) {
  mockInvoke.mockRejectedValue(new Error(message));
}

// Mock app data
export const mockApps = [
  {
    id: '1',
    name: 'Visual Studio Code',
    executablePath: '/usr/bin/code',
    icon: '📝',
    usageCount: 45,
  },
  {
    id: '2',
    name: 'Chrome',
    executablePath: '/usr/bin/google-chrome',
    icon: '🌐',
    usageCount: 120,
  },
  {
    id: '3',
    name: 'Finder',
    executablePath: '/usr/bin/finder',
    icon: '📁',
    usageCount: 89,
  },
  {
    id: '4',
    name: 'Terminal',
    executablePath: '/usr/bin/terminal',
    icon: '⌨️',
    usageCount: 67,
  },
];

// Mock clipboard data
export const mockClipboardItems = [
  {
    id: 'clip-1',
    content: 'Sample clipboard text',
    timestamp: Date.now() - 1000000,
    is_sensitive: false,
  },
  {
    id: 'clip-2',
    content: 'password: secret123',
    timestamp: Date.now() - 500000,
    is_sensitive: true,
  },
];

// Mock file data
export const mockFiles = [
  {
    id: 'file-1',
    filename: 'document.pdf',
    path: '/Users/test/Documents/document.pdf',
    extension: 'pdf',
    size: 1024000,
    indexed: Date.now(),
  },
  {
    id: 'file-2',
    filename: 'image.png',
    path: '/Users/test/Pictures/image.png',
    extension: 'png',
    size: 512000,
    indexed: Date.now(),
  },
];

// Mock browser data
export const mockBrowserData = [
  {
    id: 'bookmark-1',
    title: 'GitHub',
    url: 'https://github.com',
    browser: 'Chrome',
    entry_type: 'bookmark',
    favicon: '📦',
    last_visited: Date.now() - 86400000,
  },
  {
    id: 'history-1',
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    browser: 'Chrome',
    entry_type: 'history',
    favicon: '📚',
    last_visited: Date.now() - 3600000,
  },
];
