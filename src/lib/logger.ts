/**
 * Debug Logger
 * Writes debug logs to a file via Rust backend
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Constants
// ============================================================================

/** Maximum buffer size before auto-flush */
const MAX_BUFFER_SIZE = 50;

/** Auto-flush interval in milliseconds */
const AUTO_FLUSH_INTERVAL = 2000;

/** Tauri command for writing debug logs */
const COMMAND_WRITE_DEBUG_LOG = 'write_debug_log';

// ============================================================================
// Types
// ============================================================================

/**
 * Log level type
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'LOG';

/**
 * Log entry structure
 */
interface LogEntry {
  level: LogLevel;
  tag: string;
  message: string;
  args: unknown[];
}

/**
 * Logger interface
 */
export interface Logger {
  debug(tag: string, message: string, ...args: unknown[]): void;
  info(tag: string, message: string, ...args: unknown[]): void;
  warn(tag: string, message: string, ...args: unknown[]): void;
  error(tag: string, message: string, ...args: unknown[]): void;
  log(tag: string, message: string, ...args: unknown[]): void;
}

// ============================================================================
// State
// ============================================================================

let logBuffer: string[] = [];
let isWriting = false;
let flushInterval: ReturnType<typeof setInterval> | undefined;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get ISO timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format log entry as string
 */
function formatLogEntry(level: LogLevel, tag: string, message: string, args: unknown[]): string {
  const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
  return `[${getTimestamp()}] [${level}] [${tag}] ${message}${argsStr}`;
}

/**
 * Add log entry to buffer
 */
function addToBuffer(entry: string): void {
  logBuffer.push(entry);

  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    flushLog();
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Flush log buffer to file
 */
async function flushLog(): Promise<void> {
  if (isWriting || logBuffer.length === 0) return;

  isWriting = true;

  try {
    await invoke(COMMAND_WRITE_DEBUG_LOG, { content: logBuffer.join('\n') });
    logBuffer = [];
  } catch (error) {
    console.error('[Logger] Failed to write log:', error);
    logBuffer = [];
  } finally {
    isWriting = false;
  }
}

/**
 * Write log entry
 */
function writeLog(level: LogLevel, tag: string, message: string, ...args: unknown[]): void {
  const entry = formatLogEntry(level, tag, message, args);
  addToBuffer(entry);
}

/**
 * Create a log method for a specific level
 */
function createLogMethod(level: LogLevel, consoleFn: Console['log']) {
  return (tag: string, message: string, ...args: unknown[]) => {
    consoleFn(`[${tag}]`, message, ...args);
    writeLog(level, tag, message, ...args);
  };
}

// ============================================================================
// Logger Instance
// ============================================================================

/**
 * Logger instance with all log level methods
 */
export const logger: Logger = {
  debug: createLogMethod('DEBUG', console.log),
  info: createLogMethod('INFO', console.info),
  warn: createLogMethod('WARN', console.warn),
  error: createLogMethod('ERROR', console.error),
  log: createLogMethod('LOG', console.log),
};

// ============================================================================
// Lifecycle Functions
// ============================================================================

/**
 * Start auto-flush interval
 */
export function startAutoFlush(): void {
  if (flushInterval) return;
  flushInterval = setInterval(flushLog, AUTO_FLUSH_INTERVAL);
}

/**
 * Stop auto-flush interval
 */
export function stopAutoFlush(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = undefined;
  }
}

/**
 * Initialize logger with auto-flush and cleanup handlers
 */
export function initLogger(): void {
  startAutoFlush();
  window.addEventListener('beforeunload', flushLog);
  logger.info('Logger', 'Logger initialized');
}

/**
 * Manually flush logs
 */
export { flushLog };
