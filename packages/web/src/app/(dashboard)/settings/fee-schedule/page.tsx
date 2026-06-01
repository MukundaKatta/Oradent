'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  FileText,
  DollarSign,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface FeeEntry {
  id: string;
  cdtCode: string;
  description: string;
  category: string;
  fee: number;
}

type Category =
  | 'Preventive'
  | 'Restorative'
  | 'Endodontic'
  | 'Periodontic'
  | 'Prosthodontic'
  | 'Oral Surgery';

// ═══════════════════ MOCK DATA ═══════════════════

const CATEGORIES: Category[] = [
  'Preventive',
  'Restorative',
  'Endodontic',
  'Periodontic',
  'Prosthodontic',
  'Oral Surgery',
];

const CATEGORY_COLORS: Record<Category, string> = {
  Preventive: 'bg-green-100 text-green-700 border-green-200',
  Restorative: 'bg-blue-100 text-blue-700 border-blue-200',
  Endodontic: 'bg-purple-100 text-purple-700 border-purple-200',
  Periodontic: 'bg-amber-100 text-amber-700 border-amber-200',
  Prosthodontic: 'bg-rose-100 text-rose-700 border-rose-200',
  'Oral Surgery': 'bg-red-100 text-red-700 border-red-200',
};

const INITIAL_FEES: FeeEntry[] = [
  // Preventive
  { id: '1', cdtCode: 'D0120', description: 'Periodic oral evaluation', category: 'Preventive', fee: 65 },
  { id: '2', cdtCode: 'D0150', description: 'Comprehensive oral evaluation - new or established patient', category: 'Preventive', fee: 95 },
  { id: '3', cdtCode: 'D0210', description: 'Intraoral - complete series of radiographic images', category: 'Preventive', fee: 150 },
  { id: '4', cdtCode: 'D0220', description: 'Intraoral - periapical first radiographic image', category: 'Preventive', fee: 35 },
  { id: '5', cdtCode: 'D0274', description: 'Bitewings - four radiographic images', category: 'Preventive', fee: 70 },
  { id: '6', cdtCode: 'D0330', description: 'Panoramic radiographic image', category: 'Preventive', fee: 130 },
  { id: '7', cdtCode: 'D1110', description: 'Prophylaxis - adult', category: 'Preventive', fee: 110 },
  { id: '8', cdtCode: 'D1120', description: 'Prophylaxis - child', category: 'Preventive', fee: 75 },
  { id: '9', cdtCode: 'D1206', description: 'Topical application of fluoride varnish', category: 'Preventive', fee: 40 },
  { id: '10', cdtCode: 'D1351', description: 'Sealant - per tooth', category: 'Preventive', fee: 55 },
  // Restorative
  { id: '11', cdtCode: 'D2140', description: 'Amalgam - one surface, primary or permanent', category: 'Restorative', fee: 175 },
  { id: '12', cdtCode: 'D2150', description: 'Amalgam - two surfaces, primary or permanent', category: 'Restorative', fee: 215 },
  { id: '13', cdtCode: 'D2160', description: 'Amalgam - three surfaces, primary or permanent', category: 'Restorative', fee: 260 },
  { id: '14', cdtCode: 'D2330', description: 'Resin composite - one surface, anterior', category: 'Restorative', fee: 195 },
  { id: '15', cdtCode: 'D2331', description: 'Resin composite - two surfaces, anterior', category: 'Restorative', fee: 245 },
  { id: '16', cdtCode: 'D2391', description: 'Resin composite - one surface, posterior', category: 'Restorative', fee: 210 },
  { id: '17', cdtCode: 'D2392', description: 'Resin composite - two surfaces, posterior', category: 'Restorative', fee: 270 },
  { id: '18', cdtCode: 'D2740', description: 'Crown - porcelain/ceramic', category: 'Restorative', fee: 1250 },
  { id: '19', cdtCode: 'D2750', description: 'Crown - porcelain fused to high noble metal', category: 'Restorative', fee: 1350 },
  { id: '20', cdtCode: 'D2950', description: 'Core buildup, including any pins when required', category: 'Restorative', fee: 320 },
  // Endodontic
  { id: '21', cdtCode: 'D3220', description: 'Therapeutic pulpotomy', category: 'Endodontic', fee: 290 },
  { id: '22', cdtCode: 'D3310', description: 'Endodontic therapy, anterior tooth', category: 'Endodontic', fee: 850 },
  { id: '23', cdtCode: 'D3320', description: 'Endodontic therapy, premolar tooth', category: 'Endodontic', fee: 975 },
  { id: '24', cdtCode: 'D3330', description: 'Endodontic therapy, molar tooth', category: 'Endodontic', fee: 1150 },
  { id: '25', cdtCode: 'D3346', description: 'Retreatment of previous root canal therapy - anterior', category: 'Endodontic', fee: 950 },
  { id: '26', cdtCode: 'D3410', description: 'Apicoectomy - anterior', category: 'Endodontic', fee: 750 },
  // Periodontic
  { id: '27', cdtCode: 'D4210', description: 'Gingivectomy or gingivoplasty - per quadrant', category: 'Periodontic', fee: 450 },
  { id: '28', cdtCode: 'D4341', description: 'Periodontal scaling and root planing - per quadrant', category: 'Periodontic', fee: 285 },
  { id: '29', cdtCode: 'D4342', description: 'Periodontal scaling and root planing - one to three teeth', category: 'Periodontic', fee: 185 },
  { id: '30', cdtCode: 'D4355', description: 'Full mouth debridement', category: 'Periodontic', fee: 195 },
  { id: '31', cdtCode: 'D4910', description: 'Periodontal maintenance', category: 'Periodontic', fee: 165 },
  // Prosthodontic
  { id: '32', cdtCode: 'D5110', description: 'Complete denture - maxillary', category: 'Prosthodontic', fee: 1950 },
  { id: '33', cdtCode: 'D5120', description: 'Complete denture - mandibular', category: 'Prosthodontic', fee: 1950 },
  { id: '34', cdtCode: 'D5213', description: 'Maxillary partial denture - cast metal framework', category: 'Prosthodontic', fee: 1750 },
  { id: '35', cdtCode: 'D6240', description: 'Pontic - porcelain fused to high noble metal', category: 'Prosthodontic', fee: 1350 },
  { id: '36', cdtCode: 'D6750', description: 'Retainer crown - porcelain fused to high noble metal', category: 'Prosthodontic', fee: 1350 },
  // Oral Surgery
  { id: '37', cdtCode: 'D7140', description: 'Extraction, erupted tooth or exposed root', category: 'Oral Surgery', fee: 225 },
  { id: '38', cdtCode: 'D7210', description: 'Extraction, erupted tooth requiring surgical procedure', category: 'Oral Surgery', fee: 350 },
  { id: '39', cdtCode: 'D7220', description: 'Removal of impacted tooth - soft tissue', category: 'Oral Surgery', fee: 425 },
  { id: '40', cdtCode: 'D7230', description: 'Removal of impacted tooth - partially bony', category: 'Oral Surgery', fee: 525 },
  { id: '41', cdtCode: 'D7240', description: 'Removal of impacted tooth - completely bony', category: 'Oral Surgery', fee: 650 },
  { id: '42', cdtCode: 'D7510', description: 'Incision and drainage of abscess - intraoral soft tissue', category: 'Oral Surgery', fee: 310 },
];

