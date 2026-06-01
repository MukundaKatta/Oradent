'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  danger?: boolean;
}

interface DropdownButtonProps {
  label: string;
  items: DropdownItem[];
  variant?: 'primary' | 'secondary';
}

export function DropdownButton({ label, items, variant = 'primary' }: DropdownButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, handleClickOutside, handleKeyDown]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          variant === 'primary' && 'bg-teal-600 text-white hover:bg-teal-700',
          variant === 'secondary' && 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-stone-700 hover:bg-stone-100'
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
