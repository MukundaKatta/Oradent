import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  pageSize: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  canPrevious: boolean;
  canNext: boolean;
  nextPage: () => void;
  prevPage: () => void;
}

export function usePagination({
  totalItems,
  pageSize,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const startIndex = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize - 1, totalItems - 1),
    [startIndex, pageSize, totalItems]
  );

  const canPrevious = page > 1;
  const canNext = page < totalPages;

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  return {
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    canPrevious,
    canNext,
    nextPage,
    prevPage,
  };
}
