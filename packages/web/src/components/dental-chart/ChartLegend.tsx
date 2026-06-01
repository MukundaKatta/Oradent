'use client';

import React, { useState, useCallback } from 'react';
import {
  CONDITION_COLORS,
  CONDITION_LABELS,
  CONDITION_KEYS,
} from '@/lib/conditionColors';

interface ChartLegendProps {
  conditionCounts?: Record<string, number>;
  activeFilter?: string | null;
  onFilterChange?: (condition: string | null) => void;
}

export default function ChartLegend({
  conditionCounts,
  activeFilter,
  onFilterChange,
}: ChartLegendProps) {
  const [internalFilter, setInternalFilter] = useState<string | null>(null);

  const currentFilter = activeFilter !== undefined ? activeFilter : internalFilter;

  const handleClick = useCallback(
    (key: string) => {
      const newValue = currentFilter === key ? null : key;
      if (onFilterChange) {
        onFilterChange(newValue);
      } else {
        setInternalFilter(newValue);
      }
    },
    [currentFilter, onFilterChange]
  );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-2 py-2">
      {CONDITION_KEYS.map((key) => {
        const count = conditionCounts?.[key];
        const isActive = currentFilter === key;
        const isDimmed = currentFilter !== null && !isActive;

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleClick(key)}
            className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-opacity ${
              isDimmed ? 'opacity-40' : 'opacity-100'
            } ${isActive ? 'ring-1 ring-slate-400 bg-slate-50' : ''} hover:opacity-100`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm border border-slate-300"
              style={{ backgroundColor: CONDITION_COLORS[key] }}
            />
            <span className="text-[11px] text-slate-600 font-medium">
              {CONDITION_LABELS[key]}
            </span>
            {count !== undefined && count > 0 && (
              <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-semibold text-slate-700">
                {count}
              </span>
            )}
          </button>
        );
      })}
      {currentFilter !== null && (
        <button
          type="button"
          onClick={() => {
            if (onFilterChange) {
              onFilterChange(null);
            } else {
              setInternalFilter(null);
            }
          }}
          className="ml-1 text-[11px] font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
