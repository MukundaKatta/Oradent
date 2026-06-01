'use client';

import { type ReactNode } from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoBannerProps {
  variant: 'info' | 'warning' | 'success' | 'error';
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const VARIANT_CONFIG: Record<
  InfoBannerProps['variant'],
  { bg: string; border: string; icon: typeof Info; iconColor: string; titleColor: string; descColor: string }
> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    descColor: 'text-blue-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    descColor: 'text-amber-700',
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle,
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-900',
    descColor: 'text-emerald-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    descColor: 'text-red-700',
  },
};

export function InfoBanner({ variant, title, description, dismissible, onDismiss }: InfoBannerProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

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
        <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', config.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', config.titleColor)}>{title}</p>
          {description && (
            <p className={cn('text-sm mt-1', config.descColor)}>{description}</p>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              'shrink-0 rounded-lg p-1 transition-colors',
              config.iconColor,
              'hover:bg-black/5'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
