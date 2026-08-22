import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  label?: string;
  /**
   * 'lg' (default) — full block loader, e.g. a whole page/section while data loads.
   * 'md' — compact block loader for a fixed-height container (e.g. a card or chart area).
   * 'sm' — inline loader for buttons/rows; inherits the surrounding text color.
   */
  size?: 'sm' | 'md' | 'lg';
}

const DOT_SIZE: Record<NonNullable<LoaderProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const Dots: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <style>
      {`
        @keyframes loader-dot-1 { to { transform: translate(60px, -100px); } }
        @keyframes loader-dot-2 { to { transform: translate(60px, 100px); } }
        @keyframes loader-dot-3 { to { transform: translate(-120px, 0); } }
      `}
    </style>
    <g fill="currentColor" stroke="currentColor" strokeWidth={15}>
      <circle r={15} cx={40} cy={150} style={{ animation: 'loader-dot-1 2s cubic-bezier(.5,0,.5,1) infinite' }} />
      <circle r={15} cx={100} cy={50} style={{ animation: 'loader-dot-2 2s cubic-bezier(.5,0,.5,1) infinite' }} />
      <circle r={15} cx={160} cy={150} style={{ animation: 'loader-dot-3 2s cubic-bezier(.5,0,.5,1) infinite' }} />
    </g>
  </svg>
);

export const Loader: React.FC<LoaderProps> = ({ className, label, size = 'lg' }) => {
  if (size === 'sm') {
    return (
      <span className={cn('inline-flex items-center gap-2', className)} role="status">
        <Dots className={DOT_SIZE.sm} />
        {label && <span>{label}</span>}
      </span>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        size === 'lg' && 'py-16',
        className
      )}
    >
      <Dots className={cn(DOT_SIZE[size], 'text-primary')} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
};
