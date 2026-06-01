'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  User,
  Heart,
  Shield,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Save,
  Loader2,
} from 'lucide-react';
import { apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';

// ═══════════════════ SCHEMAS ═══════════════════

const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
});

const medicalHistorySchema = z.object({
  allergies: z.string().optional(),
  medications: z.string().optional(),
  conditions: z.string().optional(),
  smoking: z.boolean(),
  alcohol: z.boolean(),
  pregnancy: z.boolean(),
  previousSurgeries: z.string().optional(),
  familyHistory: z.string().optional(),
  bloodType: z.string().optional(),
  lastPhysical: z.string().optional(),
  medicalNotes: z.string().optional(),
});

const insuranceSchema = z.object({
  insuranceCompany: z.string().optional(),
  insurancePlan: z.string().optional(),
  groupNumber: z.string().optional(),
  memberId: z.string().optional(),
  subscriberName: z.string().optional(),
  subscriberDob: z.string().optional(),
  relationship: z.string().optional(),
  coveragePercent: z.coerce.number().min(0).max(100).optional(),
});

const consentSchema = z.object({
  consentTreatment: z.boolean().refine((v) => v, 'You must consent to treatment'),
  consentPrivacy: z.boolean().refine((v) => v, 'You must acknowledge the privacy policy'),
  consentFinancial: z.boolean().refine((v) => v, 'You must acknowledge financial responsibility'),
  signatureText: z.string().min(2, 'Signature is required'),
  signatureDate: z.string().min(1, 'Date is required'),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;
type MedicalHistoryData = z.infer<typeof medicalHistorySchema>;
type InsuranceData = z.infer<typeof insuranceSchema>;
type ConsentData = z.infer<typeof consentSchema>;

// ═══════════════════ STEPS ═══════════════════

const STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'medical', label: 'Medical History', icon: Heart },
  { id: 'insurance', label: 'Insurance', icon: Shield },
  { id: 'consent', label: 'Consent', icon: FileCheck },
] as const;

type StepId = (typeof STEPS)[number]['id'];

// ═══════════════════ FORM FIELD HELPERS ═══════════════════

const inputClass = (hasError: boolean) =>
  cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
    hasError ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
  );

// ═══════════════════ STEP COMPONENTS ═══════════════════

