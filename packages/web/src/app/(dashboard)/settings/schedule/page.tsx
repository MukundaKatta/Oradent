'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Save,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { apiGet, apiPut } from '@/lib/api';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface ProviderSchedule {
  id: string;
  name: string;
  title: string;
  color: string;
  schedule: WeeklySchedule;
}

interface WeeklySchedule {
  [day: string]: DaySchedule;
}

interface DaySchedule {
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breaks: TimeBlock[];
}

interface TimeBlock {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

// ═══════════════════ CONSTANTS ═══════════════════

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBREV: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 7; // 7 AM to 8 PM
  return {
    value: `${hour.toString().padStart(2, '0')}:00`,
    label: hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`,
  };
});

const DEFAULT_DAY: DaySchedule = {
  isWorking: true,
  startTime: '08:00',
  endTime: '17:00',
  breaks: [],
};

const DEFAULT_NON_WORKING: DaySchedule = {
  isWorking: false,
  startTime: '08:00',
  endTime: '17:00',
  breaks: [],
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function ProviderSchedulePage() {
  const queryClient = useQueryClient();
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<WeeklySchedule | null>(null);
  const [addingBreak, setAddingBreak] = useState<string | null>(null);
  const [breakLabel, setBreakLabel] = useState('Lunch');
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');

  const { data: providers, isLoading } = useQuery({
    queryKey: ['provider-schedules'],
    queryFn: () => apiGet<ProviderSchedule[]>('/api/settings/providers/schedules'),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { providerId: string; schedule: WeeklySchedule }) =>
      apiPut(`/api/settings/providers/${data.providerId}`, { schedule: data.schedule }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-schedules'] });
      setEditingSchedule(null);
    },
  });

  const selectedProvider = providers?.find((p) => p.id === selectedProviderId) ?? null;

  const currentSchedule = editingSchedule ?? selectedProvider?.schedule ?? null;

  const startEditing = useCallback(() => {
    if (selectedProvider?.schedule) {
      setEditingSchedule(JSON.parse(JSON.stringify(selectedProvider.schedule)));
    }
  }, [selectedProvider]);

  const handleToggleDay = (day: string) => {
    if (!editingSchedule) return;
    setEditingSchedule({
      ...editingSchedule,
      [day]: {
        ...editingSchedule[day],
        isWorking: !editingSchedule[day]?.isWorking,
      },
    });
  };

  const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    if (!editingSchedule) return;
    setEditingSchedule({
      ...editingSchedule,
      [day]: {
        ...editingSchedule[day],
        [field]: value,
      },
    });
  };

  const handleAddBreak = (day: string) => {
    if (!editingSchedule) return;
    const daySchedule = editingSchedule[day];
    if (!daySchedule) return;
    const newBreak: TimeBlock = {
      id: `break-${Date.now()}`,
      label: breakLabel,
      startTime: breakStart,
      endTime: breakEnd,
    };
    setEditingSchedule({
      ...editingSchedule,
      [day]: {
        ...daySchedule,
        breaks: [...(daySchedule.breaks ?? []), newBreak],
      },
    });
    setAddingBreak(null);
    setBreakLabel('Lunch');
    setBreakStart('12:00');
    setBreakEnd('13:00');
  };

  const handleRemoveBreak = (day: string, breakId: string) => {
    if (!editingSchedule) return;
    const daySchedule = editingSchedule[day];
    if (!daySchedule) return;
    setEditingSchedule({
      ...editingSchedule,
      [day]: {
        ...daySchedule,
        breaks: daySchedule.breaks.filter((b) => b.id !== breakId),
      },
    });
  };

  const handleSave = () => {
    if (!selectedProviderId || !editingSchedule) return;
    saveMutation.mutate({ providerId: selectedProviderId, schedule: editingSchedule });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Provider Schedules</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage working hours and availability for each provider
          </p>
        </div>
        {editingSchedule && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingSchedule(null)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-stone-300"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saveMutation.isPending ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        )}
      </div>

      {/* Provider Selection */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="h-12 w-40 animate-pulse rounded-lg bg-stone-200" />
            ))
          : providers?.map((provider) => (
              <button
                key={provider.id}
                onClick={() => {
                  setSelectedProviderId(provider.id);
                  setEditingSchedule(null);
                }}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  selectedProviderId === provider.id
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                )}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: provider.color || '#14b8a6' }}
                />
                {provider.name}
              </button>
            ))}
      </div>

      {/* Schedule Grid */}
      {selectedProvider && currentSchedule ? (
        <div className="space-y-3">
          {!editingSchedule && (
            <div className="flex justify-end">
              <button
                onClick={startEditing}
                className="flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                <Clock className="h-4 w-4" />
                Edit Schedule
              </button>
            </div>
          )}

          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            {DAYS.map((day) => {
              const daySchedule = currentSchedule[day] ?? (day === 'Saturday' || day === 'Sunday' ? DEFAULT_NON_WORKING : DEFAULT_DAY);
              const isEditing = !!editingSchedule;

              return (
                <div
                  key={day}
                  className={cn(
                    'flex items-start gap-4 border-b border-stone-100 px-5 py-4 last:border-b-0',
                    !daySchedule.isWorking && 'bg-stone-50'
                  )}
                >
                  {/* Day label */}
                  <div className="w-28 shrink-0 pt-1">
                    <span className="text-sm font-semibold text-stone-900">{day}</span>
                  </div>

                  {/* Working toggle */}
                  <div className="shrink-0 pt-1">
                    {isEditing ? (
                      <button
                        onClick={() => handleToggleDay(day)}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors',
                          daySchedule.isWorking ? 'bg-teal-600' : 'bg-stone-300'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                            daySchedule.isWorking ? 'left-[22px]' : 'left-0.5'
                          )}
                        />
                      </button>
                    ) : (
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                          daySchedule.isWorking
                            ? 'bg-green-100 text-green-700'
                            : 'bg-stone-100 text-stone-500'
                        )}
                      >
                        {daySchedule.isWorking ? 'Working' : 'Off'}
                      </span>
                    )}
                  </div>

                  {/* Schedule details */}
                  {daySchedule.isWorking ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <input
                              type="time"
                              value={daySchedule.startTime}
                              onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                              className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <span className="text-stone-400">to</span>
                            <input
                              type="time"
                              value={daySchedule.endTime}
                              onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                              className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                          </>
                        ) : (
                          <span className="text-sm text-stone-700">
                            {daySchedule.startTime} - {daySchedule.endTime}
                          </span>
                        )}
                      </div>

                      {/* Breaks */}
                      {daySchedule.breaks && daySchedule.breaks.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {daySchedule.breaks.map((brk) => (
                            <span
                              key={brk.id}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                            >
                              {brk.label}: {brk.startTime} - {brk.endTime}
                              {isEditing && (
                                <button
                                  onClick={() => handleRemoveBreak(day, brk.id)}
                                  className="ml-0.5 rounded-full p-0.5 hover:bg-amber-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Add Break */}
                      {isEditing && addingBreak === day && (
                        <div className="flex items-end gap-2 rounded-lg bg-stone-50 p-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-stone-500">Label</label>
                            <input
                              value={breakLabel}
                              onChange={(e) => setBreakLabel(e.target.value)}
                              className="w-24 rounded border border-stone-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                              placeholder="Lunch"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-stone-500">From</label>
                            <input
                              type="time"
                              value={breakStart}
                              onChange={(e) => setBreakStart(e.target.value)}
                              className="rounded border border-stone-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-stone-500">To</label>
                            <input
                              type="time"
                              value={breakEnd}
                              onChange={(e) => setBreakEnd(e.target.value)}
                              className="rounded border border-stone-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => handleAddBreak(day)}
                            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setAddingBreak(null)}
                            className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {isEditing && addingBreak !== day && (
                        <button
                          onClick={() => setAddingBreak(day)}
                          className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                        >
                          <Plus className="h-3 w-3" />
                          Add break
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1">
                      <span className="text-sm italic text-stone-400">Not working</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : !isLoading && !selectedProviderId ? (
        <div className="rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-sm font-medium text-stone-700">Select a Provider</h3>
          <p className="mt-1 text-xs text-stone-500">
            Choose a provider above to view and manage their schedule.
          </p>
        </div>
      ) : null}
    </div>
  );
}
