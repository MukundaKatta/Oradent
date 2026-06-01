'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Merge,
  AlertTriangle,
  CheckCircle2,
  X,
  User,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  insurance: string;
  memberId: string;
  lastVisit: string;
  balance: number;
  notes: string;
  allergies: string;
  emergencyContact: string;
}

type PatientField = keyof Omit<PatientRecord, 'id'>;

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_PATIENTS: PatientRecord[] = [
  {
    id: 'p1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    dateOfBirth: '1985-03-15',
    email: 'sarah.johnson@email.com',
    phone: '(555) 234-5678',
    address: '456 Oak Avenue, Springfield, IL 62701',
    insurance: 'Delta Dental PPO',
    memberId: 'DD-98765432',
    lastVisit: '2025-11-20',
    balance: 125.0,
    notes: 'Prefers morning appointments. History of dental anxiety.',
    allergies: 'Penicillin',
    emergencyContact: 'Mark Johnson - (555) 234-9999',
  },
  {
    id: 'p2',
    firstName: 'Sara',
    lastName: 'Johnson',
    dateOfBirth: '1985-03-15',
    email: 'sjohnson85@gmail.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave, Springfield, IL 62701',
    insurance: 'Delta Dental PPO',
    memberId: 'DD-98765432',
    lastVisit: '2026-01-10',
    balance: 0,
    notes: 'New patient form submitted online.',
    allergies: 'Penicillin, Latex',
    emergencyContact: 'Mark Johnson - (555) 234-9999',
  },
  {
    id: 'p3',
    firstName: 'Michael',
    lastName: 'Chen',
    dateOfBirth: '1990-07-22',
    email: 'mchen@outlook.com',
    phone: '(555) 876-5432',
    address: '789 Elm Street, Springfield, IL 62702',
    insurance: 'Cigna DPPO',
    memberId: 'CG-11223344',
    lastVisit: '2025-12-05',
    balance: 450.0,
    notes: 'Ongoing treatment plan for implant #19.',
    allergies: 'None',
    emergencyContact: 'Wei Chen - (555) 876-1111',
  },
  {
    id: 'p4',
    firstName: 'Mike',
    lastName: 'Chen',
    dateOfBirth: '1990-07-22',
    email: 'michael.chen@email.com',
    phone: '(555) 876-5433',
    address: '789 Elm St, Springfield, IL 62702',
    insurance: 'Cigna DPPO',
    memberId: 'CG-11223344',
    lastVisit: '2026-02-14',
    balance: 75.0,
    notes: '',
    allergies: 'None known',
    emergencyContact: 'Wei Chen - (555) 876-1111',
  },
  {
    id: 'p5',
    firstName: 'Jennifer',
    lastName: 'Davis',
    dateOfBirth: '1978-11-30',
    email: 'jdavis@email.com',
    phone: '(555) 345-6789',
    address: '321 Pine Road, Springfield, IL 62703',
    insurance: 'MetLife PDP',
    memberId: 'ML-55667788',
    lastVisit: '2025-10-18',
    balance: 200.0,
    notes: 'Requires pre-medication before procedures.',
    allergies: 'Sulfa drugs',
    emergencyContact: 'Tom Davis - (555) 345-0000',
  },
];

const FIELD_LABELS: Record<PatientField, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  dateOfBirth: 'Date of Birth',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  insurance: 'Insurance',
  memberId: 'Member ID',
  lastVisit: 'Last Visit',
  balance: 'Balance',
  notes: 'Notes',
  allergies: 'Allergies',
  emergencyContact: 'Emergency Contact',
};

const MERGEABLE_FIELDS: PatientField[] = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'email',
  'phone',
  'address',
  'insurance',
  'memberId',
  'lastVisit',
  'balance',
  'notes',
  'allergies',
  'emergencyContact',
];

// ═══════════════════ MAIN PAGE ═══════════════════

