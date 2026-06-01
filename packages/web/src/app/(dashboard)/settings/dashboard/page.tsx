'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Save,
  Calendar,
  DollarSign,
  Brain,
  Zap,
  Bell,
  FlaskConical,
  LayoutGrid,
  CheckCircle2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface Widget {
  id: string;
  name: string;
  description: string;
  icon: typeof Calendar;
  visible: boolean;
}

type LayoutOption = '2-column' | '3-column';

interface DashboardConfig {
  widgets: Widget[];
  layout: LayoutOption;
}

// ═══════════════════ DEFAULTS ═══════════════════

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: 'todays-schedule',
    name: "Today's Schedule",
    description: 'Shows upcoming appointments for the day with patient details and status.',
    icon: Calendar,
    visible: true,
  },
  {
    id: 'revenue-chart',
    name: 'Revenue Chart',
    description: 'Visual chart of daily/weekly/monthly production and collections.',
    icon: DollarSign,
    visible: true,
  },
  {
    id: 'ai-insights',
    name: 'AI Insights',
    description: 'AI-powered analytics and recommendations for your practice.',
    icon: Brain,
    visible: true,
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Shortcut buttons for common tasks like new patient, appointment, etc.',
    icon: Zap,
    visible: true,
  },
  {
    id: 'recall-alerts',
    name: 'Recall Alerts',
    description: 'Patients due for recall appointments and overdue follow-ups.',
    icon: Bell,
    visible: true,
  },
  {
    id: 'lab-cases-status',
    name: 'Lab Cases Status',
    description: 'Track outstanding lab cases, expected delivery dates, and status updates.',
    icon: FlaskConical,
    visible: false,
  },
];

const DEFAULT_LAYOUT: LayoutOption = '2-column';
const STORAGE_KEY = 'oradent-dashboard-config';

// ═══════════════════ HELPERS ═══════════════════

function loadConfig(): DashboardConfig {
  if (typeof window === 'undefined') {
    return { widgets: DEFAULT_WIDGETS, layout: DEFAULT_LAYOUT };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DashboardConfig;
      // Validate structure
      if (Array.isArray(parsed.widgets) && parsed.layout) {
        return parsed;
      }
    }
  } catch {
    // Fall through to defaults
  }
  return { widgets: DEFAULT_WIDGETS, layout: DEFAULT_LAYOUT };
}

