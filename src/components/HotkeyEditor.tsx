/**
 * Hotkey Editor Component
 * Allows users to customize keyboard shortcuts
 */

import { useState, useCallback } from 'react';
import { Kbd } from './ui/Kbd';
import '../styles/components/HotkeyEditor.css';

interface HotkeyEditorProps {
  currentHotkey: string;
  onSave: (hotkey: string) => void;
  onCancel: () => void;
}

export function HotkeyEditor({ currentHotkey, onSave, onCancel }: HotkeyEditorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setRecordedKeys([]);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();

    const key = e.key;

    // Ignore modifier keys when pressed alone
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      return;
    }

    // Add the key to our recording
    setRecordedKeys(prev => {
      // Don't allow more than 3 keys
      if (prev.length >= 3) return prev;

      // Convert to readable format
      let readableKey = key;
      if (key === ' ') readableKey = 'Space';
      if (key === 'Meta') readableKey = 'Cmd';

      return [...prev, readableKey];
    });
  }, [isRecording]);

  const handleKeyDownCapture = useCallback((e: React.KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();
    e.stopPropagation();

    // Handle modifier keys
    if (e.ctrlKey && !recordedKeys.includes('Ctrl')) {
      setRecordedKeys(prev => ['Ctrl', ...prev]);
    }
    if (e.altKey && !recordedKeys.includes('Alt')) {
      setRecordedKeys(prev => ['Alt', ...prev]);
    }
    if (e.shiftKey && !recordedKeys.includes('Shift')) {
      setRecordedKeys(prev => ['Shift', ...prev]);
    }
    if (e.metaKey && !recordedKeys.includes('Cmd')) {
      setRecordedKeys(prev => ['Cmd', ...prev]);
    }

    handleKeyDown(e);
  }, [isRecording, recordedKeys, handleKeyDown]);

  const handleClear = useCallback(() => {
    setRecordedKeys([]);
  }, []);

  const handleSave = useCallback(() => {
    const hotkey = recordedKeys.join('+');
    onSave(hotkey);
    setIsRecording(false);
  }, [recordedKeys, onSave]);

  const handleCancel = useCallback(() => {
    setIsRecording(false);
    setRecordedKeys([]);
    onCancel();
  }, [onCancel]);

  return (
    <div className="hotkey-editor">
      <div className="hotkey-editor__current">
        <span className="hotkey-editor__label">当前快捷键:</span>
        <Kbd>{currentHotkey}</Kbd>
      </div>

      <div className="hotkey-editor__record">
        <button
          className={`hotkey-record-btn ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? undefined : handleStartRecording}
          onKeyDown={isRecording ? handleKeyDownCapture : undefined}
          tabIndex={isRecording ? 0 : -1}
          autoFocus={isRecording}
        >
          {isRecording ? '按下快捷键...' : '录制新快捷键'}
        </button>

        {isRecording && (
          <div className="hotkey-preview">
            {recordedKeys.length > 0 ? (
              recordedKeys.map((key, i) => (
                <Kbd key={i}>{key}</Kbd>
              ))
            ) : (
              <span className="hotkey-preview__empty">按下组合键...</span>
            )}
          </div>
        )}

        {isRecording && (
          <div className="hotkey-actions">
            <button className="hotkey-action-btn" onClick={handleClear}>
              清除
            </button>
            <button className="hotkey-action-btn hotkey-action-btn--cancel" onClick={handleCancel}>
              取消
            </button>
            <button
              className="hotkey-action-btn hotkey-action-btn--save"
              onClick={handleSave}
              disabled={recordedKeys.length === 0}
            >
              保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
