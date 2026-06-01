'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default', loading = false }: ConfirmDialogProps) {
  const buttonStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    default: 'bg-teal-600 hover:bg-teal-700 text-white',
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-start gap-4">
            {variant !== 'default' && (
              <div className={cn('rounded-full p-2', variant === 'danger' ? 'bg-red-100' : 'bg-amber-100')}>
                <AlertTriangle className={cn('h-5 w-5', variant === 'danger' ? 'text-red-600' : 'text-amber-600')} />
              </div>
            )}
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-stone-900">{title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-stone-500">{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
              {cancelLabel}
            </button>
            <button onClick={onConfirm} disabled={loading} className={cn('rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50', buttonStyles[variant])}>
              {loading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
