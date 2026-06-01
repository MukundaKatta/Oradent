'use client';

import { useState } from 'react';
import {
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_SUMMARY = {
  totalProduction: 12450.0,
  totalCollections: 9875.0,
  adjustments: -1250.0,
  netProduction: 11200.0,
};

const MOCK_PROVIDER_BREAKDOWN = [
  {
    id: '1',
    name: 'Dr. Emily Carter',
    title: 'DDS',
    patients: 8,
    production: 6850.0,
    collections: 5200.0,
    adjustments: -650.0,
  },
  {
    id: '2',
    name: 'Dr. James Wilson',
    title: 'DMD',
    patients: 6,
    production: 4200.0,
    collections: 3475.0,
    adjustments: -400.0,
  },
  {
    id: '3',
    name: 'Lisa Park',
    title: 'RDH',
    patients: 5,
    production: 1400.0,
    collections: 1200.0,
    adjustments: -200.0,
  },
];

const MOCK_PROCEDURE_SUMMARY = [
  { code: 'D0120', description: 'Periodic Oral Evaluation', count: 6, total: 420.0 },
  { code: 'D1110', description: 'Prophylaxis - Adult', count: 5, total: 750.0 },
  { code: 'D2740', description: 'Crown - Porcelain/Ceramic', count: 2, total: 2800.0 },
  { code: 'D2391', description: 'Composite - 1 Surface, Posterior', count: 4, total: 960.0 },
  { code: 'D3310', description: 'Root Canal - Anterior', count: 1, total: 1100.0 },
  { code: 'D4341', description: 'Scaling & Root Planing - Per Quad', count: 4, total: 1200.0 },
  { code: 'D0274', description: 'Bitewing - Four Films', count: 6, total: 480.0 },
  { code: 'D7140', description: 'Extraction - Erupted Tooth', count: 1, total: 250.0 },
  { code: 'D1351', description: 'Sealant - Per Tooth', count: 8, total: 560.0 },
  { code: 'D0220', description: 'Periapical First Film', count: 5, total: 200.0 },
];

const MOCK_NEW_PATIENTS = [
  {
    id: 'np1',
    name: 'Amanda Thompson',
    age: 34,
    referredBy: 'Google Search',
    provider: 'Dr. Emily Carter',
    procedure: 'Comprehensive Exam (D0150)',
  },
  {
    id: 'np2',
    name: 'Kevin Lee',
    age: 8,
    referredBy: 'Parent - existing patient',
    provider: 'Dr. Emily Carter',
    procedure: 'Periodic Exam (D0120)',
  },
  {
    id: 'np3',
    name: 'Rosa Hernandez',
    age: 45,
    referredBy: 'Dr. Patel (Referral)',
    provider: 'Dr. James Wilson',
    procedure: 'Limited Exam (D0140)',
  },
];

const MOCK_UNFINISHED = [
  {
    id: 'uf1',
    patient: 'Robert Williams',
    procedure: 'Crown Delivery #14',
    provider: 'Dr. James Wilson',
    reason: 'Lab case not ready - rescheduled to 06/05',
  },
  {
    id: 'uf2',
    patient: 'Patricia Garcia',
    procedure: 'Denture Adjustment (Lower)',
    provider: 'Dr. James Wilson',
    reason: 'Patient no-show - left voicemail',
  },
  {
    id: 'uf3',
    patient: 'Jennifer Davis',
    procedure: 'Composite #5 MO',
    provider: 'Dr. Emily Carter',
    reason: 'Patient cancelled - tooth sensitivity resolved',
  },
];

// ═══════════════════ HELPERS ═══════════════════

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function EndOfDayReportPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const summaryCards = [
    {
      label: 'Total Production',
      value: MOCK_SUMMARY.totalProduction,
      icon: DollarSign,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Total Collections',
      value: MOCK_SUMMARY.totalCollections,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Adjustments',
      value: MOCK_SUMMARY.adjustments,
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Net Production',
      value: MOCK_SUMMARY.netProduction,
      icon: DollarSign,
      color: 'bg-blue-50 text-blue-600',
    },
  ];

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav,
          aside,
          header,
          [data-sidebar],
          [data-header] {
            display: none !important;
          }
          .print-hide {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: white !important;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="print-hide flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">End of Day Report</h1>
            <p className="mt-1 text-sm text-stone-500">
              Daily summary of production, collections, and patient activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-stone-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </button>
          </div>
        </div>

        {/* Print Header (visible only in print) */}
        <div className="hidden print:block">
          <h1 className="text-xl font-bold text-stone-900">End of Day Report</h1>
          <p className="text-sm text-stone-600">{formattedDate}</p>
        </div>

        {/* Date Display */}
        <div className="rounded-xl border border-stone-200 bg-white px-6 py-3 shadow-sm">
          <p className="text-sm text-stone-600">
            Report for: <span className="font-semibold text-stone-900">{formattedDate}</span>
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', card.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">{card.label}</p>
                    <p
                      className={cn(
                        'text-xl font-bold',
                        card.value < 0 ? 'text-red-600' : 'text-stone-900'
                      )}
                    >
                      {formatCurrency(card.value)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Provider Breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-stone-900">Provider Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-6 py-3 text-left font-semibold text-stone-700">Provider</th>
                  <th className="px-6 py-3 text-right font-semibold text-stone-700">Patients</th>
                  <th className="px-6 py-3 text-right font-semibold text-stone-700">Production</th>
                  <th className="px-6 py-3 text-right font-semibold text-stone-700">Collections</th>
                  <th className="px-6 py-3 text-right font-semibold text-stone-700">Adjustments</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PROVIDER_BREAKDOWN.map((provider) => (
                  <tr key={provider.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-stone-900">{provider.name}</p>
                      <p className="text-xs text-stone-500">{provider.title}</p>
                    </td>
                    <td className="px-6 py-3 text-right text-stone-600">{provider.patients}</td>
                    <td className="px-6 py-3 text-right font-medium text-stone-900">
                      {formatCurrency(provider.production)}
                    </td>
                    <td className="px-6 py-3 text-right text-stone-600">
                      {formatCurrency(provider.collections)}
                    </td>
                    <td className="px-6 py-3 text-right text-red-600">
                      {formatCurrency(provider.adjustments)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-300 bg-stone-50 font-semibold">
                  <td className="px-6 py-3 text-stone-900">Totals</td>
                  <td className="px-6 py-3 text-right text-stone-900">
                    {MOCK_PROVIDER_BREAKDOWN.reduce((s, p) => s + p.patients, 0)}
                  </td>
                  <td className="px-6 py-3 text-right text-stone-900">
                    {formatCurrency(MOCK_PROVIDER_BREAKDOWN.reduce((s, p) => s + p.production, 0))}
                  </td>
                  <td className="px-6 py-3 text-right text-stone-900">
                    {formatCurrency(MOCK_PROVIDER_BREAKDOWN.reduce((s, p) => s + p.collections, 0))}
                  </td>
                  <td className="px-6 py-3 text-right text-red-600">
                    {formatCurrency(MOCK_PROVIDER_BREAKDOWN.reduce((s, p) => s + p.adjustments, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Procedure Summary */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-stone-400" />
              <h2 className="text-lg font-semibold text-stone-900">Procedure Summary</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-6 py-3 text-left font-semibold text-stone-700">Code</th>
                  <th className="px-6 py-3 text-left font-semibold text-stone-700">Description</th>
                  <th className="px-6 py-3 text-right font-semibold text-stone-700">Count</th>
                  <th className="px-6 py-3 text-right font-semibold text-stone-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PROCEDURE_SUMMARY.map((proc) => (
                  <tr key={proc.code} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="px-6 py-3 font-mono text-xs font-medium text-teal-700">
                      {proc.code}
                    </td>
                    <td className="px-6 py-3 text-stone-600">{proc.description}</td>
                    <td className="px-6 py-3 text-right text-stone-600">{proc.count}</td>
                    <td className="px-6 py-3 text-right font-medium text-stone-900">
                      {formatCurrency(proc.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-300 bg-stone-50 font-semibold">
                  <td className="px-6 py-3 text-stone-900" colSpan={2}>
                    Total Procedures
                  </td>
                  <td className="px-6 py-3 text-right text-stone-900">
                    {MOCK_PROCEDURE_SUMMARY.reduce((s, p) => s + p.count, 0)}
                  </td>
                  <td className="px-6 py-3 text-right text-stone-900">
                    {formatCurrency(MOCK_PROCEDURE_SUMMARY.reduce((s, p) => s + p.total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* New Patients */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-stone-400" />
              <h2 className="text-lg font-semibold text-stone-900">
                New Patients ({MOCK_NEW_PATIENTS.length})
              </h2>
            </div>
          </div>
          <div className="divide-y divide-stone-100">
            {MOCK_NEW_PATIENTS.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between px-6 py-4 hover:bg-stone-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                    {patient.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">{patient.name}</p>
                    <p className="text-xs text-stone-500">
                      Age {patient.age} | {patient.procedure}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-600">{patient.provider}</p>
                  <p className="text-xs text-stone-400">Referred by: {patient.referredBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unfinished Treatments */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-stone-900">
                Unfinished / Outstanding ({MOCK_UNFINISHED.length})
              </h2>
            </div>
          </div>
          <div className="divide-y divide-stone-100">
            {MOCK_UNFINISHED.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-stone-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{item.patient}</p>
                    <p className="text-xs text-stone-600">{item.procedure}</p>
                  </div>
                  <p className="text-xs text-stone-500">{item.provider}</p>
                </div>
                <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-700">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-xl border border-stone-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-center text-xs text-stone-400">
            End of Day Report generated on {new Date().toLocaleString()} | Bright Smile Dental -
            Confidential
          </p>
        </div>
      </div>
    </>
  );
}
