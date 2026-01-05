/**
 * Button Component Unit Tests
 * Tests for button variants, states, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

// Mock CSS
vi.mock('./Button.css', () => ({}));

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('should render as button element by default', () => {
      render(<Button>Test</Button>);

      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should accept custom className', () => {
      render(<Button className="custom-class">Test</Button>);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Test</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      render(<Button>Primary</Button>);

      expect(screen.getByRole('button')).toHaveClass('btn--primary');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      expect(screen.getByRole('button')).toHaveClass('btn--secondary');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      expect(screen.getByRole('button')).toHaveClass('btn--ghost');
    });

    it('should render danger variant', () => {
      render(<Button variant="danger">Danger</Button>);

      expect(screen.getByRole('button')).toHaveClass('btn--danger');
    });

    it('should render soft variant', () => {
      render(<Button variant="soft">Soft</Button>);

      expect(screen.getByRole('button')).toHaveClass('btn--soft');
    });

    it('should render gradient variant', () => {
      render(<Button variant="gradient">Gradient</Button>);

      expect(screen.getByRole('button')).toHaveClass('btn--gradient');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<Button>Default</Button>);

      expect(screen.getByRole('button')).toHaveClass('btn--md');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);

      expect(screen.getByRole('button')).toHaveClass('btn--sm');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);

      expect(screen.getByRole('button')).toHaveClass('btn--lg');
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>);

      // Component shows spinner element instead of adding btn-loading class
      const spinner = document.querySelector('.btn__spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      render(<Button isLoading>Loading</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not be clickable when loading', () => {
      const handleClick = vi.fn();
      render(<Button isLoading onClick={handleClick}>Loading</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Full Width', () => {
    it('should have fullWidth class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);

      // Component uses btn--full instead of btn--full-width
      expect(screen.getByRole('button')).toHaveClass('btn--full');
    });

    it('should not have fullWidth class by default', () => {
      render(<Button>Normal</Button>);

      expect(screen.getByRole('button')).not.toHaveClass('btn--full');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through standard button attributes', () => {
      render(
        <Button
          type="submit"
          name="test-button"
          value="test-value"
          aria-label="Test button"
        >
          Test
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'test-button');
      expect(button).toHaveAttribute('value', 'test-value');
      expect(button).toHaveAttribute('aria-label', 'Test button');
    });

    it('should support data attributes', () => {
      render(<Button data-testid="custom-button">Test</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('data-testid', 'custom-button');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<Button>Test</Button>);

      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
      expect(button).toHaveFocus();
    });

    it('should have proper focus styles', () => {
      render(<Button>Focus Test</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });
  });

  describe('Children', () => {
    it('should render text children', () => {
      render(<Button>Text Content</Button>);

      expect(screen.getByText('Text Content')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(
        <Button>
          🚀 Launch
        </Button>
      );

      expect(screen.getByText(/🚀/)).toBeInTheDocument();
      expect(screen.getByText(/Launch/)).toBeInTheDocument();
    });
  });

  describe('Combinations', () => {
    it('should combine variant and size', () => {
      render(<Button variant="danger" size="lg">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn--danger');
      expect(button).toHaveClass('btn--lg');
    });

    it('should combine loading with variant', () => {
      render(<Button variant="secondary" isLoading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn--secondary');
      // Component shows spinner element instead of adding btn-loading class
      const spinner = document.querySelector('.btn__spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should combine all props', () => {
      render(
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          isLoading
          className="custom"
        >
          All Props
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn--ghost');
      expect(button).toHaveClass('btn--sm');
      // Component uses btn--full instead of btn--full-width
      expect(button).toHaveClass('btn--full');
      expect(button).toHaveClass('custom');
      // Loading shows spinner element
      const spinner = document.querySelector('.btn__spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<Button>{null}</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle rapid clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });
});
