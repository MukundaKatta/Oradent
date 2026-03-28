'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut, apiDelete } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import {
  ClipboardList,
  Search,
  Bell,
  CalendarCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- Types ----------

interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  appointmentType: string;
  urgency: 'URGENT' | 'SOON' | 'ROUTINE';
  preferredDays: string[];
  preferredTime?: string;
  status: 'WAITING' | 'NOTIFIED' | 'SCHEDULED' | 'EXPIRED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface WaitlistResponse {
  data: WaitlistEntry[];
  total: number;
  page: number;
  totalPages: number;
}

interface WaitlistStats {
  totalWaiting: number;
  byUrgency: { URGENT: number; SOON: number; ROUTINE: number };
  avgWaitDays: number;
}

// ---------- Constants ----------

const URGENCY_STYLES: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  SOON: 'bg-amber-100 text-amber-700',
  ROUTINE: 'bg-stone-100 text-stone-700',
};

const STATUS_STYLES: Record<string, string> = {
  WAITING: 'bg-teal-100 text-teal-700',
  NOTIFIED: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-stone-100 text-stone-600',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Waiting', value: 'WAITING' },
  { label: 'Notified', value: 'NOTIFIED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const URGENCY_OPTIONS = [
  { label: 'All Urgencies', value: '' },
  { label: 'Urgent', value: 'URGENT' },
  { label: 'Soon', value: 'SOON' },
  { label: 'Routine', value: 'ROUTINE' },
];

const DAY_LABELS: Record<string, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
};

const LIMIT = 20;

// ---------- Component ----------

