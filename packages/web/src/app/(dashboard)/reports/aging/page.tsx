'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  Download,
  Filter,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface AgingPatient {
  id: string;
  patientName: string;
  provider: string;
  totalBalance: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120Plus: number;
}

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_PATIENTS: AgingPatient[] = [
  { id: '1', patientName: 'Sarah Johnson', provider: 'Dr. Smith', totalBalance: 2450, current: 1200, days30: 750, days60: 500, days90: 0, days120Plus: 0 },
  { id: '2', patientName: 'Michael Chen', provider: 'Dr. Williams', totalBalance: 1875, current: 0, days30: 0, days60: 875, days90: 1000, days120Plus: 0 },
  { id: '3', patientName: 'Emily Rodriguez', provider: 'Dr. Smith', totalBalance: 3200, current: 1150, days30: 650, days60: 400, days90: 500, days120Plus: 500 },
  { id: '4', patientName: 'James Wilson', provider: 'Dr. Johnson', totalBalance: 680, current: 680, days30: 0, days60: 0, days90: 0, days120Plus: 0 },
  { id: '5', patientName: 'Lisa Thompson', provider: 'Dr. Williams', totalBalance: 4100, current: 0, days30: 0, days60: 0, days90: 1600, days120Plus: 2500 },
  { id: '6', patientName: 'David Park', provider: 'Dr. Smith', totalBalance: 1250, current: 850, days30: 400, days60: 0, days90: 0, days120Plus: 0 },
  { id: '7', patientName: 'Amanda Foster', provider: 'Dr. Johnson', totalBalance: 5600, current: 2200, days30: 1400, days60: 1000, days90: 600, days120Plus: 400 },
  { id: '8', patientName: 'Robert Kim', provider: 'Dr. Williams', totalBalance: 920, current: 920, days30: 0, days60: 0, days90: 0, days120Plus: 0 },
  { id: '9', patientName: 'Jennifer Martinez', provider: 'Dr. Smith', totalBalance: 1680, current: 0, days30: 980, days60: 700, days90: 0, days120Plus: 0 },
  { id: '10', patientName: 'William Taylor', provider: 'Dr. Johnson', totalBalance: 3450, current: 450, days30: 0, days60: 0, days90: 1200, days120Plus: 1800 },
  { id: '11', patientName: 'Catherine Lee', provider: 'Dr. Williams', totalBalance: 760, current: 760, days30: 0, days60: 0, days90: 0, days120Plus: 0 },
  { id: '12', patientName: 'Thomas Brown', provider: 'Dr. Smith', totalBalance: 2100, current: 0, days30: 1100, days60: 600, days90: 400, days120Plus: 0 },
  { id: '13', patientName: 'Patricia Davis', provider: 'Dr. Johnson', totalBalance: 1340, current: 540, days30: 800, days60: 0, days90: 0, days120Plus: 0 },
  { id: '14', patientName: 'Daniel Harris', provider: 'Dr. Williams', totalBalance: 4800, current: 0, days30: 0, days60: 1300, days90: 1500, days120Plus: 2000 },
  { id: '15', patientName: 'Angela White', provider: 'Dr. Smith', totalBalance: 890, current: 890, days30: 0, days60: 0, days90: 0, days120Plus: 0 },
];

