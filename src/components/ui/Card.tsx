/**
 * Card Component
 * Container with elevation and padding
 */

import { memo, forwardRef, type HTMLAttributes } from 'react';
import './Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = memo(forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`card card--${variant} card--padding-${padding} ${hover ? 'card--hover' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
));

Card.displayName = 'Card';
