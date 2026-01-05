/**
 * Skeleton Component Unit Tests
 * Tests for loading placeholder variants and animations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './Skeleton';

// Mock CSS
vi.mock('./Skeleton.css', () => ({}));

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('should render skeleton element', () => {
      render(<Skeleton />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have loading role', () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have aria-label for accessibility', () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading');
    });

    it('should accept custom className', () => {
      render(<Skeleton className="custom-class" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render text variant by default', () => {
      render(<Skeleton />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--text');
    });

    it('should render text variant', () => {
      render(<Skeleton variant="text" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--text');
    });

    it('should render circular variant', () => {
      render(<Skeleton variant="circular" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--circular');
    });

    it('should render rectangular variant', () => {
      render(<Skeleton variant="rectangular" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--rectangular');
    });
  });

  describe('Animations', () => {
    it('should render pulse animation by default', () => {
      render(<Skeleton />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--pulse');
    });

    it('should render pulse animation', () => {
      render(<Skeleton animation="pulse" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--pulse');
    });

    it('should render wave animation', () => {
      render(<Skeleton animation="wave" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--wave');
    });

    it('should render no animation', () => {
      render(<Skeleton animation="none" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--none');
    });
  });

  describe('Dimensions', () => {
    it('should apply custom width', () => {
      render(<Skeleton width="200px" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveStyle({ width: '200px' });
    });

    it('should apply custom height', () => {
      render(<Skeleton height="50px" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveStyle({ height: '50px' });
    });

    it('should apply both width and height', () => {
      render(<Skeleton width="100%" height="100px" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveStyle({ width: '100%', height: '100px' });
    });

    it('should apply numeric width', () => {
      render(<Skeleton width={300} />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveStyle({ width: '300px' });
    });

    it('should apply numeric height', () => {
      render(<Skeleton height={40} />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveStyle({ height: '40px' });
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through standard div attributes', () => {
      render(
        <Skeleton
          id="test-skeleton"
          data-testid="custom-skeleton"
        />
      );

      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('id', 'test-skeleton');
      expect(skeleton).toHaveAttribute('data-testid', 'custom-skeleton');
    });
  });

  describe('Accessibility', () => {
    it('should have default aria-label', () => {
      render(<Skeleton />);

      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading');
    });

    it('should have custom aria-label', () => {
      render(<Skeleton aria-label="Loading content..." />);

      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content...');
    });
  });

  describe('Styling', () => {
    it('should apply custom styles', () => {
      render(<Skeleton style={{ margin: '10px' }} />);

      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ margin: '10px' });
    });

    it('should combine multiple classes', () => {
      render(<Skeleton className="class1 class2" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('class1');
      expect(skeleton).toHaveClass('class2');
    });
  });

  describe('Combinations', () => {
    it('should combine variant and animation', () => {
      render(<Skeleton variant="circular" animation="wave" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--circular');
      expect(skeleton).toHaveClass('skeleton--wave');
    });

    it('should combine variant, animation, and dimensions', () => {
      render(
        <Skeleton
          variant="rectangular"
          animation="pulse"
          width="100%"
          height="200px"
        />
      );

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveClass('skeleton--rectangular');
      expect(skeleton).toHaveClass('skeleton--pulse');
      expect(skeleton).toHaveStyle({ width: '100%', height: '200px' });
    });
  });

  describe('Use Cases', () => {
    it('should work as text placeholder', () => {
      render(<Skeleton variant="text" width="80%" />);

      const skeleton = document.querySelector('.skeleton--text');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveStyle({ width: '80%' });
    });

    it('should work as avatar placeholder', () => {
      render(<Skeleton variant="circular" width={40} height={40} />);

      const skeleton = document.querySelector('.skeleton--circular');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveStyle({ width: '40px', height: '40px' });
    });

    it('should work as image placeholder', () => {
      render(<Skeleton variant="rectangular" width="100%" height={200} />);

      const skeleton = document.querySelector('.skeleton--rectangular');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveStyle({ width: '100%', height: '200px' });
    });
  });

  describe('Multiple Skeletons', () => {
    it('should render multiple skeletons', () => {
      render(
        <div>
          <Skeleton variant="text" />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rectangular" height={100} />
        </div>
      );

      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('should create card loading state', () => {
      render(
        <div>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
      );

      expect(document.querySelectorAll('.skeleton').length).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero width', () => {
      render(<Skeleton width={0} />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle very large dimensions', () => {
      render(<Skeleton width="10000px" height="10000px" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveStyle({ width: '10000px', height: '10000px' });
    });

    it('should handle percentage dimensions', () => {
      render(<Skeleton width="100%" height="100%" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveStyle({ width: '100%', height: '100%' });
    });
  });

  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();
      render(<Skeleton />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle many skeletons', () => {
      const skeletons = Array.from({ length: 100 }, (_, i) => (
        <Skeleton key={i} variant="text" />
      ));

      render(<div>{skeletons}</div>);

      expect(document.querySelectorAll('.skeleton').length).toBe(100);
    });
  });

  describe('Responsive Behavior', () => {
    it('should support responsive width', () => {
      render(<Skeleton width="100vw" />);

      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toHaveStyle({ width: '100vw' });
    });

    it('should support responsive classes', () => {
      render(<Skeleton className="skeleton-responsive" />);

      const skeleton = document.querySelector('.skeleton-responsive');
      expect(skeleton).toBeInTheDocument();
    });
  });
});
