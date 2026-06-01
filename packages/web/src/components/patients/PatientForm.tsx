'use client';

import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCreatePatient } from '@/hooks/usePatient';

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  insuranceCompany: z.string().optional(),
  insurancePlan: z.string().optional(),
  groupNumber: z.string().optional(),
  memberId: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  open: boolean;
  onClose: () => void;
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-stone-700">
      {children} <span className="text-red-500">*</span>
    </label>
  );
}

export function PatientForm({ open, onClose }: PatientFormProps) {
  const [step, setStep] = useState<'info' | 'insurance'>('info');
  const createPatient = useCreatePatient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
    },
  });

  const emailValue = useWatch({ control, name: 'email' });
  const emailIsValid = emailValue ? EMAIL_REGEX.test(emailValue) : null;

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setValue('phone', formatted, { shouldValidate: true });
    },
    [setValue]
  );

  const onSubmit = async (data: PatientFormData) => {
    try {
      await createPatient.mutateAsync({
        ...data,
        secondaryPhone: undefined,
        subscriberName: undefined,
        subscriberDob: undefined,
        coveragePercent: undefined,
        emergencyContactName: undefined,
        emergencyContactPhone: undefined,
        emergencyContactRelationship: undefined,
        allergies: [],
        medications: [],
        conditions: [],
        smoking: false,
        alcohol: false,
        pregnancy: false,
        status: 'active',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create patient:', error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-stone-900">
              New Patient
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Step Indicator */}
          <div className="mb-6 flex gap-2">
            <button
              type="button"
              onClick={() => setStep('info')}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
                step === 'info'
                  ? 'bg-teal-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Personal Info
            </button>
            <button
              type="button"
              onClick={() => setStep('insurance')}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
                step === 'insurance'
                  ? 'bg-teal-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Insurance
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 'info' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <RequiredLabel>First Name</RequiredLabel>
                    <input
                      type="text"
                      {...register('firstName')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <RequiredLabel>Last Name</RequiredLabel>
                    <input
                      type="text"
                      {...register('lastName')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <RequiredLabel>Date of Birth</RequiredLabel>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div>
                    <RequiredLabel>Gender</RequiredLabel>
                    <select
                      {...register('gender')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <RequiredLabel>Phone</RequiredLabel>
                  <input
                    type="tel"
                    {...register('phone', {
                      onChange: handlePhoneChange,
                    })}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <RequiredLabel>Email</RequiredLabel>
                  <div className="relative">
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full rounded-lg border px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-1 ${
                        emailValue && !emailIsValid
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : emailIsValid
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                            : 'border-stone-200 focus:border-teal-500 focus:ring-teal-500'
                      }`}
                    />
                    {emailValue && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailIsValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                      </span>
                    )}
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                  {emailValue && !emailIsValid && !errors.email && (
                    <p className="mt-1 text-xs text-amber-600">Please enter a valid email address</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Address
                    </label>
                    <input
                      type="text"
                      {...register('address')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      City
                    </label>
                    <input
                      type="text"
                      {...register('city')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      State
                    </label>
                    <input
                      type="text"
                      {...register('state')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      ZIP
                    </label>
                    <input
                      type="text"
                      {...register('zip')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 'insurance' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Insurance Company
                  </label>
                  <input
                    type="text"
                    {...register('insuranceCompany')}
                    placeholder="e.g., Delta Dental"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    {...register('insurancePlan')}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Group Number
                    </label>
                    <input
                      type="text"
                      {...register('groupNumber')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Member ID
                    </label>
                    <input
                      type="text"
                      {...register('memberId')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              {step === 'info' ? (
                <button
                  type="button"
                  onClick={() => setStep('insurance')}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createPatient.isPending}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {createPatient.isPending ? 'Creating...' : 'Create Patient'}
                </button>
              )}
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
