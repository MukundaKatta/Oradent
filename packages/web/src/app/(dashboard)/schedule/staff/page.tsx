'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  X,
  Clock,
  Users,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type BlockType = 'Working' | 'Lunch' | 'Off' | 'PTO';

interface TimeBlock {
  id: string;
  providerId: string;
  day: number; // 0=Mon ... 5=Sat
  startTime: string;
  endTime: string;
  type: BlockType;
  label?: string;
}

interface Provider {
  id: string;
  name: string;
  role: string;
  color: string;
}

// ═══════════════════ CONSTANTS ═══════════════════

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BLOCK_COLORS: Record<BlockType, string> = {
  Working: 'bg-teal-100 border-teal-300 text-teal-800',
  Lunch: 'bg-amber-100 border-amber-300 text-amber-800',
  Off: 'bg-stone-100 border-stone-300 text-stone-500',
  PTO: 'bg-purple-100 border-purple-300 text-purple-800',
};

const BLOCK_TYPES: BlockType[] = ['Working', 'Lunch', 'Off', 'PTO'];

const PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Dr. Sarah Miller', role: 'Dentist', color: 'bg-teal-500' },
  { id: 'p2', name: 'Dr. James Park', role: 'Dentist', color: 'bg-blue-500' },
  { id: 'p3', name: 'Dr. Lisa Chen', role: 'Orthodontist', color: 'bg-purple-500' },
  { id: 'p4', name: 'Amy Rodriguez', role: 'Hygienist', color: 'bg-green-500' },
  { id: 'p5', name: 'Mark Thompson', role: 'Hygienist', color: 'bg-amber-500' },
  { id: 'p6', name: 'Jessica Lee', role: 'Dental Assistant', color: 'bg-pink-500' },
];

function buildDefaultBlocks(): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  let id = 1;
  PROVIDERS.forEach((p) => {
    for (let day = 0; day < 6; day++) {
      if (day === 5) {
        // Saturday - some off, some half day
        if (['p1', 'p4'].includes(p.id)) {
          blocks.push({ id: String(id++), providerId: p.id, day, startTime: '08:00', endTime: '12:00', type: 'Working' });
        } else {
          blocks.push({ id: String(id++), providerId: p.id, day, startTime: '08:00', endTime: '17:00', type: 'Off' });
        }
      } else {
        blocks.push({ id: String(id++), providerId: p.id, day, startTime: '08:00', endTime: '12:00', type: 'Working' });
        blocks.push({ id: String(id++), providerId: p.id, day, startTime: '12:00', endTime: '13:00', type: 'Lunch' });
        blocks.push({ id: String(id++), providerId: p.id, day, startTime: '13:00', endTime: '17:00', type: 'Working' });
      }
    }
  });
  // Add some PTO
  blocks.push({ id: String(id++), providerId: 'p3', day: 3, startTime: '08:00', endTime: '17:00', type: 'PTO', label: 'Personal Day' });
  blocks.push({ id: String(id++), providerId: 'p5', day: 4, startTime: '08:00', endTime: '17:00', type: 'PTO', label: 'Vacation' });
  // Remove conflicting working/lunch blocks for PTO days
  const ptoProviderDays = new Set(['p3-3', 'p5-4']);
  return blocks.filter((b) => {
    const key = `${b.providerId}-${b.day}`;
    if (ptoProviderDays.has(key) && b.type !== 'PTO') return false;
    return true;
  });
}

