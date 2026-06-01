import { cn } from '@/lib/utils';

const COLOR_STYLES = {
  teal: 'bg-teal-600',
  blue: 'bg-blue-600',
  amber: 'bg-amber-500',
  red: 'bg-red-600',
};

interface ProgressBarProps {
  value: number;
  size?: 'sm' | 'md';
  color?: 'teal' | 'blue' | 'amber' | 'red';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, size = 'md', color = 'teal', showLabel, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-stone-200',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            COLOR_STYLES[color]
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs font-medium text-stone-600">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
