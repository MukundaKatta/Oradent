'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Phone,
  Mail,
  Shield,
  Calendar,
  FileText,
  Image,
  DollarSign,
  ClipboardList,
  Activity,
  AlertTriangle,
  Pill,
  HeartPulse,
  Clock,
  ChevronRight,
  Edit,
  CheckCircle2,
  XCircle,
  FileCheck,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { usePatient } from '@/hooks/usePatient';
import type { Patient } from '@/hooks/usePatient';
import {
  formatDate,
  formatAge,
  formatPhone,
  formatCurrency,
  formatPatientName,
  getInitials,
  formatRelativeDate,
} from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/StatusBadge';

// ─── Local API response types ───────────────────────────────────

interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  status: string;
  lastVisit: string | null;
  nextAppointment: string | null;
  medicalHistory: {
    allergies: string[];
    conditions: string[];
    medications: string[];
  } | null;
  insurancePrimary: {
    company: string;
    memberId: string;
    remainingBenefit: number | null;
  } | null;
  _count: { appointments: number; treatments: number };
  upcomingAppointments: {
    id: string;
    startTime: string;
    type: string;
    status: string;
  }[];
  outstandingBalance: number;
  alerts: {
    hasAllergies: boolean;
    hasMedicalConditions: boolean;
    hasOverdueBalance: boolean;
    needsRecall: boolean;
  };
}

interface TreatmentPlan {
  id: string;
  name: string;
  status: string;
  totalFee: number;
  insuranceEst: number;
  patientEst: number;
  presentedAt: string | null;
  acceptedAt: string | null;
  notes: string | null;
  createdAt: string;
  items: TreatmentPlanItem[];
}

interface TreatmentPlanItem {
  id: string;
  cdtCode: string;
  description: string;
  toothNumber: number | null;
  surfaces: string[];
  fee: number;
  insurancePays: number;
  patientPays: number;
  priority: number;
  status: string;
  sortOrder: number;
}

interface Treatment {
  id: string;
  date: string;
  toothNumber: number | null;
  surfaces: string[];
  cdtCode: string;
  description: string;
  diagnosisCodes: string[];
  fee: number;
  notes: string | null;
  status: string;
  provider?: { id: string; name: string; title: string };
}

interface ClinicalNote {
  id: string;
  date: string;
  type: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  vitals: Record<string, unknown> | null;
  aiAssisted: boolean;
  signedAt: string | null;
  provider?: { id: string; name: string; title: string };
}

interface LedgerInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  insurancePortion: number;
  patientPortion: number;
  status: string;
  treatments: { cdtCode: string; description: string; fee: number }[];
  payments: { id: string; amount: number; method: string; date: string }[];
}

interface LedgerResponse {
  invoices: LedgerInvoice[];
  summary: { totalCharges: number; totalPayments: number; balance: number };
  pagination: { page: number; limit: number; total: number; pages: number };
}

// ─── Tab definitions ────────────────────────────────────────────

type TabKey = 'overview' | 'treatments' | 'notes' | 'billing' | 'imaging';

const TABS: { key: TabKey; label: string; icon: typeof Activity }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'treatments', label: 'Treatments', icon: ClipboardList },
  { key: 'notes', label: 'Clinical Notes', icon: FileText },
  { key: 'billing', label: 'Billing', icon: DollarSign },
  { key: 'imaging', label: 'Imaging', icon: Image },
];

