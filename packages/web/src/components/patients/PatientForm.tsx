'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useCreatePatient } from "@/hooks/usePatient";
import { ptBR } from "@/i18n";

const copy = ptBR.patientWorkflow.form;

const patientSchema = z.object({
  firstName: z.string().min(1, copy.firstNameRequired),
  lastName: z.string().min(1, copy.lastNameRequired),
  dateOfBirth: z.string().min(1, copy.dateOfBirthRequired),
  gender: z.string().min(1, copy.genderRequired),
  phone: z.string().min(1, copy.phoneRequired),
  email: z.string().email(copy.emailRequired),
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

export function PatientForm({ open, onClose }: PatientFormProps) {
  const [step, setStep] = useState<'info' | 'insurance'>('info');
  const createPatient = useCreatePatient();

  const {
    register,
    handleSubmit,
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
              {copy.title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label={copy.closeDialog} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
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
              {copy.personalInfo}
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
              {copy.insurance}
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 'info' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      {copy.firstName}
                    </label>
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
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      {copy.lastName}
                    </label>
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
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      {copy.dateOfBirth}
                    </label>
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
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      {copy.gender}
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">{ptBR.auth.register.select}</option>
                      <option value="male">{ptBR.patient.gender.male}</option>
                      <option value="female">{ptBR.patient.gender.female}</option>
                      <option value="other">{ptBR.patient.gender.other}</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    {copy.phone}
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder={copy.phonePlaceholder}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    {copy.email}
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      {copy.address}
                    </label>
                    <input
                      type="text"
                      {...register('address')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      {copy.city}
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
                      {copy.state}
                    </label>
                    <input
                      type="text"
                      {...register('state')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      {copy.zip}
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
                    {copy.insuranceCompany}
                  </label>
                  <input
                    type="text"
                    {...register('insuranceCompany')}
                    placeholder={copy.insurancePlaceholder}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    {copy.planName}
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
                      {copy.groupNumber}
                    </label>
                    <input
                      type="text"
                      {...register('groupNumber')}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      {copy.memberId}
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
                {ptBR.patientWorkflow.common.cancel}
              </button>
              {step === 'info' ? (
                <button
                  type="button"
                  onClick={() => setStep('insurance')}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  {copy.next}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createPatient.isPending}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {createPatient.isPending ? copy.creating : copy.create}
                </button>
              )}
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
