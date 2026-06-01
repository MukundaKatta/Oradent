'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  BarChart3,
  Users,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface AppointmentStats {
  totalThisMonth: number;
  completionRate: number;
  avgDurationMinutes: number;
  noShowRate: number;
  byType: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  byStatus: {
    completed: number;
    cancelled: number;
    noShow: number;
    scheduled: number;
  };
}

// ═══════════════════ HELPERS ═══════════════════

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TYPE_COLORS: Record<string, string> = {
  'Cleaning': 'bg-teal-500',
  'Exam': 'bg-blue-500',
  'Filling': 'bg-amber-500',
  'Crown': 'bg-purple-500',
  'Root Canal': 'bg-red-500',
  'Extraction': 'bg-orange-500',
  'Whitening': 'bg-cyan-500',
  'Consultation': 'bg-indigo-500',
  'Emergency': 'bg-rose-500',
  'Other': 'bg-stone-500',
};

function getBarColor(key: string): string {
  return TYPE_COLORS[key] || 'bg-teal-500';
}

// ═══════════════════ BAR CHART COMPONENT ═══════════════════

function HorizontalBarChart({
  data,
  colorFn,
}: {
  data: Record<string, number>;
  colorFn?: (key: string) => string;
}) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-3">
      {entries.map(([label, value]) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-stone-600">{label}</span>
            <span className="text-sm font-medium text-stone-900">{value}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                colorFn ? colorFn(label) : 'bg-teal-500'
              )}
              style={{ width: `${(value / maxVal) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {entries.length === 0 && (
        <p className="py-4 text-center text-sm text-stone-400">No data available</p>
      )}
    </div>
  );
}

function StatusBreakdown({ data }: { data: AppointmentStats['byStatus'] }) {
  const total = data.completed + data.cancelled + data.noShow + data.scheduled;
  if (total === 0) {
    return <p className="py-4 text-center text-sm text-stone-400">No data available</p>;
  }

  const segments = [
    { label: 'Completed', value: data.completed, color: 'bg-green-500', textColor: 'text-green-600' },
    { label: 'Scheduled', value: data.scheduled, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: 'Cancelled', value: data.cancelled, color: 'bg-amber-500', textColor: 'text-amber-600' },
    { label: 'No-Show', value: data.noShow, color: 'bg-red-500', textColor: 'text-red-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-6 overflow-hidden rounded-full bg-stone-100">
        {segments.map(
          (seg) =>
            seg.value > 0 && (
              <div
                key={seg.label}
                className={cn('h-full transition-all duration-500', seg.color)}
                style={{ width: `${(seg.value / total) * 100}%` }}
                title={`${seg.label}: ${seg.value}`}
              />
            )
        )}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-full', seg.color)} />
            <span className="text-sm text-stone-600">{seg.label}</span>
            <span className={cn('ml-auto text-sm font-semibold', seg.textColor)}>
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function AppointmentAnalyticsPage() {
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiGet<AppointmentStats>('/api/appointments/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch appointment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Appointment Analytics</h1>
        <p className="mt-1 text-sm text-stone-500">
          Overview of appointment trends and performance metrics
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-50 p-2.5">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Total This Month</p>
                <p className="text-xl font-bold text-stone-900">
                  {stats?.totalThisMonth ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2.5">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Completion Rate</p>
                <p className="text-xl font-bold text-stone-900">
                  {stats?.completionRate?.toFixed(1) ?? '0.0'}%
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-stone-500">Avg Duration</p>
                <p className="text-xl font-bold text-stone-900">
                  {stats?.avgDurationMinutes ?? 0} min
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 p-2.5">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-stone-500">No-Show Rate</p>
                <p className="text-xl font-bold text-stone-900">
                  {stats?.noShowRate?.toFixed(1) ?? '0.0'}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Appointments by Type */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-semibold text-stone-900">By Type</h2>
            </div>
            <HorizontalBarChart
              data={stats.byType}
              colorFn={(key) => getBarColor(key)}
            />
          </div>

          {/* Appointments by Day of Week */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-stone-900">By Day of Week</h2>
            </div>
            <HorizontalBarChart
              data={
                // Sort by day order
                Object.fromEntries(
                  DAYS_OF_WEEK.filter((d) => d in (stats.byDayOfWeek || {})).map((d) => [
                    d,
                    stats.byDayOfWeek[d],
                  ])
                )
              }
              colorFn={() => 'bg-blue-500'}
            />
          </div>

          {/* Status Breakdown */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-stone-900">Status Breakdown</h2>
            </div>
            <StatusBreakdown
              data={
                stats.byStatus || { completed: 0, cancelled: 0, noShow: 0, scheduled: 0 }
              }
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
          <BarChart3 className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-sm font-medium text-stone-700">No analytics data available</h3>
          <p className="mt-1 text-xs text-stone-500">
            Appointment data will appear here once appointments are recorded.
          </p>
        </div>
      )}
    </div>
  );
}
