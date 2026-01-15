/**
 * Error Handler Service
 * Unified error handling with categorization, logging, and Tauri integration
 *
 * Features:
 * - Error categorization (ErrorCategory, ErrorSeverity)
 * - Error statistics and history
 * - Console logging with severity-based methods
 * - Tauri backend logging integration
 * - Global error tracking
 */

import { invoke } from '@tauri-apps/api/core';

export enum ErrorCategory {
  SCREEN_DETECTION = 'SCREEN_DETECTION',
  WINDOW_RESIZE = 'WINDOW_RESIZE',
  VIEW_TRANSITION = 'VIEW_TRANSITION',
  STATE_MANAGEMENT = 'STATE_MANAGEMENT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
  GLOBAL_ERROR = 'GLOBAL_ERROR',
  REJECTION = 'REJECTION',
  RESOURCE_LOAD = 'RESOURCE_LOAD',
}

export enum ErrorSeverity {
  LOW = 'low', // Non-critical, user can continue
  MEDIUM = 'medium', // Feature partially broken
  HIGH = 'high', // Feature completely broken
  CRITICAL = 'critical', // App crash potential
}

export interface AppError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  timestamp: number;
  stack?: string;
  componentStack?: string;
  context?: Record<string, any>;
}

type ErrorLogType = 'error' | 'warning' | 'info';

interface ErrorLog {
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  type: ErrorLogType;
}

class ErrorHandlerImpl {
  private errors: AppError[] = [];
  private maxErrors = 100; // Keep last 100 errors

  /**
   * Log an error (categorized)
   */
  log(error: AppError): void {
    this.errors.push(error);

    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Console logging based on severity
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.category}] ${error.message}`, error.context);

    // Log to Tauri backend for all errors
    this.logToBackend(error);

    if (error.severity === ErrorSeverity.CRITICAL) {
      this.reportCriticalError(error);
    }
  }

  /**
   * Log raw error with optional component stack (for ErrorBoundary)
   */
  logRaw(error: Error, componentStack?: string): void {
    const appError: AppError = {
      category: ErrorCategory.GLOBAL_ERROR,
      severity: this.inferSeverity(error),
      message: error.message,
      timestamp: Date.now(),
      stack: error.stack,
      componentStack,
    };

    this.log(appError);
  }

  /**
   * Log warning message
   */
  warn(message: string): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      message,
      type: 'warning',
    };

    console.group(`[WARNING] ${log.timestamp}`);
    console.warn(log.message);
    console.groupEnd();

    this.logToBackendRaw(log);
  }

  /**
   * Log info message
   */
  info(message: string): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      message,
      type: 'info',
    };

    console.group(`[INFO] ${log.timestamp}`);
    console.info(log.message);
    console.groupEnd();

    this.logToBackendRaw(log);
  }

  /**
   * Create and log an error from unknown error
   */
  logUnknown(
    error: unknown,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context?: Record<string, any>
  ): AppError {
    const appError: AppError = {
      category,
      severity: this.inferSeverity(error),
      message: this.extractMessage(error),
      timestamp: Date.now(),
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };

    this.log(appError);
    return appError;
  }

  /**
   * Get all logged errors
   */
  getErrors(): AppError[] {
    return [...this.errors];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): AppError[] {
    return this.errors.filter((e) => e.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter((e) => e.severity === severity);
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const error of this.errors) {
      const key = `${error.category}_${error.severity}`;
      stats[key] = (stats[key] || 0) + 1;
    }

    return stats;
  }

  /**
   * Extract error message from unknown error
   */
  private extractMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }

    return 'Unknown error occurred';
  }

  /**
   * Infer error severity from error type
   */
  private inferSeverity(error: unknown): ErrorSeverity {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return ErrorSeverity.MEDIUM;
    }

    if (error instanceof Error && error.message.includes('Tauri invocation')) {
      return ErrorSeverity.HIGH;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Get console log method based on severity
   */
  private getLogMethod(severity: ErrorSeverity): (...args: any[]) => void {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.info;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Log AppError to Tauri backend
   */
  private async logToBackend(error: AppError): Promise<void> {
    try {
      const log: ErrorLog = {
        timestamp: new Date(error.timestamp).toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: error.componentStack,
        type: error.severity === ErrorSeverity.LOW ? 'info' : 'error',
      };

      await this.logToBackendRaw(log);
    } catch (e) {
      console.debug('Could not log to backend:', e);
    }
  }

  /**
   * Log ErrorLog to Tauri backend
   */
  private async logToBackendRaw(log: ErrorLog): Promise<void> {
    try {
      await invoke('log_error', {
        message: log.message,
        stack: log.stack || '',
        component_stack: log.componentStack || '',
        timestamp: log.timestamp,
      });
    } catch (e) {
      console.debug('Could not log to backend:', e);
    }
  }

  /**
   * Report critical error to error tracking service
   * TODO: Integrate with Sentry or similar service
   */
  private reportCriticalError(error: AppError): void {
    console.error('[CRITICAL ERROR]', error);

    // TODO: Send to error tracking service (Sentry, etc.)
  }
}

export const errorHandler = new ErrorHandlerImpl();

/**
 * Utility: Wrap async function with error handling
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  category: ErrorCategory,
  context?: Record<string, any>
): Promise<T> {
  return fn().catch((error) => {
    throw errorHandler.logUnknown(error, category, context);
  });
}
