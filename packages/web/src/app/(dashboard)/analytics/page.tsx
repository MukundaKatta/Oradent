'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  Users,
  CalendarCheck,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface MetricCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

// ═══════════════════ MOCK DATA ═══════════════════

const REVENUE_DATA_MONTH = [
  { date: 'Jun 1', revenue: 8200 },
  { date: 'Jun 3', revenue: 9400 },
  { date: 'Jun 5', revenue: 7800 },
  { date: 'Jun 7', revenue: 11200 },
  { date: 'Jun 9', revenue: 6500 },
  { date: 'Jun 11', revenue: 10800 },
  { date: 'Jun 13', revenue: 9100 },
  { date: 'Jun 15', revenue: 12400 },
  { date: 'Jun 17', revenue: 8900 },
  { date: 'Jun 19', revenue: 11600 },
  { date: 'Jun 21', revenue: 7200 },
  { date: 'Jun 23', revenue: 13100 },
  { date: 'Jun 25', revenue: 10500 },
  { date: 'Jun 27', revenue: 9800 },
  { date: 'Jun 29', revenue: 11900 },
];

const REVENUE_DATA_WEEK = [
  { date: 'Mon', revenue: 9200 },
  { date: 'Tue', revenue: 11400 },
  { date: 'Wed', revenue: 10800 },
  { date: 'Thu', revenue: 12600 },
  { date: 'Fri', revenue: 8900 },
];

const REVENUE_DATA_QUARTER = [
  { date: 'Apr', revenue: 142000 },
  { date: 'May', revenue: 158000 },
  { date: 'Jun', revenue: 165000 },
];

const REVENUE_DATA_YEAR = [
  { date: 'Jan', revenue: 125000 },
  { date: 'Feb', revenue: 132000 },
  { date: 'Mar', revenue: 148000 },
  { date: 'Apr', revenue: 142000 },
  { date: 'May', revenue: 158000 },
  { date: 'Jun', revenue: 165000 },
  { date: 'Jul', revenue: 155000 },
  { date: 'Aug', revenue: 162000 },
  { date: 'Sep', revenue: 170000 },
  { date: 'Oct', revenue: 168000 },
  { date: 'Nov', revenue: 145000 },
  { date: 'Dec', revenue: 138000 },
];

const APPOINTMENT_TYPES = [
  { name: 'Cleaning', value: 35, color: '#0d9488' },
  { name: 'Examination', value: 25, color: '#14b8a6' },
  { name: 'Filling', value: 15, color: '#5eead4' },
  { name: 'Crown', value: 10, color: '#f59e0b' },
  { name: 'Root Canal', value: 8, color: '#8b5cf6' },
  { name: 'Extraction', value: 7, color: '#ec4899' },
];

const PROVIDER_PRODUCTION = [
  { name: 'Dr. Smith', production: 48500 },
  { name: 'Dr. Johnson', production: 42300 },
  { name: 'Dr. Williams', production: 38700 },
  { name: 'Lisa M. (RDH)', production: 24200 },
  { name: 'Sarah K. (RDH)', production: 22800 },
];

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
];

// ═══════════════════ HELPERS ═══════════════════

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ═══════════════════ CUSTOM TOOLTIP ═══════════════════

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="text-sm font-semibold text-teal-700">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

function ProductionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="text-sm font-semibold text-stone-900">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const revenueData = useMemo(() => {
    switch (dateRange) {
      case 'week':
        return REVENUE_DATA_WEEK;
      case 'quarter':
        return REVENUE_DATA_QUARTER;
      case 'year':
        return REVENUE_DATA_YEAR;
      default:
        return REVENUE_DATA_MONTH;
    }
  }, [dateRange]);

  const metrics: MetricCard[] = [
    {
      label: 'Total Revenue',
      value: '$165,240',
      change: '+12.5%',
      changeType: 'up',
      icon: DollarSign,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
    {
      label: 'Patient Count',
      value: '1,284',
      change: '+8.3%',
      changeType: 'up',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Appointments',
      value: '486',
      change: '+5.1%',
      changeType: 'up',
      icon: CalendarCheck,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Avg Production / Visit',
      value: '$340',
      change: '-2.3%',
      changeType: 'down',
      icon: TrendingUp,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
          <p className="mt-1 text-sm text-stone-500">
            Practice performance metrics and insights
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  dateRange === opt.value
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <label className="text-sm font-medium text-stone-600">From</label>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <label className="text-sm font-medium text-stone-600">To</label>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={cn('rounded-lg p-2.5', metric.iconBg)}>
                  <Icon className={cn('h-5 w-5', metric.iconColor)} />
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    metric.changeType === 'up'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  )}
                >
                  {metric.change}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-sm text-stone-500">{metric.label}</p>
                <p className="mt-0.5 text-2xl font-bold text-stone-900">
                  {metric.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">
                Revenue Trend
              </h2>
              <p className="text-xs text-stone-500">
                Revenue performance over time
              </p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={revenueData}
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#78716c' }}
                axisLine={{ stroke: '#d6d3d1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
              />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={{ fill: '#0d9488', r: 4 }}
                activeDot={{ r: 6, fill: '#0d9488' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appointment Types Pie Chart */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <CalendarCheck className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-900">
                  Appointment Types
                </h2>
                <p className="text-xs text-stone-500">
                  Breakdown by procedure type
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={APPOINTMENT_TYPES}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={60}
                  paddingAngle={2}
                  label={({
                    name,
                    percent,
                  }: {
                    name: string;
                    percent: number;
                  }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#a8a29e' }}
                >
                  {APPOINTMENT_TYPES.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e7e5e4',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Provider Production Bar Chart */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-900">
                  Provider Production
                </h2>
                <p className="text-xs text-stone-500">
                  Production comparison by provider
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={PROVIDER_PRODUCTION}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e7e5e4"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#78716c' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#78716c' }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip content={<ProductionTooltip />} />
                <Bar
                  dataKey="production"
                  fill="#0d9488"
                  radius={[0, 6, 6, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
