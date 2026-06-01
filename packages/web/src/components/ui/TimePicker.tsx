'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  minuteStep?: number;
  className?: string;
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

function toTimeValue(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function generateTimeSlots(step: number): { label: string; value: string }[] {
  const slots: { label: string; value: string }[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += step) {
      if (hour === 21 && minute > 0) break;
      slots.push({
        label: formatTime(hour, minute),
        value: toTimeValue(hour, minute),
      });
    }
  }
  return slots;
}

export function TimePicker({ value, onChange, label, minuteStep = 15, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const slots = useMemo(() => generateTimeSlots(minuteStep), [minuteStep]);

  const displayValue = useMemo(() => {
    if (!value) return '';
    const [hourStr, minuteStr] = value.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) return value;
    return formatTime(hour, minute);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-3 text-left text-sm',
            'focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
            value ? 'text-stone-900' : 'text-stone-400'
          )}
        >
          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <span className="flex-1">{displayValue || 'Select time'}</span>
          <ChevronDown className="h-4 w-4 text-stone-400" />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
            {slots.map((slot) => (
              <button
                key={slot.value}
                type="button"
                onClick={() => {
                  onChange(slot.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-sm transition-colors',
                  slot.value === value
                    ? 'bg-teal-50 font-medium text-teal-700'
                    : 'text-stone-700 hover:bg-stone-50'
                )}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
