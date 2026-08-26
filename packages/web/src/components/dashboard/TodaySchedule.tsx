'use client';

import { useTodaySchedule, type TodayScheduleItem } from '@/hooks/useAppointments';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { t } from '@/i18n';
import { appointmentStatusLabel, appointmentTypeLabel } from '@/components/appointments/appointmentLabels';

const statusColors: Record<string, string> = {
  scheduled: 'bg-stone-100 text-stone-700',
  confirmed: 'bg-blue-100 text-blue-700',
  'checked-in': 'bg-teal-100 text-teal-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-rose-100 text-rose-700',
};

function ScheduleSkeleton() {
  return (
    <div className="space-y-3 p-6 pt-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
          <div className="w-16 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-32 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-24 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-16 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-20 h-5 bg-stone-200 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

function ScheduleRow({ item }: { item: TodayScheduleItem }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/patients/${item.patientId}`)}
      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-stone-50 transition-colors text-left"
    >
      <span className="text-sm font-medium text-stone-900 dark:text-stone-100 w-16 shrink-0 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
        {item.time}
      </span>
      <span className="text-sm font-medium text-stone-900 dark:text-stone-100 flex-1 min-w-0 truncate">
        {item.patientName}
      </span>
      <span className="text-sm text-stone-500 dark:text-stone-400 w-28 shrink-0 truncate hidden sm:block">
        {appointmentTypeLabel(item.type)}
      </span>
      <span className="text-sm text-stone-500 dark:text-stone-400 w-16 shrink-0 hidden md:block">
        {item.chair}
      </span>
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${
          statusColors[item.status] || 'bg-stone-100 text-stone-700'
        }`}
      >
        {appointmentStatusLabel(item.status)}
      </span>
    </button>
  );
}

export default function TodaySchedule() {
  const { data: schedule, isLoading, isError } = useTodaySchedule();

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {t('dashboard.todaySchedule', 'Agenda de hoje')}
        </h2>
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {schedule?.length ?? 0} {(schedule?.length ?? 0) === 1 ? t('dashboard.appointment', 'consulta') : t('dashboard.appointments', 'consultas')}
        </span>
      </div>

      {isLoading ? (
        <ScheduleSkeleton />
      ) : isError ? (
        <div className="py-12 text-center text-stone-500 dark:text-stone-400 text-sm px-6 pb-6">{t('dashboard.scheduleLoadError', 'Não foi possível carregar a agenda de hoje.')}</div>
      ) : !schedule || schedule.length === 0 ? (
        <div className="py-12 text-center text-stone-500 dark:text-stone-400 text-sm px-6 pb-6">
          {t('dashboard.scheduleEmpty', 'Não há consultas agendadas para hoje.')}
        </div>
      ) : (
        <div className="px-6 pb-6 space-y-1">
          <div className="flex items-center gap-4 px-3 pb-2 border-b border-stone-100 dark:border-white/10">
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider w-16 shrink-0">
              {t('appointments.time', 'Horário')}
            </span>
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider flex-1">
              {t('appointments.patient', 'Paciente')}
            </span>
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider w-28 shrink-0 hidden sm:block">
              {t('appointments.type', 'Tipo')}
            </span>
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider w-16 shrink-0 hidden md:block">
              {t('appointments.chair', 'Cadeira')}
            </span>
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider w-20 shrink-0">
              {t('appointments.status', 'Status')}
            </span>
          </div>
          {schedule.map((item) => (
            <ScheduleRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export { TodaySchedule };
