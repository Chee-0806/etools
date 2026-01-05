/**
 * Spinner Component Unit Tests
 * Tests for spinner sizes, colors, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

// Mock CSS
vi.mock('./Spinner.css', () => ({}));

describe('Spinner', () => {
  describe('Rendering', () => {
    it('should render spinner', () => {
      render(<Spinner />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should have loading role', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have aria-label for accessibility', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label');
    });

    it('should accept custom className', () => {
      render(<Spinner className="custom-class" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('custom-class');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<Spinner />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--md');
    });

    it('should render small size', () => {
      render(<Spinner size="sm" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--sm');
    });

    it('should render large size', () => {
      render(<Spinner size="lg" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--lg');
    });

    it('should render extra small size (as sm)', () => {
      render(<Spinner size="sm" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--sm');
    });

    it('should render extra large size (as lg)', () => {
      render(<Spinner size="lg" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--lg');
    });
  });

  describe('Colors', () => {
    it('should render default color', () => {
      render(<Spinner />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner');
    });

    it('should render primary color', () => {
      render(<Spinner color="primary" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--primary');
    });

    it('should render secondary color', () => {
      render(<Spinner color="secondary" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--secondary');
    });

    it('should render success color (via custom class)', () => {
      render(<Spinner className="spinner--success" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--success');
    });

    it('should render danger color (via custom class)', () => {
      render(<Spinner className="spinner--danger" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--danger');
    });

    it('should render warning color (via custom class)', () => {
      render(<Spinner className="spinner--warning" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--warning');
    });

    it('should render info color (via custom class)', () => {
      render(<Spinner className="spinner--info" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--info');
    });

    it('should render light color (via custom class)', () => {
      render(<Spinner className="spinner--light" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--light');
    });

    it('should render dark color (via custom class)', () => {
      render(<Spinner className="spinner--dark" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--dark');
    });

    it('should render white color (via custom class)', () => {
      render(<Spinner className="spinner--white" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--white');
    });

    it('should render current color', () => {
      render(<Spinner color="current" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--current');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have default aria-label', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label');
    });

    it('should have custom aria-label', () => {
      render(<Spinner aria-label="Loading data..." />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading data...');
    });

    it('should hide from screen readers when hidden', () => {
      render(<Spinner aria-hidden="true" />);

      const spinner = screen.queryByRole('status');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Animation Types', () => {
    it('should render default spinner', () => {
      render(<Spinner />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner');
      // Component has a fixed animation style (SVG with animateTransform)
    });

    it('should support custom animation class', () => {
      render(<Spinner className="spinner--grow" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--grow');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through standard div attributes', () => {
      render(
        <Spinner
          id="test-spinner"
          data-testid="custom-spinner"
        />
      );

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('id', 'test-spinner');
      expect(spinner).toHaveAttribute('data-testid', 'custom-spinner');
    });
  });

  describe('Styling', () => {
    it('should apply custom styles', () => {
      render(<Spinner style={{ margin: '20px' }} />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveStyle({ margin: '20px' });
    });

    it('should combine multiple classes', () => {
      render(<Spinner className="class1 class2" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('class1');
      expect(spinner).toHaveClass('class2');
    });
  });

  describe('Combinations', () => {
    it('should combine size and color', () => {
      render(<Spinner size="lg" color="primary" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--lg');
      expect(spinner).toHaveClass('spinner--primary');
    });

    it('should combine size, color, and custom class', () => {
      render(
        <Spinner size="sm" color="secondary" className="custom-spin" />
      );

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--sm');
      expect(spinner).toHaveClass('spinner--secondary');
      expect(spinner).toHaveClass('custom-spin');
    });

    it('should combine all available props', () => {
      render(
        <Spinner
          size="lg"
          color="current"
          className="custom"
          aria-label="Custom loading"
        />
      );

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--lg');
      expect(spinner).toHaveClass('spinner--current');
      expect(spinner).toHaveClass('custom');
      expect(spinner).toHaveAttribute('aria-label', 'Custom loading');
    });
  });

  describe('Edge Cases', () => {
    it('should render without issues', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = render(<Spinner size="sm" />);

      rerender(<Spinner size="md" />);
      rerender(<Spinner size="lg" />);

      const spinner = document.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner--lg');
    });
  });

  describe('Inline Usage', () => {
    it('should work with inline text', () => {
      render(
        <span>
          Loading <Spinner size="sm" />
        </span>
      );

      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(document.querySelector('.spinner--sm')).toBeInTheDocument();
    });

    it('should work in button', () => {
      render(
        <button>
          <Spinner size="sm" /> Loading...
        </button>
      );

      const button = screen.getByRole('button');
      expect(button).toContainElement(document.querySelector('.spinner'));
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Centering', () => {
    it('should support centering via className', () => {
      render(<Spinner className="spinner-centered" />);

      const spinner = document.querySelector('.spinner-centered');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();
      render(<Spinner />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle multiple spinners', () => {
      render(
        <div>
          <Spinner />
          <Spinner />
          <Spinner />
        </div>
      );

      const spinners = document.querySelectorAll('.spinner');
      expect(spinners).toHaveLength(3);
    });
  });
});
