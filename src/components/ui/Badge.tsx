/**
 * Badge Component
 * Small status or label badge
 */

import { memo, type HTMLAttributes } from 'react';
import './Badge.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = memo(({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className = '',
  ...props
}: BadgeProps) => {
  return (
    <span
      className={`badge badge--${variant} badge--${size} ${dot ? 'badge--dot' : ''} ${className}`}
      {...props}
    >
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
