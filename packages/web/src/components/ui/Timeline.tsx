import { type LucideIcon, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  color?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative space-y-0">
      {items.map((item, index) => {
        const Icon = item.icon || Circle;
        const iconColor = item.color || 'text-teal-600';
        const bgColor = item.color?.replace('text-', 'bg-') || 'bg-teal-100';
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connecting line */}
            {!isLast && (
              <div className="absolute left-[17px] top-10 bottom-0 w-px bg-stone-200" />
            )}

            {/* Dot / Icon */}
            <div
              className={cn(
                'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                bgColor
              )}
            >
              <Icon className={cn('w-4 h-4', iconColor)} />
            </div>

            {/* Content */}
            <div className="pt-1">
              <p className="text-xs text-stone-400 mb-0.5">{item.date}</p>
              <p className="text-sm font-medium text-stone-900">{item.title}</p>
              {item.description && (
                <p className="text-sm text-stone-500 mt-1">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
