'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Clock, FileText, Filter } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { TreatmentTimeline } from '@/components/treatments/TreatmentTimeline';

interface TreatmentRecord {
  id: string;
  date: string;
  procedureCode: string;
  description: string;
  toothNumber?: number;
  surface?: string;
  provider: string;
  fee: number;
  status: 'completed' | 'planned' | 'in_progress';
  notes?: string;
}

interface TreatmentHistoryResponse {
  data: TreatmentRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export default function TreatmentHistoryPage() {
  const params = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery<TreatmentHistoryResponse>({
    queryKey: ['treatment-history', params.id, page, statusFilter],
    queryFn: () => {
      const qs = new URLSearchParams({ page: String(page), limit: '25' });
      if (statusFilter) qs.set('status', statusFilter);
      return apiGet<TreatmentHistoryResponse>(
        `/api/patients/${params.id}/treatments?${qs.toString()}`
      );
    },
    enabled: !!params.id,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Treatment History</h2>
          <p className="mt-1 text-sm text-stone-500">
            {data?.total ?? 0} treatments on record
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-stone-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-stone-200" />
                <div className="h-3 w-72 animate-pulse rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <TreatmentTimeline treatments={data.data} />
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-lg font-medium text-stone-700">
            No Treatment History
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Treatment records will appear here after procedures are completed.
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-6 py-3 shadow-sm">
          <p className="text-sm text-stone-500">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
