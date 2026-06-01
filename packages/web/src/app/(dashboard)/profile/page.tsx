'use client';

import { useState, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Lock,
  Shield,
  Save,
  X,
  Mail,
  BadgeCheck,
  Hash,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
} from 'lucide-react';
import { apiPut, apiPost } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import type { Provider } from '@/types';
import { format } from 'date-fns';

// ═══════════════════ SCHEMAS ═══════════════════

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  title: z.string().min(1, 'Title is required'),
  licenseNumber: z.string().nullable(),
  npi: z.string().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

// ═══════════════════ TOAST ═══════════════════

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// ═══════════════════ PASSWORD STRENGTH ═══════════════════

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Fair', color: 'bg-amber-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

// ═══════════════════ ROLE LABELS ═══════════════════

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  DENTIST: 'Dentist',
  HYGIENIST: 'Hygienist',
  ASSISTANT: 'Assistant',
  FRONT_DESK: 'Front Desk',
};

// ═══════════════════ PROFILE SECTION ═══════════════════

function ProfileSection({
  addToast,
}: {
  addToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const provider = useAppStore((s) => s.provider);
  const updateProvider = useAppStore((s) => s.updateProvider);

  const initials = provider?.name
    ? provider.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DR';

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: provider
      ? {
          name: provider.name,
          email: provider.email,
          title: provider.title,
          licenseNumber: provider.licenseNumber || null,
          npi: provider.npi || null,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      apiPut<Provider>(`/api/settings/providers/${provider?.id}`, data),
    onSuccess: (data) => {
      updateProvider(data);
      setIsEditing(false);
      reset({
        name: data.name,
        email: data.email,
        title: data.title,
        licenseNumber: data.licenseNumber || null,
        npi: data.npi || null,
      });
      addToast('success', 'Profile updated successfully');
    },
    onError: () => {
      addToast('error', 'Failed to update profile');
    },
  });

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const onSubmit = (data: ProfileFormData) => mutation.mutate(data);

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-stone-400" />
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Profile Information</h2>
            <p className="mt-0.5 text-sm text-stone-500">
              View and update your personal details.
            </p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>
      <div className="p-6">
        {/* Avatar */}
        <div className="mb-6 flex items-center gap-5">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ backgroundColor: provider?.color || '#0d9488' }}
          >
            {initials}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-stone-900">
              {provider?.name || 'Provider'}
            </h3>
            <p className="text-sm text-stone-500">{provider?.email}</p>
            <span
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                provider?.role === 'OWNER'
                  ? 'border-purple-200 bg-purple-100 text-purple-700'
                  : 'border-teal-200 bg-teal-100 text-teal-700'
              )}
            >
              <Shield className="h-3 w-3" />
              {ROLE_LABELS[provider?.role || 'DENTIST']}
            </span>
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-stone-400" />
                  Full Name
                </span>
              </label>
              {isEditing ? (
                <>
                  <input
                    {...register('name')}
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                      'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                      errors.name ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                    )}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </>
              ) : (
                <p className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900">
                  {provider?.name || '-'}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-stone-400" />
                  Email
                </span>
              </label>
              {isEditing ? (
                <>
                  <input
                    {...register('email')}
                    type="email"
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                      'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                      errors.email ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                    )}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </>
              ) : (
                <p className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900">
                  {provider?.email || '-'}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                <span className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-stone-400" />
                  Title
                </span>
              </label>
              {isEditing ? (
                <>
                  <input
                    {...register('title')}
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                      'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                      errors.title ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                    )}
                    placeholder="e.g. DDS, DMD, RDH"
                  />
                  {errors.title && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.title.message}</p>
                  )}
                </>
              ) : (
                <p className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900">
                  {provider?.title || '-'}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-stone-400" />
                  Role
                </span>
              </label>
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900">
                {ROLE_LABELS[provider?.role || 'DENTIST']}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                <span className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-stone-400" />
                  License Number
                </span>
              </label>
              {isEditing ? (
                <input
                  {...register('licenseNumber')}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    'border-stone-300 bg-white'
                  )}
                  placeholder="License number"
                />
              ) : (
                <p className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900">
                  {provider?.licenseNumber || '-'}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">
                <span className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-stone-400" />
                  NPI
                </span>
              </label>
              {isEditing ? (
                <input
                  {...register('npi')}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                    'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                    'border-stone-300 bg-white'
                  )}
                  placeholder="National Provider Identifier"
                />
              ) : (
                <p className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900">
                  {provider?.npi || '-'}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 border-t border-stone-100 pt-5">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isDirty || mutation.isPending}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors',
                  isDirty && !mutation.isPending
                    ? 'bg-teal-600 hover:bg-teal-700'
                    : 'cursor-not-allowed bg-stone-300'
                )}
              >
                <Save className="h-4 w-4" />
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ═══════════════════ PASSWORD SECTION ═══════════════════

function PasswordSection({
  addToast,
}: {
  addToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');
  const strength = useMemo(() => getPasswordStrength(newPassword || ''), [newPassword]);

  const mutation = useMutation({
    mutationFn: (data: PasswordFormData) =>
      apiPost<{ message: string }>('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      reset();
      addToast('success', 'Password changed successfully');
    },
    onError: () => {
      addToast('error', 'Failed to change password. Please check your current password.');
    },
  });

  const onSubmit = (data: PasswordFormData) => mutation.mutate(data);

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-stone-400" />
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Change Password</h2>
            <p className="mt-0.5 text-sm text-stone-500">
              Update your password to keep your account secure.
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Current Password
            </label>
            <input
              {...register('currentPassword')}
              type="password"
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                errors.currentPassword ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
              )}
              placeholder="Enter current password"
            />
            {errors.currentPassword && (
              <p className="mt-1.5 text-xs text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              New Password
            </label>
            <input
              {...register('newPassword')}
              type="password"
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                errors.newPassword ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
              )}
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <p className="mt-1.5 text-xs text-red-600">{errors.newPassword.message}</p>
            )}
            {/* Strength indicator */}
            {newPassword && newPassword.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className={cn('h-full rounded-full transition-all', strength.color)}
                      style={{ width: `${(strength.score / 6) * 100}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      strength.score <= 2
                        ? 'text-red-600'
                        : strength.score <= 4
                          ? 'text-amber-600'
                          : 'text-green-600'
                    )}
                  >
                    {strength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
              )}
              placeholder="Re-enter new password"
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end border-t border-stone-100 pt-5">
            <button
              type="submit"
              disabled={mutation.isPending}
              className={cn(
                'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors',
                mutation.isPending
                  ? 'cursor-not-allowed bg-stone-300'
                  : 'bg-teal-600 hover:bg-teal-700'
              )}
            >
              <Lock className="h-4 w-4" />
              {mutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════ ACTIVITY SECTION ═══════════════════

function ActivitySection() {
  const provider = useAppStore((s) => s.provider);

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-stone-400" />
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Account Activity</h2>
            <p className="mt-0.5 text-sm text-stone-500">
              Your account timeline and activity.
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-lg border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
              <Clock className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Last Login</p>
              <p className="text-sm font-semibold text-stone-900">
                {provider?.updatedAt
                  ? format(new Date(provider.updatedAt), 'MMM d, yyyy h:mm a')
                  : '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
              <Calendar className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Account Created</p>
              <p className="text-sm font-semibold text-stone-900">
                {provider?.createdAt
                  ? format(new Date(provider.createdAt), 'MMM d, yyyy')
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ TOAST CONTAINER ═══════════════════

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm transition-all animate-in slide-in-from-right',
            toast.type === 'success'
              ? 'border-green-200 bg-white text-green-800'
              : 'border-red-200 bg-white text-red-800'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-2 shrink-0 rounded p-0.5 hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function ProfilePage() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Profile</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage your personal information and account security.
        </p>
      </div>

      {/* Profile Section */}
      <ProfileSection addToast={addToast} />

      {/* Password Section */}
      <PasswordSection addToast={addToast} />

      {/* Activity Section */}
      <ActivitySection />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
