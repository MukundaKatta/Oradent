'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  ClipboardList,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type PlanStatus = 'accepted' | 'declined' | 'pending';

interface TreatmentPlan {
  id: string;
  patientName: string;
  planDescription: string;
  amount: number;
  status: PlanStatus;
  date: string;
  provider: string;
}

interface MonthlyTrend {
  month: string;
  accepted: number;
  declined: number;
  total: number;
}

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_PLANS: TreatmentPlan[] = [
  { id: '1', patientName: 'Sarah Johnson', planDescription: 'Crown & Bridge - #14, #15', amount: 3200, status: 'accepted', date: '2026-05-28', provider: 'Dr. Smith' },
  { id: '2', patientName: 'Michael Chen', planDescription: 'Root Canal Therapy - #19', amount: 1150, status: 'accepted', date: '2026-05-27', provider: 'Dr. Williams' },
  { id: '3', patientName: 'Emily Rodriguez', planDescription: 'Full Mouth Rehabilitation', amount: 12500, status: 'declined', date: '2026-05-26', provider: 'Dr. Smith' },
  { id: '4', patientName: 'James Wilson', planDescription: 'Implant Placement - #30', amount: 4500, status: 'accepted', date: '2026-05-25', provider: 'Dr. Johnson' },
  { id: '5', patientName: 'Lisa Thompson', planDescription: 'Orthodontic Treatment - Full', amount: 5800, status: 'pending', date: '2026-05-24', provider: 'Dr. Williams' },
  { id: '6', patientName: 'David Park', planDescription: 'Periodontal Surgery - Quad 1', amount: 2100, status: 'accepted', date: '2026-05-22', provider: 'Dr. Smith' },
  { id: '7', patientName: 'Amanda Foster', planDescription: 'Veneer Preparation - #6-#11', amount: 7800, status: 'declined', date: '2026-05-21', provider: 'Dr. Johnson' },
  { id: '8', patientName: 'Robert Kim', planDescription: 'Composite Fillings - #3, #5, #12', amount: 680, status: 'accepted', date: '2026-05-20', provider: 'Dr. Williams' },
  { id: '9', patientName: 'Jennifer Martinez', planDescription: 'Wisdom Teeth Extraction - All 4', amount: 2400, status: 'accepted', date: '2026-05-18', provider: 'Dr. Smith' },
  { id: '10', patientName: 'William Taylor', planDescription: 'Deep Cleaning - Full Mouth', amount: 1140, status: 'declined', date: '2026-05-16', provider: 'Dr. Johnson' },
  { id: '11', patientName: 'Catherine Lee', planDescription: 'Crown Lengthening - #8', amount: 1500, status: 'accepted', date: '2026-05-14', provider: 'Dr. Williams' },
  { id: '12', patientName: 'Thomas Brown', planDescription: 'Denture - Upper Full', amount: 3200, status: 'accepted', date: '2026-05-12', provider: 'Dr. Smith' },
  { id: '13', patientName: 'Patricia Davis', planDescription: 'Teeth Whitening - In-Office', amount: 450, status: 'accepted', date: '2026-05-10', provider: 'Dr. Johnson' },
  { id: '14', patientName: 'Daniel Harris', planDescription: 'Night Guard - Custom', amount: 650, status: 'declined', date: '2026-05-08', provider: 'Dr. Williams' },
  { id: '15', patientName: 'Angela White', planDescription: 'Implant Supported Bridge - #18-#20', amount: 8900, status: 'accepted', date: '2026-05-06', provider: 'Dr. Smith' },
  { id: '16', patientName: 'Kevin Clark', planDescription: 'Bone Graft - #14', amount: 1800, status: 'pending', date: '2026-05-04', provider: 'Dr. Johnson' },
  { id: '17', patientName: 'Rachel Moore', planDescription: 'Inlay/Onlay - #19', amount: 1250, status: 'accepted', date: '2026-05-02', provider: 'Dr. Williams' },
];

const MONTHLY_TRENDS: MonthlyTrend[] = [
  { month: 'Jan', accepted: 18, declined: 5, total: 23 },
  { month: 'Feb', accepted: 22, declined: 7, total: 29 },
  { month: 'Mar', accepted: 20, declined: 4, total: 24 },
  { month: 'Apr', accepted: 25, declined: 6, total: 31 },
  { month: 'May', accepted: 24, declined: 8, total: 32 },
  { month: 'Jun', accepted: 11, declined: 4, total: 15 },
];

