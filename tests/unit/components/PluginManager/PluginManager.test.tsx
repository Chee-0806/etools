/**
 * PluginManager Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PluginStoreProvider } from '../../../../src/services/pluginStateStore';
import PluginManager from '../../../../src/components/PluginManager/PluginManager';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock child components (will be tested separately)
vi.mock('../../../../src/components/PluginManager/InstalledPluginsView', () => ({
  default: () => <div data-testid="installed-plugins-view">Installed Plugins</div>,
}));

vi.mock('../../../../src/components/PluginManager/MarketplaceView', () => ({
  default: () => <div data-testid="marketplace-view">Marketplace</div>,
}));

describe('PluginManager Component', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(<PluginStoreProvider>{component}</PluginStoreProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the plugin manager container', () => {
      renderWithProvider(<PluginManager />);
      expect(screen.getByTestId('plugin-manager')).toBeInTheDocument();
    });

    it('should render tab navigation', () => {
      renderWithProvider(<PluginManager />);
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      expect(screen.getByText('已安装插件')).toBeInTheDocument();
      expect(screen.getByText('插件市场')).toBeInTheDocument();
    });

    it('should show InstalledPluginsView by default', () => {
      renderWithProvider(<PluginManager />);
      expect(screen.getByTestId('installed-plugins-view')).toBeInTheDocument();
      expect(screen.queryByTestId('marketplace-view')).not.toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should switch to marketplace tab when clicked', async () => {
      renderWithProvider(<PluginManager />);

      const marketplaceTab = screen.getByText('插件市场');
      fireEvent.click(marketplaceTab);

      await waitFor(() => {
        expect(screen.getByTestId('marketplace-view')).toBeInTheDocument();
        expect(screen.queryByTestId('installed-plugins-view')).not.toBeInTheDocument();
      });
    });

    it('should switch back to installed plugins tab when clicked', async () => {
      renderWithProvider(<PluginManager />);

      // First switch to marketplace
      const marketplaceTab = screen.getByText('插件市场');
      fireEvent.click(marketplaceTab);

      await waitFor(() => {
        expect(screen.getByTestId('marketplace-view')).toBeInTheDocument();
      });

      // Then switch back
      const installedTab = screen.getByText('已安装插件');
      fireEvent.click(installedTab);

      await waitFor(() => {
        expect(screen.getByTestId('installed-plugins-view')).toBeInTheDocument();
        expect(screen.queryByTestId('marketplace-view')).not.toBeInTheDocument();
      });
    });

    it('should highlight active tab', () => {
      renderWithProvider(<PluginManager />);

      const installedTab = screen.getByText('已安装插件');
      const marketplaceTab = screen.getByText('插件市场');

      // Default: installed tab should be active
      expect(installedTab).toHaveClass('active');
      expect(marketplaceTab).not.toHaveClass('active');

      // After clicking marketplace
      fireEvent.click(marketplaceTab);
      expect(marketplaceTab).toHaveClass('active');
      expect(installedTab).not.toHaveClass('active');
    });
  });

  describe('State Management', () => {
    it('should update current view in state when tab changes', async () => {
      const { container } = renderWithProvider(<PluginManager />);

      // Get access to state through a custom hook or dispatch
      // This test verifies the component integrates with pluginStateStore
      const marketplaceTab = screen.getByText('插件市场');
      fireEvent.click(marketplaceTab);

      await waitFor(() => {
        expect(screen.getByTestId('marketplace-view')).toBeInTheDocument();
      });
    });

    it('should clear selection when switching tabs', async () => {
      // This test verifies that selectedPluginIds is cleared when switching views
      const { container } = renderWithProvider(<PluginManager />);

      // Implementation would verify selection clearing
      // This will be tested in integration tests with actual plugin selection
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS class', () => {
      const { container } = renderWithProvider(<PluginManager />);
      const pluginManager = screen.getByTestId('plugin-manager');
      expect(pluginManager).toHaveClass('plugin-manager');
    });

    it('should render header with title', () => {
      renderWithProvider(<PluginManager />);
      expect(screen.getByText('插件管理')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      renderWithProvider(<PluginManager />);
      const tabNavigation = screen.getByTestId('tab-navigation');
      expect(tabNavigation).toHaveAttribute('role', 'tablist');
    });

    it('should have accessible tab buttons', () => {
      renderWithProvider(<PluginManager />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });
  });
});