// ─── Page component ─────────────────────────────────────────────

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const { data: patient, isLoading: patientLoading } = usePatient(patientId);

  const { data: summary } = useQuery<PatientSummary>({
    queryKey: ['patient-summary', patientId],
    queryFn: () => apiGet<PatientSummary>(`/api/patients/${patientId}/summary`),
    enabled: !!patientId,
  });

  // ── Loading state ───────────────────────────────────────────
  if (patientLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-xl bg-stone-200" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-stone-200" />
      </div>
    );
  }

  // ── Not-found state ─────────────────────────────────────────
  if (!patient) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-stone-200 bg-white">
        <div className="text-center">
          <User className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-2 text-stone-500">Patient not found.</p>
          <Link href="/patients" className="mt-3 inline-block text-sm font-medium text-teal-600 hover:text-teal-700">
            Back to patients
          </Link>
        </div>
      </div>
    );
  }

  const fullName = formatPatientName(patient.firstName, patient.lastName);

  return (
    <div className="space-y-6">
      {/* ═══════════ Patient Header ═══════════ */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700">
            {getInitials(fullName)}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-stone-900">{fullName}</h1>
              <StatusBadge status={patient.status} />
              <Link
                href={`/patients/${patientId}/edit`}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Link>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                DOB: {formatDate(patient.dateOfBirth)} ({formatAge(patient.dateOfBirth)})
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {formatPhone(patient.phone)}
              </span>
              {patient.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {patient.email}
                </span>
              )}
              {patient.insuranceCompany && (
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {patient.insuranceCompany}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════ Tab Navigation ═══════════ */}
        <div className="mt-6 flex gap-1 border-t border-stone-100 pt-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════ Tab Content ═══════════ */}
      {activeTab === 'overview' && (
        <OverviewTab patientId={patientId} patient={patient} summary={summary ?? null} />
      )}
      {activeTab === 'treatments' && <TreatmentsTab patientId={patientId} />}
      {activeTab === 'notes' && <ClinicalNotesTab patientId={patientId} />}
      {activeTab === 'billing' && <BillingTab patientId={patientId} />}
      {activeTab === 'imaging' && <ImagingTab patientId={patientId} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Overview Tab
// ═══════════════════════════════════════════════════════════════

function OverviewTab({
  patientId,
  patient,
  summary,
}: {
  patientId: string;
  patient: Patient;
  summary: PatientSummary | null;
}) {
  const { data: treatments } = useQuery<Treatment[]>({
    queryKey: ['treatments', patientId],
    queryFn: () => apiGet<Treatment[]>(`/api/treatments/${patientId}`),
    enabled: !!patientId,
  });

  const recentTreatments = (treatments ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Visits"
          value={String(summary?._count?.appointments ?? 0)}
          icon={<Calendar className="h-5 w-5 text-teal-600" />}
        />
        <StatCard
          label="Next Appointment"
          value={
            summary?.upcomingAppointments?.[0]
              ? formatDate(summary.upcomingAppointments[0].startTime)
              : 'None scheduled'
          }
          icon={<Clock className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(summary?.outstandingBalance ?? 0)}
          icon={<DollarSign className="h-5 w-5 text-amber-600" />}
          highlight={!!summary?.alerts?.hasOverdueBalance}
        />
        <StatCard
          label="Last Visit"
          value={patient.lastVisit ? formatDate(patient.lastVisit) : 'N/A'}
          icon={<Activity className="h-5 w-5 text-stone-500" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Medical Alerts */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Medical Alerts
          </h3>

          <div className="mt-4 space-y-4">
            {/* Allergies */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                <AlertTriangle className="h-3 w-3" />
                Allergies
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(summary?.medicalHistory?.allergies ?? patient.allergies ?? []).length > 0 ? (
                  (summary?.medicalHistory?.allergies ?? patient.allergies).map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400">None recorded</span>
                )}
              </div>
            </div>

            {/* Medications */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                <Pill className="h-3 w-3" />
                Medications
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(summary?.medicalHistory?.medications ?? patient.medications ?? []).length > 0 ? (
                  (summary?.medicalHistory?.medications ?? patient.medications).map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                    >
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400">None recorded</span>
                )}
              </div>
            </div>

            {/* Conditions */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                <HeartPulse className="h-3 w-3" />
                Conditions
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(summary?.medicalHistory?.conditions ?? patient.conditions ?? []).length > 0 ? (
                  (summary?.medicalHistory?.conditions ?? patient.conditions).map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Treatments Timeline */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <ClipboardList className="h-4 w-4 text-teal-600" />
            Recent Treatments
          </h3>

          {recentTreatments.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentTreatments.map((tx) => (
                <div key={tx.id} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-700 truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>{formatDate(tx.date)}</span>
                      <span className="text-stone-300">|</span>
                      <span>{tx.cdtCode}</span>
                      {tx.toothNumber && (
                        <>
                          <span className="text-stone-300">|</span>
                          <span>#{tx.toothNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-stone-600">
                    {formatCurrency(tx.fee)}
                  </span>
                </div>
              ))}
              {(treatments ?? []).length > 5 && (
                <button
                  onClick={() => {/* handled by switching tab */}}
                  className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                >
                  View all treatments
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-400">No treatments on file</p>
          )}
        </div>

        {/* Insurance Info Card */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <Shield className="h-4 w-4 text-blue-600" />
            Insurance
          </h3>

          {summary?.insurancePrimary || patient.insuranceCompany ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-stone-500">Carrier</p>
                <p className="text-sm font-medium text-stone-800">
                  {summary?.insurancePrimary?.company ?? patient.insuranceCompany}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Member ID</p>
                <p className="text-sm font-medium text-stone-800">
                  {summary?.insurancePrimary?.memberId ?? patient.memberId ?? 'N/A'}
                </p>
              </div>
              {summary?.insurancePrimary?.remainingBenefit != null && (
                <div>
                  <p className="text-xs text-stone-500">Remaining Benefit</p>
                  <p className="text-sm font-medium text-stone-800">
                    {formatCurrency(summary.insurancePrimary.remainingBenefit)}
                  </p>
                </div>
              )}
              {patient.groupNumber && (
                <div>
                  <p className="text-xs text-stone-500">Group #</p>
                  <p className="text-sm font-medium text-stone-800">{patient.groupNumber}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-400">No insurance on file</p>
          )}
        </div>
      </div>

      {/* Upcoming Appointments */}
      {summary?.upcomingAppointments && summary.upcomingAppointments.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <Calendar className="h-4 w-4 text-blue-600" />
            Upcoming Appointments
          </h3>
          <div className="mt-4 divide-y divide-stone-100">
            {summary.upcomingAppointments.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-700">{appt.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-stone-500">{formatDate(appt.startTime)}</p>
                  </div>
                </div>
                <StatusBadge status={appt.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Treatments Tab
// ═══════════════════════════════════════════════════════════════

function TreatmentsTab({ patientId }: { patientId: string }) {
  const { data: plans, isLoading: plansLoading } = useQuery<TreatmentPlan[]>({
    queryKey: ['treatment-plans', patientId],
    queryFn: () => apiGet<TreatmentPlan[]>(`/api/treatments/plans/${patientId}`),
    enabled: !!patientId,
  });

  const { data: treatments, isLoading: txLoading } = useQuery<Treatment[]>({
    queryKey: ['treatments', patientId],
    queryFn: () => apiGet<Treatment[]>(`/api/treatments/${patientId}`),
    enabled: !!patientId,
  });

  const isLoading = plansLoading || txLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  const activePlans = (plans ?? []).filter(
    (p) => !['COMPLETED', 'DECLINED'].includes(p.status)
  );
  const completedPlans = (plans ?? []).filter((p) => p.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Active Treatment Plans */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h3 className="text-base font-semibold text-stone-900">
            Active Treatment Plans
          </h3>
          <p className="text-xs text-stone-500">{activePlans.length} active plan{activePlans.length !== 1 ? 's' : ''}</p>
        </div>

        {activePlans.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {activePlans.map((plan) => (
              <div key={plan.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-stone-800">{plan.name}</h4>
                      <StatusBadge status={plan.status} />
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      Created {formatDate(plan.createdAt)}
                      {plan.presentedAt && ` · Presented ${formatDate(plan.presentedAt)}`}
                      {plan.acceptedAt && ` · Accepted ${formatDate(plan.acceptedAt)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-stone-900">{formatCurrency(plan.totalFee)}</p>
                    <p className="text-xs text-stone-500">
                      Ins: {formatCurrency(plan.insuranceEst)} | Pt: {formatCurrency(plan.patientEst)}
                    </p>
                  </div>
                </div>

                {/* Plan items */}
                <div className="mt-4 rounded-lg border border-stone-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-stone-50 text-left text-xs font-medium text-stone-500">
                        <th className="px-4 py-2">CDT</th>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2">Tooth</th>
                        <th className="px-4 py-2 text-right">Fee</th>
                        <th className="px-4 py-2 text-right">Ins Pays</th>
                        <th className="px-4 py-2 text-right">Pt Pays</th>
                        <th className="px-4 py-2 text-center">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {plan.items.map((item) => (
                        <tr key={item.id} className="text-stone-700">
                          <td className="px-4 py-2 font-mono text-xs">{item.cdtCode}</td>
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2">{item.toothNumber ? `#${item.toothNumber}` : '—'}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.fee)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.insurancePays)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.patientPays)}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                              item.priority === 1 ? 'bg-red-100 text-red-700' :
                              item.priority === 2 ? 'bg-amber-100 text-amber-700' :
                              'bg-stone-100 text-stone-600'
                            }`}>
                              {item.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-stone-300" />
            <p className="mt-2 text-sm text-stone-400">No active treatment plans</p>
          </div>
        )}
      </div>

      {/* Treatment History */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h3 className="text-base font-semibold text-stone-900">Treatment History</h3>
          <p className="text-xs text-stone-500">{(treatments ?? []).length} total treatment{(treatments ?? []).length !== 1 ? 's' : ''}</p>
        </div>

        {(treatments ?? []).length > 0 ? (
          <div className="divide-y divide-stone-100">
            {(treatments ?? []).map((tx) => (
              <div key={tx.id} className="flex items-start gap-4 px-6 py-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{tx.description}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                        <span>{formatDate(tx.date)}</span>
                        <span className="text-stone-300">|</span>
                        <span className="font-mono">{tx.cdtCode}</span>
                        {tx.toothNumber && (
                          <>
                            <span className="text-stone-300">|</span>
                            <span>Tooth #{tx.toothNumber}</span>
                          </>
                        )}
                        {tx.surfaces.length > 0 && (
                          <>
                            <span className="text-stone-300">|</span>
                            <span>{tx.surfaces.join(', ')}</span>
                          </>
                        )}
                      </div>
                      {tx.provider && (
                        <p className="mt-0.5 text-xs text-stone-400">
                          {tx.provider.title} {tx.provider.name}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-stone-700">{formatCurrency(tx.fee)}</p>
                      <StatusBadge status={tx.status} className="mt-1" />
                    </div>
                  </div>
                  {tx.notes && (
                    <p className="mt-1.5 text-xs text-stone-500 italic">{tx.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <Activity className="mx-auto h-8 w-8 text-stone-300" />
            <p className="mt-2 text-sm text-stone-400">No treatments recorded</p>
          </div>
        )}
      </div>

      {/* Completed Plans */}
      {completedPlans.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <h3 className="text-base font-semibold text-stone-900">Completed Plans</h3>
          </div>
          <div className="divide-y divide-stone-100">
            {completedPlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-stone-700">{plan.name}</p>
                  <p className="text-xs text-stone-500">{formatDate(plan.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-stone-700">{formatCurrency(plan.totalFee)}</p>
                  <StatusBadge status="completed" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Clinical Notes Tab
// ═══════════════════════════════════════════════════════════════

function ClinicalNotesTab({ patientId }: { patientId: string }) {
  const { data: notes, isLoading } = useQuery<ClinicalNote[]>({
    queryKey: ['clinical-notes', patientId],
    queryFn: () => apiGet<ClinicalNote[]>(`/api/treatments/${patientId}/notes`),
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 px-6 py-4">
        <h3 className="text-base font-semibold text-stone-900">Clinical Notes</h3>
        <p className="text-xs text-stone-500">{(notes ?? []).length} note{(notes ?? []).length !== 1 ? 's' : ''}</p>
      </div>

      {(notes ?? []).length > 0 ? (
        <div className="divide-y divide-stone-100">
          {(notes ?? []).map((note) => (
            <div key={note.id} className="px-6 py-5">
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100">
                    <FileText className="h-4 w-4 text-stone-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-800 capitalize">
                        {note.type.replace(/_/g, ' ')} Note
                      </p>
                      {note.aiAssisted && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600">
                          AI-Assisted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500">
                      {formatDate(note.date)}
                      {note.provider && ` · ${note.provider.title} ${note.provider.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {note.signedAt ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Signed {formatDate(note.signedAt)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      <XCircle className="h-3 w-3" />
                      Unsigned
                    </span>
                  )}
                </div>
              </div>

              {/* SOAP content */}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {note.subjective && (
                  <div className="rounded-lg bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Subjective</p>
                    <p className="mt-1 text-sm text-stone-700">{note.subjective}</p>
                  </div>
                )}
                {note.objective && (
                  <div className="rounded-lg bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Objective</p>
                    <p className="mt-1 text-sm text-stone-700">{note.objective}</p>
                  </div>
                )}
                {note.assessment && (
                  <div className="rounded-lg bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Assessment</p>
                    <p className="mt-1 text-sm text-stone-700">{note.assessment}</p>
                  </div>
                )}
                {note.plan && (
                  <div className="rounded-lg bg-stone-50 p-3">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Plan</p>
                    <p className="mt-1 text-sm text-stone-700">{note.plan}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-stone-300" />
          <p className="mt-2 text-sm text-stone-400">No clinical notes on file</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Billing Tab
// ═══════════════════════════════════════════════════════════════

function BillingTab({ patientId }: { patientId: string }) {
  const { data: ledger, isLoading } = useQuery<LedgerResponse>({
    queryKey: ['ledger', patientId],
    queryFn: () => apiGet<LedgerResponse>(`/api/billing/ledger/${patientId}`),
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-xl bg-stone-200" />
        <div className="h-64 animate-pulse rounded-xl bg-stone-200" />
      </div>
    );
  }

  const summary = ledger?.summary ?? { totalCharges: 0, totalPayments: 0, balance: 0 };

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Charges"
          value={formatCurrency(summary.totalCharges)}
          icon={<DollarSign className="h-5 w-5 text-stone-500" />}
        />
        <StatCard
          label="Total Payments"
          value={formatCurrency(summary.totalPayments)}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(summary.balance)}
          icon={<DollarSign className="h-5 w-5 text-amber-600" />}
          highlight={summary.balance > 0}
        />
      </div>

      {/* Invoice List */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h3 className="text-base font-semibold text-stone-900">Invoices</h3>
          <p className="text-xs text-stone-500">{ledger?.pagination.total ?? 0} total</p>
        </div>

        {(ledger?.invoices ?? []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium text-stone-500">
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">Insurance</th>
                  <th className="px-6 py-3 text-right">Patient</th>
                  <th className="px-6 py-3 text-right">Paid</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {(ledger?.invoices ?? []).map((inv) => {
                  const totalPaid = inv.payments.reduce((s, p) => s + p.amount, 0);
                  return (
                    <tr key={inv.id} className="text-stone-700 hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                      <td className="px-6 py-3">{formatDate(inv.date)}</td>
                      <td className="px-6 py-3">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(inv.insurancePortion)}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(inv.patientPortion)}</td>
                      <td className="px-6 py-3 text-right">{formatCurrency(totalPaid)}</td>
                      <td className="px-6 py-3 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <DollarSign className="mx-auto h-8 w-8 text-stone-300" />
            <p className="mt-2 text-sm text-stone-400">No invoices on file</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Imaging Tab (placeholder)
// ═══════════════════════════════════════════════════════════════

function ImagingTab({ patientId }: { patientId: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 px-6 py-4">
        <h3 className="text-base font-semibold text-stone-900">Imaging</h3>
      </div>
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <Image className="h-10 w-10 text-stone-300" />
        <p className="mt-3 text-sm font-medium text-stone-500">Patient Imaging</p>
        <p className="mt-1 text-xs text-stone-400">
          View radiographs, intraoral photos, and AI analyses.
        </p>
        <Link
          href={`/patients/${patientId}/imaging`}
          className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          Open Imaging Module
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared helper components
// ═══════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-50">
          {icon}
        </div>
        <div>
          <p className="text-xs text-stone-500">{label}</p>
          <p
            className={`text-lg font-bold ${
              highlight ? 'text-amber-600' : 'text-stone-900'
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
