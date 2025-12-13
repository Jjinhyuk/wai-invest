'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [show, setShow] = React.useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-sm text-white bg-slate-800 rounded-lg shadow-lg max-w-xs whitespace-normal",
            positions[side],
            className
          )}
        >
          {content}
          <div
            className={cn(
              "absolute w-0 h-0 border-4",
              arrows[side]
            )}
          />
        </div>
      )}
    </div>
  );
}

interface TooltipIconProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function TooltipIcon({ content, side = 'top' }: TooltipIconProps) {
  return (
    <Tooltip content={content} side={side}>
      <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-slate-400 hover:text-slate-600 cursor-help rounded-full border border-slate-300 hover:border-slate-400 transition-colors">
        ?
      </span>
    </Tooltip>
  );
}
