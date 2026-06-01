'use client';

import { cn } from '@/lib/utils';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  className?: string;
}

export function RadioGroup({ options, value, onChange, name, className }: RadioGroupProps) {
  return (
    <fieldset className={cn('space-y-0', className)} role="radiogroup">
      {options.map((option, index) => (
        <label
          key={option.value}
          className={cn(
            'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-stone-50',
            index < options.length - 1 && 'border-b border-stone-200'
          )}
        >
          <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'block h-4 w-4 rounded-full border-2 transition-colors',
                value === option.value
                  ? 'border-teal-600'
                  : 'border-stone-300 peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500 peer-focus-visible:ring-offset-2'
              )}
            />
            {value === option.value && (
              <span className="absolute h-2 w-2 rounded-full bg-teal-600" />
            )}
          </span>
          <div className="flex-1">
            <span className="text-sm font-medium text-stone-900">{option.label}</span>
            {option.description && (
              <p className="mt-0.5 text-xs text-stone-500">{option.description}</p>
            )}
          </div>
        </label>
      ))}
    </fieldset>
  );
}
