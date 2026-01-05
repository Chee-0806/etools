/**
 * Spinner Component
 * Loading spinner with sizes
 */

import { memo, type HTMLAttributes } from 'react';
import './Spinner.css';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'current';
}

export const Spinner = memo(({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}: SpinnerProps) => {
  return (
    <span
      className={`spinner spinner--${size} spinner--${color} ${className}`}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          opacity="0.25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </span>
  );
});

Spinner.displayName = 'Spinner';
