'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

interface RecallPatient {
  id: string;
  name: string;
  lastVisit: string;
  daysOverdue: number;
}

const MOCK_RECALLS: RecallPatient[] = [
  { id: '1', name: 'Maria Garcia', lastVisit: '2025-08-12', daysOverdue: 295 },
  { id: '2', name: 'James Wilson', lastVisit: '2025-10-05', daysOverdue: 240 },
  { id: '3', name: 'Sarah Chen', lastVisit: '2025-12-20', daysOverdue: 163 },
  { id: '4', name: 'Robert Taylor', lastVisit: '2026-02-15', daysOverdue: 106 },
  { id: '5', name: 'Emily Johnson', lastVisit: '2026-03-28', daysOverdue: 65 },
];

function getUrgencyColor(daysOverdue: number): { dot: string; text: string } {
  if (daysOverdue > 270) {
    return { dot: 'bg-red-500', text: 'text-red-700' };
  }
  if (daysOverdue > 180) {
    return { dot: 'bg-amber-500', text: 'text-amber-700' };
  }
  return { dot: 'bg-green-500', text: 'text-green-700' };
}

export default function RecallAlerts() {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-stone-900">Recall Alerts</h2>
        </div>
        <Link
          href="/patients/recall"
          className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="px-6 pb-6">
        <ul className="divide-y divide-stone-100">
          {MOCK_RECALLS.map((patient) => {
            const urgency = getUrgencyColor(patient.daysOverdue);
            return (
              <li
                key={patient.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', urgency.dot)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {patient.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      Last visit: {formatDate(patient.lastVisit)}
                      <span className={cn('ml-2 font-medium', urgency.text)}>
                        {patient.daysOverdue}d overdue
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    router.push(`/schedule?new=true&patientId=${patient.id}`)
                  }
                  className="ml-3 shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Schedule
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export { RecallAlerts };
