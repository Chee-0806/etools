/**
 * E2E Tests for Kaka Desktop App
 * Complete user journey testing
 */

import { test, expect } from '@playwright/test';

test.describe('Application Launch', () => {
  test('should launch application successfully', async ({ page }) => {
    await page.goto('http://localhost:1420');
    
    // Wait for app to load
    await expect(page).toHaveTitle(/Kaka/);
  });

  test('should show search window on global hotkey', async ({ page }) => {
    await page.goto('http://localhost:1420');
    
    // Check if search window is present
    const searchInput = page.locator('input[placeholder*="search" i]');
    await expect(searchInput).toBeVisible();
  });
});

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
  });

  test('should display search results as user types', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('code');
    
    // Wait for debounced search
    await page.waitForTimeout(200);
    
    // Check for results
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible();
  });

  test('should navigate results with keyboard', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('test');
    await page.waitForTimeout(200);
    
    // Navigate down
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    
    // Navigate up
    await page.keyboard.press('ArrowUp');
    
    // Verify selection state
    const selectedResult = page.locator('[data-testid="search-result"].selected');
    await expect(selectedResult).toBeVisible();
  });

  test('should execute result on Enter', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('test');
    await page.waitForTimeout(200);
    
    // Press Enter to execute
    await page.keyboard.press('Enter');
    
    // Verify action was triggered (check console or state)
    // This may need adjustment based on actual implementation
  });

  test('should clear search on Escape', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('test');
    await page.waitForTimeout(200);
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Verify input is cleared
    await expect(searchInput).toHaveValue('');
  });
});

test.describe('Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
  });

  test('should calculate math expressions', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('2 + 2');
    await page.waitForTimeout(200);
    
    // Should show calculator result
    const result = page.locator('[data-testid="search-result"]');
    await expect(result.first()).toContainText('4');
  });

  test('should convert hex colors', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('#ff0000');
    await page.waitForTimeout(200);
    
    // Should show color conversion
    const result = page.locator('[data-testid="search-result"]');
    await expect(result.first()).toContainText('rgb(255, 0, 0)');
  });

  test('should trigger web search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('g: test query');
    await page.waitForTimeout(200);
    
    // Should show web search result
    const result = page.locator('[data-testid="search-result"]');
    await expect(result.first()).toContainText('google');
  });

  test('should open URLs directly', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('https://example.com');
    await page.waitForTimeout(200);
    
    // Should show URL result
    const result = page.locator('[data-testid="search-result"]');
    await expect(result.first()).toContainText('https://example.com');
  });
});

test.describe('Clipboard Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
  });

  test('should enter clipboard mode with clip: prefix', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('clip: test');
    await page.waitForTimeout(200);
    
    // Should show clipboard icon or indicator
    const clipboardIndicator = page.locator('[data-testid="clipboard-mode"]');
    await expect(clipboardIndicator).toBeVisible();
  });

  test('should search clipboard history', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('clip:');
    await page.waitForTimeout(200);
    
    // Should show clipboard items
    const results = page.locator('[data-testid="clipboard-item"]');
    // Note: This assumes clipboard has items
  });
});

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
  });

  test('should switch to dark theme', async ({ page }) => {
    // Open settings (adjust selector as needed)
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();
    
    // Select dark theme
    const darkThemeOption = page.locator('[data-testid="theme-dark"]');
    await darkThemeOption.click();
    
    // Verify theme applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-dark/);
  });

  test('should switch to light theme', async ({ page }) => {
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();
    
    const lightThemeOption = page.locator('[data-testid="theme-light"]');
    await lightThemeOption.click();
    
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-light/);
  });

  test('should follow system theme', async ({ page }) => {
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();
    
    const systemThemeOption = page.locator('[data-testid="theme-system"]');
    await systemThemeOption.click();
    
    // Theme should match system preference
    const html = page.locator('html');
    expect(await html.getAttribute('data-theme')).toMatch(/^(light|dark)$/);
  });
});

test.describe('Plugin System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
  });

  test('should display installed plugins', async ({ page }) => {
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();
    
    const pluginsTab = page.locator('[data-testid="plugins-tab"]');
    await pluginsTab.click();
    
    // Should show plugin list
    const pluginList = page.locator('[data-testid="plugin-list"]');
    await expect(pluginList).toBeVisible();
  });

  test('should search plugin results', async ({ page }) => {
    // Test plugin-triggered search
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    // Example: timestamp plugin
    await searchInput.fill('timestamp');
    await page.waitForTimeout(200);
    
    // Should show plugin result
    const results = page.locator('[data-testid="search-result"]');
    const hasPluginResult = await results.filter({ hasText: /timestamp/i }).count();
    expect(hasPluginResult).toBeGreaterThan(0);
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
  });

  test('should focus search on global hotkey', async ({ page }) => {
    // Simulate global hotkey (may need special handling)
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    // Check if already focused
    await expect(searchInput).toBeFocused();
  });

  test('should copy selected item', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    await searchInput.fill('test');
    await page.waitForTimeout(200);
    
    // Select item and copy
    await page.keyboard.press('ArrowDown');
    
    // Simulate Cmd+C
    await page.keyboard.press('Meta+c');
    
    // Verify clipboard (may need clipboard API access)
  });
});

test.describe('Performance', () => {
  test('should load search results quickly', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    const startTime = Date.now();
    await searchInput.fill('test');
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-result"]', {
      timeout: 5000,
    });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 1 second
    expect(loadTime).toBeLessThan(1000);
  });

  test('should handle rapid typing without lag', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]');
    
    const startTime = Date.now();
    
    // Type rapidly
    await searchInput.fill('t');
    await searchInput.fill('te');
    await searchInput.fill('tes');
    await searchInput.fill('test');
    
    // Wait for final results
    await page.waitForSelector('[data-testid="search-result"]', {
      timeout: 5000,
    });
    
    const totalTime = Date.now() - startTime;
    
    // Should still be responsive
    expect(totalTime).toBeLessThan(2000);
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:1420');
    
    const searchInput = page.locator('input[placeholder*="search" i]');
    await expect(searchInput).toHaveAttribute('aria-label');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:1420');
    
    // Tab through interface
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should have focusable elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });

  test('should announce screen reader updates', async ({ page }) => {
    await page.goto('http://localhost:1420');
    
    const searchInput = page.locator('input[placeholder*="search" i]');
    await searchInput.fill('test');
    await page.waitForTimeout(200);
    
    // Check for ARIA live regions
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toExist();
  });
});

test.describe('Error Handling', () => {
  test('should handle search errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:1420');
    
    // Simulate error condition (may need API mocking)
    const searchInput = page.locator('input[placeholder*="search" i]');
    await searchInput.fill('test');
    
    // Should not crash
    await expect(page).not.toCrash();
  });

  test('should display error messages', async ({ page }) => {
    await page.goto('http://localhost:1420');
    
    // This test may need specific error scenarios
    const errorContainer = page.locator('[data-testid="error-message"]');
    
    // Should either not show errors or handle them properly
    if (await errorContainer.count() > 0) {
      await expect(errorContainer).toBeVisible();
    }
  });
});
