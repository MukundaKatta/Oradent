import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/lib/api';

// Mirrors packages/server/src/routes/appointments.ts and prisma/schema.prisma's
// Appointment model + enums.

export type AppointmentType =
  | 'EXAM' | 'CLEANING' | 'FILLING' | 'CROWN' | 'ROOT_CANAL'
  | 'EXTRACTION' | 'IMPLANT' | 'COSMETIC' | 'EMERGENCY'
  | 'CONSULTATION' | 'FOLLOW_UP' | 'OTHER';

export type AppointmentStatus =
  | 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_CHAIR'
  | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';

export interface Appointment {
  id: string;
  patientId: string;
  patient?: { id: string; firstName: string; lastName: string; phone?: string };
  providerId: string;
  provider?: { id: string; name: string; color: string; title?: string };
  chairId?: string | null;
  chair?: { id: string; name: string } | null;
  startTime: string;
  endTime: string;
  duration: number;
  type: AppointmentType;
  status: AppointmentStatus;
  reason?: string | null;
  procedures: string[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /today/schedule returns the same Appointment shape as the list
// endpoint (no flattened {time, patientName, chair, provider} view exists
// server-side).
export type TodayScheduleItem = Appointment;

export interface AppointmentListParams {
  start?: string;
  end?: string;
  providerId?: string;
  chairId?: string;
  status?: string;
}

export function useAppointments(params: AppointmentListParams = {}) {
  const queryString = new URLSearchParams();
  if (params.start) queryString.set('start', params.start);
  if (params.end) queryString.set('end', params.end);
  if (params.providerId) queryString.set('providerId', params.providerId);
  if (params.chairId) queryString.set('chairId', params.chairId);
  if (params.status) queryString.set('status', params.status);

  return useQuery<Appointment[]>({
    queryKey: ['appointments', params],
    queryFn: () => apiGet<Appointment[]>(`/api/appointments?${queryString.toString()}`),
  });
}

export function useTodaySchedule() {
  return useQuery<TodayScheduleItem[]>({
    queryKey: ['todaySchedule'],
    queryFn: () => apiGet<TodayScheduleItem[]>('/api/appointments/today/schedule'),
    refetchInterval: 60_000,
  });
}

export type CreateAppointmentInput = {
  patientId: string;
  providerId: string;
  chairId?: string;
  startTime: string;
  duration: number;
  type: AppointmentType;
  reason?: string;
  procedures?: string[];
  notes?: string;
  isRecurring?: boolean;
  recurringRule?: string;
};

export type UpdateAppointmentInput = Partial<CreateAppointmentInput> & { status?: AppointmentStatus };

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentInput) =>
      apiPost<Appointment, CreateAppointmentInput>('/api/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaySchedule'] });
    },
  });
}

export function useUpdateAppointment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAppointmentInput) =>
      apiPut<Appointment, UpdateAppointmentInput>(`/api/appointments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaySchedule'] });
    },
  });
}
