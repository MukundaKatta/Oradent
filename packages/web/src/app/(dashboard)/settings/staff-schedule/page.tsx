'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Plus,
  X,
  Clock,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

// ═══════════════════ TYPES ═══════════════════

interface StaffMember {
  id: string;
  name: string;
  role: string;
  color: string;
}

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'REGULAR' | 'OVERTIME' | 'ON_CALL';
  notes: string | null;
}

interface TimeOffRequest {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  requestedAt: string;
}

interface StaffScheduleResponse {
  staff: StaffMember[];
  shifts: Shift[];
  timeOffRequests: TimeOffRequest[];
}

// ═══════════════════ CONSTANTS ═══════════════════

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SHIFT_TYPE_COLORS: Record<string, string> = {
  REGULAR: 'bg-teal-100 text-teal-800 border-teal-200',
  OVERTIME: 'bg-amber-100 text-amber-800 border-amber-200',
  ON_CALL: 'bg-purple-100 text-purple-800 border-purple-200',
};

const TIME_OFF_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  DENIED: 'bg-red-100 text-red-700',
};

// ═══════════════════ HELPERS ═══════════════════

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function StaffSchedulePage() {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [shiftType, setShiftType] = useState<'REGULAR' | 'OVERTIME' | 'ON_CALL'>('REGULAR');
  const [shiftNotes, setShiftNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'time-off'>('schedule');

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const queryParams = new URLSearchParams();
  queryParams.set('startDate', formatDateKey(weekDates[0]));
  queryParams.set('endDate', formatDateKey(weekDates[6]));

  const { data, isLoading } = useQuery({
    queryKey: ['staff-schedule', weekOffset],
    queryFn: () =>
      apiGet<StaffScheduleResponse>(`/api/settings/staff-schedule?${queryParams.toString()}`),
  });

  const addShiftMutation = useMutation({
    mutationFn: (shift: {
      staffId: string;
      date: string;
      startTime: string;
      endTime: string;
      type: string;
      notes: string;
    }) => apiPost('/api/settings/staff-schedule/shifts', shift),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedule'] });
      setShowAddShift(false);
      resetShiftForm();
    },
  });

  const updateTimeOffMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPut(`/api/settings/staff-schedule/time-off/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedule'] });
    },
  });

  const resetShiftForm = () => {
    setSelectedDate('');
    setSelectedStaffId('');
    setShiftStart('08:00');
    setShiftEnd('17:00');
    setShiftType('REGULAR');
    setShiftNotes('');
  };

  const handleAddShift = () => {
    if (!selectedStaffId || !selectedDate) return;
    addShiftMutation.mutate({
      staffId: selectedStaffId,
      date: selectedDate,
      startTime: shiftStart,
      endTime: shiftEnd,
      type: shiftType,
      notes: shiftNotes,
    });
  };

  // Find coverage gaps (days where no staff are scheduled)
  const coverageGaps = useMemo(() => {
    if (!data?.shifts) return new Set<string>();
    const gaps = new Set<string>();
    weekDates.forEach((date) => {
      const dateKey = formatDateKey(date);
      const day = date.getDay();
      // Only check weekdays (Mon-Fri)
      if (day >= 1 && day <= 5) {
        const hasShift = data.shifts.some((s) => s.date === dateKey);
        if (!hasShift) {
          gaps.add(dateKey);
        }
      }
    });
    return gaps;
  }, [data, weekDates]);

  const weekLabel = `${formatDayLabel(weekDates[0])} - ${formatDayLabel(weekDates[6])}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Staff Scheduling</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage staff shifts, time off requests, and coverage
          </p>
        </div>
        <button
          onClick={() => setShowAddShift(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Add Shift
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'schedule'
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            <Calendar className="h-4 w-4" />
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('time-off')}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'time-off'
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            <Clock className="h-4 w-4" />
            Time Off
            {data?.timeOffRequests?.filter((r) => r.status === 'PENDING').length ? (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
                {data.timeOffRequests.filter((r) => r.status === 'PENDING').length}
              </span>
            ) : null}
          </button>
        </div>

        {activeTab === 'schedule' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-stone-700 min-w-[180px] text-center">
              {weekLabel}
            </span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
            >
              Today
            </button>
          </div>
        )}
      </div>

      {/* Coverage Gaps Warning */}
      {coverageGaps.size > 0 && activeTab === 'schedule' && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Coverage Gaps Detected</p>
            <p className="text-xs text-amber-600">
              {coverageGaps.size} weekday{coverageGaps.size !== 1 ? 's' : ''} with no staff scheduled this week.
            </p>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="sticky left-0 bg-stone-50 px-4 py-3 text-left font-medium text-stone-500 min-w-[140px]">
                      Staff
                    </th>
                    {weekDates.map((date, i) => {
                      const dateKey = formatDateKey(date);
                      const isGap = coverageGaps.has(dateKey);
                      const isToday = formatDateKey(new Date()) === dateKey;
                      return (
                        <th
                          key={dateKey}
                          className={cn(
                            'px-3 py-3 text-center font-medium min-w-[120px]',
                            isToday
                              ? 'bg-teal-50 text-teal-700'
                              : isGap
                                ? 'bg-amber-50 text-amber-700'
                                : 'text-stone-500'
                          )}
                        >
                          <div>{DAYS_OF_WEEK[i]}</div>
                          <div className="text-xs">{formatDayLabel(date)}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {data?.staff && data.staff.length > 0 ? (
                    data.staff.map((member) => (
                      <tr key={member.id} className="border-b border-stone-100">
                        <td className="sticky left-0 bg-white px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: member.color || '#14b8a6' }}
                            />
                            <div>
                              <p className="text-sm font-medium text-stone-900">{member.name}</p>
                              <p className="text-xs text-stone-500">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        {weekDates.map((date) => {
                          const dateKey = formatDateKey(date);
                          const shifts = data.shifts?.filter(
                            (s) => s.staffId === member.id && s.date === dateKey
                          ) ?? [];

                          // Check for time off
                          const hasTimeOff = data.timeOffRequests?.some(
                            (r) =>
                              r.staffId === member.id &&
                              r.status === 'APPROVED' &&
                              dateKey >= r.startDate &&
                              dateKey <= r.endDate
                          );

                          return (
                            <td key={dateKey} className="px-2 py-2 text-center">
                              {hasTimeOff ? (
                                <span className="inline-block rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-500 italic">
                                  Time Off
                                </span>
                              ) : shifts.length > 0 ? (
                                <div className="space-y-1">
                                  {shifts.map((shift) => (
                                    <div
                                      key={shift.id}
                                      className={cn(
                                        'rounded-md border px-2 py-1 text-xs',
                                        SHIFT_TYPE_COLORS[shift.type] ?? SHIFT_TYPE_COLORS.REGULAR
                                      )}
                                    >
                                      {shift.startTime} - {shift.endTime}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-stone-300">--</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <Users className="mx-auto h-12 w-12 text-stone-300" />
                        <h3 className="mt-3 text-sm font-medium text-stone-700">No staff members</h3>
                        <p className="mt-1 text-xs text-stone-500">
                          Add staff members in Settings to begin scheduling.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Time Off Tab */}
      {activeTab === 'time-off' && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          ) : !data?.timeOffRequests || data.timeOffRequests.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No time off requests</h3>
              <p className="mt-1 text-xs text-stone-500">
                No time off requests have been submitted.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Staff Member</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Dates</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Requested</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.timeOffRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-stone-900">{request.staffName}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{request.reason}</td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{formatDate(request.requestedAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-medium',
                          TIME_OFF_STATUS_COLORS[request.status] ?? TIME_OFF_STATUS_COLORS.PENDING
                        )}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {request.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              updateTimeOffMutation.mutate({ id: request.id, status: 'APPROVED' })
                            }
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              updateTimeOffMutation.mutate({ id: request.id, status: 'DENIED' })
                            }
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Shift Modal */}
      {showAddShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-900">Add Shift</h3>
              <button
                onClick={() => {
                  setShowAddShift(false);
                  resetShiftForm();
                }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Staff Member *</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select staff member...</option>
                  {data?.staff?.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Date *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Start Time *</label>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">End Time *</label>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Shift Type</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as 'REGULAR' | 'OVERTIME' | 'ON_CALL')}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="OVERTIME">Overtime</option>
                  <option value="ON_CALL">On Call</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Notes</label>
                <textarea
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddShift(false);
                    resetShiftForm();
                  }}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddShift}
                  disabled={!selectedStaffId || !selectedDate || addShiftMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
                >
                  {addShiftMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {addShiftMutation.isPending ? 'Adding...' : 'Add Shift'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
