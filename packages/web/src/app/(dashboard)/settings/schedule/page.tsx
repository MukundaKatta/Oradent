'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// ═══════════════════ TYPES ═══════════════════

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface ProviderSchedule {
  providerId: string;
  providerName: string;
  days: Record<string, DaySchedule>;
}

// ═══════════════════ CONSTANTS ═══════════════════

const DAYS = [
  { key: 'monday', label: 'Mon', fullLabel: 'Monday' },
  { key: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { key: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
  { key: 'friday', label: 'Fri', fullLabel: 'Friday' },
  { key: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
  { key: 'sunday', label: 'Sun', fullLabel: 'Sunday' },
];

const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 21; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    TIME_SLOTS.push(`${hh}:${mm}`);
  }
}

const DEFAULT_DAY: DaySchedule = { enabled: false, startTime: '09:00', endTime: '17:00' };

function createDefaultSchedules(): ProviderSchedule[] {
  return [
    {
      providerId: 'provider-1',
      providerName: 'Dr. Smith',
      days: {
        monday: { enabled: true, startTime: '08:00', endTime: '17:00' },
        tuesday: { enabled: true, startTime: '08:00', endTime: '17:00' },
        wednesday: { enabled: true, startTime: '08:00', endTime: '17:00' },
        thursday: { enabled: true, startTime: '08:00', endTime: '17:00' },
        friday: { enabled: true, startTime: '08:00', endTime: '14:00' },
        saturday: { enabled: false, startTime: '09:00', endTime: '13:00' },
        sunday: { enabled: false, startTime: '09:00', endTime: '13:00' },
      },
    },
    {
      providerId: 'provider-2',
      providerName: 'Dr. Johnson',
      days: {
        monday: { enabled: true, startTime: '09:00', endTime: '18:00' },
        tuesday: { enabled: true, startTime: '09:00', endTime: '18:00' },
        wednesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
        thursday: { enabled: true, startTime: '09:00', endTime: '18:00' },
        friday: { enabled: true, startTime: '09:00', endTime: '16:00' },
        saturday: { enabled: true, startTime: '09:00', endTime: '13:00' },
        sunday: { enabled: false, startTime: '09:00', endTime: '13:00' },
      },
    },
  ];
}

// ═══════════════════ HELPERS ═══════════════════

function formatTimeLabel(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${ampm}`;
}

function getHoursDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMinutes <= 0) return '0h';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Visual grid constants
const GRID_START_HOUR = 6;
const GRID_END_HOUR = 22;
const TOTAL_GRID_HOURS = GRID_END_HOUR - GRID_START_HOUR;

function getBlockStyle(start: string, end: string): { left: string; width: string } {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startOffset = (sh - GRID_START_HOUR) + sm / 60;
  const endOffset = (eh - GRID_START_HOUR) + em / 60;
  const left = (startOffset / TOTAL_GRID_HOURS) * 100;
  const width = ((endOffset - startOffset) / TOTAL_GRID_HOURS) * 100;
  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.max(0, Math.min(width, 100 - left))}%`,
  };
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function ProviderSchedulePage() {
  const [schedules, setSchedules] = useLocalStorage<ProviderSchedule[]>(
    'oradent-provider-schedules',
    createDefaultSchedules()
  );
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const provider = schedules[selectedProvider];

  const updateDay = (dayKey: string, updates: Partial<DaySchedule>) => {
    const updated = schedules.map((s, i) => {
      if (i !== selectedProvider) return s;
      return {
        ...s,
        days: {
          ...s.days,
          [dayKey]: { ...(s.days[dayKey] || DEFAULT_DAY), ...updates },
        },
      };
    });
    setSchedules(updated);
    setHasChanges(true);
    setSaved(false);
  };

  const toggleDay = (dayKey: string) => {
    const current = provider.days[dayKey] || DEFAULT_DAY;
    updateDay(dayKey, { enabled: !current.enabled });
  };

  const handleSave = () => {
    // Already persisted to localStorage via useLocalStorage
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaults = createDefaultSchedules();
    setSchedules(defaults);
    setHasChanges(false);
    setSaved(false);
  };

  const weeklyHours = useMemo(() => {
    let total = 0;
    DAYS.forEach(({ key }) => {
      const day = provider.days[key];
      if (day?.enabled) {
        const [sh, sm] = day.startTime.split(':').map(Number);
        const [eh, em] = day.endTime.split(':').map(Number);
        total += (eh * 60 + em - sh * 60 - sm);
      }
    });
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, [provider]);

  const activeDaysCount = DAYS.filter(({ key }) => provider.days[key]?.enabled).length;

  // Grid hour markers
  const gridHours: number[] = [];
  for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h += 2) {
    gridHours.push(h);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Provider Schedule</h1>
          <p className="mt-1 text-sm text-stone-500">
            Set weekly availability for each provider.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
              hasChanges
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-stone-300 cursor-not-allowed'
            )}
          >
            <Save className="h-4 w-4" />
            Save Schedule
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Schedule saved successfully.
        </div>
      )}

      {/* Provider Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-stone-700">Provider:</label>
        <div className="relative">
          <select
            value={selectedProvider}
            onChange={(e) => {
              setSelectedProvider(Number(e.target.value));
              setHasChanges(false);
              setSaved(false);
            }}
            className="appearance-none rounded-lg border border-stone-300 bg-white py-2 pl-3 pr-10 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {schedules.map((s, i) => (
              <option key={s.providerId} value={i}>
                {s.providerName}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <Clock className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Weekly Hours</p>
              <p className="text-xl font-bold text-stone-900">{weeklyHours}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Active Days</p>
              <p className="text-xl font-bold text-stone-900">{activeDaysCount} of 7</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Status</p>
              <p className="text-xl font-bold text-stone-900">
                {hasChanges ? 'Unsaved' : 'Saved'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Day Configuration */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Weekly Availability</h2>
          <p className="mt-1 text-sm text-stone-500">
            Toggle days on or off and set working hours for {provider.providerName}.
          </p>
        </div>
        <div className="divide-y divide-stone-100">
          {DAYS.map(({ key, label, fullLabel }) => {
            const day = provider.days[key] || DEFAULT_DAY;
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-4 px-6 py-4 transition-colors',
                  day.enabled ? 'bg-white' : 'bg-stone-50'
                )}
              >
                {/* Toggle */}
                <button
                  onClick={() => toggleDay(key)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer',
                    day.enabled ? 'bg-teal-600' : 'bg-stone-300'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                      day.enabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>

                {/* Day Label */}
                <div className="w-24">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      day.enabled ? 'text-stone-900' : 'text-stone-400'
                    )}
                  >
                    <span className="hidden sm:inline">{fullLabel}</span>
                    <span className="sm:hidden">{label}</span>
                  </span>
                </div>

                {/* Time Selectors */}
                {day.enabled ? (
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={day.startTime}
                        onChange={(e) => updateDay(key, { startTime: e.target.value })}
                        className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {formatTimeLabel(t)}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-stone-400">to</span>
                      <select
                        value={day.endTime}
                        onChange={(e) => updateDay(key, { endTime: e.target.value })}
                        className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {formatTimeLabel(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="hidden text-xs text-stone-400 sm:inline">
                      ({getHoursDuration(day.startTime, day.endTime)})
                    </span>
                  </div>
                ) : (
                  <div className="flex-1">
                    <span className="text-sm text-stone-400 italic">Day off</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Grid */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Visual Schedule</h2>
          <p className="mt-1 text-sm text-stone-500">
            Overview of availability blocks for the week.
          </p>
        </div>
        <div className="p-6">
          {/* Hour Labels */}
          <div className="mb-2 ml-20 flex justify-between">
            {gridHours.map((h) => (
              <span key={h} className="text-xs text-stone-400">
                {formatTimeLabel(`${h.toString().padStart(2, '0')}:00`)}
              </span>
            ))}
          </div>

          {/* Grid Rows */}
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const day = provider.days[key] || DEFAULT_DAY;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-16 text-right text-xs font-medium text-stone-500">
                    {label}
                  </span>
                  <div className="relative flex-1 h-8 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden">
                    {/* Hour grid lines */}
                    {gridHours.map((h) => {
                      const left = ((h - GRID_START_HOUR) / TOTAL_GRID_HOURS) * 100;
                      return (
                        <div
                          key={h}
                          className="absolute top-0 bottom-0 border-l border-stone-200"
                          style={{ left: `${left}%` }}
                        />
                      );
                    })}
                    {/* Availability Block */}
                    {day.enabled && (
                      <div
                        className="absolute top-1 bottom-1 rounded bg-teal-500/80 border border-teal-600/30"
                        style={getBlockStyle(day.startTime, day.endTime)}
                        title={`${formatTimeLabel(day.startTime)} - ${formatTimeLabel(day.endTime)}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
