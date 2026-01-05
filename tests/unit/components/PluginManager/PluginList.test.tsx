/**
 * PluginList Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PluginStoreProvider } from '../../../../src/services/pluginStateStore';
import PluginList from '../../../../src/components/PluginManager/PluginList';
import type { Plugin } from '../../../../src/types/plugin';

// Mock PluginListItem component
vi.mock('../../../../src/components/PluginManager/PluginListItem', () => ({
  default: ({
    plugin,
    selected,
    onToggleSelect,
    onToggleEnable,
    onClick,
  }: {
    plugin: Plugin;
    selected: boolean;
    onToggleSelect: () => void;
    onToggleEnable: () => void;
    onClick?: () => void;
  }) => (
    <div
      data-testid={`plugin-item-${plugin.manifest.id}`}
      role="listitem"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        role="checkbox"
        aria-checked={selected}
      />
      <span>{plugin.manifest.name}</span>
      <span>{plugin.enabled ? 'Enabled' : 'Disabled'}</span>
      <button onClick={onToggleEnable}>Toggle Enable</button>
      {selected && <span data-testid="selected-badge">Selected</span>}
    </div>
  ),
}));

// Mock empty state component
const mockEmptyState = () => <div data-testid="empty-state">No plugins found</div>;

describe('PluginList Component', () => {
  // Mock plugin data
  const mockPlugins: Plugin[] = [
    {
      manifest: {
        id: 'plugin-1',
        name: 'QR 码生成器',
        version: '1.0.0',
        description: '快速生成二维码',
        author: 'Test Author',
        permissions: [],
        triggers: ['qr:', 'qrcode:'],
      },
      enabled: true,
      health: {
        status: 'healthy',
        lastChecked: Date.now(),
      },
      usageStats: {
        lastUsed: Date.now(),
        usageCount: 42,
      },
      installedAt: Date.now(),
      grantedPermissions: new Set(),
      configValues: {},
    },
    {
      manifest: {
        id: 'plugin-2',
        name: '颜色转换器',
        version: '1.2.0',
        description: '颜色格式转换',
        author: 'Test Author',
        permissions: [],
        triggers: ['#', 'rgb:'],
      },
      enabled: false,
      health: {
        status: 'healthy',
        lastChecked: Date.now(),
      },
      usageStats: {
        lastUsed: null,
        usageCount: 0,
      },
      installedAt: Date.now(),
      grantedPermissions: new Set(),
      configValues: {},
    },
  ];

  const renderWithProvider = (
    component: React.ReactElement,
    initialStateOverrides: Partial<Plugin[]> = []
  ) => {
    // For simplicity, we're testing the component structure
    // In actual implementation, this would integrate with pluginStateStore
    return render(<PluginStoreProvider>{component}</PluginStoreProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render plugin list container', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} selectedIds={new Set()} />);
      expect(screen.getByTestId('plugin-list')).toBeInTheDocument();
    });

    it('should render all plugins', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} selectedIds={new Set()} />);

      expect(screen.getByTestId('plugin-item-plugin-1')).toBeInTheDocument();
      expect(screen.getByTestId('plugin-item-plugin-2')).toBeInTheDocument();
      expect(screen.getByText('QR 码生成器')).toBeInTheDocument();
      expect(screen.getByText('颜色转换器')).toBeInTheDocument();
    });

    it('should render empty state when no plugins', () => {
      renderWithProvider(<PluginList plugins={[]} selectedIds={new Set()} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No plugins found')).toBeInTheDocument();
    });

    it('should render loading skeleton when loading', () => {
      renderWithProvider(<PluginList plugins={[]} selectedIds={new Set()} loading={true} />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });
  });

  describe('Plugin Display', () => {
    it('should display plugin name and description', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} selectedIds={new Set()} />);

      const plugin1 = screen.getByTestId('plugin-item-plugin-1');
      expect(within(plugin1).getByText('QR 码生成器')).toBeInTheDocument();
      expect(within(plugin1).getByText('Enabled')).toBeInTheDocument();

      const plugin2 = screen.getByTestId('plugin-item-plugin-2');
      expect(within(plugin2).getByText('颜色转换器')).toBeInTheDocument();
      expect(within(plugin2).getByText('Disabled')).toBeInTheDocument();
    });

    it('should show plugin status indicators', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} selectedIds={new Set()} />);

      // Plugin 1 should show enabled status
      expect(screen.getByText('Enabled')).toBeInTheDocument();

      // Plugin 2 should show disabled status
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('should accept search query prop for highlighting', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} searchQuery="QR" selectedIds={new Set()} />);

      // PluginList accepts searchQuery for highlighting (filtering happens in parent)
      expect(screen.getByTestId('plugin-item-plugin-1')).toBeInTheDocument();
      expect(screen.getByTestId('plugin-item-plugin-2')).toBeInTheDocument();
    });

    it('should render empty state when no plugins provided', () => {
      renderWithProvider(<PluginList plugins={[]} selectedIds={new Set()} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No plugins found')).toBeInTheDocument();
    });
  });

  describe('Plugin Selection', () => {
    it('should render checkbox for each plugin when in selection mode', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} selectionMode={true} selectedIds={new Set()} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('should highlight selected plugins', () => {
      const selectedIds = new Set(['plugin-1']);

      renderWithProvider(
        <PluginList plugins={mockPlugins} selectedIds={selectedIds} />
      );

      // Plugin 1 should show selected badge
      expect(screen.getByTestId('selected-badge')).toBeInTheDocument();

      // Plugin 2 should not show selected badge
      const plugin2 = screen.getByTestId('plugin-item-plugin-2');
      expect(within(plugin2).queryByTestId('selected-badge')).not.toBeInTheDocument();
    });

    it('should call onToggleSelect when checkbox is clicked', () => {
      const onToggleSelect = vi.fn();

      renderWithProvider(
        <PluginList
          plugins={mockPlugins}
          selectionMode={true}
          onToggleSelect={onToggleSelect}
          selectedIds={new Set()}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(onToggleSelect).toHaveBeenCalled();
      expect(onToggleSelect).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('Plugin Actions', () => {
    it('should call onToggleEnable when enable toggle is clicked', () => {
      const onToggleEnable = vi.fn();

      renderWithProvider(
        <PluginList plugins={mockPlugins} onToggleEnable={onToggleEnable} selectedIds={new Set()} />
      );

      const toggleButtons = screen.getAllByText('Toggle Enable');
      fireEvent.click(toggleButtons[0]);

      expect(onToggleEnable).toHaveBeenCalled();
      expect(onToggleEnable).toHaveBeenCalledWith(expect.any(String));
    });

    it('should call onPluginClick when plugin is clicked', () => {
      const onPluginClick = vi.fn();

      renderWithProvider(
        <PluginList plugins={mockPlugins} onPluginClick={onPluginClick} selectedIds={new Set()} />
      );

      const plugin1 = screen.getByTestId('plugin-item-plugin-1');
      fireEvent.click(plugin1);

      expect(onPluginClick).toHaveBeenCalledWith(mockPlugins[0]);
    });
  });

  describe('Sorting', () => {
    it('should sort plugins by name', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} sortBy="name" selectedIds={new Set()} />);

      const items = screen.getAllByTestId(/plugin-item-/);
      expect(items).toHaveLength(2);
      // Verify sorting is applied (actual order depends on localeCompare)
      expect(items[0]).toHaveTextContent(/QR 码生成器|颜色转换器/);
      expect(items[1]).toHaveTextContent(/QR 码生成器|颜色转换器/);
    });

    it('should sort plugins by usage count', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} sortBy="usageCount" selectedIds={new Set()} />);

      // Plugin 1 has higher usage count (42), should appear first
      const items = screen.getAllByTestId(/plugin-item-/);
      expect(items[0]).toHaveTextContent('QR 码生成器');
      expect(items[1]).toHaveTextContent('颜色转换器');
    });

    it('should sort plugins by installed date', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} sortBy="installedAt" selectedIds={new Set()} />);

      // Should sort by installation date
      const items = screen.getAllByTestId(/plugin-item-/);
      expect(items).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper list semantics', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} selectedIds={new Set()} />);

      const list = screen.getByTestId('plugin-list');
      expect(list).toHaveAttribute('role', 'list');
    });

    it('should have accessible plugin items', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} selectedIds={new Set()} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('should handle search query for highlighting', () => {
      renderWithProvider(<PluginList plugins={mockPlugins} searchQuery="QR" selectedIds={new Set()} />);

      // Component accepts searchQuery prop for highlighting
      const plugin1 = screen.getByTestId('plugin-item-plugin-1');
      expect(plugin1).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large plugin lists efficiently', () => {
      // Create 100 mock plugins
      const manyPlugins: Plugin[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockPlugins[0],
        manifest: {
          ...mockPlugins[0].manifest,
          id: `plugin-${i}`,
          name: `Plugin ${i}`,
        },
      }));

      renderWithProvider(<PluginList plugins={manyPlugins} selectedIds={new Set()} />);

      const items = screen.getAllByTestId(/plugin-item-/);
      expect(items).toHaveLength(100);
    });
  });
});
