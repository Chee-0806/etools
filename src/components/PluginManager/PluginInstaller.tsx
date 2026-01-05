/**
 * PluginInstaller Component
 * Main plugin installation interface with drag-and-drop support
 */

import React from 'react';
import { usePluginInstaller } from '../../hooks/usePluginInstaller';
import { DragDropZone } from '../ui/DragDropZone';
import './PluginInstaller.css';

interface PluginInstallerProps {
  /**
   * Callback when installation succeeds
   */
  onSuccess?: () => void;
}

export const PluginInstaller: React.FC<PluginInstallerProps> = ({ onSuccess }) => {
  const { isInstalling, progress, error, installFromFile, resetError } = usePluginInstaller();

  const handleFileDrop = async (files: File[]) => {
    if (files.length > 0) {
      const success = await installFromFile(files[0]);
      if (success && onSuccess) {
        onSuccess();
      }
    }
  };

  const getStageMessage = (stage: string) => {
    const stageMessages: Record<string, string> = {
      validating: '正在验证插件包...',
      extracting: '正在解压插件文件...',
      installing: '正在安装插件...',
      complete: '安装完成！',
      '': '准备就绪',
    };
    return stageMessages[stage] || stage;
  };

  return (
    <div className="plugin-installer" data-testid="plugin-installer">
      <div className="plugin-installer-header">
        <h2 className="plugin-installer-title">安装插件</h2>
        <p className="plugin-installer-subtitle">
          拖拽插件包文件到下方区域进行安装
        </p>
      </div>

      {error && (
        <div className="plugin-installer-error" data-testid="install-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <div className="error-title">安装失败</div>
            <div className="error-message">{error}</div>
          </div>
          <button
            className="error-dismiss"
            onClick={resetError}
            aria-label="关闭错误提示"
          >
            ✕
          </button>
        </div>
      )}

      {isInstalling && (
        <div className="plugin-installer-progress" data-testid="install-progress">
          <div className="progress-header">
            <span className="progress-stage">{getStageMessage(progress.stage)}</span>
            <span className="progress-percentage">{progress.progress}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              role="progressbar"
              aria-valuenow={progress.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className={`plugin-installer-dropzone ${isInstalling ? 'installing' : ''}`}>
        <DragDropZone
          onDrop={handleFileDrop}
          disabled={isInstalling}
          title={isInstalling ? '正在安装...' : '拖拽插件文件到此处'}
          hint="支持 .zip 和 .tar.gz 格式，最大 50MB"
        />
      </div>

      <div className="plugin-installer-info">
        <h3>安装说明</h3>
        <ul>
          <li>插件必须包含有效的 plugin.json 清单文件</li>
          <li>插件 ID 必须唯一，不能与已安装插件冲突</li>
          <li>安装后插件默认处于禁用状态，需要手动启用</li>
          <li>建议只安装来自可信来源的插件</li>
        </ul>
      </div>
    </div>
  );
};

export default PluginInstaller;
