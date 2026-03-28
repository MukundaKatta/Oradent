'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Plus,
  X,
  Pencil,
  Eye,
  Ban,
  PenTool,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// ---------- Types ----------

interface ConsentStats {
  pendingCount: number;
  signedToday: number;
  totalActive: number;
}

interface ConsentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  version: string;
  content: string;
  updatedAt: string;
}

interface PatientConsent {
  id: string;
  patientName: string;
  templateName: string;
  procedureDescription: string;
  status: ConsentStatus;
  createdAt: string;
  signedAt: string | null;
}

type TemplateCategory =
  | 'General'
  | 'Surgical'
  | 'Orthodontic'
  | 'Cosmetic'
  | 'Sedation'
  | 'Custom';

type ConsentStatus = 'PENDING' | 'SIGNED' | 'REVOKED' | 'EXPIRED';

interface CreateTemplatePayload {
  name: string;
  category: TemplateCategory;
  content: string;
}

// ---------- Constants ----------

const CATEGORIES: TemplateCategory[] = [
  'General',
  'Surgical',
  'Orthodontic',
  'Cosmetic',
  'Sedation',
  'Custom',
];

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  General: 'bg-teal-100 text-teal-700',
  Surgical: 'bg-red-100 text-red-700',
  Orthodontic: 'bg-blue-100 text-blue-700',
  Cosmetic: 'bg-purple-100 text-purple-700',
  Sedation: 'bg-amber-100 text-amber-700',
  Custom: 'bg-stone-100 text-stone-700',
};

const STATUS_COLORS: Record<ConsentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  SIGNED: 'bg-green-100 text-green-700',
  REVOKED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-stone-100 text-stone-600',
};

const STATUS_LABELS: Record<ConsentStatus, string> = {
  PENDING: 'Pending',
  SIGNED: 'Signed',
  REVOKED: 'Revoked',
  EXPIRED: 'Expired',
};

// ---------- Component ----------

