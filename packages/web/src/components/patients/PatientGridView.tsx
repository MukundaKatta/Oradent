'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MoreHorizontal,
  Eye,
  Pencil,
  CalendarPlus,
  ClipboardPlus,
} from 'lucide-react';
import type { Patient } from '@/hooks/usePatient';
import { formatDate, formatAge, formatPhone, getInitials } from '@/lib/formatters';

interface PatientGridViewProps {
  patients: Patient[];
  onSelect: (id: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-stone-100 text-stone-600',
  archived: 'bg-amber-100 text-amber-700',
};

export function PatientGridView({ patients, onSelect }: PatientGridViewProps) {
  const router = useRouter();
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  if (patients.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
        <User className="mx-auto h-12 w-12 text-stone-300" />
        <h3 className="mt-3 text-lg font-medium text-stone-700">
          No Patients Found
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {patients.map((patient) => (
        <div
          key={patient.id}
          onClick={() => onSelect(patient.id)}
          className="group relative cursor-pointer rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-teal-200 hover:shadow-md"
        >
          {/* Quick Actions */}
          <div className="absolute right-3 top-3">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionId(
                    openActionId === patient.id ? null : patient.id
                  );
                }}
                className="rounded p-1 text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-stone-100 hover:text-stone-600 transition-all"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {openActionId === patient.id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionId(null);
                    }}
                  />
                  <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(null);
                        router.push(`/patients/${patient.id}`);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(null);
                        router.push(`/patients/${patient.id}?edit=true`);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(null);
                        router.push(
                          `/schedule?new=true&patientId=${patient.id}`
                        );
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      New Appointment
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(null);
                        router.push(
                          `/clinical/treatment-plans?new=true&patientId=${patient.id}`
                        );
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    >
                      <ClipboardPlus className="h-4 w-4" />
                      New Treatment
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-lg font-semibold text-teal-700">
              {getInitials(`${patient.firstName} ${patient.lastName}`)}
            </div>
            <h3 className="mt-3 font-medium text-stone-900">
              {patient.firstName} {patient.lastName}
            </h3>
            <span
              className={`mt-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                STATUS_BADGE[patient.status] || 'bg-stone-100 text-stone-600'
              }`}
            >
              {patient.status}
            </span>
          </div>

          {/* Details */}
          <div className="mt-4 space-y-2 text-xs text-stone-500">
            {patient.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-stone-400" />
                <span>{formatPhone(patient.phone)}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-stone-400" />
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-stone-400">
                {formatAge(patient.dateOfBirth)}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-stone-400" />
                <span>{formatDate(patient.lastVisit)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