// ═══════════════════ HELPERS ═══════════════════

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);

  const dates: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeToHours(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

function computeHours(blocks: TimeBlock[], providerId: string): number {
  return blocks
    .filter((b) => b.providerId === providerId && b.type === 'Working')
    .reduce((sum, b) => sum + (timeToHours(b.endTime) - timeToHours(b.startTime)), 0);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function StaffSchedulePage() {
  const [blocks, setBlocks] = useState<TimeBlock[]>(() => buildDefaultBlocks());
  const [weekOffset, setWeekOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [formProvider, setFormProvider] = useState(PROVIDERS[0].id);
  const [formDay, setFormDay] = useState(0);
  const [formStart, setFormStart] = useState('08:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formType, setFormType] = useState<BlockType>('Working');
  const [formLabel, setFormLabel] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[weekDates.length - 1];
    return `${formatDateShort(start)} - ${formatDateShort(end)}, ${end.getFullYear()}`;
  }, [weekDates]);

  const getBlocksForCell = (providerId: string, day: number): TimeBlock[] => {
    return blocks
      .filter((b) => b.providerId === providerId && b.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const openAddModal = (providerId?: string, day?: number) => {
    setEditingBlock(null);
    setFormProvider(providerId || PROVIDERS[0].id);
    setFormDay(day ?? 0);
    setFormStart('08:00');
    setFormEnd('17:00');
    setFormType('Working');
    setFormLabel('');
    setShowModal(true);
  };

  const openEditModal = (block: TimeBlock) => {
    setEditingBlock(block);
    setFormProvider(block.providerId);
    setFormDay(block.day);
    setFormStart(block.startTime);
    setFormEnd(block.endTime);
    setFormType(block.type);
    setFormLabel(block.label || '');
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingBlock) {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === editingBlock.id
            ? { ...b, providerId: formProvider, day: formDay, startTime: formStart, endTime: formEnd, type: formType, label: formLabel || undefined }
            : b
        )
      );
    } else {
      const newBlock: TimeBlock = {
        id: generateId(),
        providerId: formProvider,
        day: formDay,
        startTime: formStart,
        endTime: formEnd,
        type: formType,
        label: formLabel || undefined,
      };
      setBlocks((prev) => [...prev, newBlock]);
    }
    setShowModal(false);
    setEditingBlock(null);
  };

  const handleDelete = () => {
    if (!editingBlock) return;
    setBlocks((prev) => prev.filter((b) => b.id !== editingBlock.id));
    setShowModal(false);
    setEditingBlock(null);
  };

  const handleCopyPreviousWeek = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Employee Schedule</h1>
          <p className="mt-1 text-sm text-stone-500">Manage provider and staff work schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPreviousWeek}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
              copied
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            )}
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Previous Week'}
          </button>
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Shift
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-2 text-lg font-semibold text-stone-900">{weekLabel}</h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {BLOCK_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={cn('h-3 w-3 rounded-sm border', BLOCK_COLORS[type])} />
              <span className="text-xs text-stone-500">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="sticky left-0 z-10 w-48 bg-white px-4 py-3 text-left font-medium text-stone-500">
                    Provider
                  </th>
                  {DAYS.map((day, i) => (
                    <th key={day} className="min-w-[140px] px-3 py-3 text-center font-medium text-stone-500">
                      <div>{day}</div>
                      <div className="text-xs font-normal text-stone-400">
                        {formatDateShort(weekDates[i])}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Hours</th>
                </tr>
              </thead>
              <tbody>
                {PROVIDERS.map((provider) => {
                  const totalHours = computeHours(blocks, provider.id);
                  return (
                    <tr key={provider.id} className="border-b border-stone-100">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2.5 w-2.5 rounded-full', provider.color)} />
                          <div>
                            <p className="font-medium text-stone-900">{provider.name}</p>
                            <p className="text-xs text-stone-500">{provider.role}</p>
                          </div>
                        </div>
                      </td>
                      {DAYS.map((_, dayIndex) => {
                        const cellBlocks = getBlocksForCell(provider.id, dayIndex);
                        return (
                          <td
                            key={dayIndex}
                            className="px-1.5 py-2 align-top"
                          >
                            <div
                              className="min-h-[60px] space-y-1 rounded-lg p-1 cursor-pointer hover:bg-stone-50 transition-colors"
                              onClick={() => {
                                if (cellBlocks.length === 0) openAddModal(provider.id, dayIndex);
                              }}
                            >
                              {cellBlocks.map((block) => (
                                <button
                                  key={block.id}
                                  onClick={(e) => { e.stopPropagation(); openEditModal(block); }}
                                  className={cn(
                                    'w-full rounded-md border px-2 py-1 text-left text-xs transition-opacity hover:opacity-80',
                                    BLOCK_COLORS[block.type]
                                  )}
                                >
                                  <div className="font-medium">{block.type}</div>
                                  <div className="opacity-75">
                                    {block.startTime} - {block.endTime}
                                  </div>
                                  {block.label && (
                                    <div className="mt-0.5 truncate opacity-75">{block.label}</div>
                                  )}
                                </button>
                              ))}
                              {cellBlocks.length === 0 && (
                                <div className="flex h-[60px] items-center justify-center text-xs text-stone-300">
                                  --
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-stone-900">{totalHours.toFixed(1)}h</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Providers</p>
              <p className="text-xl font-bold text-stone-900">{PROVIDERS.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Weekly Hours</p>
              <p className="text-xl font-bold text-stone-900">
                {PROVIDERS.reduce((sum, p) => sum + computeHours(blocks, p.id), 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2.5">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">PTO This Week</p>
              <p className="text-xl font-bold text-stone-900">
                {blocks.filter((b) => b.type === 'PTO').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">
                {editingBlock ? 'Edit Shift' : 'Add Shift'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingBlock(null); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Provider</label>
                <select
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Day</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(Number(e.target.value))}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {DAYS_FULL.map((day, i) => (
                      <option key={day} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as BlockType)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {BLOCK_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Start Time</label>
                  <input
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">End Time</label>
                  <input
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Label (optional)</label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g., Vacation, Training"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div>
                {editingBlock && (
                  <button
                    onClick={handleDelete}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowModal(false); setEditingBlock(null); }}
                  className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                >
                  {editingBlock ? 'Save Changes' : 'Add Shift'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
