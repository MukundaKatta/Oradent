import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: string;
}

export function Skeleton({ className, height, width, rounded = 'rounded' }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-stone-200', rounded, className)}
      style={{ height, width }}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 animate-pulse rounded bg-stone-200',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-stone-200 bg-white p-4',
        className
      )}
    >
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/5" />
        <SkeletonText lines={2} />
        <Skeleton className="h-8 w-1/3" />
      </div>
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-stone-200 bg-white">
      {/* Header */}
      <div className="flex gap-4 border-b border-stone-200 bg-stone-50 px-4 py-3">
        {Array.from({ length: columns }).map((_, col) => (
          <div
            key={col}
            className="h-4 flex-1 animate-pulse rounded bg-stone-200"
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex gap-4 border-b border-stone-100 px-4 py-3 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, col) => (
            <div
              key={col}
              className="h-4 flex-1 animate-pulse rounded bg-stone-100"
              style={{ animationDelay: `${(row * columns + col) * 75}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
