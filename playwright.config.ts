/**
 * E2E Test Configuration for Playwright
 * Tests the complete application flow from user perspective
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Tauri apps should run tests sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for desktop app
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'Desktop App',
      use: {
        // Tauri app will be launched before tests
        launchOptions: {
          args: ['--no-sandbox'],
        },
      },
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run tauri dev',
    url: 'http://localhost:1420',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
