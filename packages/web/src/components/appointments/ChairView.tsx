'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSocketEvent } from '@/hooks/useSocket';
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from '@/lib/constants';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  providerColor: string;
  chairId: string;
  chairName: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason?: string;
  notes?: string;
  seatedAt?: string;
}

interface ChairViewProps {
  appointments: Appointment[];
  currentDate: Date;
  onEventClick: (appointment: Appointment) => void;
  onSlotClick: (date: string, time: string) => void;
  onRefresh?: () => void;
}

type ChairStatus = 'empty' | 'occupied' | 'ready';

interface ChairInfo {
  status: ChairStatus;
  currentAppointment: Appointment | null;
  seatedSince: Date | null;
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8am - 5pm
const SLOT_HEIGHT = 60; // px per 30 min
const CHAIRS = ['Chair 1', 'Chair 2', 'Chair 3'];

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

const CHAIR_STATUS_STYLES: Record<ChairStatus, string> = {
  empty: 'bg-stone-100 border-stone-300',
  occupied: 'bg-teal-50 border-teal-400',
  ready: 'bg-green-50 border-green-400',
};

const CHAIR_STATUS_DOT: Record<ChairStatus, string> = {
  empty: 'bg-stone-400',
  occupied: 'bg-teal-500',
  ready: 'bg-green-500',
};

export function ChairView({
  appointments,
  currentDate,
  onEventClick,
  onSlotClick,
  onRefresh,
}: ChairViewProps) {
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const [now, setNow] = useState(() => new Date());

  // Update timer every 30 seconds for duration display
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time chair status updates
  const handleChairStatus = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  useSocketEvent('chair:status', handleChairStatus);

  // Also listen for appointment updates to refresh
  useSocketEvent('appointment:updated', handleChairStatus);

  const chairGroups = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    CHAIRS.forEach((chair) => {
      groups[chair] = [];
    });

    appointments.forEach((apt) => {
      const aptDate = apt.startTime.split('T')[0];
      if (aptDate === dateStr) {
        const chairKey = apt.chairName || 'Chair 1';
        if (groups[chairKey]) {
          groups[chairKey].push(apt);
        }
      }
    });

    return groups;
  }, [appointments, dateStr]);

  // Determine real-time status of each chair
  const chairInfoMap = useMemo((): Record<string, ChairInfo> => {
    const infoMap: Record<string, ChairInfo> = {};

    CHAIRS.forEach((chair) => {
      const chairAppts = chairGroups[chair] || [];

      // Find the current IN_CHAIR appointment
      const inChairApt = chairAppts.find((apt) => apt.status === 'IN_CHAIR');

      // Find a CHECKED_IN patient ready for this chair
      const readyApt = chairAppts.find((apt) => apt.status === 'CHECKED_IN');

      if (inChairApt) {
        const seatedSince = inChairApt.seatedAt
          ? new Date(inChairApt.seatedAt)
          : new Date(inChairApt.startTime);
        infoMap[chair] = {
          status: 'occupied',
          currentAppointment: inChairApt,
          seatedSince,
        };
      } else if (readyApt) {
        infoMap[chair] = {
          status: 'ready',
          currentAppointment: readyApt,
          seatedSince: null,
        };
      } else {
        infoMap[chair] = {
          status: 'empty',
          currentAppointment: null,
          seatedSince: null,
        };
      }
    });

    return infoMap;
  }, [chairGroups]);

  const getPositionStyles = (apt: Appointment) => {
    const start = new Date(apt.startTime);
    const end = new Date(apt.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 8) * SLOT_HEIGHT * 2;
    const height = (endHour - startHour) * SLOT_HEIGHT * 2;
    return { top: `${top}px`, height: `${Math.max(height, 30)}px` };
  };

  const getCurrentTimePosition = () => {
    const nowDateStr = format(now, 'yyyy-MM-dd');
    if (nowDateStr !== dateStr) return null;
    const hours = now.getHours() + now.getMinutes() / 60;
    if (hours < 8 || hours > 17) return null;
    return (hours - 8) * SLOT_HEIGHT * 2;
  };

  const currentTimePos = getCurrentTimePosition();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Chair status indicators */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr] mb-2">
          <div />
          {CHAIRS.map((chair) => {
            const info = chairInfoMap[chair];
            const statusStyle = CHAIR_STATUS_STYLES[info.status];
            const dotStyle = CHAIR_STATUS_DOT[info.status];

            return (
              <div
                key={`status-${chair}`}
                className={cn(
                  'mx-1 rounded-lg border p-2 transition-colors',
                  statusStyle
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('h-2.5 w-2.5 rounded-full', dotStyle)} />
                  <span className="text-xs font-medium text-stone-700 capitalize">
                    {info.status === 'ready' ? 'Patient Ready' : info.status}
                  </span>
                </div>
                {info.currentAppointment && (
                  <div className="mt-1">
                    <div className="truncate text-xs font-semibold text-stone-800">
                      {info.currentAppointment.patientName}
                    </div>
                    {info.status === 'occupied' && info.seatedSince && (
                      <div className="text-[10px] text-teal-700 font-medium">
                        In chair: {formatDuration(now.getTime() - info.seatedSince.getTime())}
                      </div>
                    )}
                    {info.status === 'ready' && (
                      <div className="text-[10px] text-green-700 font-medium">
                        Checked in - waiting
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr] border-b border-stone-200">
          <div className="border-r border-stone-200 bg-stone-50 p-3">
            <span className="text-xs font-medium text-stone-500">Time</span>
          </div>
          {CHAIRS.map((chair) => (
            <div
              key={chair}
              className="border-r border-stone-200 bg-stone-50 p-3 text-center last:border-r-0"
            >
              <span className="text-sm font-semibold text-stone-700">{chair}</span>
              <span className="ml-2 text-xs text-stone-400">
                {chairGroups[chair]?.length || 0} appts
              </span>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative grid grid-cols-[80px_1fr_1fr_1fr]">
          {/* Time labels */}
          <div className="border-r border-stone-200">
            {HOURS.map((hour) => (
              <div key={hour} className="relative" style={{ height: `${SLOT_HEIGHT * 2}px` }}>
                <span className="absolute -top-2 right-3 text-xs text-stone-400">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
                <div
                  className="absolute right-0 top-0 w-3 border-t border-stone-200"
                />
                <div
                  className="absolute right-0 top-1/2 w-2 border-t border-stone-100"
                />
              </div>
            ))}
          </div>

          {/* Chair columns */}
          {CHAIRS.map((chair) => (
            <div
              key={chair}
              className="relative border-r border-stone-200 last:border-r-0"
            >
              {/* Grid lines */}
              {HOURS.map((hour) => (
                <div key={hour} style={{ height: `${SLOT_HEIGHT * 2}px` }}>
                  <div
                    className="h-1/2 border-b border-stone-100 cursor-pointer hover:bg-teal-50/50 transition-colors"
                    onClick={() =>
                      onSlotClick(dateStr, `${hour.toString().padStart(2, '0')}:00`)
                    }
                  />
                  <div
                    className="h-1/2 border-b border-stone-200 cursor-pointer hover:bg-teal-50/50 transition-colors"
                    onClick={() =>
                      onSlotClick(dateStr, `${hour.toString().padStart(2, '0')}:30`)
                    }
                  />
                </div>
              ))}

              {/* Appointments */}
              {chairGroups[chair]?.map((apt) => {
                const pos = getPositionStyles(apt);
                const bgColor = apt.providerColor || APPOINTMENT_TYPE_COLORS[apt.type] || '#14b8a6';
                const isInChair = apt.status === 'IN_CHAIR';
                const statusLabel = APPOINTMENT_STATUS_LABELS[apt.status] || apt.status;
                return (
                  <button
                    key={apt.id}
                    onClick={() => onEventClick(apt)}
                    className={cn(
                      'absolute inset-x-1 overflow-hidden rounded-lg p-2 text-left transition-opacity hover:opacity-90',
                      isInChair && 'ring-2 ring-green-400 ring-offset-1'
                    )}
                    style={{
                      ...pos,
                      backgroundColor: bgColor,
                    }}
                  >
                    <div className="truncate text-xs font-semibold text-white">
                      {apt.patientName}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/80">
                      {APPOINTMENT_TYPE_LABELS[apt.type] || apt.type}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-white/70">
                      {format(new Date(apt.startTime), 'h:mm a')} -{' '}
                      {format(new Date(apt.endTime), 'h:mm a')}
                    </div>
                    <div className="mt-0.5">
                      <span className="inline-block rounded-full bg-black/20 px-1.5 py-0.5 text-[9px] font-medium text-white">
                        {statusLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Current time indicator */}
          {currentTimePos !== null && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${currentTimePos}px` }}
            >
              <div className="flex items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-0.5 flex-1 bg-red-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
