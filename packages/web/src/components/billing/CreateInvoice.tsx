'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search, User, CheckSquare, Square } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { localizeErrorMessage } from '@/lib/errorMessages';
import { useCreateInvoice } from '@/hooks/useBilling';
import { useTreatments } from '@/hooks/useTreatments';
import { ptBR } from '@/i18n';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface CreateInvoiceProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  defaultPatientId?: string;
}

export function CreateInvoice({ open, onClose, onSave, defaultPatientId }: CreateInvoiceProps) {
  const copy = ptBR.patientWorkflow.profile.billing;
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<Set<string>>(new Set());
  const [discount, setDiscount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [insurancePortion, setInsurancePortion] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createInvoice = useCreateInvoice();
  const { data: treatments, isLoading: treatmentsLoading } = useTreatments(selectedPatient?.id);

  // Only treatments not already attached to another invoice can be billed —
  // matches what POST /api/billing/invoices' treatmentIds validation
  // actually checks server-side (patient + practice scope, not invoice
  // status), but re-billing an already-invoiced treatment would double-count
  // revenue, so it's filtered out of the picker entirely.
  const uninvoicedTreatments = useMemo(
    () => (treatments ?? []).filter((t) => !t.invoiceId),
    [treatments]
  );

  const subtotal = uninvoicedTreatments
    .filter((t) => selectedTreatmentIds.has(t.id))
    .reduce((sum, t) => sum + t.fee, 0);
  const total = subtotal - discount + taxAmount;

  // Auto-load patient when defaultPatientId is provided
  useEffect(() => {
    if (defaultPatientId && !selectedPatient) {
      apiGet<Patient>(`/api/patients/${defaultPatientId}`)
        .then((p) => {
          setSelectedPatient({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone });
        })
        .catch(() => {});
    }
  }, [defaultPatientId, selectedPatient]);

  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await apiGet<{ patients: Patient[] }>(`/api/patients?search=${encodeURIComponent(query)}`);
      setSearchResults(data.patients);
    } catch (err) {
      console.error('Failed to search patients:', err);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (patientSearch) searchPatients(patientSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch, searchPatients]);

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedTreatmentIds(new Set());
    setShowSearch(false);
    setPatientSearch('');
    setSearchResults([]);
  };

  const toggleTreatment = (id: string) => {
    setSelectedTreatmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedTreatmentIds((prev) =>
      prev.size === uninvoicedTreatments.length
        ? new Set()
        : new Set(uninvoicedTreatments.map((t) => t.id))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedPatient || selectedTreatmentIds.size === 0) return;

    try {
      await createInvoice.mutateAsync({
        patientId: selectedPatient.id,
        treatmentIds: Array.from(selectedTreatmentIds),
        subtotal,
        discount: discount || undefined,
        taxAmount: taxAmount || undefined,
        insurancePortion: insurancePortion || undefined,
        notes: notes || undefined,
        dueDate: dueDate || undefined,
      });
      onSave();
    } catch (err) {
      setError(localizeErrorMessage(err instanceof Error ? err.message : undefined, copy.createInvoiceFailed));
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-stone-900">
              {copy.newInvoice}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Patient */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">{copy.selectPatientPrompt}</label>
              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-stone-400" />
                    <span className="text-sm font-medium">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setSelectedTreatmentIds(new Set());
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700"
                  >
                    {copy.changePatient}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder={copy.searchPatients}
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowSearch(true);
                    }}
                    className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPatient(p)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50"
                        >
                          <User className="h-4 w-4 text-stone-400" />
                          {p.firstName} {p.lastName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Treatments to invoice */}
            {selectedPatient && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-stone-700">{copy.treatmentsToInvoice}</label>
                  {uninvoicedTreatments.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      {selectedTreatmentIds.size === uninvoicedTreatments.length ? (
                        <CheckSquare className="h-3.5 w-3.5" />
                      ) : (
                        <Square className="h-3.5 w-3.5" />
                      )}
                      {copy.selectAll}
                    </button>
                  )}
                </div>

                {treatmentsLoading ? (
                  <div className="h-16 animate-pulse rounded-lg bg-stone-100" />
                ) : uninvoicedTreatments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-stone-200 px-3 py-4 text-center text-sm text-stone-400">
                    {copy.noUninvoicedTreatments}
                  </div>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-stone-200 p-2">
                    {uninvoicedTreatments.map((t) => (
                      <label
                        key={t.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-stone-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTreatmentIds.has(t.id)}
                          onChange={() => toggleTreatment(t.id)}
                          className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="w-16 shrink-0 font-mono text-xs text-stone-500">{t.cdtCode}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-stone-700">
                          {t.description}
                          {t.toothNumber ? ` — #${t.toothNumber}` : ''}
                        </span>
                        <span className="shrink-0 text-xs text-stone-400">{formatDate(t.date)}</span>
                        <span className="w-20 shrink-0 text-right text-sm font-medium text-stone-900">
                          {formatCurrency(t.fee)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Amounts */}
            {selectedPatient && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">{copy.discount}</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">{copy.taxAmount}</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={taxAmount || ''}
                    onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">{copy.insurancePortion}</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={insurancePortion || ''}
                    onChange={(e) => setInsurancePortion(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            {selectedPatient && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">{copy.dueDate}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            )}

            {/* Total */}
            {selectedPatient && (
              <div className="flex items-center justify-between border-t border-stone-200 pt-3 text-sm">
                <span className="text-stone-500">{copy.subtotalLabel}: {formatCurrency(subtotal)}</span>
                <div className="text-right">
                  <span className="text-stone-500">{copy.total}: </span>
                  <span className="text-lg font-bold text-stone-900">{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedPatient && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">{ptBR.patientWorkflow.chart.clinicalNotes}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                {ptBR.patientWorkflow.common.cancel}
              </button>
              <button
                type="submit"
                disabled={!selectedPatient || selectedTreatmentIds.size === 0 || createInvoice.isPending}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {createInvoice.isPending ? copy.creating : copy.newInvoice}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
