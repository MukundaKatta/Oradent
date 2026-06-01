'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Save,
  Loader2,
  X,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useDebounce } from '@/hooks/useDebounce';

// ═══════════════════ TYPES ═══════════════════

interface PatientInsurance {
  id: string;
  patientId: string;
  patientName: string;
  dateOfBirth: string;
  insuranceCompany: string;
  planName: string | null;
  groupNumber: string | null;
  memberId: string;
  subscriberName: string;
  relationship: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  annualMax: number | null;
  remainingBenefit: number | null;
  deductible: number | null;
  deductibleMet: number | null;
  coveragePreventive: number;
  coverageBasic: number;
  coverageMajor: number;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'EXPIRED' | 'NOT_VERIFIED';
  lastVerifiedAt: string | null;
  verifiedBy: string | null;
  notes: string | null;
}

interface PatientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
}

// ═══════════════════ SCHEMA ═══════════════════

const verificationSchema = z.object({
  insuranceCompany: z.string().min(1, 'Insurance company is required'),
  planName: z.string().optional(),
  groupNumber: z.string().optional(),
  memberId: z.string().min(1, 'Member ID is required'),
  subscriberName: z.string().min(1, 'Subscriber name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  annualMax: z.coerce.number().min(0).optional(),
  remainingBenefit: z.coerce.number().min(0).optional(),
  deductible: z.coerce.number().min(0).optional(),
  deductibleMet: z.coerce.number().min(0).optional(),
  coveragePreventive: z.coerce.number().min(0).max(100),
  coverageBasic: z.coerce.number().min(0).max(100),
  coverageMajor: z.coerce.number().min(0).max(100),
  notes: z.string().optional(),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

// ═══════════════════ STATUS CONFIG ═══════════════════

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  VERIFIED: { label: 'Verified', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  EXPIRED: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  NOT_VERIFIED: { label: 'Not Verified', color: 'bg-stone-100 text-stone-600 border-stone-200', icon: Shield },
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function InsuranceVerificationPage() {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const debouncedSearch = useDebounce(patientSearch, 300);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['patient-search', debouncedSearch],
    queryFn: () =>
      apiGet<{ data: PatientSearchResult[] }>(`/api/patients?search=${encodeURIComponent(debouncedSearch)}&limit=10`),
    enabled: debouncedSearch.length >= 2,
  });

  const { data: insuranceData, isLoading: isLoadingInsurance } = useQuery({
    queryKey: ['patient-insurance', selectedPatientId],
    queryFn: () => apiGet<PatientInsurance>(`/api/patients/${selectedPatientId}/insurance`),
    enabled: !!selectedPatientId,
  });

  const verifyMutation = useMutation({
    mutationFn: (data: VerificationFormData) =>
      apiPost(`/api/patients/${selectedPatientId}/insurance/verify`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-insurance', selectedPatientId] });
      setShowVerifyForm(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    values: insuranceData
      ? {
          insuranceCompany: insuranceData.insuranceCompany,
          planName: insuranceData.planName ?? undefined,
          groupNumber: insuranceData.groupNumber ?? undefined,
          memberId: insuranceData.memberId,
          subscriberName: insuranceData.subscriberName,
          relationship: insuranceData.relationship,
          effectiveDate: insuranceData.effectiveDate ?? undefined,
          expirationDate: insuranceData.expirationDate ?? undefined,
          annualMax: insuranceData.annualMax ?? undefined,
          remainingBenefit: insuranceData.remainingBenefit ?? undefined,
          deductible: insuranceData.deductible ?? undefined,
          deductibleMet: insuranceData.deductibleMet ?? undefined,
          coveragePreventive: insuranceData.coveragePreventive,
          coverageBasic: insuranceData.coverageBasic,
          coverageMajor: insuranceData.coverageMajor,
          notes: insuranceData.notes ?? undefined,
        }
      : undefined,
  });

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
      'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
      hasError ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Insurance Verification</h1>
        <p className="mt-1 text-sm text-stone-500">
          Verify patient insurance eligibility and benefits
        </p>
      </div>

      {/* Patient Search */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-stone-700">Search Patient</label>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => {
              setPatientSearch(e.target.value);
              if (!e.target.value) setSelectedPatientId(null);
            }}
            placeholder="Search by patient name..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-stone-400" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {debouncedSearch.length >= 2 && searchResults?.data && searchResults.data.length > 0 && !selectedPatientId && (
          <div className="mt-2 max-w-md rounded-lg border border-stone-200 bg-white shadow-lg">
            {searchResults.data.map((patient) => (
              <button
                key={patient.id}
                onClick={() => {
                  setSelectedPatientId(patient.id);
                  setPatientSearch(`${patient.firstName} ${patient.lastName}`);
                  setShowVerifyForm(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-stone-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-stone-900">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-stone-500">
                    DOB: {formatDate(patient.dateOfBirth)} | {patient.phone}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Insurance Details */}
      {selectedPatientId && (
        <>
          {isLoadingInsurance ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-stone-100" />
                ))}
              </div>
            </div>
          ) : insuranceData ? (
            <>
              {/* Status & Actions */}
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {(() => {
                    const statusConf = STATUS_CONFIG[insuranceData.verificationStatus] ?? STATUS_CONFIG.NOT_VERIFIED;
                    const StatusIcon = statusConf.icon;
                    return (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
                          statusConf.color
                        )}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {statusConf.label}
                      </span>
                    );
                  })()}
                  {insuranceData.lastVerifiedAt && (
                    <span className="text-sm text-stone-500">
                      Last verified: {formatDate(insuranceData.lastVerifiedAt)}
                      {insuranceData.verifiedBy && ` by ${insuranceData.verifiedBy}`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowVerifyForm(!showVerifyForm);
                    if (!showVerifyForm) reset();
                  }}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  {showVerifyForm ? 'Cancel' : 'Verify / Update'}
                </button>
              </div>

              {/* Current Insurance Info */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-800">
                    <Shield className="h-4 w-4 text-teal-600" />
                    Insurance Information
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Company</dt>
                      <dd className="font-medium text-stone-900">{insuranceData.insuranceCompany}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Plan</dt>
                      <dd className="font-medium text-stone-900">{insuranceData.planName ?? 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Group #</dt>
                      <dd className="font-medium text-stone-900">{insuranceData.groupNumber ?? 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Member ID</dt>
                      <dd className="font-medium text-stone-900">{insuranceData.memberId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Subscriber</dt>
                      <dd className="font-medium text-stone-900">{insuranceData.subscriberName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Relationship</dt>
                      <dd className="font-medium text-stone-900 capitalize">{insuranceData.relationship}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Effective Date</dt>
                      <dd className="font-medium text-stone-900">{formatDate(insuranceData.effectiveDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Expiration Date</dt>
                      <dd className="font-medium text-stone-900">{formatDate(insuranceData.expirationDate)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-800">
                    <DollarSign className="h-4 w-4 text-teal-600" />
                    Benefits Summary
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Annual Maximum</dt>
                      <dd className="font-medium text-stone-900">
                        {insuranceData.annualMax !== null ? formatCurrency(insuranceData.annualMax) : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Remaining Benefit</dt>
                      <dd className="font-medium text-teal-700">
                        {insuranceData.remainingBenefit !== null
                          ? formatCurrency(insuranceData.remainingBenefit)
                          : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Deductible</dt>
                      <dd className="font-medium text-stone-900">
                        {insuranceData.deductible !== null ? formatCurrency(insuranceData.deductible) : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Deductible Met</dt>
                      <dd className="font-medium text-stone-900">
                        {insuranceData.deductibleMet !== null ? formatCurrency(insuranceData.deductibleMet) : 'N/A'}
                      </dd>
                    </div>
                    <div className="border-t border-stone-200 pt-3">
                      <p className="mb-2 text-xs font-medium text-stone-500 uppercase tracking-wide">Coverage Levels</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-600">Preventive</span>
                          <span className="font-semibold text-stone-900">{insuranceData.coveragePreventive}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-600">Basic</span>
                          <span className="font-semibold text-stone-900">{insuranceData.coverageBasic}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-600">Major</span>
                          <span className="font-semibold text-stone-900">{insuranceData.coverageMajor}%</span>
                        </div>
                      </div>
                    </div>
                  </dl>
                </div>
              </div>

              {insuranceData.notes && (
                <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  <span className="font-medium">Notes: </span>{insuranceData.notes}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white py-12 text-center shadow-sm">
              <Shield className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No Insurance on File</h3>
              <p className="mt-1 text-xs text-stone-500">
                This patient does not have insurance information recorded.
              </p>
              <button
                onClick={() => setShowVerifyForm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Add Insurance
              </button>
            </div>
          )}

          {/* Verification Form */}
          {showVerifyForm && (
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-stone-900">Verify Insurance Information</h3>
                <button
                  onClick={() => setShowVerifyForm(false)}
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={handleSubmit((data) => verifyMutation.mutate(data))}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Insurance Company *</label>
                    <input {...register('insuranceCompany')} className={inputClass(!!errors.insuranceCompany)} />
                    {errors.insuranceCompany && <p className="mt-1 text-xs text-red-600">{errors.insuranceCompany.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Plan Name</label>
                    <input {...register('planName')} className={inputClass(false)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Member ID *</label>
                    <input {...register('memberId')} className={inputClass(!!errors.memberId)} />
                    {errors.memberId && <p className="mt-1 text-xs text-red-600">{errors.memberId.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Group Number</label>
                    <input {...register('groupNumber')} className={inputClass(false)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Relationship *</label>
                    <select {...register('relationship')} className={inputClass(!!errors.relationship)}>
                      <option value="">Select...</option>
                      <option value="self">Self</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.relationship && <p className="mt-1 text-xs text-red-600">{errors.relationship.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Subscriber Name *</label>
                    <input {...register('subscriberName')} className={inputClass(!!errors.subscriberName)} />
                    {errors.subscriberName && <p className="mt-1 text-xs text-red-600">{errors.subscriberName.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-stone-700">Effective Date</label>
                      <input type="date" {...register('effectiveDate')} className={inputClass(false)} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-stone-700">Expiration Date</label>
                      <input type="date" {...register('expirationDate')} className={inputClass(false)} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Annual Max ($)</label>
                    <input type="number" {...register('annualMax')} className={inputClass(false)} placeholder="1500" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Remaining ($)</label>
                    <input type="number" {...register('remainingBenefit')} className={inputClass(false)} placeholder="1200" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Deductible ($)</label>
                    <input type="number" {...register('deductible')} className={inputClass(false)} placeholder="50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Ded. Met ($)</label>
                    <input type="number" {...register('deductibleMet')} className={inputClass(false)} placeholder="50" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Preventive %</label>
                    <input type="number" {...register('coveragePreventive')} className={inputClass(!!errors.coveragePreventive)} min={0} max={100} placeholder="100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Basic %</label>
                    <input type="number" {...register('coverageBasic')} className={inputClass(!!errors.coverageBasic)} min={0} max={100} placeholder="80" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">Major %</label>
                    <input type="number" {...register('coverageMajor')} className={inputClass(!!errors.coverageMajor)} min={0} max={100} placeholder="50" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Notes</label>
                  <textarea {...register('notes')} rows={2} className={inputClass(false)} placeholder="Verification notes..." />
                </div>

                <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setShowVerifyForm(false)}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-stone-300"
                  >
                    {verifyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {verifyMutation.isPending ? 'Verifying...' : 'Mark as Verified'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════ HELPER (scoped to avoid import-level use) ═══════════════════

function DollarSign_({ className }: { className?: string }) {
  return <DollarSign className={className} />;
}