export default function PatientMergePage() {
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [patientA, setPatientA] = useState<PatientRecord | null>(null);
  const [patientB, setPatientB] = useState<PatientRecord | null>(null);
  const [selections, setSelections] = useState<Record<PatientField, 'A' | 'B'>>(() => {
    const defaults = {} as Record<PatientField, 'A' | 'B'>;
    MERGEABLE_FIELDS.forEach((f) => (defaults[f] = 'A'));
    return defaults;
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [merged, setMerged] = useState(false);
  const [showDropdownA, setShowDropdownA] = useState(false);
  const [showDropdownB, setShowDropdownB] = useState(false);

  const filteredA = useMemo(
    () =>
      searchA.length > 0
        ? MOCK_PATIENTS.filter(
            (p) =>
              p.id !== patientB?.id &&
              (`${p.firstName} ${p.lastName}`.toLowerCase().includes(searchA.toLowerCase()) ||
                p.email.toLowerCase().includes(searchA.toLowerCase()))
          )
        : [],
    [searchA, patientB]
  );

  const filteredB = useMemo(
    () =>
      searchB.length > 0
        ? MOCK_PATIENTS.filter(
            (p) =>
              p.id !== patientA?.id &&
              (`${p.firstName} ${p.lastName}`.toLowerCase().includes(searchB.toLowerCase()) ||
                p.email.toLowerCase().includes(searchB.toLowerCase()))
          )
        : [],
    [searchB, patientA]
  );

  const mergedPreview = useMemo(() => {
    if (!patientA || !patientB) return null;
    const result = {} as Record<PatientField, string | number>;
    MERGEABLE_FIELDS.forEach((field) => {
      result[field] = selections[field] === 'A' ? patientA[field] : patientB[field];
    });
    return result;
  }, [patientA, patientB, selections]);

  const selectPatientA = (p: PatientRecord) => {
    setPatientA(p);
    setSearchA('');
    setShowDropdownA(false);
    setMerged(false);
  };

  const selectPatientB = (p: PatientRecord) => {
    setPatientB(p);
    setSearchB('');
    setShowDropdownB(false);
    setMerged(false);
  };

  const handleMerge = () => {
    setShowConfirm(false);
    setMerged(true);
  };

  const formatValue = (field: PatientField, value: string | number) => {
    if (field === 'balance') return `$${Number(value).toFixed(2)}`;
    return String(value) || '--';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Patient Merge Tool</h1>
        <p className="mt-1 text-sm text-stone-500">
          Search for two patient records to compare and merge into a single record.
        </p>
      </div>

      {/* Success Banner */}
      {merged && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-6 py-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Patients merged successfully</p>
            <p className="text-xs text-green-600">
              The duplicate record has been archived and all history has been consolidated.
            </p>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Patient A Search */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-stone-700">Primary Patient (Keep)</h3>
          {patientA ? (
            <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                  {patientA.firstName[0]}{patientA.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {patientA.firstName} {patientA.lastName}
                  </p>
                  <p className="text-xs text-stone-500">{patientA.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPatientA(null);
                  setMerged(false);
                }}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchA}
                onChange={(e) => {
                  setSearchA(e.target.value);
                  setShowDropdownA(true);
                }}
                onFocus={() => setShowDropdownA(true)}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-stone-300 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              {showDropdownA && filteredA.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdownA(false)} />
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                    {filteredA.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPatientA(p)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50"
                      >
                        <User className="h-4 w-4 text-stone-400" />
                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-stone-500">
                            DOB: {p.dateOfBirth} | {p.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Patient B Search */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-stone-700">Duplicate Patient (Merge In)</h3>
          {patientB ? (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-sm font-semibold text-white">
                  {patientB.firstName[0]}{patientB.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {patientB.firstName} {patientB.lastName}
                  </p>
                  <p className="text-xs text-stone-500">{patientB.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPatientB(null);
                  setMerged(false);
                }}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchB}
                onChange={(e) => {
                  setSearchB(e.target.value);
                  setShowDropdownB(true);
                }}
                onFocus={() => setShowDropdownB(true)}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-stone-300 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              {showDropdownB && filteredB.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdownB(false)} />
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                    {filteredB.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPatientB(p)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50"
                      >
                        <User className="h-4 w-4 text-stone-400" />
                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-stone-500">
                            DOB: {p.dateOfBirth} | {p.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      {patientA && patientB && !merged && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-stone-900">Field Comparison</h2>
            <p className="mt-1 text-sm text-stone-500">
              Select which value to keep for each field. Highlighted differences help identify
              conflicting data.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-6 py-3 text-left font-semibold text-stone-700">Field</th>
                  <th className="px-6 py-3 text-left font-semibold text-teal-700">
                    Primary (A)
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-amber-700">
                    Duplicate (B)
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-stone-700">Keep</th>
                </tr>
              </thead>
              <tbody>
                {MERGEABLE_FIELDS.map((field) => {
                  const valA = patientA[field];
                  const valB = patientB[field];
                  const isDifferent = String(valA) !== String(valB);
                  return (
                    <tr
                      key={field}
                      className={cn(
                        'border-b border-stone-100',
                        isDifferent ? 'bg-amber-50/40' : ''
                      )}
                    >
                      <td className="whitespace-nowrap px-6 py-3 font-medium text-stone-700">
                        {FIELD_LABELS[field]}
                        {isDifferent && (
                          <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            DIFFERS
                          </span>
                        )}
                      </td>
                      <td
                        className={cn(
                          'px-6 py-3',
                          selections[field] === 'A'
                            ? 'font-medium text-stone-900'
                            : 'text-stone-400'
                        )}
                      >
                        {formatValue(field, valA)}
                      </td>
                      <td
                        className={cn(
                          'px-6 py-3',
                          selections[field] === 'B'
                            ? 'font-medium text-stone-900'
                            : 'text-stone-400'
                        )}
                      >
                        {formatValue(field, valB)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <label className="flex cursor-pointer items-center gap-1">
                            <input
                              type="radio"
                              name={field}
                              checked={selections[field] === 'A'}
                              onChange={() =>
                                setSelections((prev) => ({ ...prev, [field]: 'A' }))
                              }
                              className="h-4 w-4 border-stone-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-xs text-stone-500">A</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-1">
                            <input
                              type="radio"
                              name={field}
                              checked={selections[field] === 'B'}
                              onChange={() =>
                                setSelections((prev) => ({ ...prev, [field]: 'B' }))
                              }
                              className="h-4 w-4 border-stone-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-xs text-stone-500">B</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Merge Preview */}
      {mergedPreview && !merged && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-stone-900">Merge Preview</h2>
            <p className="mt-1 text-sm text-stone-500">
              This is how the final merged patient record will look.
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MERGEABLE_FIELDS.map((field) => (
                <div key={field}>
                  <p className="text-xs font-medium text-stone-500">{FIELD_LABELS[field]}</p>
                  <p className="mt-0.5 text-sm font-medium text-stone-900">
                    {formatValue(field, mergedPreview[field])}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end border-t border-stone-100 pt-5">
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                <Merge className="h-4 w-4" />
                Merge Patients
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">Confirm Patient Merge</h3>
                  <p className="text-sm text-stone-500">This action cannot be easily undone.</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Warning:</span> Merging will combine all
                  appointment history, treatment records, billing, and documents from{' '}
                  <span className="font-semibold">
                    {patientB?.firstName} {patientB?.lastName}
                  </span>{' '}
                  into{' '}
                  <span className="font-semibold">
                    {patientA?.firstName} {patientA?.lastName}
                  </span>
                  . The duplicate record will be archived.
                </p>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMerge}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  <Merge className="h-4 w-4" />
                  Confirm Merge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
