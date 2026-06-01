'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { AuditLog, Provider } from '@/types';

// ═══════════════════ TYPES ═══════════════════

interface AuditLogResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ═══════════════════ CONSTANTS ═══════════════════

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  READ: 'bg-stone-100 text-stone-600 border-stone-200',
};

const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE', 'READ'];

const RESOURCE_OPTIONS = [
  'Patient',
  'Appointment',
  'Treatment',
  'TreatmentPlan',
  'Invoice',
  'Payment',
  'InsuranceClaim',
  'ClinicalNote',
  'Provider',
  'Practice',
  'Chair',
  'DentalImage',
];

// ═══════════════════ SKELETON ═══════════════════

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-200" />
      ))}
    </div>
  );
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const limit = 50;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (actionFilter) queryParams.set('action', actionFilter);
  if (resourceFilter) queryParams.set('resource', resourceFilter);
  if (providerFilter) queryParams.set('providerId', providerFilter);
  if (startDate) queryParams.set('startDate', startDate);
  if (endDate) queryParams.set('endDate', endDate);

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-log', page, actionFilter, resourceFilter, providerFilter, startDate, endDate],
    queryFn: () => apiGet<AuditLogResponse>(`/api/settings/audit-log?${queryParams.toString()}`),
  });

  const { data: providers } = useQuery({
    queryKey: ['settings', 'providers'],
    queryFn: () => apiGet<Provider[]>('/api/settings/providers'),
  });

  const handleFilterChange = () => {
    setPage(1);
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || 'bg-stone-100 text-stone-600 border-stone-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Audit Log</h1>
          <p className="mt-1 text-sm text-stone-500">
            Track all actions performed in your practice
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); handleFilterChange(); }}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Resource</label>
            <select
              value={resourceFilter}
              onChange={(e) => { setResourceFilter(e.target.value); handleFilterChange(); }}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Resources</option>
              {RESOURCE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Provider</label>
            <select
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); handleFilterChange(); }}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Providers</option>
              {providers?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); handleFilterChange(); }}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); handleFilterChange(); }}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {(actionFilter || resourceFilter || providerFilter || startDate || endDate) && (
            <button
              onClick={() => {
                setActionFilter('');
                setResourceFilter('');
                setProviderFilter('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {error ? (
          <div className="p-8 text-center">
            <Search className="mx-auto h-10 w-10 text-red-400" />
            <p className="mt-3 text-sm font-medium text-red-700">
              Failed to load audit logs. Please try again.
            </p>
          </div>
        ) : isLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No audit logs</h3>
            <p className="mt-1 text-xs text-stone-500">
              No activity has been recorded yet, or no logs match your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Provider</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Resource</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Resource ID</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Details</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-stone-50">
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                        {log.provider?.name || 'System'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={cn(
                            'inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            getActionColor(log.action)
                          )}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                        {log.resource}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">
                        {log.resourceId.length > 16
                          ? `${log.resourceId.slice(0, 16)}...`
                          : log.resourceId}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-xs text-stone-500">
                        {log.details ? JSON.stringify(log.details) : '--'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">
                        {log.ipAddress || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4">
                <p className="text-sm text-stone-500">
                  Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className={cn(
                      'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                      page <= 1
                        ? 'cursor-not-allowed border-stone-200 text-stone-300'
                        : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="px-2 text-sm text-stone-600">
                    Page {data.pagination.page} of {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={page >= data.pagination.pages}
                    className={cn(
                      'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                      page >= data.pagination.pages
                        ? 'cursor-not-allowed border-stone-200 text-stone-300'
                        : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
