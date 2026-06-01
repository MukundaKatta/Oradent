'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Phone,
  Shield,
  Users,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from '@/lib/constants';

// ---------- Types ----------

interface HuddleAppointment {
  id: string;
  time: string;
  endTime: string;
  type: string;
  status: string;
  duration: number;
  reason: string | null;
  patient: {
    id: string;
    name: string;
    phone: string | null;
    insurance: string | null;
    remainingBenefit: number | null;
  };
  provider: {
    id: string;
    name: string;
    color: string | null;
  };
  chair: {
    id: string;
    name: string;
  } | null;
}

interface HuddleSummary {
  totalAppointments: number;
  unconfirmedCount: number;
  overdueBalance: number;
  recallsDue: number;
}

interface HuddleData {
  date: string;
  appointments: HuddleAppointment[];
  summary: HuddleSummary;
}

// ---------- Status helpers ----------

function getStatusStyle(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'CHECKED_IN':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'IN_CHAIR':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'COMPLETED':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'SCHEDULED':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-stone-50 text-stone-600 border-stone-200';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'SCHEDULED':
      return <Clock className="h-3.5 w-3.5" />;
    case 'CHECKED_IN':
      return <Users className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

// ---------- Skeletons ----------

function SummaryCardSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-stone-200" />
      </div>
      <div className="mt-4 h-8 w-20 animate-pulse rounded bg-stone-200" />
      <div className="mt-2 h-4 w-28 animate-pulse rounded bg-stone-200" />
    </div>
  );
}

function AppointmentCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center">
        <div className="h-5 w-16 animate-pulse rounded bg-stone-200" />
        <div className="mt-1 h-4 w-12 animate-pulse rounded bg-stone-100" />
      </div>
      <div className="h-full w-px bg-stone-200" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 animate-pulse rounded bg-stone-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-stone-200" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function MorningHuddlePage() {
  const {
    data: huddle,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<HuddleData>({
    queryKey: ['morning-huddle'],
    queryFn: () => apiGet('/api/reports/morning-huddle'),
    refetchInterval: 60_000,
  });

  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Morning Huddle</h1>
          <p className="mt-1 text-sm text-stone-500">{todayFormatted}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50',
            isFetching && 'opacity-60'
          )}
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            {/* Total Appointments */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-teal-100 p-2.5">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
                <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  Today
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-stone-900">
                {huddle?.summary.totalAppointments ?? 0}
              </p>
              <p className="mt-1 text-sm text-stone-500">Total Appointments</p>
            </div>

            {/* Unconfirmed */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-amber-100 p-2.5">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                {(huddle?.summary.unconfirmedCount ?? 0) > 0 && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Action needed
                  </span>
                )}
              </div>
              <p className="mt-4 text-3xl font-bold text-stone-900">
                {huddle?.summary.unconfirmedCount ?? 0}
              </p>
              <p className="mt-1 text-sm text-stone-500">Unconfirmed</p>
            </div>

            {/* Overdue Balance */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-red-100 p-2.5">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-stone-900">
                {formatCurrency(huddle?.summary.overdueBalance ?? 0)}
              </p>
              <p className="mt-1 text-sm text-stone-500">Overdue Balance</p>
            </div>

            {/* Recalls Due */}
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-violet-100 p-2.5">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-stone-900">
                {huddle?.summary.recallsDue ?? 0}
              </p>
              <p className="mt-1 text-sm text-stone-500">Recalls Due</p>
            </div>
          </>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-4">
          <div className="rounded-lg bg-teal-50 p-2">
            <Clock className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Today&apos;s Schedule
            </h2>
            <p className="text-xs text-stone-500">
              {huddle
                ? `${huddle.appointments.length} appointment${huddle.appointments.length !== 1 ? 's' : ''} scheduled`
                : 'Loading schedule...'}
            </p>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <AppointmentCardSkeleton />
              <AppointmentCardSkeleton />
              <AppointmentCardSkeleton />
              <AppointmentCardSkeleton />
            </div>
          ) : huddle && huddle.appointments.length > 0 ? (
            <div className="relative space-y-4">
              {/* Vertical timeline line */}
              <div className="absolute left-[3.25rem] top-2 bottom-2 w-px bg-stone-200" />

              {huddle.appointments.map((apt, index) => {
                const typeColor =
                  APPOINTMENT_TYPE_COLORS[apt.type] || '#78716c';
                const timeStr = format(parseISO(apt.time), 'h:mm a');
                const endTimeStr = format(parseISO(apt.endTime), 'h:mm a');

                return (
                  <div key={apt.id} className="relative flex gap-4">
                    {/* Time column */}
                    <div className="relative z-10 flex w-[4.5rem] shrink-0 flex-col items-center">
                      <span className="text-sm font-semibold text-stone-900">
                        {timeStr}
                      </span>
                      <span className="text-xs text-stone-400">
                        {apt.duration}m
                      </span>
                      {/* Timeline dot */}
                      <div
                        className="mt-1 h-3 w-3 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: typeColor }}
                      />
                    </div>

                    {/* Card */}
                    <div
                      className="flex-1 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                      style={{ borderLeftColor: typeColor, borderLeftWidth: '3px' }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-stone-900">
                            {apt.patient.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-stone-500">
                            {APPOINTMENT_TYPE_LABELS[apt.type] || apt.type}
                            {apt.reason && (
                              <span className="text-stone-400">
                                {' '}&mdash; {apt.reason}
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            getStatusStyle(apt.status)
                          )}
                        >
                          {getStatusIcon(apt.status)}
                          {APPOINTMENT_STATUS_LABELS[apt.status] || apt.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500">
                        {/* Time range */}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-stone-400" />
                          {timeStr} &ndash; {endTimeStr}
                        </span>

                        {/* Provider */}
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                apt.provider.color || '#0d9488',
                            }}
                          />
                          {apt.provider.name}
                        </span>

                        {/* Chair */}
                        {apt.chair && (
                          <span className="text-stone-400">
                            {apt.chair.name}
                          </span>
                        )}

                        {/* Phone */}
                        {apt.patient.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-stone-400" />
                            {apt.patient.phone}
                          </span>
                        )}

                        {/* Insurance */}
                        {apt.patient.insurance && (
                          <span className="inline-flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-stone-400" />
                            {apt.patient.insurance}
                            {apt.patient.remainingBenefit != null && (
                              <span className="font-medium text-stone-600">
                                ({formatCurrency(apt.patient.remainingBenefit)} remaining)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-sm text-stone-400">
              <Calendar className="mb-3 h-10 w-10 text-stone-300" />
              <p>No appointments scheduled for today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
