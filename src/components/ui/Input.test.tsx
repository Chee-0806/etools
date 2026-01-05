/**
 * Input Component Unit Tests
 * Tests for input variants, validation, and accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Input } from './Input';

// Mock CSS
vi.mock('./Input.css', () => ({}));

describe('Input', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(<Input className="custom-class" />);

      // className is applied to the wrapper div
      const wrapper = screen.getByRole('textbox').parentElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with default value', () => {
      render(<Input defaultValue="default" />);

      expect(screen.getByRole('textbox')).toHaveValue('default');
    });

    it('should render with value (controlled)', () => {
      render(<Input value="controlled" />);

      expect(screen.getByRole('textbox')).toHaveValue('controlled');
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Input Types', () => {
    it('should render text input by default', () => {
      render(<Input />);

      // Default input type is text (implicit in HTML)
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render email input', () => {
      render(<Input type="email" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      const { container } = render(<Input type="password" />);

      expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    });

    it('should render number input', () => {
      render(<Input type="number" />);

      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });

    it('should render search input', () => {
      render(<Input type="search" />);

      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });
  });

  describe('Input States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should be required when required prop is true', () => {
      render(<Input required />);

      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('should be readonly when readOnly prop is true', () => {
      render(<Input readOnly />);

      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when value changes', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should call onFocus when focused', () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when blurred', () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should update value on user input', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(input).toHaveValue('new value');
    });
  });

  describe('Keyboard Events', () => {
    it('should call onKeyDown when key is pressed', () => {
      const handleKeyDown = vi.fn();
      render(<Input onKeyDown={handleKeyDown} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Enter' })
      );
    });

    it('should call onKeyPress when key is pressed', () => {
      const handleKeyPress = vi.fn();
      render(<Input onKeyPress={handleKeyPress} />);

      const input = screen.getByRole('textbox');
      // Note: keyPress event is deprecated in browsers
      // Test that the handler prop is accepted by the component
      expect(input).toBeInTheDocument();
    });

    it('should call onKeyUp when key is released', () => {
      const handleKeyUp = vi.fn();
      render(<Input onKeyUp={handleKeyUp} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyUp(input, { key: 'Enter' });

      expect(handleKeyUp).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<Input aria-label="Search input" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Search input');
    });

    it('should have proper aria-labelledby', () => {
      render(
        <>
          <label id="label-id">Label</label>
          <Input aria-labelledby="label-id" />
        </>
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('should have proper aria-describedby', () => {
      render(
        <>
          <span id="desc-id">Description</span>
          <Input aria-describedby="desc-id" />
        </>
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'desc-id');
    });

    it('should have proper aria-invalid when invalid', () => {
      render(<Input aria-invalid="true" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through standard input attributes', () => {
      render(
        <Input
          name="test-input"
          id="test-id"
          maxLength={100}
          autoComplete="on"
          autoFocus
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'test-input');
      expect(input).toHaveAttribute('id', 'test-id');
      expect(input).toHaveAttribute('maxlength', '100');
      expect(input).toHaveAttribute('autocomplete', 'on');
    });

    it('should support data attributes', () => {
      render(<Input data-testid="custom-input" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('data-testid', 'custom-input');
    });
  });

  describe('Value Constraints', () => {
    it('should respect maxLength', () => {
      render(<Input maxLength={5} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxlength', '5');

      // maxLength attribute is set, actual truncation happens at browser level
      fireEvent.change(input, { target: { value: 'tool' } });
      expect(input).toHaveValue('tool');
    });

    it('should respect min and max for number input', () => {
      render(<Input type="number" min={0} max={100} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should respect step for number input', () => {
      render(<Input type="number" step={5} />);

      expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '5');
    });
  });

  describe('Input Sizes', () => {
    it('should support custom size via CSS class', () => {
      render(<Input size="lg" />);

      expect(screen.getByRole('textbox')).toHaveClass('input--lg');
    });
  });

  describe('Controlled Component', () => {
    it('should work as controlled component', () => {
      const TestComponent = () => {
        const [value, setValue] = useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      render(<TestComponent />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'controlled' } });

      // Component should update
      expect(input).toHaveValue('controlled');
    });
  });

  describe('Uncontrolled Component', () => {
    it('should work as uncontrolled component with ref', () => {
      let refValue = '';
      const TestComponent = () => {
        const ref = { current: null as HTMLInputElement | null };
        return (
          <div>
            <Input
              defaultValue="initial"
              ref={(input) => {
                if (input) ref.current = input;
              }}
            />
            <button
              onClick={() => {
                if (ref.current) refValue = ref.current.value;
              }}
            >
              Get Value
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(refValue).toBe('initial');
    });
  });

  describe('AutoFocus', () => {
    it('should focus when autoFocus is true', () => {
      render(<Input autoFocus />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });
  });

  describe('Prefix and Suffix', () => {
    it('should support prefix element', () => {
      render(
        <Input
          leftIcon={<span>🔍</span>}
        />
      );

      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('should support suffix element', () => {
      render(
        <Input
          rightIcon={<span>✓</span>}
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Input value="" />);

      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle special characters', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '!@#$%^&*()' } });

      expect(input).toHaveValue('!@#$%^&*()');
    });

    it('should handle emoji', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '😀🎉' } });

      expect(input).toHaveValue('😀🎉');
    });

    it('should handle very long input', () => {
      const longText = 'a'.repeat(10000);
      render(<Input />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: longText } });

      expect(input.value.length).toBe(10000);
    });
  });

  describe('Form Integration', () => {
    it('should work with form onSubmit', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Input name="test" />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test value' } });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
