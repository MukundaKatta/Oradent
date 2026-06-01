'use client';

import { format } from 'date-fns';
import { Clock, User, Check, UserCheck, Armchair, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { apiPatch } from '@/lib/api';
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_LABELS,
} from '@/lib/constants';

interface Appointment {
  id: string;
  patientName: string;
  providerName: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  chairName: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
  compact?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-teal-100 text-teal-700',
  CHECKED_IN: 'bg-amber-100 text-amber-700',
  IN_CHAIR: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-stone-100 text-stone-600',
  CANCELLED: 'bg-stone-100 text-stone-500',
  NO_SHOW: 'bg-red-100 text-red-700',
  RESCHEDULED: 'bg-indigo-100 text-indigo-700',
};

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'];

interface StatusAction {
  label: string;
  targetStatus: string;
  icon: React.ReactNode;
  className: string;
}

function getStatusActions(status: string): StatusAction[] {
  const actions: StatusAction[] = [];

  switch (status) {
    case 'SCHEDULED':
      actions.push({
        label: 'Confirm',
        targetStatus: 'CONFIRMED',
        icon: <Check className="h-3.5 w-3.5" />,
        className: 'bg-teal-600 hover:bg-teal-700 text-white',
      });
      break;
    case 'CONFIRMED':
      actions.push({
        label: 'Check In',
        targetStatus: 'CHECKED_IN',
        icon: <UserCheck className="h-3.5 w-3.5" />,
        className: 'bg-teal-600 hover:bg-teal-700 text-white',
      });
      break;
    case 'CHECKED_IN':
      actions.push({
        label: 'Seat',
        targetStatus: 'IN_CHAIR',
        icon: <Armchair className="h-3.5 w-3.5" />,
        className: 'bg-teal-600 hover:bg-teal-700 text-white',
      });
      break;
    case 'IN_CHAIR':
      actions.push({
        label: 'Complete',
        targetStatus: 'COMPLETED',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        className: 'bg-teal-600 hover:bg-teal-700 text-white',
      });
      break;
  }

  // Add cancel button for non-terminal statuses
  if (!TERMINAL_STATUSES.includes(status)) {
    actions.push({
      label: 'Cancel',
      targetStatus: 'CANCELLED',
      icon: <X className="h-3.5 w-3.5" />,
      className: 'bg-red-600 hover:bg-red-700 text-white',
    });
  }

  return actions;
}

export function AppointmentCard({
  appointment,
  onClick,
  compact = false,
}: AppointmentCardProps) {
  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  const typeLabel = APPOINTMENT_TYPE_LABELS[appointment.type] || appointment.type;
  const statusLabel = APPOINTMENT_STATUS_LABELS[appointment.status] || appointment.status;
  const statusStyle = STATUS_STYLES[appointment.status] || 'bg-stone-100 text-stone-600';

  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      apiPatch(`/api/appointments/${appointment.id}`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['today-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['todaySchedule'] });
    },
  });

  const actions = getStatusActions(appointment.status);

  const handleActionClick = (e: React.MouseEvent, targetStatus: string) => {
    e.stopPropagation();
    statusMutation.mutate(targetStatus);
  };

  const actionButtons = actions.length > 0 && (
    <div className="flex items-center gap-1.5">
      {actions.map((action) => (
        <button
          key={action.targetStatus}
          onClick={(e) => handleActionClick(e, action.targetStatus)}
          disabled={statusMutation.isPending}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50',
            action.className
          )}
          title={action.label}
        >
          {statusMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            action.icon
          )}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
        <button
          onClick={() => onClick?.(appointment)}
          className="flex w-full items-center gap-3 text-left hover:bg-stone-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-stone-900">
                {appointment.patientName}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  statusStyle
                )}
              >
                {statusLabel}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
              <Clock className="h-3 w-3" />
              <span>
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </span>
              <span className="text-stone-300">|</span>
              <span>{typeLabel}</span>
            </div>
          </div>
        </button>
        {actionButtons}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => onClick?.(appointment)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-stone-400" />
              <span className="text-sm font-semibold text-stone-900">
                {appointment.patientName}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </span>
            </div>
            <div className="mt-1 text-xs text-stone-500">
              {appointment.providerName} &middot; {appointment.chairName}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                statusStyle
              )}
            >
              {statusLabel}
            </span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {typeLabel}
            </span>
          </div>
        </div>
      </button>
      <div className="mt-3 flex justify-end">
        {actionButtons}
      </div>
    </div>
  );
}
