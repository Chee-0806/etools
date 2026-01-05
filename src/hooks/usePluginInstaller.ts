/**
 * usePluginInstaller Hook
 * Handles plugin installation logic and API calls
 */

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { PackageValidation, ExtractionResult } from '@/types/plugin';

export interface InstallState {
  isInstalling: boolean;
  progress: { stage: string; progress: number };
  error: string | null;
}

/**
 * Response from cancel installation command
 */
export interface CancelInstallResponse {
  success: boolean;
  message?: string;
}

export const usePluginInstaller = () => {
  const [state, setState] = useState<InstallState>({
    isInstalling: false,
    progress: { stage: '', progress: 0 },
    error: null,
  });

  const installFromFile = useCallback(async (file: File): Promise<boolean> => {
    try {
      setState({ isInstalling: true, progress: { stage: 'validating', progress: 10 }, error: null });

      // For web-based file upload in Tauri, we need to read the file as ArrayBuffer
      // and pass it to the backend
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Validate package
      setState({ isInstalling: true, progress: { stage: 'validating', progress: 20 }, error: null });
      const validation = await invoke<PackageValidation>('plugin_validate_package_from_buffer', {
        buffer: Array.from(uint8Array),
        fileName: file.name,
        source: 'file'
      });

      if (!validation.isValid) {
        setState({
          isInstalling: false,
          progress: { stage: '', progress: 0 },
          error: validation.errors.map(e => e.message || e).join(', ') || 'Validation failed'
        });
        return false;
      }

      setState({ isInstalling: true, progress: { stage: 'extracting', progress: 40 }, error: null });

      // Extract package
      const extraction = await invoke<ExtractionResult>('plugin_extract_package_from_buffer', {
        buffer: Array.from(uint8Array),
        fileName: file.name,
      });

      setState({ isInstalling: true, progress: { stage: 'installing', progress: 70 }, error: null });

      // Install plugin
      await invoke('plugin_install', {
        extractedPath: extraction.path,
        pluginId: extraction.manifest.id,
        permissions: extraction.manifest.permissions || [],
        autoEnable: false
      });

      setState({
        isInstalling: false,
        progress: { stage: 'complete', progress: 100 },
        error: null
      });

      return true;
    } catch (err) {
      setState({
        isInstalling: false,
        progress: { stage: '', progress: 0 },
        error: err instanceof Error ? err.message : String(err)
      });
      return false;
    }
  }, []);

  const getInstallStatus = useCallback(async (installId: string) => {
    try {
      const status = await invoke('plugin_get_install_status', { installId });
      return status;
    } catch (err) {
      return {
        installId,
        stage: 'error',
        progress: 0,
        message: err instanceof Error ? err.message : String(err)
      };
    }
  }, []);

  const cancelInstallation = useCallback(async (installId: string) => {
    try {
      const response = await invoke<CancelInstallResponse>('plugin_cancel_install', {
        installId,
        cleanup: true
      });

      if (response.success) {
        setState({
          isInstalling: false,
          progress: { stage: '', progress: 0 },
          error: null
        });
      }

      return response;
    } catch (err) {
      setState({
        isInstalling: false,
        progress: { stage: '', progress: 0 },
        error: err instanceof Error ? err.message : String(err)
      });
      return undefined;
    }
  }, []);

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    installFromFile,
    getInstallStatus,
    cancelInstallation,
    resetError,
  };
};
