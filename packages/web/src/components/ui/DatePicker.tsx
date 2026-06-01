'use client';

import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
}

export function DatePicker({ value, onChange, label, placeholder, min, max, className }: DatePickerProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}
      <div className="relative">
        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className={cn(
            'w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-3 text-sm text-stone-900',
            'placeholder:text-stone-400',
            'focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </div>
    </div>
  );
}
