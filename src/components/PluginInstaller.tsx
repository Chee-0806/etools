/**
 * Plugin Installer Component (T173, T175)
 * Modal dialog showing plugin installation progress
 */

import { useEffect, useState } from 'react';
import type { MarketplacePlugin } from './PluginMarketplace';
import './PluginInstaller.css';

interface PluginInstallerProps {
  plugin: MarketplacePlugin;
  progress: number;
  onClose: () => void;
}

type InstallStep = 'downloading' | 'installing' | 'verifying' | 'complete' | 'error';

export const PluginInstaller: React.FC<PluginInstallerProps> = ({
  plugin,
  progress,
  onClose,
}) => {
  const [step, setStep] = useState<InstallStep>('downloading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update installation step based on progress
    if (error) {
      setStep('error');
    } else if (progress >= 100) {
      setStep('complete');
    } else if (progress >= 70) {
      setStep('verifying');
    } else if (progress >= 30) {
      setStep('installing');
    }
  }, [progress, error]);

  const getStepText = () => {
    switch (step) {
      case 'downloading':
        return '正在下载插件...';
      case 'installing':
        return '正在安装插件...';
      case 'verifying':
        return '正在验证插件...';
      case 'complete':
        return '安装完成！';
      case 'error':
        return '安装失败';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Don't close if installation is in progress
      if (step === 'complete' || step === 'error') {
        onClose();
      }
    }
  };

  return (
    <div className="plugin-installer-overlay" onClick={handleBackdropClick}>
      <div className="plugin-installer-modal">
        <div className="installer-header">
          <h3>安装插件</h3>
          {(step === 'complete' || step === 'error') && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>

        <div className="installer-content">
          <div className="plugin-info-summary">
            <div className="plugin-icon-small">
              {plugin.icon ? (
                <img src={plugin.icon} alt={plugin.name} />
              ) : (
                <div className="icon-placeholder-small">
                  {plugin.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="plugin-name-summary">{plugin.name}</div>
              <div className="plugin-author-summary">by {plugin.author}</div>
            </div>
          </div>

          {/* Installation steps */}
          <div className="install-steps">
            <div className={`step ${step === 'downloading' || progress > 0 ? 'active' : ''}`}>
              <div className="step-icon">↓</div>
              <div className="step-text">下载</div>
            </div>
            <div className={`step ${step === 'installing' || progress >= 30 ? 'active' : ''}`}>
              <div className="step-icon">⚙</div>
              <div className="step-text">安装</div>
            </div>
            <div className={`step ${step === 'verifying' || progress >= 70 ? 'active' : ''}`}>
              <div className="step-icon">✓</div>
              <div className="step-text">验证</div>
            </div>
          </div>

          {/* Progress bar (T175) */}
          <div className="install-progress-container">
            <div className="progress-header">
              <span className="progress-status">{getStepText()}</span>
              <span className="progress-percent">{progress}%</span>
            </div>
            <div className="progress-bar-large">
              <div
                className="progress-fill-large"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Error message */}
          {step === 'error' && error && (
            <div className="error-message">
              <strong>安装失败:</strong> {error}
            </div>
          )}

          {/* Success message */}
          {step === 'complete' && (
            <div className="success-message">
              ✓ 插件已成功安装！
            </div>
          )}

          {/* Permissions info */}
          {plugin.manifest.permissions.length > 0 && step !== 'complete' && step !== 'error' && (
            <div className="permissions-info">
              <div className="permissions-title">所需权限:</div>
              <div className="permissions-list">
                {plugin.manifest.permissions.map(perm => (
                  <span key={perm} className="permission-tag">
                    {getPermissionLabel(perm)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="installer-footer">
          {step === 'complete' && (
            <button className="done-button" onClick={onClose}>
              完成
            </button>
          )}
          {step === 'error' && (
            <>
              <button className="retry-button" onClick={onClose}>
                重试
              </button>
              <button className="cancel-button" onClick={onClose}>
                取消
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function getPermissionLabel(permission: string): string {
  const labels: Record<string, string> = {
    read_clipboard: '读取剪贴板',
    write_clipboard: '写入剪贴板',
    read_file: '读取文件',
    write_file: '写入文件',
    network: '网络访问',
    shell: 'Shell 命令',
    notification: '系统通知',
  };
  return labels[permission] || permission;
}
