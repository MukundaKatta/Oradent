'use client';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
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

      {/* Body rows */}
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
