'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/stores/toastStore';

// ──────────────── convenience function ────────────────

function createToastFn(variant: ToastVariant) {
  return (title: string, description?: string) => {
    useToastStore.getState().addToast({ variant, title, description });
  };
}

export const toast = {
  success: createToastFn('success'),
  error: createToastFn('error'),
  warning: createToastFn('warning'),
  info: createToastFn('info'),
};

// ──────────────── backward-compat wrapper ────────────────

/**
 * @deprecated Kept for backward compatibility. The Toaster no longer needs a
 * provider since it uses a Zustand store. You can remove the wrapper from
 * providers.tsx if desired.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** @deprecated Use the global `toast` helper or `useToastStore` instead. */
export function useToast() {
  return {
    toast: (msg: { title: string; description?: string; variant: ToastVariant }) => {
      useToastStore.getState().addToast(msg);
    },
  };
}

// ──────────────── styling maps ────────────────

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
};

const variantIcons: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconStyles: Record<ToastVariant, string> = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
};

const progressStyles: Record<ToastVariant, string> = {
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-blue-400',
};

// ──────────────── progress bar ────────────────

function ProgressBar({ duration, variant }: { duration: number; variant: ToastVariant }) {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    // Trigger the shrink on the next frame so the CSS transition fires.
    const raf = requestAnimationFrame(() => setWidth(0));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg">
      <div
        className={cn('h-full transition-all ease-linear', progressStyles[variant])}
        style={{
          width: `${width}%`,
          transitionDuration: `${duration}ms`,
        }}
      />
    </div>
  );
}

// ──────────────── Toaster component ────────────────

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => {
        const Icon = variantIcons[t.variant];
        const duration = t.duration ?? (t.variant === 'error' ? 6000 : 4000);

        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto relative flex w-80 items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg',
              'animate-slide-in-right',
              variantStyles[t.variant]
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconStyles[t.variant])} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="mt-1 text-sm opacity-80">{t.description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>

            <ProgressBar duration={duration} variant={t.variant} />
          </div>
        );
      })}
    </div>
  );
}
