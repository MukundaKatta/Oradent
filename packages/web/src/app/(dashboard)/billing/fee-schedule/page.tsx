'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Save,
  DollarSign,
  FileText,
  CheckCircle,
  X,
} from 'lucide-react';
import { apiGet, apiPut } from '@/lib/api';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface FeeScheduleEntry {
  id: string;
  cdtCode: string;
  description: string;
  category: string;
  fee: number;
  insuranceAllowance: number;
}

// ═══════════════════ CONSTANTS ═══════════════════

const FEE_CATEGORIES = [
  'Preventive',
  'Diagnostic',
  'Restorative',
  'Endodontic',
  'Periodontic',
  'Prosthodontic',
  'Oral Surgery',
  'Orthodontic',
  'Adjunctive',
];

// ═══════════════════ HELPERS ═══════════════════

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function FeeSchedulePage() {
  const [entries, setEntries] = useState<FeeScheduleEntry[]>([]);
  const [originalEntries, setOriginalEntries] = useState<FeeScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchFeeSchedule();
  }, []);

  const fetchFeeSchedule = async () => {
    setLoading(true);
    try {
      const data = await apiGet<FeeScheduleEntry[]>('/api/billing/fee-schedule');
      setEntries(data);
      setOriginalEntries(data);
    } catch (error) {
      console.error('Failed to fetch fee schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = useMemo(() => {
    return JSON.stringify(entries) !== JSON.stringify(originalEntries);
  }, [entries, originalEntries]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (categoryFilter) {
      result = result.filter((e) => e.category === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.cdtCode.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, search, categoryFilter]);

  const handleStartEdit = (entry: FeeScheduleEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.fee.toString());
  };

  const handleSaveEdit = (id: string) => {
    const newFee = parseFloat(editValue);
    if (!isNaN(newFee) && newFee >= 0) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, fee: newFee } : e))
      );
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await apiPut('/api/billing/fee-schedule', entries);
      setOriginalEntries([...entries]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save fee schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['CDT Code', 'Description', 'Category', 'Fee', 'Insurance Allowance'];
    const rows = filteredEntries.map((e) => [
      e.cdtCode,
      `"${e.description}"`,
      e.category,
      e.fee.toFixed(2),
      e.insuranceAllowance.toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fee-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length < 2) return;

        const imported: FeeScheduleEntry[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].match(/(".*?"|[^,]+)/g);
          if (cols && cols.length >= 4) {
            imported.push({
              id: `imported-${i}`,
              cdtCode: cols[0].replace(/"/g, '').trim(),
              description: cols[1].replace(/"/g, '').trim(),
              category: cols[2].replace(/"/g, '').trim(),
              fee: parseFloat(cols[3]) || 0,
              insuranceAllowance: cols[4] ? parseFloat(cols[4]) || 0 : 0,
            });
          }
        }
        if (imported.length > 0) {
          setEntries(imported);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const totalCodes = entries.length;
  const categoriesUsed = new Set(entries.map((e) => e.category)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Fee Schedule</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage procedure fees and CDT codes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
              <CheckCircle className="h-4 w-4" />
              Saved
            </span>
          )}
          <button
            onClick={handleImportCSV}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            disabled={entries.length === 0}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          {hasChanges && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <FileText className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total CDT Codes</p>
              <p className="text-xl font-bold text-stone-900">{totalCodes}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Filter className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Categories</p>
              <p className="text-xl font-bold text-stone-900">{categoriesUsed}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Showing</p>
              <p className="text-xl font-bold text-stone-900">{filteredEntries.length} codes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by CDT code or description..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">All Categories</option>
          {FEE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {(search || categoryFilter) && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter(''); }}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No fee schedule entries</h3>
            <p className="mt-1 text-xs text-stone-500">
              {search || categoryFilter
                ? 'Try adjusting your filters.'
                : 'Import a CSV file to populate the fee schedule.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-medium text-stone-500">CDT Code</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Fee</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-stone-100 transition-colors hover:bg-stone-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-stone-900">
                      {entry.cdtCode}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{entry.description}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingId === entry.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-stone-400">$</span>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 rounded border border-teal-300 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            onBlur={() => handleSaveEdit(entry.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(entry.id);
                              if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                            }}
                            autoFocus
                            min="0"
                            step="0.01"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(entry)}
                          className="font-medium text-stone-900 hover:text-teal-600 transition-colors cursor-pointer"
                          title="Click to edit fee"
                        >
                          {formatCurrency(entry.fee)}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unsaved changes indicator */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 px-6 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-amber-800">
              You have unsaved changes
            </span>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
