'use client';

import { useParams } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Smile, Plus, X } from 'lucide-react';
import {
  useOrthodonticCases,
  useCreateOrthodonticCase,
  OrthodonticApplianceType,
} from '@/hooks/useOrthodontics';
import { OrthodonticVisitTimeline } from '@/components/orthodontics/OrthodonticVisitTimeline';
import { ApiClientError } from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import { ptBR, clinicalPtBR } from '@/i18n';

const copy = ptBR.patientWorkflow.orthodontics;

const APPLIANCE_TYPES: OrthodonticApplianceType[] = [
  'FIXED_METAL',
  'FIXED_CERAMIC',
  'LINGUAL',
  'ALIGNER',
  'RETAINER',
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  RETENTION: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-teal-100 text-teal-700',
  DISCONTINUED: 'bg-stone-100 text-stone-600',
};

export default function OrthodonticsPage() {
  const params = useParams<{ id: string }>();
  const { data: cases, isLoading, isError } = useOrthodonticCases(params.id);
  const createCase = useCreateOrthodonticCase();

  const [showForm, setShowForm] = useState(false);
  const [applianceType, setApplianceType] = useState<OrthodonticApplianceType>('FIXED_METAL');
  const [startDate, setStartDate] = useState('');
  const [estimatedEndDate, setEstimatedEndDate] = useState('');
  const [totalAlignerSteps, setTotalAlignerSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  const resetForm = () => {
    setApplianceType('FIXED_METAL');
    setStartDate('');
    setEstimatedEndDate('');
    setTotalAlignerSteps('');
    setNotes('');
    setFormError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createCase.mutate(
      {
        patientId: params.id,
        applianceType,
        startDate,
        estimatedEndDate: estimatedEndDate || undefined,
        totalAlignerSteps:
          applianceType === 'ALIGNER' && totalAlignerSteps
            ? Number(totalAlignerSteps)
            : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          resetForm();
        },
        onError: (err) => {
          if (err instanceof ApiClientError && err.statusCode === 409) {
            setFormError(copy.activeCaseExists);
          } else {
            setFormError(copy.createFailed);
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-stone-200 bg-white">
        <p className="text-stone-500">{copy.loadFailed}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-stone-900">{copy.title}</h2>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            if (showForm) resetForm();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {copy.newCase}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">
                {copy.applianceType}
              </label>
              <select
                value={applianceType}
                onChange={(e) => setApplianceType(e.target.value as OrthodonticApplianceType)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 [color-scheme:light]"
              >
                {APPLIANCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {clinicalPtBR.orthodonticApplianceType[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">
                {copy.startDate}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">
                {copy.estimatedEndDate}
              </label>
              <input
                type="date"
                value={estimatedEndDate}
                onChange={(e) => setEstimatedEndDate(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              />
            </div>
            {applianceType === 'ALIGNER' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">
                  {copy.totalAlignerSteps}
                </label>
                <input
                  type="number"
                  min={1}
                  value={totalAlignerSteps}
                  onChange={(e) => setTotalAlignerSteps(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">{copy.notes}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              {ptBR.patientWorkflow.common.cancel}
            </button>
            <button
              type="submit"
              disabled={createCase.isPending}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {createCase.isPending ? copy.creating : copy.create}
            </button>
          </div>
        </form>
      )}

      {(!cases || cases.length === 0) && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-12">
          <Smile className="h-12 w-12 text-stone-300" />
          <h3 className="mt-4 text-lg font-semibold text-stone-900">{copy.empty}</h3>
          <p className="mt-1 text-sm text-stone-500">{copy.emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases?.map((c) => {
            const isExpanded = expandedCaseId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <button
                  onClick={() => setExpandedCaseId(isExpanded ? null : c.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <Smile className="h-5 w-5 text-teal-600" />
                    <div>
                      <h3 className="font-semibold text-stone-900">
                        {clinicalPtBR.orthodonticApplianceType[c.applianceType]}
                      </h3>
                      <p className="mt-0.5 text-sm text-stone-500">
                        {copy.since} {formatDate(c.startDate)}
                        {c.estimatedEndDate
                          ? ` · ${formatDate(c.estimatedEndDate)}`
                          : ` · ${copy.noEstimatedEndDate}`}
                        {c.totalAlignerSteps ? ` · ${c.totalAlignerSteps} ${copy.steps}` : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[c.status] || STATUS_STYLES.ACTIVE
                    }`}
                  >
                    {clinicalPtBR.orthodonticCaseStatus[c.status]}
                  </span>
                </button>
                {c.notes && <p className="mt-3 text-sm text-stone-500 italic">{c.notes}</p>}
                {isExpanded && (
                  <OrthodonticVisitTimeline caseId={c.id} applianceType={c.applianceType} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
