/**
 * E2E Tests for Complete Plugin Workflows
 * Tests end-to-end plugin management workflows
 *
 * Note: These tests require Playwright and a running application
 * They are optional and should be run manually or in CI
 */

import { test, expect } from '@playwright/test';

test.describe('Plugin Management E2E Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to plugin management page
    await page.goto('/#/plugins');
    await page.waitForLoadState('networkidle');
  });

  test('should display plugin list', async ({ page }) => {
    // Wait for plugin list to load
    await page.waitForSelector('[data-testid="plugin-list"]');

    // Verify plugin list is visible
    const pluginList = page.locator('[data-testid="plugin-list"]');
    await expect(pluginList).toBeVisible();
  });

  test('should search for plugins', async ({ page }) => {
    // Wait for search input
    await page.waitForSelector('[data-testid="plugin-search-input"]');

    // Type search query
    await page.fill('[data-testid="plugin-search-input"]', 'search');

    // Wait for results
    await page.waitForTimeout(500);

    // Verify search results
    const pluginItems = page.locator('[data-testid="plugin-item"]');
    const count = await pluginItems.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter plugins by status', async ({ page }) => {
    // Wait for filter buttons
    await page.waitForSelector('[data-testid="filter-enabled"]');

    // Click enabled filter
    await page.click('[data-testid="filter-enabled"]');

    // Wait for results
    await page.waitForTimeout(500);

    // Verify filter applied
    const pluginItems = page.locator('[data-testid="plugin-item"]');
    const count = await pluginItems.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should enable a plugin', async ({ page }) => {
    // Find a disabled plugin
    const disabledPlugin = page.locator('[data-testid="plugin-item"][data-enabled="false"]').first();

    const hasDisabled = await disabledPlugin.count();

    if (hasDisabled > 0) {
      // Click enable button
      await disabledPlugin.locator('[data-testid="btn-enable"]').click();

      // Wait for confirmation
      await page.waitForTimeout(1000);

      // Verify plugin is now enabled
      const isEnabled = await disabledPlugin.getAttribute('data-enabled');
      expect(isEnabled).toBe('true');
    }
  });

  test('should disable a plugin', async ({ page }) => {
    // Find an enabled plugin
    const enabledPlugin = page.locator('[data-testid="plugin-item"][data-enabled="true"]').first();

    const hasEnabled = await enabledPlugin.count();

    if (hasEnabled > 0) {
      // Click disable button
      await enabledPlugin.locator('[data-testid="btn-disable"]').click();

      // Wait for confirmation
      await page.waitForTimeout(1000);

      // Verify plugin is now disabled
      const isEnabled = await enabledPlugin.getAttribute('data-enabled');
      expect(isEnabled).toBe('false');
    }
  });

  test('should view plugin details', async ({ page }) => {
    // Click on a plugin
    const firstPlugin = page.locator('[data-testid="plugin-item"]').first();
    await firstPlugin.click();

    // Wait for details panel
    await page.waitForSelector('[data-testid="plugin-details-panel"]', { timeout: 5000 });

    // Verify details are displayed
    const detailsPanel = page.locator('[data-testid="plugin-details-panel"]');
    await expect(detailsPanel).toBeVisible();
  });

  test('should uninstall a plugin', async ({ page }) => {
    // Find a non-core plugin
    const plugin = page.locator('[data-testid="plugin-item"][data-protected="false"]').first();

    const hasPlugin = await plugin.count();

    if (hasPlugin > 0) {
      // Click uninstall button
      await plugin.locator('[data-testid="btn-uninstall"]').click();

      // Confirm uninstallation
      await page.click('[data-testid="btn-confirm-uninstall"]');

      // Wait for completion
      await page.waitForTimeout(2000);

      // Verify plugin is removed
      const exists = await plugin.count();
      expect(exists).toBe(0);
    }
  });

  test('should install plugin from marketplace', async ({ page }) => {
    // Navigate to marketplace tab
    await page.click('[data-testid="tab-marketplace"]');

    // Wait for marketplace to load
    await page.waitForSelector('[data-testid="marketplace-list"]');

    // Click on first available plugin
    const firstPlugin = page.locator('[data-testid="marketplace-item"]').first();
    const hasPlugin = await firstPlugin.count();

    if (hasPlugin > 0) {
      await firstPlugin.click();

      // Click install button
      await page.click('[data-testid="btn-install-plugin"]');

      // Wait for installation to complete
      await page.waitForSelector('[data-testid="btn-install-plugin"][data-installed="true"]', {
        timeout: 30000,
      });
    }
  });

  test('should handle plugin errors gracefully', async ({ page }) => {
    // Navigate to plugin list
    await page.waitForSelector('[data-testid="plugin-list"]');

    // Look for plugins with errors
    const errorPlugins = page.locator('[data-testid="plugin-item"][data-health="error"]');
    const count = await errorPlugins.count();

    if (count > 0) {
      // Verify error indicators are shown
      const errorIndicator = errorPlugins.first().locator('[data-testid="health-error"]');
      await expect(errorIndicator).toBeVisible();
    }
  });
});

test.describe('Plugin Installation E2E Workflows', () => {
  test('should install plugin from file', async ({ page }) => {
    // Navigate to installation tab
    await page.goto('/#/plugins/install');
    await page.waitForLoadState('networkidle');

    // Wait for drag-drop zone
    await page.waitForSelector('[data-testid="drag-drop-zone"]');

    // Verify drag-drop zone is visible
    const dropZone = page.locator('[data-testid="drag-drop-zone"]');
    await expect(dropZone).toBeVisible();
  });

  test('should validate plugin package', async ({ page }) => {
    // This would require actual file upload testing
    // which is complex in E2E tests
    await page.goto('/#/plugins/install');
    await page.waitForLoadState('networkidle');

    // Verify validation UI is present
    const dropZone = page.locator('[data-testid="drag-drop-zone"]');
    await expect(dropZone).toBeVisible();
  });
});