// ═══════════════════ HELPERS ═══════════════════

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function FeeSchedulePage() {
  const [entries, setEntries] = useState<FeeEntry[]>(INITIAL_FEES);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

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

  const groupedEntries = useMemo(() => {
    const groups: Record<string, FeeEntry[]> = {};
    for (const entry of filteredEntries) {
      if (!groups[entry.category]) {
        groups[entry.category] = [];
      }
      groups[entry.category].push(entry);
    }
    return groups;
  }, [filteredEntries]);

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleStartEdit = (entry: FeeEntry) => {
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

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const totalCodes = entries.length;
  const matchedCodes = filteredEntries.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Fee Schedule</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage CDT procedure codes and fee amounts for your practice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <FileText className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Codes</p>
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
              <p className="text-xl font-bold text-stone-900">{CATEGORIES.length}</p>
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
              <p className="text-xl font-bold text-stone-900">{matchedCodes} codes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
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
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {(search || categoryFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
            }}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Grouped Table */}
      {Object.keys(groupedEntries).length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-sm font-medium text-stone-700">No matching entries</h3>
          <p className="mt-1 text-xs text-stone-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.filter((cat) => groupedEntries[cat]?.length).map((category) => {
            const isCollapsed = collapsedCategories.has(category);
            const catEntries = groupedEntries[category];
            const colorClass = CATEGORY_COLORS[category];

            return (
              <div
                key={category}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center justify-between border-b border-stone-100 px-5 py-3.5 text-left transition-colors hover:bg-stone-50"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    )}
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        colorClass
                      )}
                    >
                      {category}
                    </span>
                    <span className="text-sm font-medium text-stone-700">
                      {catEntries.length} code{catEntries.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-sm text-stone-500">
                    Avg: {formatCurrency(
                      catEntries.reduce((sum, e) => sum + e.fee, 0) / catEntries.length
                    )}
                  </span>
                </button>

                {/* Table Body */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                          <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                            CDT Code
                          </th>
                          <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                            Description
                          </th>
                          <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                            Fee
                          </th>
                          <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {catEntries.map((entry) => (
                          <tr
                            key={entry.id}
                            className="border-b border-stone-50 transition-colors hover:bg-stone-50"
                          >
                            <td className="px-5 py-3 font-mono text-xs font-semibold text-teal-700">
                              {entry.cdtCode}
                            </td>
                            <td className="px-5 py-3 text-stone-700">
                              {entry.description}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {editingId === entry.id ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-stone-400">$</span>
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-24 rounded border border-teal-300 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit(entry.id);
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    autoFocus
                                    min="0"
                                    step="0.01"
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(entry.id)}
                                    className="rounded p-1 text-green-600 transition-colors hover:bg-green-50"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="font-medium text-stone-900">
                                  {formatCurrency(entry.fee)}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {editingId !== entry.id && (
                                <button
                                  onClick={() => handleStartEdit(entry)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
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
            );
          })}
        </div>
      )}
    </div>
  );
}