const PROVIDERS = ['All Providers', 'Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];

const STATUS_CONFIG: Record<PlanStatus, { label: string; bg: string; text: string }> = {
  accepted: { label: 'Accepted', bg: 'bg-green-50', text: 'text-green-700' },
  declined: { label: 'Declined', bg: 'bg-red-50', text: 'text-red-700' },
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700' },
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function TreatmentAcceptancePage() {
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-05-31');
  const [providerFilter, setProviderFilter] = useState('All Providers');
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'all'>('all');

  const filteredPlans = useMemo(() => {
    return MOCK_PLANS.filter((plan) => {
      if (providerFilter !== 'All Providers' && plan.provider !== providerFilter) return false;
      if (statusFilter !== 'all' && plan.status !== statusFilter) return false;
      if (plan.date < startDate || plan.date > endDate) return false;
      return true;
    });
  }, [providerFilter, statusFilter, startDate, endDate]);

  const stats = useMemo(() => {
    const decidedPlans = filteredPlans.filter((p) => p.status !== 'pending');
    const accepted = filteredPlans.filter((p) => p.status === 'accepted');
    const declined = filteredPlans.filter((p) => p.status === 'declined');
    const rate = decidedPlans.length > 0 ? (accepted.length / decidedPlans.length) * 100 : 0;
    return {
      total: filteredPlans.length,
      accepted: accepted.length,
      declined: declined.length,
      rate: rate.toFixed(1),
    };
  }, [filteredPlans]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const maxTrendTotal = Math.max(...MONTHLY_TRENDS.map((t) => t.total));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Treatment Acceptance Report</h1>
          <p className="mt-1 text-sm text-stone-500">
            Track treatment plan acceptance and decline rates
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Plans Presented</p>
              <p className="text-xl font-bold text-stone-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Accepted</p>
              <p className="text-xl font-bold text-stone-900">{stats.accepted}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Declined</p>
              <p className="text-xl font-bold text-stone-900">{stats.declined}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Acceptance Rate</p>
              <p className="text-xl font-bold text-stone-900">{stats.rate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-400" />
            <h2 className="text-base font-semibold text-stone-900">Filters</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Start Date</label>
            <div className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2">
              <Calendar className="h-4 w-4 text-stone-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-0 bg-transparent text-sm text-stone-700 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">End Date</label>
            <div className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2">
              <Calendar className="h-4 w-4 text-stone-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-0 bg-transparent text-sm text-stone-700 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Provider</label>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PlanStatus | 'all')}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Acceptance Trend Chart */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-900">Acceptance Trend by Month</h2>
          <p className="mt-0.5 text-xs text-stone-500">Accepted vs. declined plans over time</p>
        </div>
        <div className="space-y-4 p-6">
          {MONTHLY_TRENDS.map((trend) => {
            const acceptedPct = maxTrendTotal > 0 ? (trend.accepted / maxTrendTotal) * 100 : 0;
            const declinedPct = maxTrendTotal > 0 ? (trend.declined / maxTrendTotal) * 100 : 0;
            const rate = trend.total > 0 ? ((trend.accepted / trend.total) * 100).toFixed(0) : '0';
            return (
              <div key={trend.month} className="flex items-center gap-4">
                <span className="w-10 text-sm font-medium text-stone-600">{trend.month}</span>
                <div className="flex flex-1 items-center gap-1">
                  <div
                    className="h-7 rounded-l-md bg-green-500 transition-all"
                    style={{ width: `${acceptedPct}%` }}
                  />
                  <div
                    className="h-7 rounded-r-md bg-red-400 transition-all"
                    style={{ width: `${declinedPct}%` }}
                  />
                </div>
                <div className="flex w-32 items-center gap-2 text-xs text-stone-500">
                  <span className="font-medium text-green-700">{trend.accepted} acc</span>
                  <span>/</span>
                  <span className="font-medium text-red-600">{trend.declined} dec</span>
                  <span className="ml-auto font-semibold text-stone-700">{rate}%</span>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-4 pt-2 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-green-500" />
              <span>Accepted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-red-400" />
              <span>Declined</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-900">Treatment Plan Details</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Patient Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Plan Description</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Provider</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => {
                const statusCfg = STATUS_CONFIG[plan.status];
                return (
                  <tr key={plan.id} className="border-b border-stone-50 transition-colors hover:bg-stone-50">
                    <td className="px-5 py-3 font-medium text-stone-900">{plan.patientName}</td>
                    <td className="px-5 py-3 text-stone-700">{plan.planDescription}</td>
                    <td className="px-5 py-3 text-right font-medium text-stone-900">{formatCurrency(plan.amount)}</td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusCfg.bg, statusCfg.text)}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-stone-700">{plan.date}</td>
                    <td className="px-5 py-3 text-stone-700">{plan.provider}</td>
                  </tr>
                );
              })}
              {filteredPlans.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-stone-400">
                    No treatment plans match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
