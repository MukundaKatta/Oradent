'use client';

import { useState, useCallback } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Plus,
  Pencil,
  X,
  Star,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface PracticeLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  status: 'Active' | 'Inactive';
  isPrimary: boolean;
}

// ═══════════════════ MOCK DATA ═══════════════════

const INITIAL_LOCATIONS: PracticeLocation[] = [
  {
    id: 'loc1',
    name: 'Bright Smile Dental - Main Office',
    address: '123 Main Street, Suite 200, Springfield, IL 62701',
    phone: '(555) 123-4567',
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM, Sat: 9:00 AM - 1:00 PM',
    status: 'Active',
    isPrimary: true,
  },
  {
    id: 'loc2',
    name: 'Bright Smile Dental - East Branch',
    address: '456 Oak Avenue, Suite 100, Springfield, IL 62702',
    phone: '(555) 987-6543',
    hours: 'Mon-Thu: 9:00 AM - 6:00 PM, Fri: 9:00 AM - 3:00 PM',
    status: 'Active',
    isPrimary: false,
  },
  {
    id: 'loc3',
    name: 'Bright Smile Dental - West Clinic',
    address: '789 Elm Boulevard, Springfield, IL 62704',
    phone: '(555) 456-7890',
    hours: 'Tue-Sat: 10:00 AM - 7:00 PM',
    status: 'Inactive',
    isPrimary: false,
  },
];

// ═══════════════════ EMPTY FORM STATE ═══════════════════

const EMPTY_FORM: { name: string; address: string; phone: string; hours: string; status: 'Active' | 'Inactive' } = {
  name: '',
  address: '',
  phone: '',
  hours: '',
  status: 'Active',
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function LocationsPage() {
  const [locations, setLocations] = useState<PracticeLocation[]>(INITIAL_LOCATIONS);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (location: PracticeLocation) => {
    setEditingId(location.id);
    setForm({
      name: location.name,
      address: location.address,
      phone: location.phone,
      hours: location.hours,
      status: location.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Location name is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!form.hours.trim()) newErrors.hours = 'Hours are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (editingId) {
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === editingId
            ? { ...loc, ...form }
            : loc
        )
      );
      showToast('Location updated successfully');
    } else {
      const newLocation: PracticeLocation = {
        id: `loc-${Date.now()}`,
        ...form,
        isPrimary: false,
      };
      setLocations((prev) => [...prev, newLocation]);
      showToast('Location added successfully');
    }
    closeModal();
  };

  const setPrimary = (id: string) => {
    setLocations((prev) =>
      prev.map((loc) => ({
        ...loc,
        isPrimary: loc.id === id,
      }))
    );
    showToast('Primary location updated');
  };

  const toggleStatus = (id: string) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === id
          ? { ...loc, status: loc.status === 'Active' ? 'Inactive' : 'Active' }
          : loc
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Practice Locations</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage your practice locations, hours, and contact information.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Add Location
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-6 py-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{toast}</p>
        </div>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {locations.map((location) => (
          <div
            key={location.id}
            className={cn(
              'rounded-xl border bg-white shadow-sm transition-colors',
              location.isPrimary ? 'border-teal-300 ring-1 ring-teal-100' : 'border-stone-200'
            )}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between border-b border-stone-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    location.isPrimary ? 'bg-teal-50' : 'bg-stone-100'
                  )}
                >
                  <Building2
                    className={cn(
                      'h-5 w-5',
                      location.isPrimary ? 'text-teal-600' : 'text-stone-500'
                    )}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-stone-900">{location.name}</h3>
                    {location.isPrimary && (
                      <span className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                        <Star className="h-3 w-3" />
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      location.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-stone-100 text-stone-500'
                    )}
                  >
                    {location.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => openEditModal(location)}
                className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                title="Edit location"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            {/* Card Body */}
            <div className="space-y-3 px-6 py-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                <p className="text-sm text-stone-600">{location.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-stone-400" />
                <p className="text-sm text-stone-600">{location.phone}</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                <p className="text-sm text-stone-600">{location.hours}</p>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center gap-2 border-t border-stone-100 px-6 py-3">
              {!location.isPrimary && (
                <button
                  onClick={() => setPrimary(location.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100"
                >
                  <Star className="h-3.5 w-3.5" />
                  Set as Primary
                </button>
              )}
              <button
                onClick={() => toggleStatus(location.id)}
                className={cn(
                  'ml-auto rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  location.status === 'Active'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                )}
              >
                {location.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-900">
                {editingId ? 'Edit Location' : 'Add New Location'}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-stone-400" />
                    Location Name
                  </span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    errors.name ? 'border-red-300 bg-red-50' : 'border-stone-300'
                  )}
                  placeholder="e.g. Downtown Office"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-stone-400" />
                    Address
                  </span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    errors.address ? 'border-red-300 bg-red-50' : 'border-stone-300'
                  )}
                  placeholder="123 Main St, Suite 100, City, ST 12345"
                />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>

              {/* Phone & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-stone-400" />
                      Phone
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                      'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                      errors.phone ? 'border-red-300 bg-red-50' : 'border-stone-300'
                    )}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value as 'Active' | 'Inactive',
                      }))
                    }
                    className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Hours */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-stone-400" />
                    Operating Hours
                  </span>
                </label>
                <input
                  type="text"
                  value={form.hours}
                  onChange={(e) => setForm((prev) => ({ ...prev, hours: e.target.value }))}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    errors.hours ? 'border-red-300 bg-red-50' : 'border-stone-300'
                  )}
                  placeholder="Mon-Fri: 8:00 AM - 5:00 PM"
                />
                {errors.hours && <p className="mt-1 text-xs text-red-600">{errors.hours}</p>}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  {editingId ? (
                    <>
                      <Pencil className="h-4 w-4" />
                      Update Location
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Location
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
