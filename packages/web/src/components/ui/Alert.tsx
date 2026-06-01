'use client';

import { type ReactNode } from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant: AlertVariant;
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
  icon?: ReactNode;
}

const VARIANT_CONFIG: Record<
  AlertVariant,
  {
    bg: string;
    border: string;
    iconColor: string;
    titleColor: string;
    bodyColor: string;
    defaultIcon: typeof Info;
  }
> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    bodyColor: 'text-blue-700',
    defaultIcon: Info,
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    bodyColor: 'text-green-700',
    defaultIcon: CheckCircle,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    bodyColor: 'text-amber-700',
    defaultIcon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    bodyColor: 'text-red-700',
    defaultIcon: XCircle,
  },
};

export function Alert({ variant, title, children, onDismiss, icon }: AlertProps) {
  const config = VARIANT_CONFIG[variant];
  const DefaultIcon = config.defaultIcon;

  return (
    <div
      className={cn(
        'w-full rounded-lg border px-4 py-3',
        config.bg,
        config.border
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 shrink-0', config.iconColor)}>
          {icon ?? <DefaultIcon className="h-5 w-5" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', config.titleColor)}>{title}</p>
          {children && (
            <div className={cn('mt-1 text-sm', config.bodyColor)}>{children}</div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              'shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5',
              config.iconColor
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
