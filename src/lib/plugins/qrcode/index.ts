/**
 * QR Code Generator Plugin (T162, T166)
 * Generates QR codes from text or URLs
 */

import type { Plugin, PluginSearchResult } from '@/types/plugin';
import { QRCodeSVG } from './ui';

// Check if qrcode library is available
let QRCode: any = null;
try {
  // Will be dynamically imported if qrcode package is installed
  QRCode = require('qrcode');
} catch {
  // Fallback - will use placeholder
}

const plugin: Plugin = {
  manifest: {
    id: 'qrcode-generator',
    name: 'QR 码生成器',
    version: '1.0.0',
    description: '生成文本或 URL 的二维码',
    author: 'Kaka Team',
    triggers: ['qr:', 'qrcode:'],
    permissions: [],
  },

  /**
   * Search handler for QR code generation
   */
  onSearch: async (query: string): Promise<PluginSearchResult[]> => {
    const lowerQuery = query.toLowerCase().trim();

    // Check for QR code triggers
    const qrMatch = lowerQuery.match(/^(qr:|qrcode:)\s*(.+)$/);
    if (qrMatch) {
      const text = qrMatch[2].trim();
      if (!text) {
        return [];
      }

      return [{
        id: 'qr-generate',
        title: `生成 QR 码: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
        description: '点击生成并复制 QR 码',
        icon: '📱',
        action: async () => {
          // Generate QR code
          const qrDataUrl = await generateQRCode(text);

          // In a real implementation, we would:
          // 1. Show the QR code in a modal
          // 2. Allow the user to save it
          // For now, just show an alert with the data URL
          console.log('QR Code generated:', qrDataUrl.substring(0, 50) + '...');

          // Could open in new tab or copy to clipboard
          if (typeof window !== 'undefined') {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>QR Code - ${text}</title>
                  <style>
                    body {
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      min-height: 100vh;
                      margin: 0;
                      font-family: system-ui, sans-serif;
                      background: #f5f5f5;
                    }
                    img {
                      max-width: 90vw;
                      max-height: 90vh;
                      padding: 20px;
                      background: white;
                      border-radius: 8px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    p {
                      margin-top: 20px;
                      color: #666;
                    }
                  </style>
                </head>
                <body>
                  <img src="${qrDataUrl}" alt="QR Code" />
                  <p>${text}</p>
                </body>
                </html>
              `);
            }
          }
        },
      }];
    }

    // Auto-detect URLs that could be converted to QR
    if (lowerQuery.startsWith('http://') || lowerQuery.startsWith('https://')) {
      return [{
        id: 'qr-url',
        title: `生成 URL 的 QR 码`,
        description: `为 ${query} 生成二维码`,
        icon: '📱',
        action: async () => {
          const qrDataUrl = await generateQRCode(query);
          console.log('QR Code generated for URL:', qrDataUrl.substring(0, 50) + '...');
        },
      }];
    }

    return [];
  },

  /**
   * UI component for QR code display
   */
  ui: {
    component: QRCodeSVG,
  },
};

/**
 * Generate QR code as data URL
 */
async function generateQRCode(text: string): Promise<string> {
  if (QRCode) {
    try {
      // Use qrcode library if available
      return await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  }

  // Fallback: Use a simple online API
  // In production, you might want to use a local library
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  return apiUrl;
}

export default plugin;
