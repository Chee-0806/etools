/**
 * T194: Global Error Handling
 * Main entry point with error boundary setup
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getErrorLogger } from "./services/errorLogger";

const errorLogger = getErrorLogger();

// Setup global error handlers (outside React)
const setupGlobalErrorHandlers = () => {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    errorLogger.log(event.error || new Error(event.message));
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    errorLogger.log(error);
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const target = event.target as HTMLElement;
      const src = target.getAttribute('src') || target.getAttribute('href') || '';
      // Filter out emoji-only resources (they're text, not images)
      // Check if src is just emoji characters (1-2 chars long, contains only emoji/symbols)
      if (src && src.length <= 3 && /^[\p{Emoji}\p{Symbol}]+$/u.test(src)) {
        return;
      }
      errorLogger.warn(`Failed to load resource: ${target.tagName} ${src}`);
    }
  }, true); // Use capture phase
};

// Initialize error handlers
setupGlobalErrorHandlers();

// Custom error handler for ErrorBoundary
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  errorLogger.log(error, errorInfo.componentStack || undefined);
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ErrorBoundary onError={handleGlobalError}>
    <App />
  </ErrorBoundary>,
);
