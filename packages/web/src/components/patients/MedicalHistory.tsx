'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle,
  Pill,
  Stethoscope,
  Pencil,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

interface Allergy {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

interface MedicalHistoryData {
  allergies: Allergy[];
  medications: Medication[];
  conditions: string[];
  surgicalHistory: string[];
  lastUpdated: string;
}

interface MedicalHistoryProps {
  patientId: string;
  data: MedicalHistoryData;
  className?: string;
}

const SEVERITY_STYLES = {
  mild: 'bg-stone-100 text-stone-700',
  moderate: 'bg-amber-100 text-amber-700',
  severe: 'bg-red-100 text-red-700',
} as const;

export function MedicalHistory({ patientId, data, className }: MedicalHistoryProps) {
  const hasCriticalAllergies = data.allergies.some((a) => a.severity === 'severe');

  return (
    <div
      className={cn(
        'rounded-xl border border-stone-200 bg-white shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-stone-900">Medical History</h2>
          {hasCriticalAllergies && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" />
              Critical Allergies
            </span>
          )}
        </div>
        <Link
          href={`/patients/${patientId}/medical-history/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      </div>

      <div className="divide-y divide-stone-100 px-6">
        {/* Allergies */}
        <div className="py-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Allergies
          </h3>
          {data.allergies.length === 0 ? (
            <p className="text-sm text-stone-500">No known allergies (NKA)</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.allergies.map((allergy) => (
                <span
                  key={allergy.name}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                    SEVERITY_STYLES[allergy.severity]
                  )}
                >
                  {allergy.severity === 'severe' && (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {allergy.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Medications */}
        <div className="py-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-stone-900">
            <Pill className="h-4 w-4 text-blue-500" />
            Medications
          </h3>
          {data.medications.length === 0 ? (
            <p className="text-sm text-stone-500">No current medications</p>
          ) : (
            <ul className="space-y-1.5">
              {data.medications.map((med) => (
                <li key={med.name} className="text-sm text-stone-700">
                  <span className="font-medium">{med.name}</span>
                  <span className="text-stone-500">
                    {' '}
                    &mdash; {med.dosage}, {med.frequency}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Conditions */}
        <div className="py-4">
          <h3 className="mb-2 text-sm font-semibold text-stone-900">Conditions</h3>
          {data.conditions.length === 0 ? (
            <p className="text-sm text-stone-500">No known conditions</p>
          ) : (
            <ul className="space-y-1">
              {data.conditions.map((condition) => (
                <li
                  key={condition}
                  className="flex items-center gap-2 text-sm text-stone-700"
                >
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {condition}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Surgical History */}
        <div className="py-4">
          <h3 className="mb-2 text-sm font-semibold text-stone-900">Surgical History</h3>
          {data.surgicalHistory.length === 0 ? (
            <p className="text-sm text-stone-500">No surgical history</p>
          ) : (
            <ul className="space-y-1">
              {data.surgicalHistory.map((surgery) => (
                <li
                  key={surgery}
                  className="text-sm text-stone-700"
                >
                  &bull; {surgery}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 border-t border-stone-100 px-6 py-3">
        <Clock className="h-3.5 w-3.5 text-stone-400" />
        <span className="text-xs text-stone-500">
          Last updated: {formatDate(data.lastUpdated)}
        </span>
      </div>
    </div>
  );
}
