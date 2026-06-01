'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  Bell,
  CalendarPlus,
  Trash2,
  Users,
  AlertTriangle,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface WaitlistEntry {
  id: string;
  patientName: string;
  patientPhone: string;
  requestedDate: string;
  currentAppointment: string;
  provider: string;
  priority: Priority;
  addedDate: string;
  notes: string;
}

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_WAITLIST: WaitlistEntry[] = [
  {
    id: '1',
    patientName: 'Sarah Johnson',
    patientPhone: '(555) 123-4567',
    requestedDate: '2026-06-05',
    currentAppointment: '2026-06-18 at 10:00 AM',
    provider: 'Dr. Smith',
    priority: 'high',
    addedDate: '2026-05-28',
    notes: 'Patient experiencing intermittent pain, would like to be seen sooner.',
  },
  {
    id: '2',
    patientName: 'Michael Chen',
    patientPhone: '(555) 234-5678',
    requestedDate: '2026-06-03',
    currentAppointment: '2026-06-12 at 2:00 PM',
    provider: 'Dr. Williams',
    priority: 'urgent',
    addedDate: '2026-05-30',
    notes: 'Broken temporary crown, needs to be seen ASAP.',
  },
  {
    id: '3',
    patientName: 'Emily Rodriguez',
    patientPhone: '(555) 345-6789',
    requestedDate: '2026-06-07',
    currentAppointment: '2026-06-20 at 9:00 AM',
    provider: 'Dr. Smith',
    priority: 'medium',
    addedDate: '2026-05-27',
    notes: 'Prefers morning appointments.',
  },
  {
    id: '4',
    patientName: 'James Wilson',
    patientPhone: '(555) 456-7890',
    requestedDate: '2026-06-10',
    currentAppointment: '2026-06-25 at 11:00 AM',
    provider: 'Dr. Johnson',
    priority: 'low',
    addedDate: '2026-05-29',
    notes: 'Routine cleaning, flexible on times.',
  },
  {
    id: '5',
    patientName: 'Lisa Thompson',
    patientPhone: '(555) 567-8901',
    requestedDate: '2026-06-04',
    currentAppointment: '2026-06-15 at 3:00 PM',
    provider: 'Dr. Williams',
    priority: 'high',
    addedDate: '2026-05-26',
    notes: 'Treatment plan follow-up, concerned about delaying.',
  },
  {
    id: '6',
    patientName: 'David Park',
    patientPhone: '(555) 678-9012',
    requestedDate: '2026-06-06',
    currentAppointment: '2026-06-22 at 1:00 PM',
    provider: 'Dr. Smith',
    priority: 'medium',
    addedDate: '2026-05-31',
    notes: 'Would like any available slot this week.',
  },
  {
    id: '7',
    patientName: 'Amanda Foster',
    patientPhone: '(555) 789-0123',
    requestedDate: '2026-06-09',
    currentAppointment: '2026-06-28 at 10:30 AM',
    provider: 'Dr. Johnson',
    priority: 'low',
    addedDate: '2026-05-25',
    notes: 'Annual exam, no rush but prefers sooner if possible.',
  },
  {
    id: '8',
    patientName: 'Robert Kim',
    patientPhone: '(555) 890-1234',
    requestedDate: '2026-06-02',
    currentAppointment: '2026-06-10 at 4:00 PM',
    provider: 'Dr. Williams',
    priority: 'urgent',
    addedDate: '2026-06-01',
    notes: 'Severe toothache, needs emergency slot.',
  },
];

const PROVIDERS = ['All Providers', 'Dr. Smith', 'Dr. Williams', 'Dr. Johnson'];
const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low'];

// ═══════════════════ CONSTANTS ═══════════════════

const PRIORITY_CONFIG: Record<Priority, { label: string; class: string; dotClass: string }> = {
  urgent: {
    label: 'Urgent',
    class: 'bg-red-100 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
  high: {
    label: 'High',
    class: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  medium: {
    label: 'Medium',
    class: 'bg-blue-100 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  low: {
    label: 'Low',
    class: 'bg-stone-100 text-stone-600 border-stone-200',
    dotClass: 'bg-stone-400',
  },
};

// ═══════════════════ HELPERS ═══════════════════

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>(MOCK_WAITLIST);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('All Providers');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    let result = entries;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.patientName.toLowerCase().includes(q) ||
          e.provider.toLowerCase().includes(q)
      );
    }

    if (providerFilter !== 'All Providers') {
      result = result.filter((e) => e.provider === providerFilter);
    }

    if (priorityFilter) {
      result = result.filter((e) => e.priority === priorityFilter);
    }

    // Sort: urgent first, then high, medium, low
    const priorityOrder: Record<Priority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    result = [...result].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return result;
  }, [entries, search, providerFilter, priorityFilter]);

  const handleRemove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const urgentCount = entries.filter((e) => e.priority === 'urgent').length;
  const highCount = entries.filter((e) => e.priority === 'high').length;
  const hasActiveFilters = providerFilter !== 'All Providers' || priorityFilter !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Appointment Waitlist</h1>
          <p className="mt-1 text-sm text-stone-500">
            Patients waiting for earlier appointment slots
          </p>
        </div>
        <div className="flex items-center gap-3">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {urgentCount} urgent
            </span>
          )}
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            {entries.length} total
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {PRIORITIES.map((priority) => {
          const cfg = PRIORITY_CONFIG[priority];
          const count = entries.filter((e) => e.priority === priority).length;
          return (
            <div
              key={priority}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className={cn('h-2.5 w-2.5 rounded-full', cfg.dotClass)} />
                <span className="text-sm font-medium text-stone-600">
                  {cfg.label}
                </span>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-stone-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient or provider..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_CONFIG[p].label}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setProviderFilter('All Providers');
              setPriorityFilter('');
            }}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">
              No waitlist entries
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              {search || hasActiveFilters
                ? 'Try adjusting your filters.'
                : 'The waitlist is currently empty.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                    Patient
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                    Requested Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                    Current Appointment
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                    Provider
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                    Priority
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                    Added
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const cfg = PRIORITY_CONFIG[entry.priority];
                  const isExpanded = expandedId === entry.id;
                  return (
                    <>
                      <tr
                        key={entry.id}
                        onClick={() =>
                          setExpandedId(isExpanded ? null : entry.id)
                        }
                        className={cn(
                          'border-b border-stone-50 transition-colors hover:bg-stone-50 cursor-pointer',
                          entry.priority === 'urgent' && 'bg-red-50/30'
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
                              {entry.patientName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div>
                              <p className="font-medium text-stone-900">
                                {entry.patientName}
                              </p>
                              <p className="text-xs text-stone-500">
                                {entry.patientPhone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-stone-700">
                          {formatDate(entry.requestedDate)}
                        </td>
                        <td className="px-5 py-3.5 text-stone-700">
                          {entry.currentAppointment}
                        </td>
                        <td className="px-5 py-3.5 text-stone-700">
                          {entry.provider}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                              cfg.class
                            )}
                          >
                            <span
                              className={cn('h-1.5 w-1.5 rounded-full', cfg.dotClass)}
                            />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-stone-500">
                          {formatDate(entry.addedDate)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              title="Notify Patient"
                              className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Bell className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              title="Schedule"
                              className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-teal-50 hover:text-teal-600"
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(entry.id);
                              }}
                              title="Remove"
                              className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${entry.id}-notes`} className="border-b border-stone-100">
                          <td colSpan={7} className="bg-stone-50 px-5 py-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-stone-500">
                                Notes:
                              </span>
                              <p className="text-xs text-stone-600">
                                {entry.notes}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
