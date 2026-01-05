/**
 * Kbd (Keyboard) Component
 * Visual keyboard shortcut indicator
 */

import { memo, type HTMLAttributes } from 'react';
import './Kbd.css';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  compact?: boolean;
}

export const Kbd = memo(({
  compact = false,
  children,
  className = '',
  ...props
}: KbdProps) => {
  return (
    <kbd
      className={`kbd ${compact ? 'kbd--compact' : ''} ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
});

Kbd.displayName = 'Kbd';
