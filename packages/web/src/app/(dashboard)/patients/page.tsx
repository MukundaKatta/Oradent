'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { usePatients } from '@/hooks/usePatient';
import { PatientList } from '@/components/patients/PatientList';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { PatientForm } from "@/components/patients/PatientForm";
import { ptBR } from "@/i18n";

const copy = ptBR.patientWorkflow.list;
const STATUS_TABS = [
  { label: ptBR.patientWorkflow.common.all, value: "" },
  { label: ptBR.patientWorkflow.common.active, value: "ACTIVE" },
  { label: ptBR.patientWorkflow.common.inactive, value: "INACTIVE" },
  { label: ptBR.patientWorkflow.common.archived, value: "ARCHIVED" },
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

  const { data, isLoading } = usePatients({
    search,
    status: status || undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">{copy.title}</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {data?.pagination.total ?? 0} {copy.total}
          </p>
        </div>
        <button
          onClick={() => setShowNewPatient(true)}
          className="flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-apple-sm transition-all hover:bg-teal-700 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          {ptBR.patientWorkflow.list.newPatient}
        </button>
      </div>

      {/* Search & Filters */}
      <PatientSearch value={search} onChange={setSearch} />

      {/* Status Tabs */}
      <div className="glass flex w-fit gap-1 rounded-full p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              status === tab.value
                ? 'bg-teal-600 text-white shadow-apple-sm'
                : 'text-stone-600 hover:bg-stone-900/5 dark:text-stone-400 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Patient Table */}
      {isLoading ? (
        <div className="glass-card divide-y divide-stone-100 dark:divide-white/5 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-stone-200/40 dark:bg-white/5" />
          ))}
        </div>
      ) : (
        <PatientList
          patients={data?.patients ?? []}
          onSelect={(id) => router.push(`/patients/${id}`)}
          onNewPatient={() => setShowNewPatient(true)}
        />
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="glass-card flex items-center justify-between px-6 py-3">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {copy.page} {data.pagination.page} {copy.of} {data.pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-full border border-stone-200/70 dark:border-white/10 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 transition-colors hover:bg-stone-900/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ptBR.patientWorkflow.common.previous}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page >= data.pagination.pages}
              className="rounded-full border border-stone-200/70 dark:border-white/10 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 transition-colors hover:bg-stone-900/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ptBR.patientWorkflow.common.next}
            </button>
          </div>
        </div>
      )}

      {/* {ptBR.patientWorkflow.list.newPatient} Modal */}
      {showNewPatient && (
        <PatientForm
          open={showNewPatient}
          onClose={() => setShowNewPatient(false)}
        />
      )}
    </div>
  );
}
