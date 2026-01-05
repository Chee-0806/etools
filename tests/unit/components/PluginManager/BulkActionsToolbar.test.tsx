/**
 * BulkActionsToolbar Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PluginStoreProvider, usePluginDispatch } from '../../../../src/services/pluginStateStore';
import BulkActionsToolbar from '../../../../src/components/PluginManager/BulkActionsToolbar';

describe('BulkActionsToolbar Component', () => {
  const mockOnOperationComplete = vi.fn();

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<PluginStoreProvider>{component}</PluginStoreProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    global.confirm = vi.fn(() => true);
  });

  describe('Rendering', () => {
    it('should render the toolbar', () => {
      renderWithProvider(
        <BulkActionsToolbar
          totalFiltered={10}
          filteredPluginIds={['plugin-1', 'plugin-2']}
          onOperationComplete={mockOnOperationComplete}
        />
      );

      expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument();
    });

    it('should display no selection message initially', () => {
      renderWithProvider(
        <BulkActionsToolbar totalFiltered={10} />
      );

      expect(screen.getByText('未选择插件')).toBeInTheDocument();
    });

    it('should show select all button when no plugins selected', () => {
      renderWithProvider(
        <BulkActionsToolbar
          totalFiltered={10}
          filteredPluginIds={['plugin-1', 'plugin-2', 'plugin-3']}
        />
      );

      expect(screen.getByTitle('选择所有可见插件')).toBeInTheDocument();
    });
  });

  describe('With Selection', () => {
    it('should display selected count', () => {
      const TestWrapper = () => {
        const dispatch = usePluginDispatch();
        // Simulate selection
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-1' });
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-2' });

        return (
          <BulkActionsToolbar
            totalFiltered={10}
            filteredPluginIds={['plugin-1', 'plugin-2', 'plugin-3']}
          />
        );
      };

      renderWithProvider(<TestWrapper />);

      expect(screen.getByText(/已选择 \d+ 个插件/)).toBeInTheDocument();
    });

    it('should render bulk enable button', () => {
      const TestWrapper = () => {
        const dispatch = usePluginDispatch();
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-1' });

        return (
          <BulkActionsToolbar
            totalFiltered={10}
            filteredPluginIds={['plugin-1', 'plugin-2']}
          />
        );
      };

      renderWithProvider(<TestWrapper />);

      expect(screen.getByText('批量启用')).toBeInTheDocument();
    });

    it('should render bulk disable button', () => {
      const TestWrapper = () => {
        const dispatch = usePluginDispatch();
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-1' });

        return (
          <BulkActionsToolbar
            totalFiltered={10}
            filteredPluginIds={['plugin-1', 'plugin-2']}
          />
        );
      };

      renderWithProvider(<TestWrapper />);

      expect(screen.getByText('批量禁用')).toBeInTheDocument();
    });

    it('should render bulk uninstall button', () => {
      const TestWrapper = () => {
        const dispatch = usePluginDispatch();
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-1' });

        return (
          <BulkActionsToolbar
            totalFiltered={10}
            filteredPluginIds={['plugin-1', 'plugin-2']}
          />
        );
      };

      renderWithProvider(<TestWrapper />);

      expect(screen.getByText('批量卸载')).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      const TestWrapper = () => {
        const dispatch = usePluginDispatch();
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-1' });

        return (
          <BulkActionsToolbar
            totalFiltered={10}
            filteredPluginIds={['plugin-1', 'plugin-2']}
          />
        );
      };

      renderWithProvider(<TestWrapper />);

      expect(screen.getByTitle('取消选择')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should clear selection when cancel clicked', () => {
      const TestWrapper = () => {
        const dispatch = usePluginDispatch();
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-1' });

        return (
          <BulkActionsToolbar
            totalFiltered={10}
            filteredPluginIds={['plugin-1', 'plugin-2']}
          />
        );
      };

      renderWithProvider(<TestWrapper />);

      const cancelButton = screen.getByTitle('取消选择');
      fireEvent.click(cancelButton);

      // Selection should be cleared
      waitFor(() => {
        expect(screen.getByText('未选择插件')).toBeInTheDocument();
      });
    });

    it('should show confirmation when bulk uninstall clicked', () => {
      const TestWrapper = () => {
        const dispatch = usePluginDispatch();
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-1' });
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-2' });
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-3' });

        return (
          <BulkActionsToolbar
            totalFiltered={10}
            filteredPluginIds={['plugin-1', 'plugin-2', 'plugin-3']}
          />
        );
      };

      renderWithProvider(<TestWrapper />);

      const uninstallButton = screen.getByText('批量卸载');
      fireEvent.click(uninstallButton);

      expect(global.confirm).toHaveBeenCalledWith(expect.stringContaining('确定要卸载选中的'));
    });

    it('should not call uninstall when confirmation cancelled', () => {
      vi.mocked(global.confirm).mockReturnValueOnce(false);

      const TestWrapper = () => {
        const dispatch = usePluginDispatch();
        dispatch({ type: 'TOGGLE_SELECTION', payload: 'plugin-1' });

        return (
          <BulkActionsToolbar
            totalFiltered={10}
            filteredPluginIds={['plugin-1', 'plugin-2']}
          />
        );
      };

      renderWithProvider(<TestWrapper />);

      const uninstallButton = screen.getByText('批量卸载');
      fireEvent.click(uninstallButton);

      expect(global.confirm).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper titles on buttons for tooltips', () => {
      renderWithProvider(
        <BulkActionsToolbar
          totalFiltered={10}
          filteredPluginIds={['plugin-1', 'plugin-2']}
        />
      );

      expect(screen.getByTitle('选择所有可见插件')).toBeInTheDocument();
    });

    it('should have proper CSS classes', () => {
      const { container } = renderWithProvider(
        <BulkActionsToolbar totalFiltered={10} />
      );

      const toolbar = container.querySelector('.bulk-actions-toolbar');
      expect(toolbar).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero plugins available', () => {
      renderWithProvider(
        <BulkActionsToolbar totalFiltered={0} />
      );

      expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument();
    });

    it('should handle empty filtered plugin IDs', () => {
      renderWithProvider(
        <BulkActionsToolbar
          totalFiltered={10}
          filteredPluginIds={[]}
        />
      );

      expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument();
    });
  });
});
