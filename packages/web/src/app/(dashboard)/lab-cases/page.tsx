'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  Filter,
  Eye,
  RefreshCw,
  MessageSquare,
  FlaskConical,
  Truck,
  Package,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type CaseStatus = 'Draft' | 'Sent to Lab' | 'In Production' | 'Shipped' | 'Received' | 'Delivered';
type CaseType = 'Crown' | 'Bridge' | 'Denture' | 'Implant' | 'Veneer' | 'Inlay/Onlay' | 'Night Guard';

interface LabCase {
  id: string;
  caseId: string;
  patientName: string;
  type: CaseType;
  lab: string;
  status: CaseStatus;
  sentDate: string;
  dueDate: string;
  cost: number;
  notes: string[];
  shade: string;
  toothNumbers: string;
}

// ═══════════════════ CONSTANTS ═══════════════════

const STATUS_COLORS: Record<CaseStatus, string> = {
  Draft: 'bg-stone-100 text-stone-700',
  'Sent to Lab': 'bg-blue-100 text-blue-700',
  'In Production': 'bg-amber-100 text-amber-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Received: 'bg-teal-100 text-teal-700',
  Delivered: 'bg-green-100 text-green-700',
};

const ALL_STATUSES: CaseStatus[] = ['Draft', 'Sent to Lab', 'In Production', 'Shipped', 'Received', 'Delivered'];
const ALL_TYPES: CaseType[] = ['Crown', 'Bridge', 'Denture', 'Implant', 'Veneer', 'Inlay/Onlay', 'Night Guard'];
const ALL_LABS = ['Glidewell', 'BioTemps', 'Dental Arts Lab', 'Burbank Dental Lab', 'NDX Oratio'];

const MOCK_CASES: LabCase[] = [
  { id: '1', caseId: 'LC-2026-001', patientName: 'Sarah Johnson', type: 'Crown', lab: 'Glidewell', status: 'Delivered', sentDate: '2026-05-10', dueDate: '2026-05-20', cost: 285, notes: ['Zirconia, shade A2'], shade: 'A2', toothNumbers: '#14' },
  { id: '2', caseId: 'LC-2026-002', patientName: 'Michael Chen', type: 'Bridge', lab: 'BioTemps', status: 'In Production', sentDate: '2026-05-18', dueDate: '2026-05-30', cost: 720, notes: ['3-unit PFM bridge'], shade: 'B1', toothNumbers: '#3-5' },
  { id: '3', caseId: 'LC-2026-003', patientName: 'Emily Rodriguez', type: 'Veneer', lab: 'Dental Arts Lab', status: 'Sent to Lab', sentDate: '2026-05-22', dueDate: '2026-06-05', cost: 1450, notes: ['4 porcelain veneers', 'Patient wants natural look'], shade: 'A1', toothNumbers: '#6-9' },
  { id: '4', caseId: 'LC-2026-004', patientName: 'James Wilson', type: 'Denture', lab: 'Burbank Dental Lab', status: 'Shipped', sentDate: '2026-05-12', dueDate: '2026-05-28', cost: 890, notes: ['Full upper denture', 'Economy line'], shade: 'A3', toothNumbers: 'Upper Arch' },
  { id: '5', caseId: 'LC-2026-005', patientName: 'Lisa Park', type: 'Implant', lab: 'NDX Oratio', status: 'In Production', sentDate: '2026-05-20', dueDate: '2026-06-03', cost: 650, notes: ['Custom abutment + crown', 'Nobel Active implant'], shade: 'A2', toothNumbers: '#19' },
  { id: '6', caseId: 'LC-2026-006', patientName: 'David Kim', type: 'Crown', lab: 'Glidewell', status: 'Draft', sentDate: '', dueDate: '2026-06-10', cost: 295, notes: ['E.max crown'], shade: 'B2', toothNumbers: '#30' },
  { id: '7', caseId: 'LC-2026-007', patientName: 'Amanda Foster', type: 'Night Guard', lab: 'Dental Arts Lab', status: 'Received', sentDate: '2026-05-15', dueDate: '2026-05-25', cost: 175, notes: ['Hard/soft combo', 'Upper arch'], shade: 'Clear', toothNumbers: 'Upper Arch' },
  { id: '8', caseId: 'LC-2026-008', patientName: 'Robert Taylor', type: 'Inlay/Onlay', lab: 'BioTemps', status: 'Sent to Lab', sentDate: '2026-05-24', dueDate: '2026-06-07', cost: 380, notes: ['Gold onlay'], shade: 'Gold', toothNumbers: '#18' },
  { id: '9', caseId: 'LC-2026-009', patientName: 'Maria Gonzalez', type: 'Crown', lab: 'Glidewell', status: 'Delivered', sentDate: '2026-05-05', dueDate: '2026-05-15', cost: 285, notes: ['BruxZir full zirconia'], shade: 'A3.5', toothNumbers: '#3' },
  { id: '10', caseId: 'LC-2026-010', patientName: 'Thomas Brown', type: 'Bridge', lab: 'NDX Oratio', status: 'In Production', sentDate: '2026-05-19', dueDate: '2026-06-02', cost: 1100, notes: ['4-unit zirconia bridge', 'Implant-supported'], shade: 'A2', toothNumbers: '#12-15' },
  { id: '11', caseId: 'LC-2026-011', patientName: 'Jennifer Lee', type: 'Implant', lab: 'Burbank Dental Lab', status: 'Draft', sentDate: '', dueDate: '2026-06-15', cost: 580, notes: ['Screw-retained crown'], shade: 'B1', toothNumbers: '#8' },
  { id: '12', caseId: 'LC-2026-012', patientName: 'Chris Martinez', type: 'Denture', lab: 'Dental Arts Lab', status: 'Shipped', sentDate: '2026-05-14', dueDate: '2026-05-29', cost: 1250, notes: ['Partial lower denture', 'Cast metal framework'], shade: 'A2', toothNumbers: 'Lower Partial' },
];

