'use client';

import { useState, FormEvent } from 'react';
import { Wrench, Plus, X, CalendarClock, Receipt } from 'lucide-react';
import {
  useOrthodonticVisits,
  useCreateOrthodonticVisit,
  OrthodonticApplianceType,
} from '@/hooks/useOrthodontics';
import { ApiClientError } from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import { ptBR } from '@/i18n';

const copy = ptBR.patientWorkflow.orthodontics.visits;

interface OrthodonticVisitTimelineProps {
  caseId: string;
  applianceType: OrthodonticApplianceType;
}

export function OrthodonticVisitTimeline({ caseId, applianceType }: OrthodonticVisitTimelineProps) {
  const { data: visits, isLoading, isError } = useOrthodonticVisits(caseId);
  const createVisit = useCreateOrthodonticVisit(caseId);

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [wireChanged, setWireChanged] = useState(false);
  const [wireStrength, setWireStrength] = useState('');
  const [elasticsUsed, setElasticsUsed] = useState('');
  const [alignerStepNumber, setAlignerStepNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [cdtCode, setCdtCode] = useState('');
  const [fee, setFee] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setDate('');
    setWireChanged(false);
    setWireStrength('');
    setElasticsUsed('');
    setAlignerStepNumber('');
    setNotes('');
    setNextVisitDate('');
    setCdtCode('');
    setFee('');
    setFormError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createVisit.mutate(
      {
        date,
        wireChanged: wireChanged || undefined,
        wireStrength: wireStrength || undefined,
        elasticsUsed: elasticsUsed || undefined,
        alignerStepNumber:
          applianceType === 'ALIGNER' && alignerStepNumber
            ? Number(alignerStepNumber)
            : undefined,
        notes: notes || undefined,
        nextVisitDate: nextVisitDate || undefined,
        cdtCode: cdtCode || undefined,
        fee: fee ? Number(fee) : undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          resetForm();
        },
        onError: (err) => {
          setFormError(
            err instanceof ApiClientError ? err.message : copy.createFailed
          );
        },
      }
    );
  };

  return (
    <div className="mt-4 border-t border-stone-100 pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-stone-900">{copy.title}</h4>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            if (showForm) resetForm();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {copy.newVisit}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-3 space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">{copy.date}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">
                {copy.nextVisitDate}
              </label>
              <input
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">
                {copy.wireStrength}
              </label>
              <input
                type="text"
                value={wireStrength}
                onChange={(e) => setWireStrength(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500">
                {copy.elasticsUsed}
              </label>
              <input
                type="text"
                value={elasticsUsed}
                onChange={(e) => setElasticsUsed(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            {/* alignerStepNumber only makes sense for ALIGNER cases — the
                server rejects it as a 400 for any other applianceType
                (ORTHO-05), so it stays hidden rather than always-present. */}
            {applianceType === 'ALIGNER' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">
                  {copy.alignerStepNumber}
                </label>
                <input
                  type="number"
                  min={1}
                  value={alignerStepNumber}
                  onChange={(e) => setAlignerStepNumber(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={wireChanged}
                onChange={(e) => setWireChanged(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300"
              />
              {copy.wireChanged}
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500">
              {ptBR.patientWorkflow.common.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <fieldset className="rounded-lg border border-stone-200 bg-white p-3">
            <legend className="px-1 text-xs font-medium text-stone-500">{copy.billing}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">
                  {copy.cdtCode}
                </label>
                <input
                  type="text"
                  placeholder="D8670"
                  value={cdtCode}
                  onChange={(e) => setCdtCode(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">
                  {copy.fee}
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </fieldset>

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
              disabled={createVisit.isPending}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {createVisit.isPending ? copy.creating : copy.create}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="mt-3 space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-3 text-sm text-stone-500">{copy.loadFailed}</p>
      ) : !visits || visits.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-stone-200 p-6 text-center">
          <Wrench className="mx-auto h-6 w-6 text-stone-300" />
          <p className="mt-2 text-sm font-medium text-stone-700">{copy.empty}</p>
          <p className="text-xs text-stone-500">{copy.emptyDescription}</p>
        </div>
      ) : (
        // Visits arrive from GET .../visits already ordered by date desc
        // (ORTHO-06 / T9) — rendered in that order, newest first.
        <div className="mt-3 space-y-2 border-l-2 border-stone-200 pl-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-900">
                  {formatDate(visit.date)}
                </span>
                {visit.treatmentId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                    <Receipt className="h-3 w-3" />
                    {copy.billed}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                {visit.wireChanged && <span>{copy.wireChanged}</span>}
                {visit.wireStrength && <span>{copy.wireStrength}: {visit.wireStrength}</span>}
                {visit.elasticsUsed && <span>{copy.elasticsUsed}: {visit.elasticsUsed}</span>}
                {visit.alignerStepNumber != null && (
                  <span>{copy.alignerStepNumber}: {visit.alignerStepNumber}</span>
                )}
              </div>
              {visit.notes && (
                <p className="mt-1.5 text-sm text-stone-600 italic">{visit.notes}</p>
              )}
              {visit.nextVisitDate && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-700">
                  <CalendarClock className="h-3 w-3" />
                  {copy.nextVisit}: {formatDate(visit.nextVisitDate)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
