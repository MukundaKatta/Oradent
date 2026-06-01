'use client';

import { useRef, useEffect } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
  className,
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className
      )}
    >
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          ref={inputRef}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
          aria-checked={indeterminate ? 'mixed' : checked}
        />
        <span
          className={cn(
            'block h-4 w-4 rounded border transition-colors',
            checked || indeterminate
              ? 'border-teal-600 bg-teal-600'
              : 'border-stone-300 bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 peer-focus-visible:ring-offset-2'
          )}
        />
        {(checked || indeterminate) && (
          <span className="absolute inset-0 flex items-center justify-center text-white">
            {indeterminate ? (
              <Minus className="h-3 w-3" strokeWidth={3} />
            ) : (
              <Check className="h-3 w-3" strokeWidth={3} />
            )}
          </span>
        )}
      </span>
      {label && <span className="text-sm text-stone-700">{label}</span>}
    </label>
  );
}