const PROVIDERS = ['All Providers', 'Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];

// ═══════════════════ MAIN PAGE ═══════════════════

export default function AgingReportPage() {
  const [providerFilter, setProviderFilter] = useState('All Providers');
  const [minBalance, setMinBalance] = useState('');

  const filteredPatients = useMemo(() => {
    return MOCK_PATIENTS.filter((p) => {
      if (providerFilter !== 'All Providers' && p.provider !== providerFilter) return false;
      if (minBalance && p.totalBalance < parseFloat(minBalance)) return false;
      return true;
    });
  }, [providerFilter, minBalance]);

  const bucketTotals = useMemo(() => {
    return filteredPatients.reduce(
      (acc, p) => ({
        current: acc.current + p.current,
        days30: acc.days30 + p.days30,
        days60: acc.days60 + p.days60,
        days90: acc.days90 + p.days90,
        days120Plus: acc.days120Plus + p.days120Plus,
        total: acc.total + p.totalBalance,
      }),
      { current: 0, days30: 0, days60: 0, days90: 0, days120Plus: 0, total: 0 }
    );
  }, [filteredPatients]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleExport = () => {
    const headers = ['Patient Name', 'Provider', 'Total Balance', 'Current', '30 Days', '60 Days', '90 Days', '120+ Days'];
    const rows = filteredPatients.map((p) => [
      p.patientName,
      p.provider,
      p.totalBalance.toFixed(2),
      p.current.toFixed(2),
      p.days30.toFixed(2),
      p.days60.toFixed(2),
      p.days90.toFixed(2),
      p.days120Plus.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aging-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Aging Report</h1>
          <p className="mt-1 text-sm text-stone-500">
            Accounts receivable aging analysis by bucket
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Bucket Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500">Current</p>
              <p className="text-lg font-bold text-stone-900">{formatCurrency(bucketTotals.current)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500">30 Days</p>
              <p className="text-lg font-bold text-stone-900">{formatCurrency(bucketTotals.days30)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-stone-500">60 Days</p>
              <p className="text-lg font-bold text-stone-900">{formatCurrency(bucketTotals.days60)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2.5">
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-stone-500">90 Days</p>
              <p className="text-lg font-bold text-stone-900">{formatCurrency(bucketTotals.days90)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-stone-500">120+ Days</p>
              <p className="text-lg font-bold text-stone-900">{formatCurrency(bucketTotals.days120Plus)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-100 p-2.5">
              <DollarSign className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-teal-700">Total A/R</p>
              <p className="text-lg font-bold text-teal-900">{formatCurrency(bucketTotals.total)}</p>
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
            <label className="text-xs font-medium text-stone-500">Min Balance ($)</label>
            <input
              type="number"
              value={minBalance}
              onChange={(e) => setMinBalance(e.target.value)}
              placeholder="0"
              className="w-32 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-900">Patient Aging Detail</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {filteredPatients.length} account{filteredPatients.length !== 1 ? 's' : ''} with outstanding balances
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Patient Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Provider</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">Total Balance</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">Current</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">30 Days</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">60 Days</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">90 Days</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">120+ Days</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-stone-50 transition-colors hover:bg-stone-50">
                  <td className="px-5 py-3 font-medium text-stone-900">{patient.patientName}</td>
                  <td className="px-5 py-3 text-stone-700">{patient.provider}</td>
                  <td className="px-5 py-3 text-right font-semibold text-stone-900">{formatCurrency(patient.totalBalance)}</td>
                  <td className="px-5 py-3 text-right text-stone-700">{patient.current > 0 ? formatCurrency(patient.current) : '-'}</td>
                  <td className="px-5 py-3 text-right text-stone-700">{patient.days30 > 0 ? formatCurrency(patient.days30) : '-'}</td>
                  <td className={cn('px-5 py-3 text-right', patient.days60 > 0 ? 'font-medium text-amber-700' : 'text-stone-700')}>
                    {patient.days60 > 0 ? formatCurrency(patient.days60) : '-'}
                  </td>
                  <td className={cn('px-5 py-3 text-right', patient.days90 > 0 ? 'font-medium text-orange-700' : 'text-stone-700')}>
                    {patient.days90 > 0 ? formatCurrency(patient.days90) : '-'}
                  </td>
                  <td className={cn('px-5 py-3 text-right', patient.days120Plus > 0 ? 'font-semibold text-red-700' : 'text-stone-700')}>
                    {patient.days120Plus > 0 ? formatCurrency(patient.days120Plus) : '-'}
                  </td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr className="border-t-2 border-stone-300 bg-stone-50 font-semibold">
                <td className="px-5 py-3 text-stone-900" colSpan={2}>Totals</td>
                <td className="px-5 py-3 text-right text-stone-900">{formatCurrency(bucketTotals.total)}</td>
                <td className="px-5 py-3 text-right text-stone-900">{formatCurrency(bucketTotals.current)}</td>
                <td className="px-5 py-3 text-right text-stone-900">{formatCurrency(bucketTotals.days30)}</td>
                <td className="px-5 py-3 text-right text-amber-700">{formatCurrency(bucketTotals.days60)}</td>
                <td className="px-5 py-3 text-right text-orange-700">{formatCurrency(bucketTotals.days90)}</td>
                <td className="px-5 py-3 text-right text-red-700">{formatCurrency(bucketTotals.days120Plus)}</td>
              </tr>
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-stone-400">
                    No accounts match the current filters.
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
