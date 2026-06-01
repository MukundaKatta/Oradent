'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Save,
  RotateCcw,
  CalendarDays,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface ToothMeasurements {
  pocketDepths: [number, number, number, number, number, number]; // MB, B, DB, ML, L, DL
  bleedingOnProbing: [boolean, boolean, boolean, boolean, boolean, boolean];
  recession: number;
}

interface PerioRecord {
  date: string;
  teeth: Record<number, ToothMeasurements>;
}

// ═══════════════════ CONSTANTS ═══════════════════

const SITE_LABELS = ['MB', 'B', 'DB', 'ML', 'L', 'DL'] as const;

const UPPER_TEETH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const LOWER_TEETH = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

function getDepthColor(depth: number): string {
  if (depth <= 3) return 'bg-green-100 text-green-700 border-green-300';
  if (depth <= 5) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  return 'bg-red-100 text-red-700 border-red-300';
}

function getDepthInputColor(depth: number): string {
  if (depth <= 3) return 'border-green-400 focus:ring-green-500 focus:border-green-500';
  if (depth <= 5) return 'border-yellow-400 focus:ring-yellow-500 focus:border-yellow-500';
  return 'border-red-400 focus:ring-red-500 focus:border-red-500';
}

// ═══════════════════ SEED DATA ═══════════════════

function generateMockMeasurements(): Record<number, ToothMeasurements> {
  const teeth: Record<number, ToothMeasurements> = {};
  const allTeeth = [...UPPER_TEETH, ...LOWER_TEETH];

  for (const tooth of allTeeth) {
    const depths: [number, number, number, number, number, number] = [
      Math.floor(Math.random() * 4) + 1,
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 4) + 1,
      Math.floor(Math.random() * 4) + 1,
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 4) + 1,
    ];

    // Some teeth with deeper pockets for realism
    if ([3, 14, 19, 30].includes(tooth)) {
      depths[0] = Math.floor(Math.random() * 3) + 5;
      depths[2] = Math.floor(Math.random() * 3) + 4;
    }

    const bleeding: [boolean, boolean, boolean, boolean, boolean, boolean] = [
      depths[0] > 3 || Math.random() > 0.7,
      depths[1] > 3 || Math.random() > 0.8,
      depths[2] > 3 || Math.random() > 0.7,
      depths[3] > 3 || Math.random() > 0.7,
      depths[4] > 3 || Math.random() > 0.8,
      depths[5] > 3 || Math.random() > 0.7,
    ];

    teeth[tooth] = {
      pocketDepths: depths,
      bleedingOnProbing: bleeding,
      recession: [3, 14, 19, 30].includes(tooth) ? Math.floor(Math.random() * 3) + 1 : 0,
    };
  }
  return teeth;
}

function generatePreviousMeasurements(): Record<number, ToothMeasurements> {
  const teeth: Record<number, ToothMeasurements> = {};
  const allTeeth = [...UPPER_TEETH, ...LOWER_TEETH];

  for (const tooth of allTeeth) {
    const depths: [number, number, number, number, number, number] = [
      Math.floor(Math.random() * 5) + 1,
      Math.floor(Math.random() * 4) + 1,
      Math.floor(Math.random() * 5) + 1,
      Math.floor(Math.random() * 5) + 1,
      Math.floor(Math.random() * 4) + 1,
      Math.floor(Math.random() * 5) + 1,
    ];
    if ([3, 14, 19, 30].includes(tooth)) {
      depths[0] = Math.floor(Math.random() * 3) + 6;
      depths[2] = Math.floor(Math.random() * 3) + 5;
    }

    teeth[tooth] = {
      pocketDepths: depths,
      bleedingOnProbing: [
        Math.random() > 0.5,
        Math.random() > 0.6,
        Math.random() > 0.5,
        Math.random() > 0.5,
        Math.random() > 0.6,
        Math.random() > 0.5,
      ],
      recession: [3, 14, 19, 30].includes(tooth) ? Math.floor(Math.random() * 4) + 1 : 0,
    };
  }
  return teeth;
}

const MOCK_RECORDS: PerioRecord[] = [
  { date: '2026-06-01', teeth: generateMockMeasurements() },
  { date: '2025-12-15', teeth: generatePreviousMeasurements() },
  { date: '2025-06-10', teeth: generatePreviousMeasurements() },
];

// ═══════════════════ SKELETON ═══════════════════

function ChartSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200" />
      <div className="grid grid-cols-16 gap-1">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-stone-200" />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════ TOOTH CARD ═══════════════════