function saveConfig(config: DashboardConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function DashboardCustomizationPage() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState<LayoutOption>(DEFAULT_LAYOUT);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const config = loadConfig();
    setWidgets(config.widgets);
    setLayout(config.layout);
  }, []);

  const markChanged = useCallback(() => {
    setHasChanges(true);
    setSaved(false);
  }, []);

  const moveWidget = useCallback(
    (index: number, direction: 'up' | 'down') => {
      setWidgets((prev) => {
        const newWidgets = [...prev];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newWidgets.length) return prev;
        [newWidgets[index], newWidgets[targetIndex]] = [
          newWidgets[targetIndex],
          newWidgets[index],
        ];
        return newWidgets;
      });
      markChanged();
    },
    [markChanged]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      setWidgets((prev) =>
        prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
      );
      markChanged();
    },
    [markChanged]
  );

  const handleLayoutChange = useCallback(
    (newLayout: LayoutOption) => {
      setLayout(newLayout);
      markChanged();
    },
    [markChanged]
  );

  const handleSave = useCallback(() => {
    saveConfig({ widgets, layout });
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  }, [widgets, layout]);

  const handleReset = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    setLayout(DEFAULT_LAYOUT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHasChanges(false);
    setSaved(false);
  }, []);

  const visibleCount = widgets.filter((w) => w.visible).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dashboard Customization</h1>
          <p className="mt-1 text-sm text-stone-500">
            Configure which widgets appear on your dashboard and their order.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
              hasChanges
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'cursor-not-allowed bg-stone-300'
            )}
          >
            <Save className="h-4 w-4" />
            Save Configuration
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-6 py-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">
            Dashboard configuration saved successfully.
          </p>
        </div>
      )}

      {/* Layout Selection */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-700">Layout</h2>
        <p className="mt-1 text-xs text-stone-500">
          Choose the number of columns for your dashboard grid.
        </p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => handleLayoutChange('2-column')}
            className={cn(
              'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-5 transition-colors',
              layout === '2-column'
                ? 'border-teal-500 bg-teal-50'
                : 'border-stone-200 bg-white hover:border-stone-300'
            )}
          >
            <div className="flex gap-2">
              <div className="h-12 w-16 rounded bg-stone-200" />
              <div className="h-12 w-16 rounded bg-stone-200" />
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                layout === '2-column' ? 'text-teal-700' : 'text-stone-600'
              )}
            >
              2 Columns
            </span>
          </button>
          <button
            onClick={() => handleLayoutChange('3-column')}
            className={cn(
              'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-5 transition-colors',
              layout === '3-column'
                ? 'border-teal-500 bg-teal-50'
                : 'border-stone-200 bg-white hover:border-stone-300'
            )}
          >
            <div className="flex gap-2">
              <div className="h-12 w-10 rounded bg-stone-200" />
              <div className="h-12 w-10 rounded bg-stone-200" />
              <div className="h-12 w-10 rounded bg-stone-200" />
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                layout === '3-column' ? 'text-teal-700' : 'text-stone-600'
              )}
            >
              3 Columns
            </span>
          </button>
        </div>
      </div>

      {/* Widget List */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Widgets</h2>
              <p className="mt-1 text-sm text-stone-500">
                Toggle visibility and reorder widgets using the arrow buttons.
              </p>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              {visibleCount} of {widgets.length} visible
            </span>
          </div>
        </div>
        <div className="divide-y divide-stone-100">
          {widgets.map((widget, index) => {
            const Icon = widget.icon;
            return (
              <div
                key={widget.id}
                className={cn(
                  'flex items-center justify-between px-6 py-4 transition-colors',
                  widget.visible ? 'bg-white' : 'bg-stone-50/50'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveWidget(index, 'up')}
                      disabled={index === 0}
                      className={cn(
                        'rounded p-0.5 transition-colors',
                        index === 0
                          ? 'cursor-not-allowed text-stone-200'
                          : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
                      )}
                      title="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveWidget(index, 'down')}
                      disabled={index === widgets.length - 1}
                      className={cn(
                        'rounded p-0.5 transition-colors',
                        index === widgets.length - 1
                          ? 'cursor-not-allowed text-stone-200'
                          : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
                      )}
                      title="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <GripVertical className="h-4 w-4 text-stone-300" />
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      widget.visible ? 'bg-teal-50' : 'bg-stone-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        widget.visible ? 'text-teal-600' : 'text-stone-400'
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        widget.visible ? 'text-stone-900' : 'text-stone-400'
                      )}
                    >
                      {widget.name}
                    </p>
                    <p className="text-xs text-stone-500">{widget.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleVisibility(widget.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    widget.visible
                      ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  )}
                >
                  {widget.visible ? (
                    <>
                      <Eye className="h-4 w-4" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Hidden
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-stone-400" />
            <h2 className="text-lg font-semibold text-stone-900">Layout Preview</h2>
          </div>
        </div>
        <div className="p-6">
          <div
            className={cn(
              'grid gap-4',
              layout === '3-column'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2'
            )}
          >
            {widgets
              .filter((w) => w.visible)
              .map((widget) => {
                const Icon = widget.icon;
                return (
                  <div
                    key={widget.id}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                      <Icon className="h-4 w-4 text-teal-600" />
                    </div>
                    <span className="text-sm font-medium text-stone-600">{widget.name}</span>
                  </div>
                );
              })}
          </div>
          {visibleCount === 0 && (
            <div className="py-12 text-center">
              <LayoutGrid className="mx-auto h-12 w-12 text-stone-300" />
              <p className="mt-3 text-sm text-stone-500">
                No widgets are visible. Enable at least one widget above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
