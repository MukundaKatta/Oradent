import { cn } from '@/lib/utils';

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <hr className={cn('border-t border-stone-200', className)} />;
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="h-px flex-1 bg-stone-200" />
      <span className="shrink-0 text-xs font-medium text-stone-400">{label}</span>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}
