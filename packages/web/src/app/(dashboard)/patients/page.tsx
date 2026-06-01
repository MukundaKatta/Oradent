'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  ArrowUpDown,
  LayoutGrid,
  List,
  ChevronDown,
} from 'lucide-react';
import { usePatients } from '@/hooks/usePatient';
import { useDebounce } from '@/hooks/useDebounce';
import { PatientList } from '@/components/patients/PatientList';
import { PatientGridView } from '@/components/patients/PatientGridView';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { PatientForm } from '@/components/patients/PatientForm';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived' },
];

const SORT_OPTIONS = [
  { label: 'Name (A-Z)', sortBy: 'lastName', sortOrder: 'asc' as const },
  { label: 'Name (Z-A)', sortBy: 'lastName', sortOrder: 'desc' as const },
  { label: 'Last Visit (Newest)', sortBy: 'lastVisit', sortOrder: 'desc' as const },
  { label: 'Last Visit (Oldest)', sortBy: 'lastVisit', sortOrder: 'asc' as const },
  { label: 'Created (Newest)', sortBy: 'createdAt', sortOrder: 'desc' as const },
  { label: 'Created (Oldest)', sortBy: 'createdAt', sortOrder: 'asc' as const },
];

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [showNewPatient, setShowNewPatient] = useState(
    searchParams.get('new') === 'true'
  );
  const [sortBy, setSortBy] = useState('lastName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = usePatients({
    search: debouncedSearch,
    status: status || undefined,
    page,
    limit: 20,
    sortBy,
    sortOrder,
  });

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.sortBy === sortBy && o.sortOrder === sortOrder)
      ?.label || 'Sort';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Patients</h1>
          <p className="mt-1 text-sm text-stone-500">
            {data?.total ?? 0} patients
          </p>
        </div>
        <button
          onClick={() => setShowNewPatient(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Patient
        </button>
      </div>

      {/* Search & Controls Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PatientSearch value={search} onChange={setSearch} />

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <ArrowUpDown className="h-4 w-4" />
              {currentSortLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={`${option.sortBy}-${option.sortOrder}`}
                      onClick={() => {
                        setSortBy(option.sortBy);
                        setSortOrder(option.sortOrder);
                        setShowSortMenu(false);
                        setPage(1);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        sortBy === option.sortBy && sortOrder === option.sortOrder
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-stone-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-teal-600 text-white'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-teal-600 text-white'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              status === tab.value
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Patient Table or Grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-200" />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <PatientList
          patients={data?.data ?? []}
          onSelect={(id) => router.push(`/patients/${id}`)}
        />
      ) : (
        <PatientGridView
          patients={data?.data ?? []}
          onSelect={(id) => router.push(`/patients/${id}`)}
        />
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-6 py-3 shadow-sm">
          <p className="text-sm text-stone-500">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* New Patient Modal */}
      {showNewPatient && (
        <PatientForm
          open={showNewPatient}
          onClose={() => setShowNewPatient(false)}
        />
      )}
    </div>
  );
}
