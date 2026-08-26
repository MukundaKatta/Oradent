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
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
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

      {/* Metrics */}
      <DashboardMetrics
        todayAppointments={stats?.todayAppointments}
        monthRevenue={stats?.monthRevenue}
        revenueTrend={stats?.revenueTrend}
        activePatients={stats?.activePatients}
        patientsTrend={stats?.patientsTrend}
        pendingClaims={stats?.pendingClaims}
        pendingClaimsAmount={stats?.pendingClaimsAmount}
        isLoading={isLoading}
      />

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