// ═══════════════════ HELPERS ═══════════════════

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function generateCaseId(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `LC-2026-${num}`;
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function LabCasesPage() {
  const [cases, setCases] = useState<LabCase[]>(MOCK_CASES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CaseType | ''>('');
  const [labFilter, setLabFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LabCase | null>(null);

  // Create form
  const [formPatient, setFormPatient] = useState('');
  const [formType, setFormType] = useState<CaseType>('Crown');
  const [formLab, setFormLab] = useState(ALL_LABS[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formShade, setFormShade] = useState('');
  const [formTooth, setFormTooth] = useState('');
  const [formNote, setFormNote] = useState('');

  // Note form
  const [newNote, setNewNote] = useState('');

  // Status update
  const [newStatus, setNewStatus] = useState<CaseStatus>('Draft');

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredCases = useMemo(() => {
    let result = cases;
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    if (typeFilter) result = result.filter((c) => c.type === typeFilter);
    if (labFilter) result = result.filter((c) => c.lab === labFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.caseId.toLowerCase().includes(q) ||
          c.patientName.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.lab.toLowerCase().includes(q)
      );
    }
    return result;
  }, [cases, search, statusFilter, typeFilter, labFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_STATUSES.forEach((s) => {
      counts[s] = cases.filter((c) => c.status === s).length;
    });
    return counts;
  }, [cases]);

  const handleCreate = () => {
    if (!formPatient.trim() || !formDueDate) return;
    const newCase: LabCase = {
      id: Date.now().toString(),
      caseId: generateCaseId(),
      patientName: formPatient.trim(),
      type: formType,
      lab: formLab,
      status: 'Draft',
      sentDate: '',
      dueDate: formDueDate,
      cost: parseFloat(formCost) || 0,
      notes: formNote.trim() ? [formNote.trim()] : [],
      shade: formShade,
      toothNumbers: formTooth,
    };
    setCases((prev) => [newCase, ...prev]);
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormPatient('');
    setFormType('Crown');
    setFormLab(ALL_LABS[0]);
    setFormDueDate('');
    setFormCost('');
    setFormShade('');
    setFormTooth('');
    setFormNote('');
  };

  const handleUpdateStatus = () => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id
          ? {
              ...c,
              status: newStatus,
              sentDate: newStatus === 'Sent to Lab' && !c.sentDate ? new Date().toISOString().split('T')[0] : c.sentDate,
            }
          : c
      )
    );
    setShowStatusModal(false);
    setSelectedCase(null);
  };

  const handleAddNote = () => {
    if (!selectedCase || !newNote.trim()) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id ? { ...c, notes: [...c.notes, newNote.trim()] } : c
      )
    );
    setNewNote('');
    setShowNoteModal(false);
    setSelectedCase(null);
  };

  const openView = (c: LabCase) => {
    setSelectedCase(c);
    setShowViewModal(true);
  };

  const openStatusUpdate = (c: LabCase) => {
    setSelectedCase(c);
    setNewStatus(c.status);
    setShowStatusModal(true);
  };

  const openAddNote = (c: LabCase) => {
    setSelectedCase(c);
    setNewNote('');
    setShowNoteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Lab Cases</h1>
          <p className="mt-1 text-sm text-stone-500">Track dental lab orders and case progress</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Lab Case
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={cn(
              'rounded-xl border p-4 text-left transition-colors',
              statusFilter === status
                ? 'border-teal-300 bg-teal-50'
                : 'border-stone-200 bg-white hover:border-stone-300'
            )}
          >
            <p className="text-xs font-medium text-stone-500">{status}</p>
            <p className="mt-1 text-xl font-bold text-stone-900">{statusCounts[status]}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CaseType | '')}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Types</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Labs</option>
            {ALL_LABS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="py-16 text-center">
            <FlaskConical className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No lab cases found</h3>
            <p className="mt-1 text-xs text-stone-500">
              {search || statusFilter || typeFilter || labFilter
                ? 'Try adjusting your filters.'
                : 'Create a new lab case to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Case ID</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Lab</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Sent Date</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Due Date</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Cost</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.id} className="border-b border-stone-100 transition-colors hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-stone-900">{c.caseId}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{c.patientName}</td>
                    <td className="px-4 py-3 text-stone-700">{c.type}</td>
                    <td className="px-4 py-3 text-stone-700">{c.lab}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[c.status])}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{formatDate(c.sentDate)}</td>
                    <td className="px-4 py-3 text-stone-600">{formatDate(c.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-medium text-stone-900">{formatCurrency(c.cost)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openView(c)}
                          className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-teal-600 transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openStatusUpdate(c)}
                          className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-teal-600 transition-colors"
                          title="Update Status"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openAddNote(c)}
                          className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-teal-600 transition-colors"
                          title="Add Note"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">New Lab Case</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Patient Name</label>
                <input
                  type="text"
                  value={formPatient}
                  onChange={(e) => setFormPatient(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Case Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CaseType)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {ALL_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Lab</label>
                  <select
                    value={formLab}
                    onChange={(e) => setFormLab(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {ALL_LABS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Cost</label>
                  <input
                    type="number"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Shade</label>
                  <input
                    type="text"
                    value={formShade}
                    onChange={(e) => setFormShade(e.target.value)}
                    placeholder="e.g., A2"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Tooth Number(s)</label>
                <input
                  type="text"
                  value={formTooth}
                  onChange={(e) => setFormTooth(e.target.value)}
                  placeholder="e.g., #14 or #3-5"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Notes</label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  rows={2}
                  placeholder="Material, special instructions..."
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formPatient.trim() || !formDueDate}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Case Details: {selectedCase.caseId}</h2>
              <button
                onClick={() => { setShowViewModal(false); setSelectedCase(null); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-stone-500">Patient</p>
                  <p className="mt-0.5 text-sm font-medium text-stone-900">{selectedCase.patientName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Status</p>
                  <span className={cn('mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[selectedCase.status])}>
                    {selectedCase.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Type</p>
                  <p className="mt-0.5 text-sm text-stone-900">{selectedCase.type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Lab</p>
                  <p className="mt-0.5 text-sm text-stone-900">{selectedCase.lab}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Tooth/Area</p>
                  <p className="mt-0.5 text-sm text-stone-900">{selectedCase.toothNumbers}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Shade</p>
                  <p className="mt-0.5 text-sm text-stone-900">{selectedCase.shade}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Sent Date</p>
                  <p className="mt-0.5 text-sm text-stone-900">{formatDate(selectedCase.sentDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Due Date</p>
                  <p className="mt-0.5 text-sm text-stone-900">{formatDate(selectedCase.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500">Cost</p>
                  <p className="mt-0.5 text-sm font-medium text-stone-900">{formatCurrency(selectedCase.cost)}</p>
                </div>
              </div>
              {selectedCase.notes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-stone-500">Notes</p>
                  <ul className="mt-1 space-y-1">
                    {selectedCase.notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-400" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setShowViewModal(false); setSelectedCase(null); }}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Update Status</h2>
              <button
                onClick={() => { setShowStatusModal(false); setSelectedCase(null); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-stone-500">{selectedCase.caseId} - {selectedCase.patientName}</p>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-stone-700">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowStatusModal(false); setSelectedCase(null); }}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Add Note</h2>
              <button
                onClick={() => { setShowNoteModal(false); setSelectedCase(null); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-stone-500">{selectedCase.caseId} - {selectedCase.patientName}</p>
            <div className="mt-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                placeholder="Add a note..."
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowNoteModal(false); setSelectedCase(null); }}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
