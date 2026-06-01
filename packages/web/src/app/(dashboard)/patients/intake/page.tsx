'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  User,
  Heart,
  Shield,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Save,
  Loader2,
  X,
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
  zipCode: z.string().optional(),
});

const medicalHistorySchema = z.object({
  allergies: z.array(z.string()),
  medications: z.array(z.string()),
  conditions: z.array(z.string()),
  smokingStatus: z.string(),
  pregnancyStatus: z.string(),
});

const insuranceSchema = z.object({
  insuranceCompany: z.string().optional(),
  memberId: z.string().optional(),
  groupNumber: z.string().optional(),
  subscriberName: z.string().optional(),
  relationship: z.string().optional(),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;
type MedicalHistoryData = z.infer<typeof medicalHistorySchema>;
type InsuranceData = z.infer<typeof insuranceSchema>;

// ═══════════════════ STEPS ═══════════════════

const STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'medical', label: 'Medical History', icon: Heart },
  { id: 'insurance', label: 'Insurance', icon: Shield },
] as const;

const CONDITIONS_LIST = [
  'Diabetes',
  'Heart Disease',
  'Hypertension',
  'Asthma',
  'Epilepsy',
  'Bleeding Disorders',
  'HIV/AIDS',
  'Hepatitis',
  'Thyroid Disorder',
  'Kidney Disease',
  'Liver Disease',
  'Cancer',
];

// ═══════════════════ FORM FIELD HELPERS ═══════════════════

const inputClass = (hasError: boolean) =>
  cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
    hasError ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
  );

// ═══════════════════ TAG INPUT ═══════════════════

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="rounded-lg border border-stone-300 bg-white px-3 py-2 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-colors">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-medium text-teal-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="rounded-full p-0.5 hover:bg-teal-100 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-none bg-transparent py-0.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none"
        />
      </div>
    </div>
  );
}

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
          <input {...register('zipCode')} className={inputClass(false)} placeholder="12345" />
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
    handleSubmit,
    setValue,
    watch,
    register,
  } = useForm<MedicalHistoryData>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      allergies: [],
      medications: [],
      conditions: [],
      smokingStatus: 'never',
      pregnancyStatus: 'no',
      ...data,
    },
  });

  const allergies = watch('allergies');
  const medications = watch('medications');
  const conditions = watch('conditions');

  const toggleCondition = (condition: string) => {
    const current = conditions || [];
    if (current.includes(condition)) {
      setValue('conditions', current.filter((c) => c !== condition));
    } else {
      setValue('conditions', [...current, condition]);
    }
  };

  return (
    <form id="step-form" onSubmit={handleSubmit(onSave)} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          Allergies <span className="text-stone-400">(press Enter to add)</span>
        </label>
        <TagInput
          tags={allergies || []}
          onChange={(v) => setValue('allergies', v)}
          placeholder="Type an allergy and press Enter..."
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          Current Medications <span className="text-stone-400">(press Enter to add)</span>
        </label>
        <TagInput
          tags={medications || []}
          onChange={(v) => setValue('medications', v)}
          placeholder="Type a medication and press Enter..."
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">Medical Conditions</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CONDITIONS_LIST.map((condition) => (
            <label
              key={condition}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors',
                (conditions || []).includes(condition)
                  ? 'border-teal-300 bg-teal-50 text-teal-800'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
              )}
            >
              <input
                type="checkbox"
                checked={(conditions || []).includes(condition)}
                onChange={() => toggleCondition(condition)}
                className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
              />
              {condition}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Smoking Status</label>
          <select {...register('smokingStatus')} className={inputClass(false)}>
            <option value="never">Never</option>
            <option value="former">Former Smoker</option>
            <option value="current">Current Smoker</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Pregnancy Status</label>
          <select {...register('pregnancyStatus')} className={inputClass(false)}>
            <option value="no">Not Pregnant</option>
            <option value="yes">Currently Pregnant</option>
            <option value="na">Not Applicable</option>
          </select>
        </div>
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
  } = useForm<InsuranceData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: data,
  });

  return (
    <form id="step-form" onSubmit={handleSubmit(onSave)} className="space-y-5">
      <p className="text-sm text-stone-500">Leave blank if patient does not have dental insurance.</p>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Insurance Company</label>
        <input {...register('insuranceCompany')} className={inputClass(false)} placeholder="Delta Dental" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Member ID</label>
          <input {...register('memberId')} className={inputClass(false)} placeholder="MEM-67890" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Group Number</label>
          <input {...register('groupNumber')} className={inputClass(false)} placeholder="GRP-12345" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Subscriber Name</label>
          <input {...register('subscriberName')} className={inputClass(false)} placeholder="John Doe" />
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
    </form>
  );
}

// ═══════════════════ MAIN PAGE ═══════════════════

interface IntakeFormData {
  personal: PersonalInfoData;
  medical: MedicalHistoryData;
  insurance: InsuranceData;
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
        zip: data.personal.zipCode,
        allergies: data.medical.allergies,
        medications: data.medical.medications,
        conditions: data.medical.conditions,
        smoking: data.medical.smokingStatus === 'current',
        alcohol: false,
        pregnancy: data.medical.pregnancyStatus === 'yes',
        insuranceCompany: data.insurance.insuranceCompany,
        memberId: data.insurance.memberId,
        groupNumber: data.insurance.groupNumber,
        subscriberName: data.insurance.subscriberName,
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
        submitMutation.mutate(updated as IntakeFormData);
      }
    },
    [formData, currentStep, submitMutation]
  );

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const stepKeys: (keyof IntakeFormData)[] = ['personal', 'medical', 'insurance'];
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
