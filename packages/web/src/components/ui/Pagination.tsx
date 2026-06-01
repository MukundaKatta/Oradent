'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}

export function Pagination({ page, totalPages, onPageChange, showPageNumbers = true }: PaginationProps) {
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (page > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);

    return pages;
  };

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          page <= 1
            ? 'text-stone-300 cursor-not-allowed'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>

      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {getVisiblePages().map((p, index) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-stone-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg w-9 h-9 text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                )}
              >
                {p}
              </button>
            )
          )}
        </div>
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          page >= totalPages
            ? 'text-stone-300 cursor-not-allowed'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        )}
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
