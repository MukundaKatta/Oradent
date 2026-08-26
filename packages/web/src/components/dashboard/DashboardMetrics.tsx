'use client';

import { Calendar, DollarSign, Users, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { t } from '@/i18n';

interface DashboardMetricsProps {
  todayAppointments?: number;
  monthRevenue?: number;
  revenueTrend?: number;
  activePatients?: number;
  patientsTrend?: number;
  pendingClaims?: number;
  pendingClaimsAmount?: number;
  isLoading?: boolean;
}

function Trend({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="flex items-center gap-1 text-xs">
      <Icon className={`w-3.5 h-3.5 ${positive ? 'text-green-500' : 'text-red-500'}`} />
      <span className={`font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {Math.abs(value)}%
      </span>
      <span className="text-stone-400 dark:text-stone-500">{t('dashboard.comparedToLastMonth', 'em relação ao mês anterior')}</span>
    </div>
  );
}

function MetricCell({
  icon: Icon,
  label,
  value,
  mono,
  footer,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  mono?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <div className="p-6 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
        <Icon className="w-4 h-4" strokeWidth={1.75} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className={`text-3xl font-semibold tabular-nums text-stone-900 dark:text-stone-100 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
      <div className="min-h-[1rem]">{footer}</div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="glass-card grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/60 dark:divide-white/10">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 flex flex-col gap-3">
          <div className="w-24 h-4 bg-stone-200/70 dark:bg-white/10 animate-pulse rounded" />
          <div className="w-16 h-8 bg-stone-200/70 dark:bg-white/10 animate-pulse rounded" />
          <div className="w-28 h-3 bg-stone-200/70 dark:bg-white/10 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardMetrics({
  todayAppointments,
  monthRevenue,
  revenueTrend,
  activePatients,
  patientsTrend,
  pendingClaims,
  pendingClaimsAmount,
  isLoading,
}: DashboardMetricsProps) {
  if (isLoading) return <MetricsSkeleton />;

  return (
    <div className="glass-card grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/60 dark:divide-white/10">
      <MetricCell
        icon={Calendar}
        label={t('dashboard.todayAppointments', 'Consultas de hoje')}
        value={String(todayAppointments ?? 0)}
      />
      <MetricCell
        icon={DollarSign}
        label={t('dashboard.monthRevenue', 'Receita do mês')}
        value={formatCurrency(monthRevenue ?? 0)}
        mono
        footer={revenueTrend !== undefined && <Trend value={revenueTrend} />}
      />
      <MetricCell
        icon={Users}
        label={t('dashboard.activePatients', 'Pacientes ativos')}
        value={(activePatients ?? 0).toLocaleString('pt-BR')}
        footer={patientsTrend !== undefined && <Trend value={patientsTrend} />}
      />
      <MetricCell
        icon={FileText}
        label={t('dashboard.pendingClaims', 'Guias pendentes')}
        value={String(pendingClaims ?? 0)}
        footer={
          pendingClaimsAmount !== undefined && (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              <span className="font-mono">{formatCurrency(pendingClaimsAmount)}</span>{' '}
              {t('dashboard.totalValue', 'em valor total')}
            </p>
          )
        }
      />
    </div>
  );
}
