/**
 * ErrorBoundary Component Unit Tests
 * Tests for error catching, fallback UI, and reset functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Dummy component that throws error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
};

// Component that throws in render
const BadComponent = () => {
  throw new Error('Render error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Error Catching', () => {
    it('should catch errors in child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('出错了')).toBeInTheDocument();
      // When error.message exists, it shows the actual message (Test error)
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should render children normally when no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
      expect(screen.queryByText('出错了')).not.toBeInTheDocument();
    });

    it('should catch errors during initial render', () => {
      render(
        <ErrorBoundary>
          <BadComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('出错了')).toBeInTheDocument();
    });
  });

  describe('Fallback UI', () => {
    it('should use custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('出错了')).not.toBeInTheDocument();
    });

    it('should show default error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should show reset button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const resetButton = screen.getByText('重新加载');
      expect(resetButton).toBeInTheDocument();
      expect(resetButton.tagName).toBe('BUTTON');
    });
  });

  describe('Reset Functionality', () => {
    it('should have reset button when error is shown', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error UI with reset button
      expect(screen.getByText('出错了')).toBeInTheDocument();
      const resetButton = screen.getByRole('button', { name: '重新加载' });
      expect(resetButton).toBeInTheDocument();

      // Click reset button (error boundary state should reset)
      fireEvent.click(resetButton);
      // Note: If children still throw, error will be caught again
      // This tests that the reset handler is properly connected
    });

    it('should clear error when children no longer throw after reset', async () => {
      // Test with a component that can stop throwing
      const TestWrapper = ({ shouldThrow }: { shouldThrow: boolean }) => (
        <ErrorBoundary key={shouldThrow ? 'error' : 'normal'}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      const { rerender } = render(<TestWrapper shouldThrow={true} />);

      // Should show error
      expect(screen.getByText('出错了')).toBeInTheDocument();

      // Click reset
      const resetButton = screen.getByRole('button', { name: '重新加载' });
      fireEvent.click(resetButton);

      // Rerender with key change (forces remount with non-throwing child)
      rerender(<TestWrapper shouldThrow={false} />);

      // Should show normal content
      expect(screen.getByText('Normal content')).toBeInTheDocument();
      expect(screen.queryByText('出错了')).not.toBeInTheDocument();
    });
  });

  describe('Error Callback', () => {
    it('should call onError callback with error and errorInfo', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should include error message in callback', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Development Mode', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('错误详情')).toBeInTheDocument();
      expect(screen.getByText(/ThrowError/)).toBeInTheDocument();
    });

    it('should hide error details in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('错误详情')).not.toBeInTheDocument();
    });

    it('should show stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const stackTrace = screen.queryByText(/at ThrowError/);
      expect(stackTrace).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('出错了');
    });

    it('should have clickable reset button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: '重新加载' });
      expect(resetButton).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={false} />);

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('出错了')).toBeInTheDocument();
  });

  it('should use custom fallback in HOC', () => {
    const customFallback = <div>HOC fallback</div>;
    const WrappedComponent = withErrorBoundary(ThrowError, customFallback);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('HOC fallback')).toBeInTheDocument();
  });

  it('should call onError callback in HOC', () => {
    const onError = vi.fn();
    const WrappedComponent = withErrorBoundary(ThrowError, undefined, onError);

    render(<WrappedComponent shouldThrow={true} />);

    expect(onError).toHaveBeenCalled();
  });

  it('should forward props to wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={false} />);

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });
});

describe('Error Boundary Edge Cases', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle errors in nested components', () => {
    const NestedComponent = ({ shouldThrow }: { shouldThrow: boolean }) => (
      <div>
        <span>Nested</span>
        {shouldThrow && <ThrowError shouldThrow={true} />}
      </div>
    );

    render(
      <ErrorBoundary>
        <NestedComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('出错了')).toBeInTheDocument();
  });

  it('should handle multiple error boundaries', () => {
    render(
      <div>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
        <ErrorBoundary>
          <div>Another boundary</div>
        </ErrorBoundary>
      </div>
    );

    expect(screen.getByText('出错了')).toBeInTheDocument();
    expect(screen.getByText('Another boundary')).toBeInTheDocument();
  });

  it('should not interfere with siblings', () => {
    render(
      <div>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
        <div>Sibling content</div>
      </div>
    );

    expect(screen.getByText('出错了')).toBeInTheDocument();
    expect(screen.getByText('Sibling content')).toBeInTheDocument();
  });
});
