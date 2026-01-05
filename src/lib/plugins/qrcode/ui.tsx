/**
 * QR Code Display UI Component (T166)
 * Shows generated QR code with options to save/copy
 */

import { useState, useEffect, useCallback } from 'react';

interface QRCodeSVGProps {
  text: string;
  size?: number;
  onClose?: () => void;
}

export function QRCodeSVG({ text, size = 300, onClose }: QRCodeSVGProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode();
  }, [text, size]);

  const generateQRCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to use a QR code library if available
      const QRCode = await import('qrcode').catch(() => null);

      if (QRCode && typeof QRCode.toDataURL === 'function') {
        const dataUrl = await QRCode.toDataURL(text, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrDataUrl(dataUrl);
      } else {
        // Fallback to API
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
        setQrDataUrl(apiUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qrcode-${Date.now()}.png`;
    link.click();
  }, [qrDataUrl]);

  const handleCopy = useCallback(async () => {
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      alert('已复制到剪贴板');
    } catch (err) {
      console.error('Copy failed:', err);
      alert('复制失败');
    }
  }, [qrDataUrl]);

  if (isLoading) {
    return (
      <div className="qrcode-display loading">
        <div className="qrcode-spinner" />
        <p>生成 QR 码中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qrcode-display error">
        <p className="error-message">生成失败: {error}</p>
        <button onClick={generateQRCode} className="retry-button">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="qrcode-display">
      <div className="qrcode-header">
        <h3>QR 码</h3>
        {onClose && (
          <button onClick={onClose} className="close-button" aria-label="关闭">
            ✕
          </button>
        )}
      </div>

      <div className="qrcode-image-container">
        <img
          src={qrDataUrl}
          alt="QR Code"
          className="qrcode-image"
          width={size}
          height={size}
        />
      </div>

      <div className="qrcode-text">
        <p>{text}</p>
      </div>

      <div className="qrcode-actions">
        <button onClick={handleDownload} className="action-button primary">
          📥 下载
        </button>
        <button onClick={handleCopy} className="action-button secondary">
          📋 复制
        </button>
      </div>
    </div>
  );
}

export default QRCodeSVG;