function ToothCard({
  toothNumber,
  measurements,
  comparisonMeasurements,
  onUpdate,
  isUpper,
}: {
  toothNumber: number;
  measurements: ToothMeasurements;
  comparisonMeasurements: ToothMeasurements | null;
  onUpdate: (toothNumber: number, measurements: ToothMeasurements) => void;
  isUpper: boolean;
}) {
  const handleDepthChange = (siteIndex: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 15) return;
    const newDepths = [...measurements.pocketDepths] as [number, number, number, number, number, number];
    newDepths[siteIndex] = numValue;
    onUpdate(toothNumber, { ...measurements, pocketDepths: newDepths });
  };

  const handleBopToggle = (siteIndex: number) => {
    const newBop = [...measurements.bleedingOnProbing] as [boolean, boolean, boolean, boolean, boolean, boolean];
    newBop[siteIndex] = !newBop[siteIndex];
    onUpdate(toothNumber, { ...measurements, bleedingOnProbing: newBop });
  };

  const maxDepth = Math.max(...measurements.pocketDepths);
  const hasBleeding = measurements.bleedingOnProbing.some(Boolean);

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-2 shadow-sm transition-shadow hover:shadow-md',
        maxDepth >= 6
          ? 'border-red-300'
          : maxDepth >= 4
            ? 'border-yellow-300'
            : 'border-stone-200'
      )}
    >
      {/* Tooth Number */}
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
            maxDepth >= 6
              ? 'bg-red-100 text-red-700'
              : maxDepth >= 4
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-teal-50 text-teal-700'
          )}
        >
          {toothNumber}
        </span>
        {hasBleeding && (
          <span className="h-2 w-2 rounded-full bg-red-500" title="Bleeding on probing" />
        )}
      </div>

      {/* Pocket Depth Inputs - Facial (MB, B, DB) */}
      <div className="mb-1">
        <p className="mb-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-stone-400">
          {isUpper ? 'Facial' : 'Lingual'}
        </p>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1">
              <label className="block text-center text-[8px] text-stone-400">
                {SITE_LABELS[isUpper ? i : i + 3]}
              </label>
              <input
                type="number"
                min={0}
                max={15}
                value={measurements.pocketDepths[isUpper ? i : i + 3]}
                onChange={(e) => handleDepthChange(isUpper ? i : i + 3, e.target.value)}
                className={cn(
                  'w-full rounded border bg-white px-0.5 py-0.5 text-center text-xs font-medium focus:outline-none focus:ring-1',
                  getDepthInputColor(measurements.pocketDepths[isUpper ? i : i + 3])
                )}
              />
              {comparisonMeasurements && (
                <p
                  className={cn(
                    'mt-0.5 text-center text-[8px]',
                    measurements.pocketDepths[isUpper ? i : i + 3] <
                      comparisonMeasurements.pocketDepths[isUpper ? i : i + 3]
                      ? 'text-green-600'
                      : measurements.pocketDepths[isUpper ? i : i + 3] >
                          comparisonMeasurements.pocketDepths[isUpper ? i : i + 3]
                        ? 'text-red-600'
                        : 'text-stone-400'
                  )}
                >
                  {comparisonMeasurements.pocketDepths[isUpper ? i : i + 3]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pocket Depth Inputs - Lingual (ML, L, DL) */}
      <div className="mb-1">
        <p className="mb-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-stone-400">
          {isUpper ? 'Lingual' : 'Facial'}
        </p>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1">
              <label className="block text-center text-[8px] text-stone-400">
                {SITE_LABELS[isUpper ? i + 3 : i]}
              </label>
              <input
                type="number"
                min={0}
                max={15}
                value={measurements.pocketDepths[isUpper ? i + 3 : i]}
                onChange={(e) => handleDepthChange(isUpper ? i + 3 : i, e.target.value)}
                className={cn(
                  'w-full rounded border bg-white px-0.5 py-0.5 text-center text-xs font-medium focus:outline-none focus:ring-1',
                  getDepthInputColor(measurements.pocketDepths[isUpper ? i + 3 : i])
                )}
              />
              {comparisonMeasurements && (
                <p
                  className={cn(
                    'mt-0.5 text-center text-[8px]',
                    measurements.pocketDepths[isUpper ? i + 3 : i] <
                      comparisonMeasurements.pocketDepths[isUpper ? i + 3 : i]
                      ? 'text-green-600'
                      : measurements.pocketDepths[isUpper ? i + 3 : i] >
                          comparisonMeasurements.pocketDepths[isUpper ? i + 3 : i]
                        ? 'text-red-600'
                        : 'text-stone-400'
                  )}
                >
                  {comparisonMeasurements.pocketDepths[isUpper ? i + 3 : i]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOP Checkboxes */}
      <div>
        <p className="mb-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-stone-400">
          BOP
        </p>
        <div className="flex justify-center gap-0.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <label key={i} className="flex cursor-pointer items-center" title={`${SITE_LABELS[i]} BOP`}>
              <input
                type="checkbox"
                checked={measurements.bleedingOnProbing[i]}
                onChange={() => handleBopToggle(i)}
                className="h-2.5 w-2.5 rounded border-stone-300 text-red-500 focus:ring-red-500"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function PerioChartPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [records] = useState<PerioRecord[]>(MOCK_RECORDS);
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [compareDate, setCompareDate] = useState<string>('');
  const [teeth, setTeeth] = useState<Record<number, ToothMeasurements>>(MOCK_RECORDS[0].teeth);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Simulate loading
  useState(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  });

  const comparisonTeeth = useMemo(() => {
    if (!compareDate) return null;
    const record = records.find((r) => r.date === compareDate);
    return record?.teeth ?? null;
  }, [compareDate, records]);

  const handleUpdateTooth = useCallback(
    (toothNumber: number, measurements: ToothMeasurements) => {
      setTeeth((prev) => ({ ...prev, [toothNumber]: measurements }));
      setSaved(false);
    },
    []
  );

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
    }, 800);
  };

  const handleReset = () => {
    setTeeth(MOCK_RECORDS[0].teeth);
    setSaved(false);
  };

  // Statistics
  const stats = useMemo(() => {
    const allDepths: number[] = [];
    let bleedingSites = 0;
    let totalSites = 0;
    let deepPockets = 0;

    Object.values(teeth).forEach((m) => {
      m.pocketDepths.forEach((d, i) => {
        allDepths.push(d);
        totalSites++;
        if (d >= 4) deepPockets++;
        if (m.bleedingOnProbing[i]) bleedingSites++;
      });
    });

    const avg = allDepths.length > 0 ? allDepths.reduce((a, b) => a + b, 0) / allDepths.length : 0;
    const bopPercent = totalSites > 0 ? Math.round((bleedingSites / totalSites) * 100) : 0;

    return {
      avgDepth: avg.toFixed(1),
      bopPercent,
      deepPockets,
      totalSites,
    };
  }, [teeth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Periodontal Charting</h1>
          <p className="mt-1 text-sm text-stone-500">
            Record and compare periodontal measurements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || saved}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
              saved
                ? 'bg-green-600'
                : 'bg-teal-600 hover:bg-teal-700',
              (isSaving || saved) && 'cursor-not-allowed opacity-80'
            )}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <Activity className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Avg Pocket Depth</p>
              <p className="text-xl font-bold text-stone-900">{stats.avgDepth}mm</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">BOP Percentage</p>
              <p className="text-xl font-bold text-stone-900">{stats.bopPercent}%</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Deep Pockets (4mm+)</p>
              <p className="text-xl font-bold text-stone-900">{stats.deepPockets}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-stone-100 p-2.5">
              <CalendarDays className="h-5 w-5 text-stone-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Sites</p>
              <p className="text-xl font-bold text-stone-900">{stats.totalSites}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Dropdown + Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-stone-700">Compare with:</label>
          <div className="relative">
            <select
              value={compareDate}
              onChange={(e) => setCompareDate(e.target.value)}
              className="appearance-none rounded-lg border border-stone-300 bg-white py-2 pl-3 pr-8 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">No comparison</option>
              {records.slice(1).map((r) => (
                <option key={r.date} value={r.date}>
                  {new Date(r.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium text-stone-500">Depth Legend:</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-green-200 border border-green-400" />
            1-3mm (Healthy)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-yellow-200 border border-yellow-400" />
            4-5mm (Moderate)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-200 border border-red-400" />
            6+mm (Severe)
          </span>
          {compareDate && (
            <>
              <span className="mx-1 text-stone-300">|</span>
              <span className="text-green-600">Green = Improved</span>
              <span className="text-red-600">Red = Worsened</span>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <>
          {/* Upper Arch */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-stone-700">Upper Arch (Maxillary)</h2>
              <span className="text-xs text-stone-400">Teeth 1-16</span>
            </div>
            <div className="grid grid-cols-8 gap-2 lg:grid-cols-16">
              {UPPER_TEETH.map((tooth) => (
                <ToothCard
                  key={tooth}
                  toothNumber={tooth}
                  measurements={teeth[tooth]}
                  comparisonMeasurements={comparisonTeeth ? comparisonTeeth[tooth] : null}
                  onUpdate={handleUpdateTooth}
                  isUpper={true}
                />
              ))}
            </div>
          </div>

          {/* Lower Arch */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-stone-700">Lower Arch (Mandibular)</h2>
              <span className="text-xs text-stone-400">Teeth 17-32</span>
            </div>
            <div className="grid grid-cols-8 gap-2 lg:grid-cols-16">
              {LOWER_TEETH.map((tooth) => (
                <ToothCard
                  key={tooth}
                  toothNumber={tooth}
                  measurements={teeth[tooth]}
                  comparisonMeasurements={comparisonTeeth ? comparisonTeeth[tooth] : null}
                  onUpdate={handleUpdateTooth}
                  isUpper={false}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
