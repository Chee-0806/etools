/**
 * DragDropZone Component
 * A reusable drag-and-drop zone component for file uploads
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export interface DragDropZoneProps {
  /**
   * Accepted file types (e.g., ['.zip', '.tar.gz'])
   */
  accept?: Record<string, string[]>;

  /**
   * Maximum file size in bytes
   */
  maxSize?: number;

  /**
   * Whether multiple files are allowed
   */
  multiple?: boolean;

  /**
   * Whether the dropzone is disabled
   */
  disabled?: boolean;

  /**
   * Callback when files are dropped
   */
  onDrop: (files: File[]) => void;

  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;

  /**
   * Title text
   */
  title?: string;

  /**
   * Hint/subtitle text
   */
  hint?: string;

  /**
   * Additional class name
   */
  className?: string;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  accept = {
    'application/zip': ['.zip'],
    'application/x-tar': ['.tar', '.tar.gz'],
    'application/gzip': ['.gz'],
  },
  maxSize = 50 * 1024 * 1024, // 50MB default
  multiple = false,
  disabled = false,
  onDrop,
  icon = (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  title = '拖拽插件文件到此处',
  hint = '支持 .zip 和 .tar.gz 格式',
  className = '',
}) => {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!disabled) {
        onDrop(acceptedFiles);
      }
    },
    [onDrop, disabled]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept,
    maxSize,
    multiple,
    disabled,
    onDrop: handleDrop,
  });

  const getStatusClass = () => {
    if (disabled) return 'disabled';
    if (isDragReject) return 'error';
    if (isDragActive) return 'active';
    return '';
  };

  return (
    <div
      {...getRootProps()}
      className={`drag-drop-zone ${getStatusClass()} ${className}`}
      data-testid="drag-drop-zone"
    >
      <input {...getInputProps()} />
      <div className="drag-drop-content">
        <div className="drag-drop-icon">{icon}</div>
        <p className="drag-drop-text">
          {isDragActive ? (isDragReject ? '不支持的文件类型' : '释放文件以安装') : title}
        </p>
        {hint && <p className="drag-drop-hint">{hint}</p>}
      </div>
    </div>
  );
};

export default DragDropZone;
