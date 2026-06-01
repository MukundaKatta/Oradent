import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddingMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm', paddingMap[padding], className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function CardHeader({ title, description, icon, actions }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          {description && <p className="text-xs text-stone-500">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}
