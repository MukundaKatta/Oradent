'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  AlertTriangle,
  Clock,
  CalendarCheck,
  Users,
  CalendarPlus,
  Phone,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

// ═══════════════════ TYPES ═══════════════════

interface RecallStats {
  dueForRecall: number;
  overdue: number;
  scheduled: number;
}

interface RecallPatient {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  email: string | null;
  lastCleaningDate: string | null;
  daysSinceLastCleaning: number | null;
  status: 'DUE' | 'OVERDUE' | 'SCHEDULED';
}

interface RecallListResponse {
  data: RecallPatient[];
  total: number;
}

// ═══════════════════ HELPERS ═══════════════════

function getRowColor(daysSince: number | null): string {
  if (daysSince === null) return 'bg-red-50 border-l-4 border-l-red-400';
  const months = daysSince / 30;
  if (months > 8) return 'bg-red-50 border-l-4 border-l-red-400';
  if (months > 6) return 'bg-amber-50 border-l-4 border-l-amber-400';
  return 'bg-green-50 border-l-4 border-l-green-400';
}

function getDaysBadgeColor(daysSince: number | null): string {
  if (daysSince === null) return 'bg-red-100 text-red-700';
  const months = daysSince / 30;
  if (months > 8) return 'bg-red-100 text-red-700';
  if (months > 6) return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function RecallListPage() {
  const [search, setSearch] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['recall-stats'],
    queryFn: () => apiGet<RecallStats>('/api/patients/recall/stats'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['recall-list'],
    queryFn: () => apiGet<RecallListResponse>('/api/patients/recall'),
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Recall List</h1>
        <p className="mt-1 text-sm text-stone-500">
          Patients due for recall appointments and cleanings
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Due for Recall</p>
              <p className="text-xl font-bold text-stone-900">
                {stats?.dueForRecall ?? 0}
              </p>
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
              <p className="text-xl font-bold text-stone-900">
                {stats?.overdue ?? 0}
              </p>
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
              <p className="text-xl font-bold text-stone-900">
                {stats?.scheduled ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

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
            <h3 className="mt-3 text-sm font-medium text-stone-700">
              No patients due for recall
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              {search
                ? 'Try adjusting your search terms.'
                : 'All patients are up to date with their appointments.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-medium text-stone-500">
                    Patient Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">
                    Last Cleaning
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">
                    Days Since
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((patient) => (
                  <tr
                    key={patient.id}
                    className={cn(
                      'border-b border-stone-100 transition-colors hover:opacity-90',
                      getRowColor(patient.daysSinceLastCleaning)
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">
                        {patient.patientName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {patient.lastCleaningDate
                        ? formatDate(patient.lastCleaningDate)
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          getDaysBadgeColor(patient.daysSinceLastCleaning)
                        )}
                      >
                        {patient.daysSinceLastCleaning !== null
                          ? `${patient.daysSinceLastCleaning} days`
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-stone-600">
                        <Phone className="h-3.5 w-3.5 text-stone-400" />
                        {patient.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {patient.email ? (
                        <span className="flex items-center gap-1.5 text-stone-600">
                          <Mail className="h-3.5 w-3.5 text-stone-400" />
                          {patient.email}
                        </span>
                      ) : (
                        <span className="text-stone-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/appointments?new=true&patientId=${patient.patientId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Schedule Appointment
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
