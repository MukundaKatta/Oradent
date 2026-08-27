'use client';

import { UserPlus, Phone, Mail, Calendar } from 'lucide-react';
import type { Patient } from '@/hooks/usePatient';
import { formatDate, formatAge, formatPhone, getInitials } from "@/lib/formatters";
import { ptBR } from "@/i18n";

interface PatientListProps {
  patients: Patient[];
  onSelect: (id: string) => void;
  onNewPatient?: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  INACTIVE: 'bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300',
  ARCHIVED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

export function PatientList({ patients, onSelect, onNewPatient }: PatientListProps) {
  if (patients.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 dark:bg-white/5">
          <UserPlus className="h-5 w-5 text-stone-400 dark:text-stone-500" strokeWidth={1.75} />
        </div>
        <h3 className="text-base font-medium text-stone-700 dark:text-stone-200">
          {ptBR.patientWorkflow.list.noPatients}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {ptBR.patientWorkflow.list.adjustFilters}
        </p>
        {onNewPatient && (
          <button
            onClick={onNewPatient}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-apple-sm transition-all hover:bg-teal-700 active:scale-[0.97]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {ptBR.patientWorkflow.list.newPatient}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 dark:border-white/10">
            <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">
              {ptBR.patientWorkflow.common.patient}
            </th>
            <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">
              {ptBR.patientWorkflow.list.contact}
            </th>
            <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">
              {ptBR.patientWorkflow.list.age}
            </th>
            <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">
              {ptBR.patientWorkflow.list.lastVisit}
            </th>
            <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">
              {ptBR.patientWorkflow.common.status}
            </th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr
              key={patient.id}
              onClick={() => onSelect(patient.id)}
              className="cursor-pointer border-b border-stone-100 dark:border-white/5 transition-colors hover:bg-stone-900/[0.03] dark:hover:bg-white/5"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/15 text-sm font-semibold text-teal-700 dark:text-teal-300">
                    {getInitials(`${patient.firstName} ${patient.lastName}`)}
                  </div>
                  <div>
                    <div className="font-medium text-stone-900 dark:text-stone-100">
                      {patient.firstName} {patient.lastName}
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                        <Mail className="h-3 w-3" />
                        {patient.email}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-stone-600 dark:text-stone-300">
                  <Phone className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />
                  {formatPhone(patient.phone)}
                </div>
              </td>
              <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                {formatAge(patient.dateOfBirth)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-stone-600 dark:text-stone-300">
                  <Calendar className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />
                  {formatDate(patient.lastVisit)}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    STATUS_BADGE[patient.status] || 'bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300'
                  }`}
                >
                  {ptBR.patient.status[patient.status.toUpperCase() as keyof typeof ptBR.patient.status] ?? patient.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
