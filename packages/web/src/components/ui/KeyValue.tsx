import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface KeyValueProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function KeyValue({ label, value, className }: KeyValueProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="text-sm font-medium text-stone-900">{value}</dd>
    </div>
  );
}
