'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Package,
  AlertTriangle,
  Plus,
  X,
  Filter,
  Edit3,
  Trash2,
  CheckCircle,
  Box,
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type Category = 'Instruments' | 'Materials' | 'Disposables' | 'PPE' | 'Office Supplies';

interface SupplyItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  reorderPoint: number;
  unit: string;
  notes: string;
}

// ═══════════════════ SEED DATA ═══════════════════

const CATEGORIES: Category[] = ['Instruments', 'Materials', 'Disposables', 'PPE', 'Office Supplies'];

const INITIAL_SUPPLIES: SupplyItem[] = [
  { id: '1', name: 'Dental Mirrors', category: 'Instruments', quantity: 45, reorderPoint: 20, unit: 'pcs', notes: '' },
  { id: '2', name: 'Explorer Probes', category: 'Instruments', quantity: 30, reorderPoint: 15, unit: 'pcs', notes: '' },
  { id: '3', name: 'Scalers (Sickle)', category: 'Instruments', quantity: 8, reorderPoint: 10, unit: 'pcs', notes: 'Need to reorder' },
  { id: '4', name: 'Composite Resin (A2)', category: 'Materials', quantity: 12, reorderPoint: 5, unit: 'syringes', notes: '' },
  { id: '5', name: 'Amalgam Capsules', category: 'Materials', quantity: 3, reorderPoint: 10, unit: 'boxes', notes: 'Low stock' },
  { id: '6', name: 'Dental Impression Material', category: 'Materials', quantity: 18, reorderPoint: 8, unit: 'cartridges', notes: '' },
  { id: '7', name: 'Disposable Suction Tips', category: 'Disposables', quantity: 200, reorderPoint: 100, unit: 'pcs', notes: '' },
  { id: '8', name: 'Cotton Rolls', category: 'Disposables', quantity: 50, reorderPoint: 100, unit: 'pcs', notes: 'Running low' },
  { id: '9', name: 'Gauze Pads (2x2)', category: 'Disposables', quantity: 350, reorderPoint: 150, unit: 'pcs', notes: '' },
  { id: '10', name: 'Nitrile Gloves (M)', category: 'PPE', quantity: 4, reorderPoint: 5, unit: 'boxes', notes: '' },
  { id: '11', name: 'Nitrile Gloves (L)', category: 'PPE', quantity: 6, reorderPoint: 5, unit: 'boxes', notes: '' },
  { id: '12', name: 'Face Masks (Level 3)', category: 'PPE', quantity: 2, reorderPoint: 3, unit: 'boxes', notes: 'Critical low' },
  { id: '13', name: 'Face Shields', category: 'PPE', quantity: 15, reorderPoint: 10, unit: 'pcs', notes: '' },
  { id: '14', name: 'Printer Paper (Letter)', category: 'Office Supplies', quantity: 8, reorderPoint: 3, unit: 'reams', notes: '' },
  { id: '15', name: 'Appointment Reminder Cards', category: 'Office Supplies', quantity: 100, reorderPoint: 200, unit: 'pcs', notes: 'Need to reorder' },
];

// ═══════════════════ HELPERS ═══════════════════

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getStockStatus(item: SupplyItem): { label: string; color: string } {
  if (item.quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
  if (item.quantity < item.reorderPoint) return { label: 'Low Stock', color: 'bg-red-100 text-red-700' };
  if (item.quantity <= item.reorderPoint * 1.5) return { label: 'Warning', color: 'bg-amber-100 text-amber-700' };
  return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function InventoryPage() {
  const [supplies, setSupplies] = useLocalStorage<SupplyItem[]>('oradent-inventory', INITIAL_SUPPLIES);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('Instruments');
  const [formQuantity, setFormQuantity] = useState('');
  const [formReorderPoint, setFormReorderPoint] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const lowStockCount = supplies.filter((s) => s.quantity < s.reorderPoint).length;
  const totalItems = supplies.length;
  const totalValue = supplies.reduce((acc, s) => acc + s.quantity, 0);

  const filteredSupplies = useMemo(() => {
    let result = supplies;
    if (categoryFilter) {
      result = result.filter((s) => s.category === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.notes.toLowerCase().includes(q)
      );
    }
    return result;
  }, [supplies, search, categoryFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Instruments');
    setFormQuantity('');
    setFormReorderPoint('');
    setFormUnit('pcs');
    setFormNotes('');
    setShowModal(true);
  };

  const openEditModal = (item: SupplyItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity.toString());
    setFormReorderPoint(item.reorderPoint.toString());
    setFormUnit(item.unit);
    setFormNotes(item.notes);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) return;
    const qty = parseInt(formQuantity, 10) || 0;
    const reorder = parseInt(formReorderPoint, 10) || 0;

    if (editingItem) {
      setSupplies((prev) =>
        prev.map((s) =>
          s.id === editingItem.id
            ? { ...s, name: formName.trim(), category: formCategory, quantity: qty, reorderPoint: reorder, unit: formUnit, notes: formNotes.trim() }
            : s
        )
      );
    } else {
      const newItem: SupplyItem = {
        id: generateId(),
        name: formName.trim(),
        category: formCategory,
        quantity: qty,
        reorderPoint: reorder,
        unit: formUnit,
        notes: formNotes.trim(),
      };
      setSupplies((prev) => [...prev, newItem]);
    }
    setShowModal(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    setSupplies((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-stone-500">
            Track and manage dental supplies and equipment
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <Package className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Items</p>
              <p className="text-xl font-bold text-stone-900">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Box className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Units in Stock</p>
              <p className="text-xl font-bold text-stone-900">{totalValue}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Low Stock Alerts</p>
              <p className="text-xl font-bold text-stone-900">{lowStockCount}</p>
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
            placeholder="Search supplies..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | '')}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Supply Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          </div>
        ) : filteredSupplies.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No items found</h3>
            <p className="mt-1 text-xs text-stone-500">
              {search || categoryFilter ? 'Try adjusting your filters.' : 'Add inventory items to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Quantity</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Reorder Point</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSupplies.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-stone-100 transition-colors hover:bg-stone-50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-900">{item.name}</p>
                        {item.notes && (
                          <p className="mt-0.5 text-xs text-stone-400">{item.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-stone-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-600">
                        {item.reorderPoint} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            status.color
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-teal-600 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">
                {editingItem ? 'Edit Supply Item' : 'Add Supply Item'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingItem(null); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Item Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Nitrile Gloves (M)"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Unit</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g., pcs, boxes"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Current Quantity
                  </label>
                  <input
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    min="0"
                    placeholder="0"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    value={formReorderPoint}
                    onChange={(e) => setFormReorderPoint(e.target.value)}
                    min="0"
                    placeholder="0"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setEditingItem(null); }}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formName.trim()}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
