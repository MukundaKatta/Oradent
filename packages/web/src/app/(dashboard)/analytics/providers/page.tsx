'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  Users,
  CalendarCheck,
  Star,
  TrendingUp,
  Calendar,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type DateRange = 'month' | 'quarter' | 'year';

interface ProviderMetrics {
  id: string;
  name: string;
  specialty: string;
  production: number;
  collections: number;
  patientsServed: number;
  appointmentsPerDay: number;
  satisfactionScore: number;
  totalReviews: number;
  topProcedures: { name: string; count: number; revenue: number }[];
}

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_PROVIDERS: Record<DateRange, ProviderMetrics[]> = {
  month: [
    {
      id: '1', name: 'Dr. Smith', specialty: 'General Dentistry',
      production: 68500, collections: 58200, patientsServed: 142, appointmentsPerDay: 8.2,
      satisfactionScore: 4.8, totalReviews: 56,
      topProcedures: [
        { name: 'Crown - Porcelain', count: 12, revenue: 15000 },
        { name: 'Root Canal', count: 8, revenue: 9200 },
        { name: 'Composite Filling', count: 22, revenue: 4620 },
        { name: 'Prophylaxis', count: 18, revenue: 1980 },
      ],
    },
    {
      id: '2', name: 'Dr. Johnson', specialty: 'Oral Surgery',
      production: 52300, collections: 44100, patientsServed: 98, appointmentsPerDay: 6.5,
      satisfactionScore: 4.6, totalReviews: 42,
      topProcedures: [
        { name: 'Extraction', count: 15, revenue: 3375 },
        { name: 'Implant Placement', count: 6, revenue: 27000 },
        { name: 'Bone Graft', count: 4, revenue: 7200 },
        { name: 'Wisdom Teeth', count: 8, revenue: 9600 },
      ],
    },
    {
      id: '3', name: 'Dr. Williams', specialty: 'Endodontics',
      production: 61800, collections: 53400, patientsServed: 118, appointmentsPerDay: 7.4,
      satisfactionScore: 4.9, totalReviews: 48,
      topProcedures: [
        { name: 'Root Canal - Molar', count: 14, revenue: 16100 },
        { name: 'Root Canal - Premolar', count: 10, revenue: 8500 },
        { name: 'Retreatment', count: 3, revenue: 4500 },
        { name: 'Post & Core', count: 8, revenue: 2560 },
      ],
    },
  ],
  quarter: [
    {
      id: '1', name: 'Dr. Smith', specialty: 'General Dentistry',
      production: 198500, collections: 172400, patientsServed: 412, appointmentsPerDay: 8.0,
      satisfactionScore: 4.8, totalReviews: 156,
      topProcedures: [
        { name: 'Crown - Porcelain', count: 35, revenue: 43750 },
        { name: 'Root Canal', count: 22, revenue: 25300 },
        { name: 'Composite Filling', count: 65, revenue: 13650 },
        { name: 'Prophylaxis', count: 52, revenue: 5720 },
      ],
    },
    {
      id: '2', name: 'Dr. Johnson', specialty: 'Oral Surgery',
      production: 156900, collections: 132300, patientsServed: 285, appointmentsPerDay: 6.3,
      satisfactionScore: 4.6, totalReviews: 120,
      topProcedures: [
        { name: 'Extraction', count: 42, revenue: 9450 },
        { name: 'Implant Placement', count: 18, revenue: 81000 },
        { name: 'Bone Graft', count: 12, revenue: 21600 },
        { name: 'Wisdom Teeth', count: 24, revenue: 28800 },
      ],
    },
    {
      id: '3', name: 'Dr. Williams', specialty: 'Endodontics',
      production: 185400, collections: 160200, patientsServed: 348, appointmentsPerDay: 7.2,
      satisfactionScore: 4.9, totalReviews: 140,
      topProcedures: [
        { name: 'Root Canal - Molar', count: 40, revenue: 46000 },
        { name: 'Root Canal - Premolar', count: 28, revenue: 23800 },
        { name: 'Retreatment', count: 10, revenue: 15000 },
        { name: 'Post & Core', count: 22, revenue: 7040 },
      ],
    },
  ],
  year: [
    {
      id: '1', name: 'Dr. Smith', specialty: 'General Dentistry',
      production: 782000, collections: 680000, patientsServed: 1580, appointmentsPerDay: 7.9,
      satisfactionScore: 4.7, totalReviews: 620,
      topProcedures: [
        { name: 'Crown - Porcelain', count: 140, revenue: 175000 },
        { name: 'Root Canal', count: 88, revenue: 101200 },
        { name: 'Composite Filling', count: 260, revenue: 54600 },
        { name: 'Prophylaxis', count: 210, revenue: 23100 },
      ],
    },
    {
      id: '2', name: 'Dr. Johnson', specialty: 'Oral Surgery',
      production: 625000, collections: 528000, patientsServed: 1120, appointmentsPerDay: 6.2,
      satisfactionScore: 4.5, totalReviews: 480,
      topProcedures: [
        { name: 'Extraction', count: 168, revenue: 37800 },
        { name: 'Implant Placement', count: 72, revenue: 324000 },
        { name: 'Bone Graft', count: 48, revenue: 86400 },
        { name: 'Wisdom Teeth', count: 96, revenue: 115200 },
      ],
    },
    {
      id: '3', name: 'Dr. Williams', specialty: 'Endodontics',
      production: 738000, collections: 642000, patientsServed: 1380, appointmentsPerDay: 7.1,
      satisfactionScore: 4.9, totalReviews: 560,
      topProcedures: [
        { name: 'Root Canal - Molar', count: 160, revenue: 184000 },
        { name: 'Root Canal - Premolar', count: 112, revenue: 95200 },
        { name: 'Retreatment', count: 40, revenue: 60000 },
        { name: 'Post & Core', count: 88, revenue: 28160 },
      ],
    },
  ],
};

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  month: 'This Month',
  quarter: 'This Quarter',
  year: 'This Year',
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function ProviderPerformancePage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const providers = MOCK_PROVIDERS[dateRange];

  const maxProduction = Math.max(...providers.map((p) => p.production));

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalf = score - fullStars >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i < fullStars
                ? 'fill-amber-400 text-amber-400'
                : i === fullStars && hasHalf
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'text-stone-200'
            )}
          />
        ))}
        <span className="ml-1.5 text-sm font-semibold text-stone-700">{score.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Provider Performance</h1>
          <p className="mt-1 text-sm text-stone-500">
            Compare provider metrics, production, and patient satisfaction
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1">
          {(Object.entries(DATE_RANGE_LABELS) as [DateRange, string][]).map(([range, label]) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                dateRange === range
                  ? 'bg-teal-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Provider Metric Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.id} className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-900">{provider.name}</h3>
              <p className="text-xs text-stone-500">{provider.specialty}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6">
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-teal-600" />
                  <span className="text-xs text-stone-500">Production</span>
                </div>
                <p className="mt-1 text-lg font-bold text-stone-900">{formatCurrency(provider.production)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-stone-500">Collections</span>
                </div>
                <p className="mt-1 text-lg font-bold text-stone-900">{formatCurrency(provider.collections)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-stone-500">Patients Served</span>
                </div>
                <p className="mt-1 text-lg font-bold text-stone-900">{provider.patientsServed}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-stone-500">Appts/Day</span>
                </div>
                <p className="mt-1 text-lg font-bold text-stone-900">{provider.appointmentsPerDay}</p>
              </div>
            </div>
            <div className="border-t border-stone-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500">Patient Satisfaction</span>
                <span className="text-xs text-stone-400">{provider.totalReviews} reviews</span>
              </div>
              <div className="mt-1">
                {renderStars(provider.satisfactionScore)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Production Bar Chart */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-900">Production by Provider</h2>
          <p className="mt-0.5 text-xs text-stone-500">{DATE_RANGE_LABELS[dateRange]} comparison</p>
        </div>
        <div className="space-y-4 p-6">
          {providers.map((provider) => {
            const pct = maxProduction > 0 ? (provider.production / maxProduction) * 100 : 0;
            const collectionRate = provider.production > 0 ? ((provider.collections / provider.production) * 100).toFixed(0) : '0';
            return (
              <div key={provider.id} className="flex items-center gap-4">
                <span className="w-28 text-sm font-medium text-stone-700">{provider.name}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 rounded-md bg-teal-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="text-sm font-semibold text-stone-700">
                      {formatCurrency(provider.production)}
                    </span>
                  </div>
                </div>
                <span className="w-20 text-right text-xs text-stone-500">
                  {collectionRate}% collected
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Procedures per Provider */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {providers.map((provider) => {
          const maxCount = Math.max(...provider.topProcedures.map((p) => p.count));
          return (
            <div key={provider.id} className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="border-b border-stone-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-teal-600" />
                  <h3 className="text-sm font-semibold text-stone-900">{provider.name} - Top Procedures</h3>
                </div>
              </div>
              <div className="space-y-3 p-6">
                {provider.topProcedures.map((proc) => {
                  const barPct = maxCount > 0 ? (proc.count / maxCount) * 100 : 0;
                  return (
                    <div key={proc.name}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-700">{proc.name}</span>
                        <span className="text-stone-500">{proc.count} &middot; {formatCurrency(proc.revenue)}</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-stone-100">
                        <div
                          className="h-2 rounded-full bg-teal-400 transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
