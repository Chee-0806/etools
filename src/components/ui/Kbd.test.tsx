/**
 * Kbd Component Unit Tests
 * Tests for keyboard key display component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Kbd } from './Kbd';

// Mock CSS
vi.mock('./Kbd.css', () => ({}));

describe('Kbd', () => {
  describe('Rendering', () => {
    it('should render keyboard key', () => {
      render(<Kbd>Ctrl</Kbd>);

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
    });

    it('should render as kbd element', () => {
      render(<Kbd>A</Kbd>);

      const kbd = screen.getByText('A');
      expect(kbd.tagName).toBe('KBD');
    });

    it('should accept custom className', () => {
      render(<Kbd className="custom-class">Esc</Kbd>);

      expect(screen.getByText('Esc')).toHaveClass('custom-class');
    });

    it('should have kbd class by default', () => {
      render(<Kbd>Enter</Kbd>);

      expect(screen.getByText('Enter')).toHaveClass('kbd');
    });
  });

  describe('Content', () => {
    it('should render single character', () => {
      render(<Kbd>A</Kbd>);

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should render key name', () => {
      render(<Kbd>Enter</Kbd>);

      expect(screen.getByText('Enter')).toBeInTheDocument();
    });

    it('should render key combination', () => {
      render(
        <div>
          <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>
        </div>
      );

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('should render arrow keys', () => {
      render(<Kbd>↑</Kbd>);

      expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('should render special symbols', () => {
      render(<Kbd>⌘</Kbd>);

      expect(screen.getByText('⌘')).toBeInTheDocument();
    });

    it('should render function keys', () => {
      render(<Kbd>F1</Kbd>);

      expect(screen.getByText('F1')).toBeInTheDocument();
    });

    it('should render with modifier keys', () => {
      render(
        <div>
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>5</Kbd>
        </div>
      );

      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('⇧')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Kbd>A</Kbd>);

      expect(screen.getByText('A')).toHaveClass('kbd');
    });

    it('should render compact variant', () => {
      render(<Kbd compact>X</Kbd>);

      expect(screen.getByText('X')).toHaveClass('kbd--compact');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through standard kbd attributes', () => {
      render(
        <Kbd
          id="test-kbd"
          data-testid="custom-kbd"
          title="Press this key"
        >
          A
        </Kbd>
      );

      const kbd = screen.getByText('A');
      expect(kbd).toHaveAttribute('id', 'test-kbd');
      expect(kbd).toHaveAttribute('data-testid', 'custom-kbd');
      expect(kbd).toHaveAttribute('title', 'Press this key');
    });
  });

  describe('Accessibility', () => {
    it('should have kbd semantic element', () => {
      render(<Kbd>Enter</Kbd>);

      const kbd = screen.getByText('Enter');
      expect(kbd.tagName).toBe('KBD');
    });

    it('should support aria-label', () => {
      render(<Kbd aria-label="Control key">Ctrl</Kbd>);

      const kbd = screen.getByText('Ctrl');
      expect(kbd).toHaveAttribute('aria-label', 'Control key');
    });

    it('should support aria-keyshortcuts', () => {
      render(<Kbd aria-keyshortcuts="Control+S">Ctrl+S</Kbd>);

      const kbd = screen.getByText('Ctrl+S');
      expect(kbd).toHaveAttribute('aria-keyshortcuts', 'Control+S');
    });
  });

  describe('Styling', () => {
    it('should apply custom styles', () => {
      render(<Kbd style={{ color: 'red' }}>X</Kbd>);

      const kbd = screen.getByText('X');
      // Browsers convert named colors to rgb format
      expect(kbd).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('should combine multiple classes', () => {
      render(<Kbd className="class1 class2">A</Kbd>);

      const kbd = screen.getByText('A');
      expect(kbd).toHaveClass('class1');
      expect(kbd).toHaveClass('class2');
    });
  });

  describe('Common Key Combinations', () => {
    it('should render copy shortcut', () => {
      render(
        <div>
          <Kbd>⌘</Kbd>
          <Kbd>C</Kbd>
        </div>
      );

      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should render paste shortcut', () => {
      render(
        <div>
          <Kbd>⌘</Kbd>
          <Kbd>V</Kbd>
        </div>
      );

      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('V')).toBeInTheDocument();
    });

    it('should render save shortcut', () => {
      render(
        <div>
          <Kbd>Ctrl</Kbd>
          <Kbd>S</Kbd>
        </div>
      );

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('should render select all shortcut', () => {
      render(
        <div>
          <Kbd>⌘</Kbd>
          <Kbd>A</Kbd>
        </div>
      );

      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('Modifier Keys', () => {
    it('should render Control key', () => {
      render(<Kbd>Ctrl</Kbd>);

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
    });

    it('should render Alt key', () => {
      render(<Kbd>Alt</Kbd>);

      expect(screen.getByText('Alt')).toBeInTheDocument();
    });

    it('should render Shift key', () => {
      render(<Kbd>Shift</Kbd>);

      expect(screen.getByText('Shift')).toBeInTheDocument();
    });

    it('should render Option key (Mac)', () => {
      render(<Kbd>⌥</Kbd>);

      expect(screen.getByText('⌥')).toBeInTheDocument();
    });

    it('should render Command key (Mac)', () => {
      render(<Kbd>⌘</Kbd>);

      expect(screen.getByText('⌘')).toBeInTheDocument();
    });
  });

  describe('Special Keys', () => {
    it('should render Enter key', () => {
      render(<Kbd>Enter</Kbd>);

      expect(screen.getByText('Enter')).toBeInTheDocument();
    });

    it('should render Escape key', () => {
      render(<Kbd>Esc</Kbd>);

      expect(screen.getByText('Esc')).toBeInTheDocument();
    });

    it('should render Tab key', () => {
      render(<Kbd>Tab</Kbd>);

      expect(screen.getByText('Tab')).toBeInTheDocument();
    });

    it('should render Backspace key', () => {
      render(<Kbd>⌫</Kbd>);

      expect(screen.getByText('⌫')).toBeInTheDocument();
    });

    it('should render Delete key', () => {
      render(<Kbd>Del</Kbd>);

      expect(screen.getByText('Del')).toBeInTheDocument();
    });

    it('should render Space key', () => {
      render(<Kbd>Space</Kbd>);

      expect(screen.getByText('Space')).toBeInTheDocument();
    });
  });

  describe('Arrow Keys', () => {
    it('should render arrow up', () => {
      render(<Kbd>↑</Kbd>);

      expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('should render arrow down', () => {
      render(<Kbd>↓</Kbd>);

      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('should render arrow left', () => {
      render(<Kbd>←</Kbd>);

      expect(screen.getByText('←')).toBeInTheDocument();
    });

    it('should render arrow right', () => {
      render(<Kbd>→</Kbd>);

      expect(screen.getByText('→')).toBeInTheDocument();
    });
  });

  describe('Function Keys', () => {
    it('should render F1', () => {
      render(<Kbd>F1</Kbd>);

      expect(screen.getByText('F1')).toBeInTheDocument();
    });

    it('should render F12', () => {
      render(<Kbd>F12</Kbd>);

      expect(screen.getByText('F12')).toBeInTheDocument();
    });
  });

  describe('Combinations', () => {
    it('should combine compact with custom class', () => {
      render(<Kbd compact className="custom">Esc</Kbd>);

      const kbd = screen.getByText('Esc');
      expect(kbd).toHaveClass('kbd--compact');
      expect(kbd).toHaveClass('custom');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(<Kbd></Kbd>);

      const kbd = document.querySelector('.kbd');
      expect(kbd).toBeInTheDocument();
    });

    it('should handle very long key name', () => {
      render(<Kbd>VeryLongKeyName</Kbd>);

      expect(screen.getByText('VeryLongKeyName')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Kbd>+ - / *</Kbd>);

      expect(screen.getByText('+ - / *')).toBeInTheDocument();
    });
  });

  describe('Common Use Cases', () => {
    it('should display keyboard shortcut hint', () => {
      render(
        <div>
          Press <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd> to save
        </div>
      );

      // The text content is split across elements, check the container and individual parts
      expect(screen.getByText('Ctrl')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      // Check that the container has the expected text content
      const container = screen.getByText(/Press/);
      expect(container).toBeInTheDocument();
    });

    it('should work in a list of shortcuts', () => {
      render(
        <ul>
          <li><Kbd>Ctrl</Kbd> + <Kbd>C</Kbd> Copy</li>
          <li><Kbd>Ctrl</Kbd> + <Kbd>V</Kbd> Paste</li>
        </ul>
      );

      expect(screen.getAllByRole('listitem').length).toBe(2);
    });

    it('should work in keyboard shortcut table', () => {
      render(
        <table>
          <tbody>
            <tr>
              <td>Save</td>
              <td><Kbd>Ctrl</Kbd> + <Kbd>S</Kbd></td>
            </tr>
            <tr>
              <td>Open</td>
              <td><Kbd>Ctrl</Kbd> + <Kbd>O</Kbd></td>
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now();
      render(<Kbd>A</Kbd>);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle many keys', () => {
      const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(key => (
        <Kbd key={key}>{key}</Kbd>
      ));

      render(<div>{keys}</div>);

      expect(document.querySelectorAll('.kbd').length).toBe(10);
    });
  });

  describe('Platform Differences', () => {
    it('should render Windows shortcuts', () => {
      render(
        <div>
          <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>
        </div>
      );

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
    });

    it('should render Mac shortcuts', () => {
      render(
        <div>
          <Kbd>⌘</Kbd> + <Kbd>S</Kbd>
        </div>
      );

      expect(screen.getByText('⌘')).toBeInTheDocument();
    });
  });
});
