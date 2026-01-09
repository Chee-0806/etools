/**
 * Hotkey Editor Component
 * Allows users to customize keyboard shortcuts
 */

import { useState, useCallback, useEffect, useRef } from 'react';
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
  const recordingRef = useRef(false);
  const keyDownHandledRef = useRef(false);
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartRecording = useCallback(() => {
    console.log('[HotkeyEditor] Starting recording');
    setIsRecording(true);
    recordingRef.current = true;
    setRecordedKeys([]);
    keyDownHandledRef.current = false;

    // Clear any existing timeout
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!recordingRef.current) return;
    if (keyDownHandledRef.current) {
      keyDownHandledRef.current = false;
      return;
    }

    // Prevent the event from bubbling up
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    const key = e.key;
    const code = e.code;
    console.log('[HotkeyEditor] Key pressed:', key, 'Code:', code, 'Modifiers:', {
      metaKey: e.metaKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey
    });

    // Ignore modifier keys when pressed alone
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      // Just show the modifier keys being held
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Cmd');

      console.log('[HotkeyEditor] Showing modifiers:', keys);
      setRecordedKeys(keys);
      return;
    }

    // Build the complete key combination
    const keys: string[] = [];
    if (e.metaKey) keys.push('Cmd');
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');

    // Convert to readable format using lookup table for symbol keys
    // Simplifies the long if-else chain for better maintainability
    let readableKey = key;

    // Symbol key lookup table - maps code/key to display character
    const SYMBOL_KEY_MAP: Record<string, string> = {
      // Symbols
      'Equal': '=', 'Minus': '-', 'BracketLeft': '[', 'BracketRight': ']',
      'Backslash': '\\\\', 'Semicolon': ';', 'Quote': "'",
      'Comma': ',', 'Period': '.', 'Slash': '/', 'Backquote': '`',
    };

    // Letter keys: KeyA -> A
    if (code.startsWith('Key')) {
      readableKey = code.replace('Key', '').toUpperCase();
    }
    // Number keys: Digit0 -> 0
    else if (code.startsWith('Digit')) {
      readableKey = code.replace('Digit', '');
    }
    // Special keys
    else if (key === ' ') {
      readableKey = 'Space';
    } else if (key.startsWith('Arrow')) {
      readableKey = key.replace('Arrow', '');
    }
    // Look up symbol keys in map
    else if (SYMBOL_KEY_MAP[code]) {
      readableKey = SYMBOL_KEY_MAP[code];
    }
    // F-keys (F1-F12) and other special keys
    else {
      readableKey = key.toUpperCase();
    }

    keys.push(readableKey);

    console.log('[HotkeyEditor] Complete combination:', keys);
    setRecordedKeys(keys);
    keyDownHandledRef.current = true;

    // Stop recording after capturing the combination
    completeTimeoutRef.current = setTimeout(() => {
      console.log('[HotkeyEditor] Stopping recording after capture');
      setIsRecording(false);
      recordingRef.current = false;
      keyDownHandledRef.current = false;
      completeTimeoutRef.current = null;
    }, 300);
  }, []);

  const handleClear = useCallback(() => {
    console.log('[HotkeyEditor] Clearing recorded keys');
    setRecordedKeys([]);
    keyDownHandledRef.current = false;
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
  }, []);

  const handleSave = useCallback(() => {
    console.log('[HotkeyEditor] ===== handleSave called =====');
    console.log('[HotkeyEditor] recordedKeys:', recordedKeys);
    console.log('[HotkeyEditor] recordedKeys.length:', recordedKeys.length);

    if (recordedKeys.length > 0) {
      const hotkey = recordedKeys.join('+');
      console.log('[HotkeyEditor] Calling onSave with hotkey:', hotkey);

      // Call onSave immediately before clearing state
      onSave(hotkey);

      // Clear state after calling onSave
      setIsRecording(false);
      recordingRef.current = false;
      setRecordedKeys([]);
      keyDownHandledRef.current = false;
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    } else {
      console.log('[HotkeyEditor] No keys to save, recordedKeys is empty');
    }
  }, [recordedKeys, onSave]);

  const handleCancel = useCallback(() => {
    console.log('[HotkeyEditor] Canceling recording');
    setIsRecording(false);
    recordingRef.current = false;
    setRecordedKeys([]);
    keyDownHandledRef.current = false;
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
    onCancel();
  }, [onCancel]);

  // Handle Escape key to cancel
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isRecording && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      }
    };

    if (isRecording) {
      window.addEventListener('keydown', handleGlobalKeyDown, true);
      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown, true);
      };
    }
  }, [isRecording, handleCancel]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
      }
    };
  }, []);

  console.log('[HotkeyEditor] Render state:', {
    isRecording,
    recordedKeys,
    recordingRef: recordingRef.current
  });

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
          onKeyDown={isRecording ? handleKeyDown : undefined}
          tabIndex={isRecording ? 0 : -1}
          autoFocus={isRecording}
        >
          {isRecording ? '按下快捷键...' : '录制新快捷键'}
        </button>

        <div className="hotkey-preview">
          {recordedKeys.length > 0 ? (
            <>
              {recordedKeys.map((key, i) => (
                <Kbd key={i}>{key}</Kbd>
              ))}
              {!isRecording && (
                <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>
                  ✅ 录制完成，请点击"保存"按钮
                </span>
              )}
            </>
          ) : (
            <span className="hotkey-preview__empty">
              {isRecording ? '按下组合键...' : '未录制'}
            </span>
          )}
        </div>

        {isRecording && (
          <div className="hotkey-actions">
            <button
              className="hotkey-action-btn"
              onClick={handleClear}
              disabled={recordedKeys.length === 0}
              title="清除已录制的按键"
            >
              清除
            </button>
            <button
              className="hotkey-action-btn hotkey-action-btn--cancel"
              onClick={handleCancel}
              title="取消录制（也可以按 ESC 键）"
            >
              取消
            </button>
          </div>
        )}

        {!isRecording && recordedKeys.length > 0 && (
          <div className="hotkey-actions">
            <button
              className="hotkey-action-btn"
              onClick={handleClear}
              title="清除并重新录制"
            >
              重新录制
            </button>
            <button
              className="hotkey-action-btn hotkey-action-btn--save"
              onClick={handleSave}
              title="保存新的快捷键"
            >
              保存快捷键
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
