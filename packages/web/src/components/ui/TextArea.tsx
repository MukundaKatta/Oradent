'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  maxLength?: number;
  showCharCount?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const RESIZE_MAP = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
} as const;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    label,
    error,
    helperText,
    rows = 4,
    resize = 'vertical',
    maxLength,
    showCharCount = false,
    className,
    id,
    value,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-stone-700"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        className={cn(
          'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-stone-300 focus:border-teal-500 focus:ring-teal-500/20',
          RESIZE_MAP[resize]
        )}
        {...props}
      />
      <div className="mt-1 flex items-center justify-between">
        <div>
          {error && (
            <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          {!error && helperText && (
            <p id={`${inputId}-helper`} className="text-xs text-stone-500">
              {helperText}
            </p>
          )}
        </div>
        {showCharCount && (
          <span
            className={cn(
              'text-xs',
              maxLength && charCount >= maxLength ? 'text-red-500' : 'text-stone-400'
            )}
          >
            {charCount}
            {maxLength ? `/${maxLength}` : ''}
          </span>
        )}
      </div>
    </div>
  );
});
