import { useEffect, useRef } from 'react';

export function useDocumentTitle(title: string): void {
  const previousTitleRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    previousTitleRef.current = document.title;
    document.title = title;

    return () => {
      if (previousTitleRef.current !== undefined) {
        document.title = previousTitleRef.current;
      }
    };
  }, [title]);
}
