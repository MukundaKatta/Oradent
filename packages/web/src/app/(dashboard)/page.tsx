'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import {
  Calendar,
  Users,
  Plus,
  Brain,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR as dateFnsPtBR } from 'date-fns/locale';
import { t } from '@/i18n';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import RevenueCard from '@/components/dashboard/RevenueCard';
import PatientStatsCard from '@/components/dashboard/PatientStatsCard';
import PendingClaimsCard from '@/components/dashboard/PendingClaimsCard';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';

interface DashboardStats {
  todayAppointments: number;
  monthRevenue: number;
  revenueTrend?: number;
  activePatients: number;
  patientsTrend?: number;
  pendingClaims: number;
  pendingClaimsAmount?: number;
  aiInsights?: {
    id: string;
    type: 'reminder' | 'alert' | 'suggestion';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
  }[];
}

function StatCardSkeleton() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-stone-200/70 animate-pulse rounded-xl" />
      </div>
      <div className="h-8 w-24 bg-stone-200/70 animate-pulse rounded" />
      <div className="h-4 w-32 bg-stone-200/70 animate-pulse rounded mt-2" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiGet('/api/reports/dashboard'),
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">{t('dashboard.title', 'Visão geral')}</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: dateFnsPtBR })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/patients?new=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 border border-stone-200/70 rounded-full text-stone-700 shadow-apple-sm backdrop-blur-sm hover:bg-white text-sm font-medium transition-all active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.newPatient', 'Novo paciente')}
          </Link>
          <Link
            href="/appointments?new=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 text-sm font-medium shadow-apple-sm transition-all active:scale-[0.97]"
          >
            <Calendar className="w-4 h-4" />
            {t('dashboard.newAppointment', 'Nova consulta')}
          </Link>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('dashboard.loadError', 'Não foi possível carregar os indicadores. Tente novamente.')}
        </div>
      )}

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        {isLoading ? (
          <StatCardSkeleton />
        ) : (
          <div className="glass-card p-6 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-teal-100/80">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              {stats?.todayAppointments !== undefined && stats.todayAppointments > 0 && (
                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  {t('dashboard.today', 'Hoje')}
                </span>
              )}
            </div>
            <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {stats?.todayAppointments ?? 0}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('dashboard.todayAppointments', 'Consultas de hoje')}</p>
          </div>
        )}

        {/* Month Revenue */}
        <RevenueCard
          revenue={stats?.monthRevenue}
          trend={stats?.revenueTrend}
          isLoading={isLoading}
        />

        {/* Active Patients */}
        <PatientStatsCard
          activePatients={stats?.activePatients}
          trend={stats?.patientsTrend}
          isLoading={isLoading}
        />

        {/* Pending Claims */}
        <PendingClaimsCard
          pendingClaims={stats?.pendingClaims}
          totalAmount={stats?.pendingClaimsAmount}
          isLoading={isLoading}
        />
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodaySchedule />
        </div>

        {/* Quick Actions & AI sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('dashboard.quickActions', 'Ações rápidas')}</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/patients?new=true"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors group"
              >
                <div className="p-2 bg-teal-100/80 rounded-lg group-hover:bg-teal-200/80 transition-colors">
                  <Users className="w-4 h-4 text-teal-600" />
                </div>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{t('dashboard.newPatient', 'Novo paciente')}</span>
              </Link>
              <Link
                href="/appointments?new=true"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors group"
              >
                <div className="p-2 bg-blue-100/80 rounded-lg group-hover:bg-blue-200/80 transition-colors">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{t('dashboard.newAppointment', 'Nova consulta')}</span>
              </Link>
              <Link
                href="/ai-assistant"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors group"
              >
                <div className="p-2 bg-purple-100/80 rounded-lg group-hover:bg-purple-200/80 transition-colors">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{t('dashboard.aiAnalysis', 'Análise com IA')}</span>
              </Link>
            </div>
          </div>

          {/* AI Insights */}
          <AIInsightsCard
            insights={stats?.aiInsights}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
