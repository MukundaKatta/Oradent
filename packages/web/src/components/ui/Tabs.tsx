'use client';

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
}

export function Tabs({ tabs, activeTab, onChange, variant = 'pills' }: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1',
        variant === 'underline' && 'border-b border-stone-200 gap-0'
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap',
              variant === 'pills' && [
                'px-3.5 py-2 rounded-lg',
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
              ],
              variant === 'underline' && [
                'px-4 py-2.5 -mb-px border-b-2',
                isActive
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300',
              ]
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium min-w-[1.25rem]',
                  variant === 'pills' && isActive
                    ? 'bg-teal-500 text-white'
                    : 'bg-stone-100 text-stone-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
