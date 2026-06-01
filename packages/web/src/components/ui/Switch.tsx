'use client';

import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

const SIZE_CONFIG = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-3.5 w-3.5',
    translate: 'translate-x-4',
    padding: 'p-0.5',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-4.5 w-4.5',
    translate: 'translate-x-5',
    padding: 'p-0.5',
  },
} as const;

export function Switch({ checked, onChange, disabled = false, label, size = 'md' }: SwitchProps) {
  const config = SIZE_CONFIG[size];

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
          config.track,
          config.padding,
          checked ? 'bg-teal-600' : 'bg-stone-300'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out',
            config.thumb,
            checked ? config.translate : 'translate-x-0'
          )}
        />
      </button>
      {label && (
        <span className="text-sm text-stone-700">{label}</span>
      )}
    </label>
  );
}