export default function ConsentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'templates' | 'consents'>('templates');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- Form state for new template ---
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<TemplateCategory>('General');
  const [formContent, setFormContent] = useState('');

  // --- Queries ---

  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery<ConsentStats>({
    queryKey: ['consent', 'stats'],
    queryFn: () => apiGet<ConsentStats>('/api/consent/stats'),
  });

  const {
    data: templates,
    isLoading: templatesLoading,
  } = useQuery<ConsentTemplate[]>({
    queryKey: ['consent', 'templates'],
    queryFn: () => apiGet<ConsentTemplate[]>('/api/consent/templates'),
  });

  const {
    data: consents,
    isLoading: consentsLoading,
  } = useQuery<PatientConsent[]>({
    queryKey: ['consent', 'patient-consents'],
    queryFn: () => apiGet<PatientConsent[]>('/api/consent'),
  });

  // --- Mutations ---

  const createTemplateMutation = useMutation({
    mutationFn: (payload: CreateTemplatePayload) =>
      apiPost<ConsentTemplate, CreateTemplatePayload>('/api/consent/templates', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent', 'templates'] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const signConsentMutation = useMutation({
    mutationFn: (id: string) => apiPut<PatientConsent>(`/api/consent/${id}/sign`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent'] });
    },
  });

  const revokeConsentMutation = useMutation({
    mutationFn: (id: string) => apiPut<PatientConsent>(`/api/consent/${id}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent'] });
    },
  });

  // --- Helpers ---

  function resetForm() {
    setFormName('');
    setFormCategory('General');
    setFormContent('');
  }

  function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim()) return;
    createTemplateMutation.mutate({
      name: formName.trim(),
      category: formCategory,
      content: formContent.trim(),
    });
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function truncate(text: string, maxLen: number) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Consent Management</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage treatment consent forms and patient signatures
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Pending Signatures</p>
              {statsLoading ? (
                <div className="mt-1 h-7 w-12 animate-pulse rounded bg-stone-100" />
              ) : (
                <p className="text-xl font-bold text-stone-900">{stats?.pendingCount ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Signed Today</p>
              {statsLoading ? (
                <div className="mt-1 h-7 w-12 animate-pulse rounded bg-stone-100" />
              ) : (
                <p className="text-xl font-bold text-stone-900">{stats?.signedToday ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Active</p>
              {statsLoading ? (
                <div className="mt-1 h-7 w-12 animate-pulse rounded bg-stone-100" />
              ) : (
                <p className="text-xl font-bold text-stone-900">{stats?.totalActive ?? 0}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1 w-fit">
          <button
            onClick={() => setActiveTab('templates')}
            className={
              'rounded-md px-4 py-2 text-sm font-medium transition-colors ' +
              (activeTab === 'templates'
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100')
            }
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('consents')}
            className={
              'rounded-md px-4 py-2 text-sm font-medium transition-colors ' +
              (activeTab === 'consents'
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100')
            }
          >
            Patient Consents
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="mt-4">
            {templatesLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-xl bg-stone-100" />
                ))}
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-stone-900 truncate">
                          {template.name}
                        </h3>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span
                            className={
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' +
                              CATEGORY_COLORS[template.category]
                            }
                          >
                            {template.category}
                          </span>
                          <span className="text-xs text-stone-400">v{template.version}</span>
                        </div>
                      </div>
                      <button className="ml-2 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-stone-500 leading-relaxed">
                      {truncate(template.content, 120)}
                    </p>
                    <p className="mt-3 text-xs text-stone-400">
                      Updated {formatDate(template.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
                <FileCheck className="mx-auto h-12 w-12 text-stone-300" />
                <h3 className="mt-3 text-lg font-medium text-stone-700">No templates yet</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Create your first consent template to get started.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Patient Consents Tab */}
        {activeTab === 'consents' && (
          <div className="mt-4">
            {consentsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-stone-100" />
                ))}
              </div>
            ) : consents && consents.length > 0 ? (
              <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50">
                        <th className="px-4 py-3 text-left font-medium text-stone-500">
                          Patient Name
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-stone-500">
                          Template
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-stone-500">
                          Procedure
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-stone-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-stone-500">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-stone-500">
                          Signed
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-stone-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consents.map((consent) => (
                        <tr
                          key={consent.id}
                          className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-stone-900">
                            {consent.patientName}
                          </td>
                          <td className="px-4 py-3 text-stone-700">{consent.templateName}</td>
                          <td className="px-4 py-3 text-stone-600 max-w-[200px] truncate">
                            {consent.procedureDescription}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' +
                                STATUS_COLORS[consent.status]
                              }
                            >
                              {STATUS_LABELS[consent.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-500">
                            {formatDate(consent.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-stone-500">
                            {formatDate(consent.signedAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {consent.status === 'PENDING' && (
                                <button
                                  onClick={() => signConsentMutation.mutate(consent.id)}
                                  disabled={signConsentMutation.isPending}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                                  title="Sign"
                                >
                                  <PenTool className="h-3.5 w-3.5" />
                                  Sign
                                </button>
                              )}
                              {consent.status === 'SIGNED' && (
                                <button
                                  onClick={() => revokeConsentMutation.mutate(consent.id)}
                                  disabled={revokeConsentMutation.isPending}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                                  title="Revoke"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  Revoke
                                </button>
                              )}
                              <button
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                                title="View"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
                <FileCheck className="mx-auto h-12 w-12 text-stone-300" />
                <h3 className="mt-3 text-lg font-medium text-stone-700">No consents found</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Patient consent records will appear here once created.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-stone-900">New Consent Template</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wisdom Teeth Extraction Consent"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TemplateCategory)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Content
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Enter the consent form content..."
                  rows={6}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                  required
                />
              </div>

              {createTemplateMutation.isError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {createTemplateMutation.error instanceof Error
                      ? createTemplateMutation.error.message
                      : 'Failed to create template'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTemplateMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {createTemplateMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
