'use client';

import { useRouter } from 'next/navigation';
import {
  UserPlus,
  CalendarPlus,
  Sun,
  Footprints,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: 'New Patient',
    icon: UserPlus,
    href: '/patients/new',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
  },
  {
    label: 'New Appointment',
    icon: CalendarPlus,
    href: '/schedule?new=true',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    label: 'Morning Huddle',
    icon: Sun,
    href: '/schedule/huddle',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
  },
  {
    label: 'Walk-in',
    icon: Footprints,
    href: '/schedule?walkin=true',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    label: 'Emergency',
    icon: AlertTriangle,
    href: '/schedule?emergency=true',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
  },
  {
    label: 'Quick Checkout',
    icon: CreditCard,
    href: '/billing/checkout',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
  },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg px-3 py-4 transition-colors',
                action.bgColor
              )}
            >
              <Icon className={cn('h-6 w-6', action.color)} />
              <span className="text-xs font-medium text-stone-700">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { QuickActions };
