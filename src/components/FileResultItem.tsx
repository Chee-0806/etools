/**
 * File Result Item Component (T151, T153)
 * Displays file search results with path and metadata
 */

import { Kbd } from './ui/Kbd';
import './FileResultItem.css';

export interface FileResultItemData {
  id: string;
  path: string;
  filename: string;
  extension?: string;
  size: number;
  modified: number;
  hidden: boolean;
}

interface FileResultItemProps {
  item: FileResultItemData;
  isActive?: boolean;
  onClick?: () => void;
}

export function FileResultItem({ item, isActive = false, onClick }: FileResultItemProps) {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const getFileIcon = (): string => {
    if (!item.extension) return '📄';

    const ext = item.extension.toLowerCase();
    const iconMap: Record<string, string> = {
      // Code
      'ts': '📘',
      'tsx': '📘',
      'js': '📒',
      'jsx': '📒',
      'py': '🐍',
      'rs': '🦀',
      'go': '🐹',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'h': '⚙️',
      'css': '🎨',
      'scss': '🎨',
      'html': '🌐',
      'json': '📋',
      'xml': '📋',
      'yaml': '📋',
      'yml': '📋',
      'md': '📝',
      'txt': '📄',
      'pdf': '📕',
      'doc': '📘',
      'docx': '📘',
      'xls': '📗',
      'xlsx': '📗',
      'ppt': '📙',
      'pptx': '📙',
      // Images
      'png': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'gif': '🖼️',
      'svg': '🖼️',
      'webp': '🖼️',
      'ico': '🖼️',
      // Audio
      'mp3': '🎵',
      'wav': '🎵',
      'flac': '🎵',
      'ogg': '🎵',
      'm4a': '🎵',
      // Video
      'mp4': '🎬',
      'mkv': '🎬',
      'avi': '🎬',
      'mov': '🎬',
      'webm': '🎬',
      // Archives
      'zip': '📦',
      'rar': '📦',
      '7z': '📦',
      'tar': '📦',
      'gz': '📦',
    };

    return iconMap[ext] || '📄';
  };

  const getPathParts = () => {
    const parts = item.path.split('/');
    return parts.slice(0, -1); // Remove filename
  };

  return (
    <div
      className={`file-result ${isActive ? 'active' : ''} ${item.hidden ? 'hidden' : ''}`}
      onClick={onClick}
    >
      <div className="file-result__icon">{getFileIcon()}</div>

      <div className="file-result__content">
        <div className="file-result__name">{item.filename}</div>
        <div className="file-result__path">
          {getPathParts().join(' / ')}
        </div>
      </div>

      <div className="file-result__meta">
        <Kbd>{formatSize(item.size)}</Kbd>
      </div>
    </div>
  );
}
