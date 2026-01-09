/**
 * Error Handler Service
 * Centralized error handling for responsive window features
 */

export enum ErrorCategory {
  SCREEN_DETECTION = 'SCREEN_DETECTION',
  WINDOW_RESIZE = 'WINDOW_RESIZE',
  VIEW_TRANSITION = 'VIEW_TRANSITION',
  STATE_MANAGEMENT = 'STATE_MANAGEMENT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
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
  context?: Record<string, any>;
}

class ErrorHandlerImpl {
  private errors: AppError[] = [];
  private maxErrors = 100; // Keep last 100 errors

  /**
   * Log an error
   */
  log(error: AppError): void {
    this.errors.push(error);

    // Keep only last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Console logging based on severity
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.category}] ${error.message}`, error.context);

    // In production, send to error tracking service
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.reportCriticalError(error);
    }
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
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return ErrorSeverity.MEDIUM;
    }

    // Tauri invocation errors
    if (error instanceof Error && error.message.includes('Tauri invocation')) {
      return ErrorSeverity.HIGH;
    }

    // Default to medium
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
   * Report critical error to error tracking service
   * TODO: Integrate with Sentry or similar service
   */
  private reportCriticalError(error: AppError): void {
    // In production, send to error tracking service
    console.error('[CRITICAL ERROR]', error);

    // TODO: Send to backend for logging
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
