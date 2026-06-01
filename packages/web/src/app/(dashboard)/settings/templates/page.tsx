'use client';

import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  FileText,
  Search,
  AlertCircle,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// ═══════════════════ TYPES ═══════════════════

interface NoteTemplate {
  id: string;
  name: string;
  category: 'Exam' | 'Treatment' | 'Post-Op' | 'General';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

type TemplateCategory = NoteTemplate['category'];

const CATEGORIES: TemplateCategory[] = ['Exam', 'Treatment', 'Post-Op', 'General'];

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  Exam: 'bg-blue-100 text-blue-700 border-blue-200',
  Treatment: 'bg-teal-100 text-teal-700 border-teal-200',
  'Post-Op': 'bg-amber-100 text-amber-700 border-amber-200',
  General: 'bg-stone-100 text-stone-700 border-stone-200',
};

const DEFAULT_TEMPLATES: NoteTemplate[] = [
  {
    id: 'default-periodic-exam',
    name: 'Periodic Oral Exam',
    category: 'Exam',
    subjective: 'Patient presents for periodic oral examination. Reports no pain, sensitivity, or concerns since last visit.',
    objective: 'Comprehensive exam of hard and soft tissues performed. Periodontal charting completed. Radiographs reviewed.',
    assessment: 'Oral health status: Stable. No new carious lesions detected. Periodontal health within normal limits.',
    plan: 'Continue current home care regimen. Recall in 6 months for prophylaxis and exam. Patient educated on flossing technique.',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'default-composite-restoration',
    name: 'Composite Restoration',
    category: 'Treatment',
    subjective: 'Patient presents for scheduled restorative treatment. No acute symptoms reported.',
    objective: 'Local anesthesia administered. Caries removed. Tooth prepared for direct composite restoration. Restoration placed and adjusted to proper occlusion.',
    assessment: 'Restoration completed successfully. Good marginal adaptation. Occlusion verified.',
    plan: 'Patient instructed to avoid hard or sticky foods for 24 hours. Monitor restoration at next recall visit. Patient to call if experiencing sensitivity or discomfort.',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'default-post-extraction',
    name: 'Post-Extraction Care',
    category: 'Post-Op',
    subjective: 'Patient underwent tooth extraction. Reviewing post-operative instructions.',
    objective: 'Extraction site examined. Hemostasis achieved. Gauze pack placed. No excessive bleeding noted.',
    assessment: 'Uncomplicated extraction. Patient tolerated procedure well.',
    plan: 'Post-op instructions provided: bite on gauze for 30 minutes, avoid straws and smoking for 72 hours, soft diet for 24 hours, gentle warm salt-water rinses starting tomorrow. Prescribed analgesics as needed. Follow-up in 1 week if needed.',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// ═══════════════════ MAIN PAGE ═══════════════════

export default function NoteTemplatesPage() {
  const [templates, setTemplates] = useLocalStorage<NoteTemplate[]>('oradent-note-templates', DEFAULT_TEMPLATES);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | ''>('');
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<TemplateCategory>('General');
  const [formSubjective, setFormSubjective] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formAssessment, setFormAssessment] = useState('');
  const [formPlan, setFormPlan] = useState('');
  const [formError, setFormError] = useState('');

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subjective.toLowerCase().includes(search.toLowerCase()) ||
      t.objective.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openCreateForm = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormCategory('General');
    setFormSubjective('');
    setFormObjective('');
    setFormAssessment('');
    setFormPlan('');
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (template: NoteTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormCategory(template.category);
    setFormSubjective(template.subjective);
    setFormObjective(template.objective);
    setFormAssessment(template.assessment);
    setFormPlan(template.plan);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      setFormError('Template name is required');
      return;
    }

    const now = new Date().toISOString();

    if (editingTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                name: formName.trim(),
                category: formCategory,
                subjective: formSubjective,
                objective: formObjective,
                assessment: formAssessment,
                plan: formPlan,
                updatedAt: now,
              }
            : t
        )
      );
    } else {
      const newTemplate: NoteTemplate = {
        id: crypto.randomUUID(),
        name: formName.trim(),
        category: formCategory,
        subjective: formSubjective,
        objective: formObjective,
        assessment: formAssessment,
        plan: formPlan,
        createdAt: now,
        updatedAt: now,
      };
      setTemplates([...templates, newTemplate]);
    }

    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    setDeleteConfirm(null);
  };

  const getPreviewText = (template: NoteTemplate) => {
    const parts = [
      template.subjective && `S: ${template.subjective}`,
      template.objective && `O: ${template.objective}`,
      template.assessment && `A: ${template.assessment}`,
      template.plan && `P: ${template.plan}`,
    ].filter(Boolean);
    const text = parts.join(' | ');
    return text.length > 120 ? text.slice(0, 120) + '...' : text || 'No content';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Note Templates</h1>
          <p className="mt-1 text-sm text-stone-500">
            Create and manage SOAP note templates for clinical documentation.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1 w-fit">
          <button
            onClick={() => setCategoryFilter('')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === '' ? 'bg-teal-600 text-white' : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                categoryFilter === cat ? 'bg-teal-600 text-white' : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template List */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {filteredTemplates.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">
              {templates.length === 0 ? 'No templates yet' : 'No matching templates'}
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              {templates.length === 0
                ? 'Create your first SOAP note template to get started.'
                : 'Try adjusting your search or filter.'}
            </p>
            {templates.length === 0 && (
              <button
                onClick={openCreateForm}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" />
                Create Template
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        CATEGORY_COLORS[template.category]
                      )}
                    >
                      {template.category}
                    </span>
                    <h3 className="text-sm font-medium text-stone-900">{template.name}</h3>
                  </div>
                  <p className="mt-1 text-xs text-stone-500 truncate max-w-lg">
                    {getPreviewText(template)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEditForm(template)}
                    className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                    title="Edit template"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {deleteConfirm === template.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(template.id)}
                      className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setFormError('');
                    }}
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors',
                      'focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500',
                      formError ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
                    )}
                    placeholder="e.g. Standard Exam Note"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TemplateCategory)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Subjective <span className="text-stone-400">(S)</span>
                </label>
                <textarea
                  value={formSubjective}
                  onChange={(e) => setFormSubjective(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Patient-reported symptoms and concerns..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Objective <span className="text-stone-400">(O)</span>
                </label>
                <textarea
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Clinical findings and observations..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Assessment <span className="text-stone-400">(A)</span>
                </label>
                <textarea
                  value={formAssessment}
                  onChange={(e) => setFormAssessment(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Diagnosis and clinical assessment..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Plan <span className="text-stone-400">(P)</span>
                </label>
                <textarea
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Treatment plan and follow-up..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
