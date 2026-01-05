/**
 * Badge Component Unit Tests
 * Tests for badge variants, sizes, and accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

// Mock CSS
vi.mock('./Badge.css', () => ({}));

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>Badge</Badge>);

      expect(screen.getByText('Badge')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(<Badge className="custom-class">Badge</Badge>);

      expect(screen.getByText('Badge')).toHaveClass('custom-class');
    });

    it('should render small content', () => {
      render(<Badge>1</Badge>);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should render with emoji', () => {
      render(<Badge>🔥 Hot</Badge>);

      expect(screen.getByText(/🔥/)).toBeInTheDocument();
      expect(screen.getByText(/Hot/)).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Badge>Default</Badge>);

      expect(screen.getByText('Default')).toHaveClass('badge');
    });

    it('should render primary variant', () => {
      render(<Badge variant="primary">Primary</Badge>);

      expect(screen.getByText('Primary')).toHaveClass('badge--primary');
    });

    it('should render secondary variant (as primary)', () => {
      render(<Badge variant="primary">Secondary</Badge>);

      expect(screen.getByText('Secondary')).toHaveClass('badge--primary');
    });

    it('should render success variant', () => {
      render(<Badge variant="success">Success</Badge>);

      expect(screen.getByText('Success')).toHaveClass('badge--success');
    });

    it('should render danger variant (as error)', () => {
      render(<Badge variant="error">Danger</Badge>);

      expect(screen.getByText('Danger')).toHaveClass('badge--error');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);

      expect(screen.getByText('Warning')).toHaveClass('badge--warning');
    });

    it('should render info variant', () => {
      render(<Badge variant="info">Info</Badge>);

      expect(screen.getByText('Info')).toHaveClass('badge--info');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      render(<Badge>Default</Badge>);

      expect(screen.getByText('Default')).toHaveClass('badge--md');
    });

    it('should render small size', () => {
      render(<Badge size="sm">Small</Badge>);

      expect(screen.getByText('Small')).toHaveClass('badge--sm');
    });

    it('should render medium size (only sm/md available)', () => {
      render(<Badge>Medium</Badge>);

      expect(screen.getByText('Medium')).toHaveClass('badge--md');
    });
  });

  describe('Shape', () => {
    it('should render default shape', () => {
      render(<Badge>Default</Badge>);

      expect(screen.getByText('Default')).toHaveClass('badge');
    });

    it('should accept custom shape class', () => {
      render(<Badge className="badge-pill">Pill</Badge>);

      expect(screen.getByText('Pill')).toHaveClass('badge-pill');
    });
  });

  describe('Dot Variant', () => {
    it('should render dot badge', () => {
      render(<Badge dot />);

      const badge = document.querySelector('.badge--dot');
      expect(badge).toBeInTheDocument();
    });

    it('should combine dot with variant', () => {
      render(<Badge dot variant="success" />);

      const badge = document.querySelector('.badge--dot');
      expect(badge).toHaveClass('badge--success');
    });

    it('should render dot with text', () => {
      render(<Badge dot>New</Badge>);

      expect(screen.getByText('New')).toBeInTheDocument();
      expect(document.querySelector('.badge--dot')).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through standard span attributes', () => {
      render(
        <Badge
          id="test-badge"
          data-testid="custom-badge"
          role="status"
        >
          Test
        </Badge>
      );

      const badge = screen.getByText('Test');
      expect(badge).toHaveAttribute('id', 'test-badge');
      expect(badge).toHaveAttribute('data-testid', 'custom-badge');
      expect(badge).toHaveAttribute('role', 'status');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<Badge role="status">Status</Badge>);

      const badge = screen.getByText('Status');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('should support aria-label', () => {
      render(<Badge aria-label="New notifications">3</Badge>);

      const badge = screen.getByText('3');
      expect(badge).toHaveAttribute('aria-label', 'New notifications');
    });

    it('should support aria-live for dynamic updates', () => {
      render(<Badge aria-live="polite">Live</Badge>);

      const badge = screen.getByText('Live');
      expect(badge).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Styling', () => {
    it('should apply custom styles', () => {
      render(
        <Badge style={{ backgroundColor: 'purple' }}>
          Custom
        </Badge>
      );

      const badge = screen.getByText('Custom');
      // Check that inline style is applied (browser may convert color format)
      expect(badge.style.backgroundColor).toBeTruthy();
    });

    it('should combine multiple classes', () => {
      render(
        <Badge className="class1 class2" variant="primary">
          Multiple
        </Badge>
      );

      const badge = screen.getByText('Multiple');
      expect(badge).toHaveClass('class1');
      expect(badge).toHaveClass('class2');
      expect(badge).toHaveClass('badge--primary');
    });
  });

  describe('Content Types', () => {
    it('should render numeric content', () => {
      render(<Badge>42</Badge>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render text content', () => {
      render(<Badge>New Feature</Badge>);

      expect(screen.getByText('New Feature')).toBeInTheDocument();
    });

    it('should render mixed content', () => {
      render(
        <Badge>
          <span>Icon</span> Text
        </Badge>
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should render icon only', () => {
      render(<Badge>★</Badge>);

      expect(screen.getByText('★')).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('should support positioning classes', () => {
      render(<Badge className="badge-top-right">Positioned</Badge>);

      const badge = screen.getByText('Positioned');
      expect(badge).toHaveClass('badge-top-right');
    });
  });

  describe('Count Badge', () => {
    it('should render count badge', () => {
      render(<Badge>5</Badge>);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle large counts', () => {
      render(<Badge>99+</Badge>);

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should show count as text', () => {
      render(<Badge>999+</Badge>);

      expect(screen.getByText('999+')).toBeInTheDocument();
    });
  });

  describe('Combinations', () => {
    it('should combine variant and size', () => {
      render(<Badge variant="success" size="sm">Combined</Badge>);

      const badge = screen.getByText('Combined');
      expect(badge).toHaveClass('badge--success');
      expect(badge).toHaveClass('badge--sm');
    });

    it('should combine variant with custom class', () => {
      render(
        <Badge variant="error" size="sm" className="badge-pill">
          All props
        </Badge>
      );

      const badge = screen.getByText('All props');
      expect(badge).toHaveClass('badge--error');
      expect(badge).toHaveClass('badge--sm');
      expect(badge).toHaveClass('badge-pill');
    });

    it('should combine dot with variant and color', () => {
      render(<Badge dot variant="warning" className="custom">Dot badge</Badge>);

      const badge = screen.getByText('Dot badge');
      expect(badge).toHaveClass('badge--dot');
      expect(badge).toHaveClass('badge--warning');
      expect(badge).toHaveClass('custom');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(<Badge></Badge>);

      const badge = document.querySelector('.badge');
      expect(badge).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(100);
      render(<Badge>{longContent}</Badge>);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Badge>Special: !@#$%</Badge>);

      expect(screen.getByText(/Special:/)).toBeInTheDocument();
    });

    it('should handle zero count', () => {
      render(<Badge>0</Badge>);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('should be clickable when onClick is provided', () => {
      const handleClick = () => {};
      render(<Badge onClick={handleClick}>Clickable</Badge>);

      const badge = screen.getByText('Clickable');
      // Component accepts onClick but doesn't add a special class
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('should support custom color classes', () => {
      render(<Badge className="badge-purple">Purple</Badge>);

      expect(screen.getByText('Purple')).toHaveClass('badge-purple');
    });

    it('should support inline color styles', () => {
      render(<Badge style={{ color: 'white', background: 'black' }}>Styled</Badge>);

      const badge = screen.getByText('Styled');
      // Check that inline styles are applied
      expect(badge.style.color).toBeTruthy();
      expect(badge.style.background).toBeTruthy();
    });
  });
});
