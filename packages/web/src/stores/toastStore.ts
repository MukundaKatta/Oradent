import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    const duration =
      toast.duration ?? (toast.variant === 'error' ? ERROR_DURATION : DEFAULT_DURATION);

    set((state) => {
      const next = [...state.toasts, { ...toast, id, duration }];
      // Keep only the most recent MAX_TOASTS
      return { toasts: next.slice(-MAX_TOASTS) };
    });

    // Auto-remove after duration
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
