'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  RefreshCcw,
  Plus,
  CheckCircle2,
  Bell,
  AlertTriangle,
  CalendarClock,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react';

// ---------- Types ----------

type RecallStatus = 'DUE' | 'SCHEDULED' | 'OVERDUE' | 'COMPLETED' | 'SKIPPED';
type RecallPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface Recall {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  type: string;
  nextDueDate: string;
  lastCompletedDate?: string;
  status: RecallStatus;
  priority: RecallPriority;
  notes?: string;
}

interface RecallListResponse {
  data: Recall[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OverdueRecall extends Recall {
  daysOverdue: number;
}

interface RecallStats {
  totalDue: number;
  overdueCount: number;
  completedThisMonth: number;
  completionRate: number;
}

interface RecallTypeGroup {
  type: string;
  count: number;
  overdueCount: number;
}

// ---------- Constants ----------

const STATUS_BADGE: Record<RecallStatus, { bg: string; text: string }> = {
  DUE: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
  SCHEDULED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  OVERDUE: { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  COMPLETED: { bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  SKIPPED: { bg: 'bg-stone-50 border-stone-200', text: 'text-stone-600' },
};

const PRIORITY_BADGE: Record<RecallPriority, { bg: string; text: string }> = {
  LOW: { bg: 'bg-stone-50', text: 'text-stone-500' },
  NORMAL: { bg: 'bg-blue-50', text: 'text-blue-600' },
  HIGH: { bg: 'bg-amber-50', text: 'text-amber-700' },
  URGENT: { bg: 'bg-red-50', text: 'text-red-700' },
};

const TABS = ['all', 'overdue', 'by-type'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  all: 'All Recalls',
  overdue: 'Overdue',
  'by-type': 'By Type',
};

const PAGE_SIZE = 10;

// ---------- Component ----------

export default function RecallPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // ---- Queries ----

  const statsQuery = useQuery({
    queryKey: ['recall', 'stats'],
    queryFn: () => apiGet<RecallStats>('/api/recall/stats'),
  });

  const recallsQuery = useQuery({
    queryKey: ['recall', 'list', page, statusFilter, typeFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      return apiGet<RecallListResponse>(`/api/recall?${params.toString()}`);
    },
  });

  const overdueQuery = useQuery({
    queryKey: ['recall', 'overdue'],
    queryFn: () => apiGet<OverdueRecall[]>('/api/recall/overdue'),
    enabled: activeTab === 'overdue',
  });

  const byTypeQuery = useQuery({
    queryKey: ['recall', 'by-type'],
    queryFn: () => apiGet<RecallTypeGroup[]>('/api/recall?groupBy=type'),
    enabled: activeTab === 'by-type',
  });

  // ---- Mutations ----

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiPut<void>(`/api/recall/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recall'] });
    },
  });

  const remindMutation = useMutation({
    mutationFn: (id: string) => apiPost<void>(`/api/recall/${id}/remind`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recall'] });
    },
  });

  // ---- Helpers ----

  const stats = statsQuery.data;
  const recalls = recallsQuery.data;

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-50 p-2.5">
            <RefreshCcw className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Recall &amp; Recare</h1>
            <p className="text-sm text-stone-500">
              Manage patient recall schedules and follow-ups
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors">
          <Plus className="h-4 w-4" />
          New Recall
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsQuery.isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-stone-200 bg-stone-100"
              />
            ))}
          </>
        ) : (
          <>
            <StatCard
              icon={<CalendarClock className="h-5 w-5 text-teal-600" />}
              iconBg="bg-teal-50"
              label="Total Due"
              value={String(stats?.totalDue ?? 0)}
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
              iconBg="bg-red-50"
              label="Overdue"
              value={String(stats?.overdueCount ?? 0)}
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
              iconBg="bg-green-50"
              label="Completed This Month"
              value={String(stats?.completedThisMonth ?? 0)}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-50"
              label="Completion Rate"
              value={`${(stats?.completionRate ?? 0).toFixed(1)}%`}
            />
          </>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && (
        <AllRecallsTab
          data={recalls}
          isLoading={recallsQuery.isLoading}
          isError={recallsQuery.isError}
          page={page}
          onPageChange={setPage}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          typeFilter={typeFilter}
          onTypeFilterChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
          onComplete={(id) => completeMutation.mutate(id)}
          onRemind={(id) => remindMutation.mutate(id)}
          completingId={completeMutation.isPending ? (completeMutation.variables as string) : null}
          remindingId={remindMutation.isPending ? (remindMutation.variables as string) : null}
        />
      )}

      {activeTab === 'overdue' && (
        <OverdueTab
          data={overdueQuery.data}
          isLoading={overdueQuery.isLoading}
          isError={overdueQuery.isError}
          onComplete={(id) => completeMutation.mutate(id)}
          onRemind={(id) => remindMutation.mutate(id)}
          completingId={completeMutation.isPending ? (completeMutation.variables as string) : null}
          remindingId={remindMutation.isPending ? (remindMutation.variables as string) : null}
        />
      )}

      {activeTab === 'by-type' && (
        <ByTypeTab
          data={byTypeQuery.data}
          isLoading={byTypeQuery.isLoading}
          isError={byTypeQuery.isError}
        />
      )}
    </div>
  );
}

// ---------- Sub-Components ----------

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2.5', iconBg)}>{icon}</div>
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="text-xl font-bold text-stone-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ---------- All Recalls Tab ----------

function AllRecallsTab({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onComplete,
  onRemind,
  completingId,
  remindingId,
}: {
  data: RecallListResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (p: number) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  onComplete: (id: string) => void;
  onRemind: (id: string) => void;
  completingId: string | null;
  remindingId: string | null;
}) {
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm font-medium text-red-700">
          Failed to load recalls. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="DUE">Due</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="OVERDUE">Overdue</option>
          <option value="COMPLETED">Completed</option>
          <option value="SKIPPED">Skipped</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">All Types</option>
          <option value="PROPHY">Prophylaxis</option>
          <option value="PERIO">Periodontal</option>
          <option value="EXAM">Exam</option>
          <option value="XRAY">X-Ray</option>
          <option value="FLUORIDE">Fluoride</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="px-4 py-3 text-left font-medium text-stone-500">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Type</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">
                  Next Due
                </th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">
                  Priority
                </th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">
                  Last Completed
                </th>
                <th className="px-4 py-3 text-right font-medium text-stone-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(PAGE_SIZE)].map((_, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-stone-100" />
                    </td>
                  </tr>
                ))
              ) : data && data.data.length > 0 ? (
                data.data.map((recall) => (
                  <RecallRow
                    key={recall.id}
                    recall={recall}
                    onComplete={onComplete}
                    onRemind={onRemind}
                    isCompleting={completingId === recall.id}
                    isReminding={remindingId === recall.id}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-stone-400"
                  >
                    No recalls found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
            <p className="text-sm text-stone-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(page * PAGE_SIZE, data.total)} of {data.total} recalls
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-stone-200 p-1.5 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === data.totalPages ||
                    Math.abs(p - page) <= 1
                )
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev !== undefined && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-stone-400">...</span>
                      )}
                      <button
                        onClick={() => onPageChange(p)}
                        className={cn(
                          'min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
                          p === page
                            ? 'bg-teal-600 text-white'
                            : 'text-stone-600 hover:bg-stone-100'
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= (data?.totalPages ?? 1)}
                className="rounded-lg border border-stone-200 p-1.5 text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Recall Row ----------

function RecallRow({
  recall,
  onComplete,
  onRemind,
  isCompleting,
  isReminding,
}: {
  recall: Recall;
  onComplete: (id: string) => void;
  onRemind: (id: string) => void;
  isCompleting: boolean;
  isReminding: boolean;
}) {
  const statusStyle = STATUS_BADGE[recall.status] ?? STATUS_BADGE.DUE;
  const priorityStyle = PRIORITY_BADGE[recall.priority] ?? PRIORITY_BADGE.NORMAL;

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
      <td className="px-4 py-3 font-medium text-stone-900">{recall.patientName}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
          {recall.type}
        </span>
      </td>
      <td className="px-4 py-3 text-stone-700">{formatDate(recall.nextDueDate)}</td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
            statusStyle.bg,
            statusStyle.text
          )}
        >
          {recall.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            priorityStyle.bg,
            priorityStyle.text
          )}
        >
          {recall.priority}
        </span>
      </td>
      <td className="px-4 py-3 text-stone-500">
        {formatDate(recall.lastCompletedDate)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {recall.status !== 'COMPLETED' && (
            <>
              <button
                onClick={() => onComplete(recall.id)}
                disabled={isCompleting}
                className="flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isCompleting ? 'Saving...' : 'Complete'}
              </button>
              <button
                onClick={() => onRemind(recall.id)}
                disabled={isReminding}
                className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <Bell className="h-3.5 w-3.5" />
                {isReminding ? 'Sending...' : 'Remind'}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------- Overdue Tab ----------

function OverdueTab({
  data,
  isLoading,
  isError,
  onComplete,
  onRemind,
  completingId,
  remindingId,
}: {
  data: OverdueRecall[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onComplete: (id: string) => void;
  onRemind: (id: string) => void;
  completingId: string | null;
  remindingId: string | null;
}) {
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm font-medium text-red-700">
          Failed to load overdue recalls.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-stone-200 bg-stone-100"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-300" />
        <h3 className="mt-3 text-lg font-medium text-stone-700">All caught up!</h3>
        <p className="mt-1 text-sm text-stone-500">
          There are no overdue recalls at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((recall) => (
        <div
          key={recall.id}
          className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:border-stone-300 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-stone-900">{recall.patientName}</p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-stone-500">
                <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-600">
                  {recall.type}
                </span>
                <span>Due: {formatDate(recall.nextDueDate)}</span>
                <span className="font-semibold text-red-600">
                  {recall.daysOverdue} days overdue
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Contact Info */}
            <div className="flex items-center gap-3 text-xs text-stone-500">
              {recall.patientPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {recall.patientPhone}
                </span>
              )}
              {recall.patientEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {recall.patientEmail}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onComplete(recall.id)}
                disabled={completingId === recall.id}
                className="flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completingId === recall.id ? 'Saving...' : 'Complete'}
              </button>
              <button
                onClick={() => onRemind(recall.id)}
                disabled={remindingId === recall.id}
                className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <Bell className="h-3.5 w-3.5" />
                {remindingId === recall.id ? 'Sending...' : 'Remind'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- By Type Tab ----------

function ByTypeTab({
  data,
  isLoading,
  isError,
}: {
  data: RecallTypeGroup[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm font-medium text-red-700">
          Failed to load recall type data.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-stone-200 bg-stone-100"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
        <Users className="mx-auto h-12 w-12 text-stone-300" />
        <h3 className="mt-3 text-lg font-medium text-stone-700">No Data</h3>
        <p className="mt-1 text-sm text-stone-500">
          No recall type data available.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((group) => (
        <div
          key={group.type}
          className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900">{group.type}</h3>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              {group.count}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div>
              <p className="text-xs text-stone-500">Total</p>
              <p className="text-lg font-bold text-stone-900">{group.count}</p>
            </div>
            <div className="h-8 w-px bg-stone-200" />
            <div>
              <p className="text-xs text-stone-500">Overdue</p>
              <p
                className={cn(
                  'text-lg font-bold',
                  group.overdueCount > 0 ? 'text-red-600' : 'text-stone-900'
                )}
              >
                {group.overdueCount}
              </p>
            </div>
          </div>
          {group.count > 0 && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    group.overdueCount > 0 ? 'bg-red-400' : 'bg-teal-500'
                  )}
                  style={{
                    width: `${Math.min(
                      ((group.count - group.overdueCount) / group.count) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-stone-400">
                {group.count - group.overdueCount} of {group.count} on track
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
