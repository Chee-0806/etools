/**
 * Debug Logger
 * Writes all debug logs to a file via Rust backend
 */

import { invoke } from '@tauri-apps/api/core';

let logBuffer: string[] = [];
let isWriting = false;

const MAX_BUFFER_SIZE = 50; // Write to file when buffer reaches this size

/**
 * Get current timestamp in readable format
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString();
}

/**
 * Write log entry to buffer and flush to file if needed
 */
async function writeLog(level: string, tag: string, message: string, ...args: any[]) {
  const timestamp = getTimestamp();
  const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
  const logEntry = `[${timestamp}] [${level}] [${tag}] ${message}${argsStr}`;

  logBuffer.push(logEntry);

  // Flush buffer if it's full
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    await flushLog();
  }
}

/**
 * Flush log buffer to file via Rust command
 */
async function flushLog() {
  if (isWriting || logBuffer.length === 0) return;

  isWriting = true;

  try {
    // Join all logs and send to Rust
    const logContent = logBuffer.join('\n');

    // Use invoke to call Rust command
    await invoke('write_debug_log', { content: logContent });

    // Clear buffer
    logBuffer = [];
  } catch (error) {
    console.error('[Logger] Failed to write log:', error);
  } finally {
    isWriting = false;
  }
}

/**
 * Logger with different levels
 */
export const logger = {
  debug: (tag: string, message: string, ...args: any[]) => {
    console.log(`[${tag}]`, message, ...args);
    writeLog('DEBUG', tag, message, ...args);
  },

  info: (tag: string, message: string, ...args: any[]) => {
    console.info(`[${tag}]`, message, ...args);
    writeLog('INFO', tag, message, ...args);
  },

  warn: (tag: string, message: string, ...args: any[]) => {
    console.warn(`[${tag}]`, message, ...args);
    writeLog('WARN', tag, message, ...args);
  },

  error: (tag: string, message: string, ...args: any[]) => {
    console.error(`[${tag}]`, message, ...args);
    writeLog('ERROR', tag, message, ...args);
  },

  log: (tag: string, message: string, ...args: any[]) => {
    console.log(`[${tag}]`, message, ...args);
    writeLog('LOG', tag, message, ...args);
  },
};

/**
 * Auto-flush logs periodically
 */
let flushInterval: number | null = null;

export function startAutoFlush() {
  if (flushInterval) return;

  // Flush every 2 seconds
  flushInterval = window.setInterval(() => {
    flushLog();
  }, 2000);
}

export function stopAutoFlush() {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

/**
 * Initialize logger
 */
export function initLogger() {
  startAutoFlush();

  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    flushLog();
  });

  logger.info('Logger', 'Logger initialized');
}

