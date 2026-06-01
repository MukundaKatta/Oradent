'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  colors?: string[];
  className?: string;
}

const DEFAULT_COLORS = [
  '#0D9488', // teal-600
  '#2563EB', // blue-600
  '#7C3AED', // violet-600
  '#DC2626', // red-600
  '#EA580C', // orange-600
  '#16A34A', // green-600
  '#CA8A04', // yellow-600
  '#64748B', // slate-500
];

export function ColorPicker({ value, onChange, colors = DEFAULT_COLORS, className }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const isPreset = colors.includes(value);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              onChange(color);
              setShowCustom(false);
            }}
            className={cn(
              'h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none',
              value === color && 'ring-2 ring-offset-2 ring-stone-400'
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-stone-300 text-xs text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-500',
            showCustom && 'border-teal-500 text-teal-600'
          )}
          title="Custom color"
        >
          +
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={isPreset ? '#0D9488' : value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-stone-300"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="w-28 rounded-lg border border-stone-300 px-2 py-1 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      )}
    </div>
  );
}
