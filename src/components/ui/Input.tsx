/**
 * Input Component
 * Accessible text input with variants
 */

import { memo, forwardRef, type InputHTMLAttributes } from 'react';
import './Input.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'filled' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = memo(forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`input-wrapper input-wrapper--${variant} ${error ? 'input-wrapper--error' : ''} ${className}`}>
        {leftIcon && <span className="input__icon input__icon--left">{leftIcon}</span>}
        <input
          ref={ref}
          className={`input input--${size}`}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {rightIcon && <span className="input__icon input__icon--right">{rightIcon}</span>}
        {error && (
          <span id={`${props.id}-error`} className="input__error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
));

Input.displayName = 'Input';