export default function WaitlistPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['waitlist-stats'],
    queryFn: () => apiGet<WaitlistStats>('/api/waitlist/stats'),
  });

  // Fetch waitlist entries
  const queryParams = new URLSearchParams();
  if (statusFilter) queryParams.set('status', statusFilter);
  if (urgencyFilter) queryParams.set('urgency', urgencyFilter);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(LIMIT));

  const { data: waitlistData, isLoading: listLoading } = useQuery({
    queryKey: ['waitlist', statusFilter, urgencyFilter, page],
    queryFn: () =>
      apiGet<WaitlistResponse>(`/api/waitlist?${queryParams.toString()}`),
  });

  // Mutations
  const notifyMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/api/waitlist/${id}/notify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-stats'] });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/api/waitlist/${id}/schedule`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-stats'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/waitlist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-stats'] });
    },
  });

  // Filter entries client-side by search
  const filteredEntries = (waitlistData?.data ?? []).filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      entry.patientName.toLowerCase().includes(q) ||
      entry.patientEmail?.toLowerCase().includes(q) ||
      entry.patientPhone?.includes(q) ||
      entry.appointmentType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          Appointment Waitlist
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage patients waiting for available appointment slots
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statsLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-stone-200"
              />
            ))}
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-100">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-500">
                  Total Waiting
                </p>
                <p className="text-2xl font-bold text-stone-900">
                  {stats?.totalWaiting ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-500">
                  Avg Wait Time
                </p>
                <p className="text-2xl font-bold text-stone-900">
                  {stats?.avgWaitDays ?? 0}{' '}
                  <span className="text-sm font-normal text-stone-500">
                    days
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-500">
                  Urgent Count
                </p>
                <p className="text-2xl font-bold text-stone-900">
                  {stats?.byUrgency?.URGENT ?? 0}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={urgencyFilter}
          onChange={(e) => {
            setUrgencyFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {URGENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Waitlist Table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-4 py-3 font-medium text-stone-600">
                  Patient
                </th>
                <th className="px-4 py-3 font-medium text-stone-600">
                  Appointment Type
                </th>
                <th className="px-4 py-3 font-medium text-stone-600">
                  Urgency
                </th>
                <th className="px-4 py-3 font-medium text-stone-600">
                  Preferred Days
                </th>
                <th className="px-4 py-3 font-medium text-stone-600">
                  Preferred Time
                </th>
                <th className="px-4 py-3 font-medium text-stone-600">
                  Wait Time
                </th>
                <th className="px-4 py-3 font-medium text-stone-600">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-stone-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <>
                  {[...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-stone-100">
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 animate-pulse rounded bg-stone-200" />
                        <div className="mt-1 h-3 w-24 animate-pulse rounded bg-stone-100" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-20 animate-pulse rounded-full bg-stone-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-16 animate-pulse rounded-full bg-stone-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-28 animate-pulse rounded bg-stone-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-stone-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 animate-pulse rounded bg-stone-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-16 animate-pulse rounded-full bg-stone-200" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <div className="h-7 w-7 animate-pulse rounded bg-stone-200" />
                          <div className="h-7 w-7 animate-pulse rounded bg-stone-200" />
                          <div className="h-7 w-7 animate-pulse rounded bg-stone-200" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <ClipboardList className="mx-auto h-10 w-10 text-stone-300" />
                    <p className="mt-2 text-sm font-medium text-stone-500">
                      No waitlist entries found
                    </p>
                    <p className="text-xs text-stone-400">
                      Try adjusting your filters or search query
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    {/* Patient Name */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">
                        {entry.patientName}
                      </p>
                      <div className="mt-0.5 space-x-2 text-xs text-stone-500">
                        {entry.patientPhone && (
                          <span>{entry.patientPhone}</span>
                        )}
                        {entry.patientEmail && (
                          <span>{entry.patientEmail}</span>
                        )}
                      </div>
                    </td>

                    {/* Appointment Type */}
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                        {entry.appointmentType}
                      </span>
                    </td>

                    {/* Urgency */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          URGENCY_STYLES[entry.urgency] ?? URGENCY_STYLES.ROUTINE
                        )}
                      >
                        {entry.urgency}
                      </span>
                    </td>

                    {/* Preferred Days */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((day) => (
                          <span
                            key={day}
                            className={cn(
                              'inline-flex h-6 w-8 items-center justify-center rounded text-xs font-medium',
                              entry.preferredDays?.includes(day)
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-stone-50 text-stone-300'
                            )}
                          >
                            {DAY_LABELS[day]}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Preferred Time */}
                    <td className="px-4 py-3 text-stone-700">
                      {entry.preferredTime ?? '--'}
                    </td>

                    {/* Wait Time */}
                    <td className="px-4 py-3 text-stone-700">
                      {formatDistanceToNow(new Date(entry.createdAt), {
                        addSuffix: false,
                      })}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_STYLES[entry.status] ?? STATUS_STYLES.WAITING
                        )}
                      >
                        {entry.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title="Notify Patient"
                          onClick={() => notifyMutation.mutate(entry.id)}
                          disabled={
                            notifyMutation.isPending ||
                            entry.status === 'CANCELLED' ||
                            entry.status === 'SCHEDULED'
                          }
                          className="rounded p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Bell className="h-4 w-4" />
                        </button>
                        <button
                          title="Mark Scheduled"
                          onClick={() => scheduleMutation.mutate(entry.id)}
                          disabled={
                            scheduleMutation.isPending ||
                            entry.status === 'CANCELLED' ||
                            entry.status === 'SCHEDULED'
                          }
                          className="rounded p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <CalendarCheck className="h-4 w-4" />
                        </button>
                        <button
                          title="Cancel Entry"
                          onClick={() => cancelMutation.mutate(entry.id)}
                          disabled={
                            cancelMutation.isPending ||
                            entry.status === 'CANCELLED' ||
                            entry.status === 'SCHEDULED'
                          }
                          className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {waitlistData && waitlistData.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-6 py-3 shadow-sm">
          <p className="text-sm text-stone-500">
            Page {waitlistData.page} of {waitlistData.totalPages} ({waitlistData.total} entries)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() =>
                setPage((p) => Math.min(waitlistData.totalPages, p + 1))
              }
              disabled={page >= waitlistData.totalPages}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
