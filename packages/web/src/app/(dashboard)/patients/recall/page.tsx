'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Calendar,
  Filter,
  Send,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarCheck,
  Users,
  X,
  Loader2,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeDate } from '@/lib/formatters';

// ═══════════════════ TYPES ═══════════════════

interface RecallPatient {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  email: string | null;
  recallType: string;
  lastVisitDate: string | null;
  dueDate: string;
  status: 'DUE' | 'OVERDUE' | 'SCHEDULED';
  scheduledDate: string | null;
  lastReminderSent: string | null;
}

interface RecallListResponse {
  data: RecallPatient[];
  total: number;
  summary: {
    due: number;
    overdue: number;
    scheduled: number;
  };
}

// ═══════════════════ CONSTANTS ═══════════════════

const RECALL_TYPES = [
  { label: 'All Types', value: '' },
  { label: '6-Month Cleaning', value: 'CLEANING_6MO' },
  { label: 'Annual Exam', value: 'ANNUAL_EXAM' },
  { label: 'Perio Maintenance', value: 'PERIO_MAINT' },
  { label: 'Follow-up', value: 'FOLLOW_UP' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  DUE: { label: 'Due', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  OVERDUE: { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  SCHEDULED: { label: 'Scheduled', color: 'bg-green-100 text-green-700 border-green-200', icon: CalendarCheck },
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function RecallListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [recallType, setRecallType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = new URLSearchParams();
  if (recallType) queryParams.set('type', recallType);
  if (statusFilter) queryParams.set('status', statusFilter);
  if (dateFrom) queryParams.set('dateFrom', dateFrom);
  if (dateTo) queryParams.set('dateTo', dateTo);

  const { data, isLoading } = useQuery({
    queryKey: ['recall-list', recallType, statusFilter, dateFrom, dateTo],
    queryFn: () => apiGet<RecallListResponse>(`/api/patients/recall?${queryParams.toString()}`),
  });

  const sendRemindersMutation = useMutation({
    mutationFn: (patientIds: string[]) =>
      apiPost('/api/patients/recall/send-reminders', { patientIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recall-list'] });
      setSelectedIds(new Set());
    },
  });

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    if (!search) return data.data;
    const q = search.toLowerCase();
    return data.data.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
    );
  }, [data, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((p) => p.id)));
    }
  };

  const handleSendReminders = () => {
    const ids = Array.from(selectedIds);
    if (ids.length > 0) {
      sendRemindersMutation.mutate(ids);
    }
  };

  const hasActiveFilters = recallType || statusFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Recall List</h1>
          <p className="mt-1 text-sm text-stone-500">
            Patients due for recall appointments
          </p>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleSendReminders}
            disabled={sendRemindersMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-stone-300"
          >
            {sendRemindersMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Reminders ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Due</p>
              <p className="text-xl font-bold text-stone-900">{data?.summary?.due ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Overdue</p>
              <p className="text-xl font-bold text-stone-900">{data?.summary?.overdue ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <CalendarCheck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Scheduled</p>
              <p className="text-xl font-bold text-stone-900">{data?.summary?.scheduled ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={recallType}
            onChange={(e) => setRecallType(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {RECALL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              hasActiveFilters
                ? 'border-teal-200 bg-teal-50 text-teal-700'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="DUE">Due</option>
              <option value="OVERDUE">Overdue</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Due From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Due To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setRecallType('');
                setStatusFilter('');
                setDateFrom('');
                setDateTo('');
              }}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-50"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Recall Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No recall patients found</h3>
            <p className="mt-1 text-xs text-stone-500">
              {search ? 'Try adjusting your search or filters.' : 'No patients are currently due for recall.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Patient</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Recall Type</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Due Date</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Last Visit</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Last Reminder</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((patient) => {
                const statusConf = STATUS_CONFIG[patient.status] ?? STATUS_CONFIG.DUE;
                const StatusIcon = statusConf.icon;
                return (
                  <tr
                    key={patient.id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(patient.id)}
                        onChange={() => toggleSelect(patient.id)}
                        className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-stone-900">{patient.patientName}</p>
                        <p className="text-xs text-stone-500">{patient.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {patient.recallType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{formatDate(patient.dueDate)}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {patient.lastVisitDate ? formatRelativeDate(patient.lastVisitDate) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          statusConf.color
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {patient.lastReminderSent ? formatRelativeDate(patient.lastReminderSent) : 'Never'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
