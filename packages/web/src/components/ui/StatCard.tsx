import { type LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({ title, value, icon: Icon, trend, subtitle, iconBg = 'bg-teal-100', iconColor = 'text-teal-600' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {trend && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium', trend.isPositive ? 'text-emerald-600' : 'text-red-600')}>
            {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-stone-900">{value}</p>
      <p className="text-sm text-stone-500 mt-1">{subtitle || title}</p>
    </div>
  );
}
