'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useSocketEvent } from '@/hooks/useSocket';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/lib/formatters';
import {
  DollarSign,
  Users,
  CalendarCheck,
  AlertCircle,
  UserPlus,
  CalendarPlus,
  Footprints,
  Sun,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  CreditCard,
  LogIn,
  Clock,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RevenueChart from '@/components/dashboard/RevenueChart';
import RecallAlerts from '@/components/dashboard/RecallAlerts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  todayRevenue: number;
  revenueTrend?: number;
  patientsSeen: number;
  patientsSeenTrend?: number;
  upcomingAppointments: number;
  outstandingBalance: number;
  balanceTrend?: number;
}

interface RecentActivityItem {
  id: string;
  type: 'check-in' | 'completed' | 'payment' | 'new-patient' | 'cancelled';
  description: string;
  timestamp: string;
  patientName: string;
}

// ---------------------------------------------------------------------------
// Mock / fallback data
// ---------------------------------------------------------------------------

const MOCK_STATS: DashboardStats = {
  todayRevenue: 4820,
  revenueTrend: 12.5,
  patientsSeen: 14,
  patientsSeenTrend: 8,
  upcomingAppointments: 7,
  outstandingBalance: 23450,
  balanceTrend: -3.2,
};

const MOCK_ACTIVITY: RecentActivityItem[] = [
  {
    id: '1',
    type: 'check-in',
    description: 'Checked in for 10:00 AM cleaning',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    patientName: 'Sarah Chen',
  },
  {
    id: '2',
    type: 'completed',
    description: 'Crown prep completed by Dr. Patel',
    timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
    patientName: 'James Wilson',
  },
  {
    id: '3',
    type: 'payment',
    description: 'Co-pay of $45.00 received',
    timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
    patientName: 'Maria Garcia',
  },
  {
    id: '4',
    type: 'new-patient',
    description: 'New patient intake completed',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    patientName: 'Robert Taylor',
  },
  {
    id: '5',
    type: 'cancelled',
    description: 'Cancelled 2:30 PM filling appointment',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    patientName: 'Emily Johnson',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getActivityIcon(type: RecentActivityItem['type']) {
  switch (type) {
    case 'check-in':
      return <LogIn className="h-4 w-4 text-blue-500" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-teal-500" />;
    case 'new-patient':
      return <UserPlus className="h-4 w-4 text-purple-500" />;
    case 'cancelled':
      return <AlertCircle className="h-4 w-4 text-red-400" />;
  }
}

function formatRelativeMinutes(isoString: string): string {
  const diff = Math.round((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  const hours = Math.floor(diff / 60);
  return `${hours}h ago`;
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-stone-200" />
      </div>
      <div className="h-8 w-24 animate-pulse rounded bg-stone-200" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-stone-200" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-8 animate-pulse rounded-full bg-stone-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: number;
  trendLabel?: string;
}

function MetricCard({ title, value, icon, iconBg, trend, trendLabel }: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>{icon}</div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-stone-900">{value}</p>
      <p className="mt-1 text-sm text-stone-500">{trendLabel ?? title}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  {
    label: 'New Patient',
    icon: UserPlus,
    href: '/patients/new',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
  },
  {
    label: 'New Appointment',
    icon: CalendarPlus,
    href: '/schedule?new=true',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    label: 'Walk-in',
    icon: Footprints,
    href: '/schedule?walkin=true',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    label: 'Morning Huddle',
    icon: Sun,
    href: '/schedule/huddle',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
  },
] as const;

function QuickActionsSection() {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`flex flex-col items-center gap-2 rounded-lg px-3 py-4 transition-colors ${action.bgColor}`}
            >
              <Icon className={`h-6 w-6 ${action.color}`} />
              <span className="text-xs font-medium text-stone-700">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent Activity
// ---------------------------------------------------------------------------

function RecentActivity({
  items,
  isLoading,
}: {
  items: RecentActivityItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-stone-900">Recent Activity</h2>
        <ActivitySkeleton />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-stone-400" />
          <h2 className="text-lg font-semibold text-stone-900">Recent Activity</h2>
        </div>
      </div>
      <ul className="divide-y divide-stone-100">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-50">
              {getActivityIcon(item.type)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-900">{item.patientName}</p>
              <p className="text-xs text-stone-500 truncate">{item.description}</p>
            </div>
            <span className="shrink-0 text-xs text-stone-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeMinutes(item.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { provider } = useAppStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    stats: DashboardStats;
    recentActivity: RecentActivityItem[];
  }>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      try {
        return await apiGet('/api/dashboard/stats');
      } catch {
        // Mock fallback when the API is unavailable
        return {
          stats: MOCK_STATS,
          recentActivity: MOCK_ACTIVITY,
        };
      }
    },
  });

  useSocketEvent('appointment:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
  });

  useSocketEvent('payment:received', () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
  });

  const stats = data?.stats;
  const activity = data?.recentActivity ?? MOCK_ACTIVITY;
  const firstName = provider?.name?.split(' ')[0] ?? 'Doctor';

  return (
    <div className="space-y-6">
      {/* ── Greeting ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">
            {getGreeting()}, Dr. {firstName}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {stats && stats.upcomingAppointments > 0 && (
              <span className="ml-2 font-medium text-teal-600">
                &middot; {stats.upcomingAppointments} upcoming appointment
                {stats.upcomingAppointments !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/morning-huddle"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            <Sun className="h-4 w-4" />
            Morning Huddle
          </Link>
          <Link
            href="/schedule?new=true"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <CalendarPlus className="h-4 w-4" />
            New Appointment
          </Link>
        </div>
      </div>

      {/* ── Key Metric Stat Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Today's Revenue"
              value={formatCurrency(stats?.todayRevenue ?? 0)}
              icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-100"
              trend={stats?.revenueTrend}
              trendLabel="vs. last week"
            />
            <MetricCard
              title="Patients Seen"
              value={String(stats?.patientsSeen ?? 0)}
              icon={<Users className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-100"
              trend={stats?.patientsSeenTrend}
              trendLabel="vs. last week"
            />
            <MetricCard
              title="Upcoming Appointments"
              value={String(stats?.upcomingAppointments ?? 0)}
              icon={<CalendarCheck className="h-5 w-5 text-teal-600" />}
              iconBg="bg-teal-100"
            />
            <MetricCard
              title="Outstanding Balance"
              value={formatCurrency(stats?.outstandingBalance ?? 0)}
              icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
              iconBg="bg-amber-100"
              trend={stats?.balanceTrend}
              trendLabel="vs. last month"
            />
          </>
        )}
      </div>

      {/* ── Main Content: 2-col on lg, stacked on mobile ─────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <RevenueChart />
          <RecentActivity items={activity} isLoading={isLoading} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <QuickActionsSection />
          <RecallAlerts />
        </div>
      </div>
    </div>
  );
}
