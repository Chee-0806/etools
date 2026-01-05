/**
 * Skeleton Component
 * Loading placeholder with animation
 */

import { memo, type HTMLAttributes } from 'react';
import './Skeleton.css';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = memo(({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  ...props
}: SkeletonProps) => {
  const style = {
    width: width ?? undefined,
    height: height ?? undefined,
  };

  return (
    <div
      className={`skeleton skeleton--${variant} skeleton--${animation} ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';