function PersonalInfoStep({
  data,
  onSave,
}: {
  data: Partial<PersonalInfoData>;
  onSave: (data: PersonalInfoData) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data,
  });

  return (
    <form id="step-form" onSubmit={handleSubmit(onSave)} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">First Name *</label>
          <input {...register('firstName')} className={inputClass(!!errors.firstName)} placeholder="John" />
          {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Last Name *</label>
          <input {...register('lastName')} className={inputClass(!!errors.lastName)} placeholder="Doe" />
          {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Date of Birth *</label>
          <input type="date" {...register('dateOfBirth')} className={inputClass(!!errors.dateOfBirth)} />
          {errors.dateOfBirth && <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Gender *</label>
          <select {...register('gender')} className={inputClass(!!errors.gender)}>
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
          {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Phone *</label>
          <input {...register('phone')} className={inputClass(!!errors.phone)} placeholder="(555) 123-4567" />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Email</label>
          <input type="email" {...register('email')} className={inputClass(!!errors.email)} placeholder="john@example.com" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Address</label>
        <input {...register('address')} className={inputClass(false)} placeholder="123 Main St" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">City</label>
          <input {...register('city')} className={inputClass(false)} placeholder="Anytown" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">State</label>
          <input {...register('state')} className={inputClass(false)} placeholder="CA" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">ZIP Code</label>
          <input {...register('zip')} className={inputClass(false)} placeholder="12345" />
        </div>
      </div>

      <div className="border-t border-stone-200 pt-5">
        <h3 className="mb-4 text-sm font-semibold text-stone-800">Emergency Contact</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Name</label>
            <input {...register('emergencyContactName')} className={inputClass(false)} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Phone</label>
            <input {...register('emergencyContactPhone')} className={inputClass(false)} placeholder="(555) 987-6543" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Relationship</label>
            <input {...register('emergencyContactRelationship')} className={inputClass(false)} placeholder="Spouse" />
          </div>
        </div>
      </div>
    </form>
  );
}

function MedicalHistoryStep({
  data,
  onSave,
}: {
  data: Partial<MedicalHistoryData>;
  onSave: (data: MedicalHistoryData) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicalHistoryData>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: { smoking: false, alcohol: false, pregnancy: false, ...data },
  });

  return (
    <form id="step-form" onSubmit={handleSubmit(onSave)} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          Allergies <span className="text-stone-400">(separate with commas)</span>
        </label>
        <textarea {...register('allergies')} rows={2} className={inputClass(false)} placeholder="Penicillin, Latex, etc." />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          Current Medications <span className="text-stone-400">(separate with commas)</span>
        </label>
        <textarea {...register('medications')} rows={2} className={inputClass(false)} placeholder="Lisinopril 10mg, Metformin 500mg, etc." />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          Medical Conditions <span className="text-stone-400">(separate with commas)</span>
        </label>
        <textarea {...register('conditions')} rows={2} className={inputClass(false)} placeholder="Diabetes, Hypertension, etc." />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Blood Type</label>
          <select {...register('bloodType')} className={inputClass(false)}>
            <option value="">Unknown</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Last Physical Exam</label>
          <input type="date" {...register('lastPhysical')} className={inputClass(false)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" {...register('smoking')} className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500" />
          Current smoker
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" {...register('alcohol')} className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500" />
          Regular alcohol use
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" {...register('pregnancy')} className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500" />
          Currently pregnant
        </label>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Previous Surgeries</label>
        <textarea {...register('previousSurgeries')} rows={2} className={inputClass(false)} placeholder="Appendectomy (2015), etc." />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Family Medical History</label>
        <textarea {...register('familyHistory')} rows={2} className={inputClass(false)} placeholder="Heart disease, Diabetes, etc." />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Additional Notes</label>
        <textarea {...register('medicalNotes')} rows={2} className={inputClass(false)} placeholder="Any other relevant medical information..." />
      </div>
    </form>
  );
}

function InsuranceStep({
  data,
  onSave,
}: {
  data: Partial<InsuranceData>;
  onSave: (data: InsuranceData) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InsuranceData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: data,
  });

  return (
    <form id="step-form" onSubmit={handleSubmit(onSave)} className="space-y-5">
      <p className="text-sm text-stone-500">Leave blank if patient does not have dental insurance.</p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Insurance Company</label>
          <input {...register('insuranceCompany')} className={inputClass(false)} placeholder="Delta Dental" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Plan Name</label>
          <input {...register('insurancePlan')} className={inputClass(false)} placeholder="PPO Premium" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Group Number</label>
          <input {...register('groupNumber')} className={inputClass(false)} placeholder="GRP-12345" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Member ID</label>
          <input {...register('memberId')} className={inputClass(false)} placeholder="MEM-67890" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Subscriber Name</label>
          <input {...register('subscriberName')} className={inputClass(false)} placeholder="John Doe" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Subscriber DOB</label>
          <input type="date" {...register('subscriberDob')} className={inputClass(false)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Relationship to Subscriber</label>
          <select {...register('relationship')} className={inputClass(false)}>
            <option value="">Select...</option>
            <option value="self">Self</option>
            <option value="spouse">Spouse</option>
            <option value="child">Child</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Coverage Percentage</label>
        <input
          type="number"
          {...register('coveragePercent')}
          className={cn(inputClass(!!errors.coveragePercent), 'max-w-[200px]')}
          placeholder="80"
          min={0}
          max={100}
        />
        {errors.coveragePercent && <p className="mt-1 text-xs text-red-600">{errors.coveragePercent.message}</p>}
      </div>
    </form>
  );
}

function ConsentStep({
  data,
  onSave,
}: {
  data: Partial<ConsentData>;
  onSave: (data: ConsentData) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsentData>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      consentTreatment: false,
      consentPrivacy: false,
      consentFinancial: false,
      signatureDate: new Date().toISOString().split('T')[0],
      ...data,
    },
  });

  return (
    <form id="step-form" onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-semibold text-stone-800">Consent for Treatment</h3>
        <p className="mt-1 text-xs text-stone-500">
          I consent to the dental treatments and procedures recommended by my dentist. I understand that
          the practice of dentistry is not an exact science and acknowledge that no guarantees have been
          made to me concerning the results of any dental treatment or procedure.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" {...register('consentTreatment')} className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500" />
          I agree to the above
        </label>
        {errors.consentTreatment && <p className="mt-1 text-xs text-red-600">{errors.consentTreatment.message}</p>}
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-semibold text-stone-800">Privacy Policy Acknowledgment</h3>
        <p className="mt-1 text-xs text-stone-500">
          I acknowledge that I have received a copy of the Notice of Privacy Practices. I understand that
          this practice may use and disclose my health information for treatment, payment, and healthcare operations.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" {...register('consentPrivacy')} className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500" />
          I acknowledge the privacy policy
        </label>
        {errors.consentPrivacy && <p className="mt-1 text-xs text-red-600">{errors.consentPrivacy.message}</p>}
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-semibold text-stone-800">Financial Responsibility</h3>
        <p className="mt-1 text-xs text-stone-500">
          I understand that I am financially responsible for all charges incurred whether or not covered by insurance.
          I authorize the release of any information necessary to process insurance claims on my behalf.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" {...register('consentFinancial')} className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500" />
          I accept financial responsibility
        </label>
        {errors.consentFinancial && <p className="mt-1 text-xs text-red-600">{errors.consentFinancial.message}</p>}
      </div>

      <div className="border-t border-stone-200 pt-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Signature (Type Full Name) *</label>
            <input
              {...register('signatureText')}
              className={inputClass(!!errors.signatureText)}
              placeholder="John Doe"
              style={{ fontFamily: 'cursive' }}
            />
            {errors.signatureText && <p className="mt-1 text-xs text-red-600">{errors.signatureText.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Date *</label>
            <input type="date" {...register('signatureDate')} className={inputClass(!!errors.signatureDate)} />
            {errors.signatureDate && <p className="mt-1 text-xs text-red-600">{errors.signatureDate.message}</p>}
          </div>
        </div>
      </div>
    </form>
  );
}

// ═══════════════════ MAIN PAGE ═══════════════════

interface IntakeFormData {
  personal: PersonalInfoData;
  medical: MedicalHistoryData;
  insurance: InsuranceData;
  consent: ConsentData;
}

export default function PatientIntakePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<IntakeFormData>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: (data: IntakeFormData) => {
      const payload = {
        firstName: data.personal.firstName,
        lastName: data.personal.lastName,
        dateOfBirth: data.personal.dateOfBirth,
        gender: data.personal.gender,
        phone: data.personal.phone,
        email: data.personal.email || undefined,
        address: data.personal.address,
        city: data.personal.city,
        state: data.personal.state,
        zip: data.personal.zip,
        emergencyContactName: data.personal.emergencyContactName,
        emergencyContactPhone: data.personal.emergencyContactPhone,
        emergencyContactRelationship: data.personal.emergencyContactRelationship,
        allergies: data.medical.allergies?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
        medications: data.medical.medications?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
        conditions: data.medical.conditions?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
        smoking: data.medical.smoking,
        alcohol: data.medical.alcohol,
        pregnancy: data.medical.pregnancy,
        insuranceCompany: data.insurance.insuranceCompany,
        insurancePlan: data.insurance.insurancePlan,
        groupNumber: data.insurance.groupNumber,
        memberId: data.insurance.memberId,
        subscriberName: data.insurance.subscriberName,
        subscriberDob: data.insurance.subscriberDob,
        coveragePercent: data.insurance.coveragePercent,
        status: 'active' as const,
      };
      return apiPost<{ id: string }>('/api/patients', payload);
    },
    onSuccess: (result) => {
      router.push(`/patients/${result.id}`);
    },
    onError: (error: Error) => {
      setSubmitError(error.message || 'Failed to submit intake form');
    },
  });

  const handleStepSave = useCallback(
    (stepKey: keyof IntakeFormData, data: IntakeFormData[keyof IntakeFormData]) => {
      const updated = { ...formData, [stepKey]: data };
      setFormData(updated);

      if (currentStep < STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        // Final step - submit
        submitMutation.mutate(updated as IntakeFormData);
      }
    },
    [formData, currentStep, submitMutation]
  );

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const stepKeys: (keyof IntakeFormData)[] = ['personal', 'medical', 'insurance', 'consent'];
  const currentStepKey = stepKeys[currentStep];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">New Patient Intake</h1>
        <p className="mt-1 text-sm text-stone-500">Complete all steps to register a new patient.</p>
      </div>

      {/* Step Indicator */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      isCompleted
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : isCurrent
                          ? 'border-teal-600 bg-teal-50 text-teal-600'
                          : 'border-stone-300 bg-white text-stone-400'
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isCurrent ? 'text-teal-700' : isCompleted ? 'text-teal-600' : 'text-stone-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 flex-1',
                      index < currentStep ? 'bg-teal-600' : 'bg-stone-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-stone-900">{STEPS[currentStep].label}</h2>

        {currentStepKey === 'personal' && (
          <PersonalInfoStep
            data={formData.personal ?? {}}
            onSave={(d) => handleStepSave('personal', d)}
          />
        )}
        {currentStepKey === 'medical' && (
          <MedicalHistoryStep
            data={formData.medical ?? {}}
            onSave={(d) => handleStepSave('medical', d)}
          />
        )}
        {currentStepKey === 'insurance' && (
          <InsuranceStep
            data={formData.insurance ?? {}}
            onSave={(d) => handleStepSave('insurance', d)}
          />
        )}
        {currentStepKey === 'consent' && (
          <ConsentStep
            data={formData.consent ?? {}}
            onSave={(d) => handleStepSave('consent', d)}
          />
        )}

        {submitError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {submitError}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
            currentStep === 0
              ? 'cursor-not-allowed border-stone-200 text-stone-300'
              : 'border-stone-300 text-stone-700 hover:bg-stone-50'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-xs text-stone-400">
          Step {currentStep + 1} of {STEPS.length}
        </div>

        <button
          type="submit"
          form="step-form"
          disabled={submitMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-stone-300"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : currentStep < STEPS.length - 1 ? (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Submit Intake
            </>
          )}
        </button>
      </div>
    </div>
  );
}
