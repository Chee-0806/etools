/**
 * Card Component Unit Tests
 * Tests for card variants, padding, and accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

// Mock CSS
vi.mock('./Card.css', () => ({}));

describe('Card', () => {
  describe('Rendering', () => {
    it('should render card container', () => {
      render(<Card>Card content</Card>);

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render as div by default', () => {
      render(<Card>Content</Card>);

      const card = document.querySelector('.card');
      expect(card?.tagName).toBe('DIV');
    });

    it('should accept custom className', () => {
      render(<Card className="custom-class">Content</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveClass('custom-class');
    });

    it('should render children content', () => {
      render(
        <Card>
          <h1>Title</h1>
          <p>Description</p>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Card>Default</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card');
    });

    it('should apply variant class', () => {
      render(<Card variant="elevated">Elevated</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card--elevated');
    });

    it('should apply outlined variant', () => {
      render(<Card variant="outlined">Outlined</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card--outlined');
    });

    it('should apply flat variant (as filled)', () => {
      render(<Card variant="filled">Flat</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card--filled');
    });
  });

  describe('Padding', () => {
    it('should apply padding prop', () => {
      render(<Card padding="lg">Large padding</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card--padding-lg');
    });

    it('should apply small padding', () => {
      render(<Card padding="sm">Small padding</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card--padding-sm');
    });

    it('should have default padding', () => {
      render(<Card>Default padding</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card--padding-md');
    });
  });

  describe('Hover Effects', () => {
    it('should apply hover class when hover is true', () => {
      render(<Card hover>Hoverable card</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card--hover');
    });

    it('should not apply hover class by default', () => {
      render(<Card>Not hover</Card>);

      const card = document.querySelector('.card');
      expect(card).not.toHaveClass('card--hover');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through standard div attributes', () => {
      render(
        <Card
          id="test-card"
          data-testid="custom-card"
          role="article"
        >
          Content
        </Card>
      );

      const card = document.querySelector('.card');
      expect(card).toHaveAttribute('id', 'test-card');
      expect(card).toHaveAttribute('data-testid', 'custom-card');
      expect(card).toHaveAttribute('role', 'article');
    });
  });

  describe('Complex Content', () => {
    it('should render nested elements', () => {
      render(
        <Card>
          <div className="header">Header</div>
          <div className="body">Body content</div>
          <div className="footer">Footer</div>
        </Card>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should render with media content', () => {
      render(
        <Card>
          <img src="test.jpg" alt="Test" />
          <h3>Title</h3>
          <p>Description</p>
        </Card>
      );

      const img = screen.getByAltText('Test');
      expect(img).toBeInTheDocument();
      expect(img.tagName).toBe('IMG');
    });

    it('should render card actions', () => {
      render(
        <Card>
          <p>Content</p>
          <button>Action 1</button>
          <button>Action 2</button>
        </Card>
      );

      expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA roles', () => {
      render(<Card role="article">Article</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should support ARIA labels', () => {
      render(<Card aria-label="News card">News</Card>);

      const card = document.querySelector('.card');
      expect(card).toHaveAttribute('aria-label', 'News card');
    });

    it('should support ARIA describedby', () => {
      render(
        <Card aria-describedby="desc-1">
          Content
        </Card>
      );

      const card = document.querySelector('.card');
      expect(card).toHaveAttribute('aria-describedby', 'desc-1');
    });
  });

  describe('Styling', () => {
    it('should apply custom styles', () => {
      render(
        <Card style={{ backgroundColor: 'red' }}>
          Styled
        </Card>
      );

      const card = document.querySelector('.card') as HTMLElement;
      expect(card?.style.backgroundColor).toBeTruthy();
    });

    it('should combine multiple classes', () => {
      render(
        <Card className="class1 class2" variant="elevated">
          Multiple classes
        </Card>
      );

      const card = document.querySelector('.card');
      expect(card).toHaveClass('class1');
      expect(card).toHaveClass('class2');
      expect(card).toHaveClass('card--elevated');
    });
  });

  describe('Interactive Elements', () => {
    it('should contain clickable elements', () => {
      render(
        <Card>
          <a href="/link">Link</a>
        </Card>
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/link');
    });

    it('should contain form elements', () => {
      render(
        <Card>
          <input type="checkbox" />
          <label>Checkbox</label>
        </Card>
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Card></Card>);

      const card = document.querySelector('.card');
      expect(card).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<Card>{null}</Card>);

      const card = document.querySelector('.card');
      expect(card).toBeInTheDocument();
    });

    it('should handle long content', () => {
      const longContent = 'A'.repeat(10000);
      render(
        <Card>
          {longContent}
        </Card>
      );

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(
        <Card>
          {'Special: !@#$%^&*()_+-=[]{}|:\'"<>?/'}
        </Card>
      );

      expect(screen.getByText(/Special:/)).toBeInTheDocument();
    });
  });

  describe('Combinations', () => {
    it('should combine variant and padding', () => {
      render(
        <Card variant="outlined" padding="lg">
          Combined
        </Card>
      );

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card--outlined');
      expect(card).toHaveClass('card--padding-lg');
    });

    it('should combine variant, padding, and hover', () => {
      render(
        <Card variant="elevated" padding="md" hover>
          All props
        </Card>
      );

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card--elevated');
      expect(card).toHaveClass('card--padding-md');
      expect(card).toHaveClass('card--hover');
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive classes', () => {
      render(
        <Card className="card-responsive">
          Responsive
        </Card>
      );

      const card = document.querySelector('.card');
      expect(card).toHaveClass('card-responsive');
    });
  });

  describe('Card Sections', () => {
    it('should support header section', () => {
      render(
        <Card>
          <div className="card-header">Header</div>
          <div className="card-body">Body</div>
        </Card>
      );

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
    });

    it('should support footer section', () => {
      render(
        <Card>
          <div className="card-body">Body</div>
          <div className="card-footer">Footer</div>
        </Card>
      );

      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });
});
