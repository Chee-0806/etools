/**
 * Integration Test for Drag-Drop Plugin Installation
 * Tests the complete drag-and-drop installation workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePluginInstaller } from '@/hooks/usePluginInstaller';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('Drag-Drop Installation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Installation', () => {
    it('should accept valid plugin package files', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File(['test content'], 'test-plugin.zip', {
        type: 'application/zip',
      });

      // Mock successful validation and installation
      (invoke as any)
        .mockResolvedValueOnce({
          isValid: true,
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({ success: true });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(success).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.isInstalling).toBe(false);
        expect(result.current.progress.progress).toBe(100);
      });
    });

    it('should reject files with validation errors', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'invalid-plugin.zip', {
        type: 'application/zip',
      });

      // Mock validation failure
      (invoke as any).mockResolvedValue({
        isValid: false,
        errors: [{ message: 'Invalid manifest format' }, { message: 'Missing required fields' }]
      });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(success).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.error).toContain('Invalid manifest format');
        expect(result.current.isInstalling).toBe(false);
      });
    });

    it('should handle installation errors', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      // Mock validation success but installation failure
      (invoke as any)
        .mockResolvedValueOnce({
          isValid: true,
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockRejectedValueOnce(new Error('Failed to extract plugin files'));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(success).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.error).toContain('Failed to extract plugin files');
        expect(result.current.isInstalling).toBe(false);
      });
    });
  });

  describe('Installation Progress', () => {
    it('should track installation progress through stages', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      // Mock successful installation
      (invoke as any)
        .mockImplementationOnce(() => new Promise(resolve =>
          setTimeout(() => resolve({
            isValid: true,
            manifest: { id: 'test-plugin', name: 'Test Plugin' }
          }), 10)
        ))
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({ success: true });

      act(() => {
        result.current.installFromFile(mockFile);
      });

      // Should be in validating stage
      await waitFor(() => {
        expect(result.current.isInstalling).toBe(true);
        expect(result.current.progress.stage).toBe('validating');
      });

      // Should complete
      await waitFor(() => {
        expect(result.current.isInstalling).toBe(false);
        expect(result.current.progress.stage).toBe('complete');
        expect(result.current.progress.progress).toBe(100);
      });
    });

    it('should report progress percentages', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any)
        .mockResolvedValueOnce({
          isValid: true,
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(result.current.progress.progress).toBe(100);
      });
    });
  });

  describe('Error Handling', () => {
    it('should allow retry after error', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      // First attempt fails, second succeeds
      (invoke as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          isValid: true,
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({ success: true });

      // First attempt
      let success1: boolean | undefined;
      await act(async () => {
        success1 = await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(success1).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.error).toContain('Network error');
      });

      // Clear error
      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBeNull();

      // Second attempt
      let success2: boolean | undefined;
      await act(async () => {
        success2 = await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(success2).toBe(true);
        expect(result.current.error).toBeNull();
      });
    });

    it('should reset error state', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any).mockRejectedValue(new Error('Installation failed'));

      await act(async () => {
        await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Installation Success', () => {
    it('should complete installation with success state', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any)
        .mockResolvedValueOnce({
          isValid: true,
          manifest: { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' }
        })
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' }
        })
        .mockResolvedValueOnce({ success: true });

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(success).toBe(true);
        expect(result.current.isInstalling).toBe(false);
        expect(result.current.progress.stage).toBe('complete');
        expect(result.current.progress.progress).toBe(100);
        expect(result.current.error).toBeNull();
      });
    });

    it('should reset to initial state after completion', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any)
        .mockResolvedValueOnce({
          isValid: true,
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(result.current.isInstalling).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Validation Integration', () => {
    it('should validate package before installation', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any)
        .mockResolvedValue({
          isValid: true,
          manifest: {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            description: 'A test plugin',
            author: 'Test Author',
            permissions: ['clipboard:read'],
            entry: 'index.ts',
            triggers: []
          }
        })
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith(
          'plugin_validate_package_from_buffer',
          expect.objectContaining({
            fileName: 'test-plugin.zip',
            source: 'file'
          })
        );
      });
    });

    it('should extract package after validation', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any)
        .mockResolvedValueOnce({
          isValid: true,
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            permissions: ['clipboard:read']
          }
        })
        .mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith(
          'plugin_extract_package_from_buffer',
          expect.objectContaining({
            fileName: 'test-plugin.zip'
          })
        );
      });
    });

    it('should install plugin with correct parameters', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any)
        .mockResolvedValueOnce({
          isValid: true,
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: {
            id: 'test-plugin',
            name: 'Test Plugin',
            permissions: ['clipboard:read', 'network']
          }
        })
        .mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith(
          'plugin_install',
          expect.objectContaining({
            extractedPath: '/tmp/test-plugin',
            pluginId: 'test-plugin',
            permissions: ['clipboard:read', 'network'],
            autoEnable: false
          })
        );
      });
    });
  });

  describe('User Feedback', () => {
    it('should provide clear success indication', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any)
        .mockResolvedValueOnce({
          isValid: true,
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({
          path: '/tmp/test-plugin',
          manifest: { id: 'test-plugin', name: 'Test Plugin' }
        })
        .mockResolvedValueOnce({ success: true });

      await act(async () => {
        await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(result.current.progress.stage).toBe('complete');
        expect(result.current.progress.progress).toBe(100);
        expect(result.current.error).toBeNull();
        expect(result.current.isInstalling).toBe(false);
      });
    });

    it('should provide clear error messages', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'test-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any).mockRejectedValue(
        new Error('Installation failed: insufficient permissions')
      );

      await act(async () => {
        await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Installation failed');
        expect(result.current.error).toContain('insufficient permissions');
        expect(result.current.isInstalling).toBe(false);
      });
    });

    it('should show validation errors in error message', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const { result } = renderHook(() => usePluginInstaller());

      const mockFile = new File([''], 'invalid-plugin.zip', {
        type: 'application/zip',
      });

      (invoke as any).mockResolvedValue({
        isValid: false,
        errors: [
          { message: 'Missing required field: name' },
          { message: 'Invalid version format' }
        ]
      });

      await act(async () => {
        await result.current.installFromFile(mockFile);
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Missing required field: name');
        expect(result.current.error).toContain('Invalid version format');
        expect(result.current.isInstalling).toBe(false);
      });
    });
  });
});
