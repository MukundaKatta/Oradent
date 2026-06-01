'use client';

import { useTodaySchedule, type TodayScheduleItem } from '@/hooks/useAppointments';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { useSocketEvent } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';

const statusColors: Record<string, string> = {
  scheduled: 'bg-stone-100 text-stone-700',
  confirmed: 'bg-blue-100 text-blue-700',
  'checked-in': 'bg-teal-100 text-teal-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-rose-100 text-rose-700',
};

const typeColorDots: Record<string, string> = {
  EXAM: 'bg-blue-500',
  CLEANING: 'bg-teal-500',
  FILLING: 'bg-amber-500',
  CROWN: 'bg-purple-500',
  ROOT_CANAL: 'bg-red-500',
  EXTRACTION: 'bg-rose-500',
  WHITENING: 'bg-sky-500',
  CONSULTATION: 'bg-indigo-500',
  EMERGENCY: 'bg-orange-500',
  IMPLANT: 'bg-cyan-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-3 p-6 pt-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
          <div className="w-16 h-5 bg-stone-200 animate-pulse rounded" />
          <div className="w-8 h-8 bg-stone-200 animate-pulse rounded-full" />
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
  const typeKey = item.type.toUpperCase().replace(/[\s-]+/g, '_');
  const dotColor = typeColorDots[typeKey] || 'bg-stone-400';

  return (
    <button
      onClick={() => router.push(`/patients/${item.patientId}`)}
      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-stone-50 transition-colors text-left"
    >
      <span className="text-sm font-semibold text-stone-900 w-16 shrink-0 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-stone-400" />
        {item.time}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
        {getInitials(item.patientName)}
      </span>
      <span className="text-sm font-medium text-stone-900 flex-1 min-w-0 truncate">
        {item.patientName}
      </span>
      <span className="text-sm text-stone-500 w-28 shrink-0 truncate hidden sm:flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
        {item.type}
      </span>
      <span className="text-sm text-stone-500 w-16 shrink-0 hidden md:block">
        {item.chair}
      </span>
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${
          statusColors[item.status] || 'bg-stone-100 text-stone-700'
        }`}
      >
        {item.status.replace('-', ' ')}
      </span>
    </button>
  );
}

export default function TodaySchedule() {
  const { data: schedule, isLoading } = useTodaySchedule();
  const queryClient = useQueryClient();

  useSocketEvent('appointment:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['today-schedule'] });
  });

  useSocketEvent('schedule:refresh', () => {
    queryClient.invalidateQueries({ queryKey: ['today-schedule'] });
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200">
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Today&apos;s Schedule
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500">
            {schedule?.length ?? 0} appointments
          </span>
          <Link
            href="/appointments"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            View All
          </Link>
        </div>
      </div>

      {isLoading ? (
        <ScheduleSkeleton />
      ) : !schedule || schedule.length === 0 ? (
        <div className="py-12 text-center text-stone-500 text-sm px-6 pb-6">
          No appointments scheduled for today
        </div>
      ) : (
        <div className="px-6 pb-6 space-y-1">
          <div className="flex items-center gap-4 px-3 pb-2 border-b border-stone-100">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider w-16 shrink-0">
              Time
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider w-8 shrink-0">
              {/* Avatar column */}
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider flex-1">
              Patient
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider w-28 shrink-0 hidden sm:block">
              Type
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider w-16 shrink-0 hidden md:block">
              Chair
            </span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider w-20 shrink-0">
              Status
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
