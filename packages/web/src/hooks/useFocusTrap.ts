import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Trap focus within a container element. Useful for modals and dialogs
 * to keep keyboard navigation contained.
 *
 * @param active - Whether the focus trap is active (default true)
 * @returns A ref to attach to the container element
 *
 * @example
 * const trapRef = useFocusTrap<HTMLDivElement>(isModalOpen);
 * return <div ref={trapRef}>...</div>;
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean = true
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    // Save the currently focused element to restore later
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus the first focusable element inside the container
    const focusableElements = container.querySelectorAll<HTMLElement>(
      FOCUSABLE_SELECTORS
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = container.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTORS
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on the first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on the last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the previously focused element
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [active]);

  return containerRef;
}
