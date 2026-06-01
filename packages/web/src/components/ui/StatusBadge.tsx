import { cn } from '@/lib/utils';

const STATUS_VARIANTS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-stone-100 text-stone-600',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-stone-100 text-stone-500',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
  draft: 'bg-stone-100 text-stone-600',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  variant?: string;
  className?: string;
}

export function StatusBadge({ status, label, variant, className }: StatusBadgeProps) {
  const key = variant || status.toLowerCase().replace(/_/g, '');
  const colors = STATUS_VARIANTS[key] || 'bg-stone-100 text-stone-600';
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors, className)}>
      {label || status.replace(/_/g, ' ')}
    </span>
  );
}
