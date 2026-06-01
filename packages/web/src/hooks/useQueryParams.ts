import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useQueryParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setParams = useCallback((params: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    const search = current.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
  }, [searchParams, router, pathname]);

  const getParam = useCallback((key: string, defaultValue?: string) => {
    return searchParams.get(key) || defaultValue || '';
  }, [searchParams]);

  return { setParams, getParam, searchParams };
}
