'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  Eye,
  FileText,
  UserPlus,
  CheckCircle,
  Clock,
  Archive,
  Filter,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type TemplateStatus = 'Active' | 'Draft' | 'Archived';
type TemplateType = 'General Consent' | 'Treatment Consent' | 'HIPAA Notice' | 'Financial Agreement' | 'Photography Release';

interface ConsentTemplate {
  id: string;
  name: string;
  type: TemplateType;
  version: string;
  lastUpdated: string;
  status: TemplateStatus;
  description: string;
  content: string;
  signatureCount: number;
}

// ═══════════════════ CONSTANTS ═══════════════════

const STATUS_COLORS: Record<TemplateStatus, string> = {
  Active: 'bg-green-100 text-green-700',
  Draft: 'bg-amber-100 text-amber-700',
  Archived: 'bg-stone-100 text-stone-500',
};

const STATUS_ICONS: Record<TemplateStatus, typeof CheckCircle> = {
  Active: CheckCircle,
  Draft: Clock,
  Archived: Archive,
};

const ALL_STATUSES: TemplateStatus[] = ['Active', 'Draft', 'Archived'];
const ALL_TYPES: TemplateType[] = ['General Consent', 'Treatment Consent', 'HIPAA Notice', 'Financial Agreement', 'Photography Release'];

const MOCK_PATIENTS = [
  'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'James Wilson',
  'Lisa Park', 'David Kim', 'Amanda Foster', 'Robert Taylor',
];

const MOCK_TEMPLATES: ConsentTemplate[] = [
  {
    id: '1',
    name: 'General Consent for Treatment',
    type: 'General Consent',
    version: '3.2',
    lastUpdated: '2026-04-15',
    status: 'Active',
    description: 'Standard consent form for all dental procedures',
    content: `GENERAL CONSENT FOR DENTAL TREATMENT

I hereby authorize the dentist(s) and staff of Oradent Dental Practice to perform dental treatments and procedures as may be deemed necessary or advisable for my dental health, including but not limited to:

1. DIAGNOSTIC PROCEDURES: Including but not limited to radiographs (x-rays), study models, photographs, and other diagnostic aids deemed necessary.

2. GENERAL DENTAL PROCEDURES: Including but not limited to prophylaxis (cleaning), fluoride treatments, sealants, fillings, crowns, bridges, extractions, root canals, periodontal treatments, and other restorative and preventive procedures.

3. MEDICATIONS: Administration of anesthetic agents and/or prescription of medications as deemed necessary.

4. RISKS: I understand that there are risks inherent in any dental treatment including but not limited to: prolonged numbness, allergic reactions, infection, swelling, bleeding, nerve damage, and treatment failure.

5. ALTERNATIVES: I understand that alternatives to treatment include no treatment at all.

I acknowledge that no guarantees have been made regarding the outcome of the treatment.

Patient Signature: ___________________________  Date: ____________
Witness Signature: ___________________________  Date: ____________`,
    signatureCount: 245,
  },
  {
    id: '2',
    name: 'Informed Consent - Surgical Extraction',
    type: 'Treatment Consent',
    version: '2.1',
    lastUpdated: '2026-03-20',
    status: 'Active',
    description: 'Consent for surgical tooth extraction procedures',
    content: `INFORMED CONSENT FOR SURGICAL EXTRACTION

Tooth/Teeth Number(s): _______________

I understand that the following procedure is recommended: Surgical extraction of the tooth/teeth identified above.

RISKS AND COMPLICATIONS may include:
- Pain, swelling, and bruising
- Bleeding and infection
- Damage to adjacent teeth or restorations
- Jaw fracture
- Sinus involvement (upper teeth)
- Temporary or permanent numbness of the lip, tongue, or chin
- Dry socket (alveolar osteitis)
- TMJ (jaw joint) discomfort

ALTERNATIVES: I have been informed of alternatives including no treatment, non-surgical extraction, or referral to a specialist.

I certify that I have read and understand this document and all my questions have been answered.

Patient Signature: ___________________________  Date: ____________`,
    signatureCount: 89,
  },
  {
    id: '3',
    name: 'HIPAA Privacy Notice',
    type: 'HIPAA Notice',
    version: '4.0',
    lastUpdated: '2026-01-01',
    status: 'Active',
    description: 'Notice of privacy practices for patient health information',
    content: `NOTICE OF PRIVACY PRACTICES

THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.

OUR OBLIGATIONS: We are required by law to maintain the privacy of your protected health information (PHI) and to provide you with this notice of our legal duties and privacy practices.

HOW WE MAY USE YOUR INFORMATION:
- Treatment: To provide, coordinate, or manage your dental care
- Payment: To obtain payment for services provided
- Healthcare Operations: For quality assessment and improvement activities
- As Required by Law: When required by federal, state, or local law

YOUR RIGHTS:
- Right to inspect and copy your PHI
- Right to request amendment of your PHI
- Right to an accounting of disclosures
- Right to request restrictions on certain uses
- Right to request confidential communications

I acknowledge receipt of this Notice of Privacy Practices.

Patient Signature: ___________________________  Date: ____________`,
    signatureCount: 312,
  },
  {
    id: '4',
    name: 'Financial Agreement & Payment Policy',
    type: 'Financial Agreement',
    version: '2.5',
    lastUpdated: '2026-02-10',
    status: 'Active',
    description: 'Patient financial responsibilities and payment terms',
    content: `FINANCIAL AGREEMENT & PAYMENT POLICY

PATIENT FINANCIAL RESPONSIBILITY:

1. PAYMENT: Payment is due at the time of service unless prior arrangements have been made. We accept cash, checks, credit cards, and CareCredit.

2. INSURANCE: We will submit claims to your insurance company as a courtesy. However, you are responsible for all charges regardless of insurance coverage.

3. ESTIMATED COSTS: Treatment estimates are approximate and not a guarantee of final costs. Additional procedures may be necessary during treatment.

4. MISSED APPOINTMENTS: A fee of $50 may be charged for appointments missed without 24-hour notice.

5. COLLECTIONS: Accounts past due 90 days may be referred to a collection agency. You will be responsible for collection costs and attorney fees.

6. INTEREST: Unpaid balances may accrue interest at 1.5% per month after 60 days.

I have read and understand the above financial policies.

Patient Signature: ___________________________  Date: ____________`,
    signatureCount: 198,
  },
  {
    id: '5',
    name: 'Photography & Media Release',
    type: 'Photography Release',
    version: '1.3',
    lastUpdated: '2026-03-05',
    status: 'Active',
    description: 'Consent for clinical photography and media use',
    content: `PHOTOGRAPHY & MEDIA RELEASE CONSENT

I authorize Oradent Dental Practice to take photographs, videos, and/or digital images of my face, teeth, and oral structures for the following purposes:

[ ] Clinical record documentation
[ ] Educational purposes and case presentations
[ ] Marketing materials (website, social media, brochures)
[ ] Before/after treatment comparisons
[ ] Publication in dental journals or textbooks

I understand that:
- My identity will be kept confidential unless I provide separate written consent
- I may revoke this consent at any time in writing
- Images used for marketing will not include identifying information without additional consent
- I will not receive compensation for the use of these images

Patient Signature: ___________________________  Date: ____________`,
    signatureCount: 156,
  },
  {
    id: '6',
    name: 'Informed Consent - Root Canal',
    type: 'Treatment Consent',
    version: '1.0',
    lastUpdated: '2026-05-10',
    status: 'Draft',
    description: 'Consent for endodontic (root canal) treatment',
    content: `INFORMED CONSENT FOR ENDODONTIC TREATMENT (DRAFT)

This form is currently under review and has not been finalized.

Tooth Number: _______________

PROCEDURE: Root canal therapy involves removing the infected or inflamed pulp tissue from inside the tooth, cleaning and shaping the root canals, and filling them with a biocompatible material.

RISKS include but are not limited to:
- Instrument separation
- Perforation of the root
- Incomplete treatment
- Need for retreatment or extraction
- Post-operative pain and swelling

Patient Signature: ___________________________  Date: ____________`,
    signatureCount: 0,
  },
  {
    id: '7',
    name: 'Pediatric Consent (Guardian)',
    type: 'General Consent',
    version: '1.2',
    lastUpdated: '2025-11-20',
    status: 'Archived',
    description: 'Parental/guardian consent for minor patients - replaced by v2.0',
    content: `PARENTAL/GUARDIAN CONSENT FOR MINOR PATIENT (ARCHIVED)

This form has been superseded by version 2.0.

Guardian Name: ___________________________
Patient (Minor) Name: ___________________________
Relationship: ___________________________

I, the undersigned parent/legal guardian, authorize dental treatment for the above-named minor.

Guardian Signature: ___________________________  Date: ____________`,
    signatureCount: 67,
  },
  {
    id: '8',
    name: 'Sedation Consent Form',
    type: 'Treatment Consent',
    version: '1.5',
    lastUpdated: '2026-04-01',
    status: 'Active',
    description: 'Consent for conscious sedation during dental procedures',
    content: `INFORMED CONSENT FOR CONSCIOUS SEDATION

I consent to the administration of sedation medications during my dental treatment.

TYPE OF SEDATION:
[ ] Nitrous oxide (laughing gas)
[ ] Oral sedation
[ ] IV sedation

RISKS include: nausea, vomiting, allergic reaction, respiratory depression, and in rare cases, more serious complications.

PRE-OPERATIVE INSTRUCTIONS:
- No food or drink 6 hours before appointment (oral/IV sedation)
- Arrange for transportation home
- Wear comfortable, loose-fitting clothing

Patient Signature: ___________________________  Date: ____________`,
    signatureCount: 42,
  },
];

// ═══════════════════ HELPERS ═══════════════════

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function ConsentFormsPage() {
  const [templates, setTemplates] = useState<ConsentTemplate[]>(MOCK_TEMPLATES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<TemplateType | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showPreview, setShowPreview] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null);

  // Assign form
  const [assignPatient, setAssignPatient] = useState('');
  const [assignMethod, setAssignMethod] = useState<'in-office' | 'email' | 'portal'>('in-office');
  const [assignSubmitted, setAssignSubmitted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (statusFilter) result = result.filter((t) => t.status === statusFilter);
    if (typeFilter) result = result.filter((t) => t.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [templates, search, statusFilter, typeFilter]);

  const openPreview = (template: ConsentTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const openAssign = (template: ConsentTemplate) => {
    setSelectedTemplate(template);
    setAssignPatient('');
    setAssignMethod('in-office');
    setAssignSubmitted(false);
    setShowAssign(true);
  };

  const handleAssign = () => {
    if (!assignPatient) return;
    setAssignSubmitted(true);
    setTimeout(() => {
      setShowAssign(false);
      setSelectedTemplate(null);
      setAssignSubmitted(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Consent Forms</h1>
          <p className="mt-1 text-sm text-stone-500">Manage consent form templates and patient signatures</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors">
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Active Templates</p>
              <p className="text-xl font-bold text-stone-900">
                {templates.filter((t) => t.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <PenLine className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Signatures</p>
              <p className="text-xl font-bold text-stone-900">
                {templates.reduce((sum, t) => sum + t.signatureCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Drafts</p>
              <p className="text-xl font-bold text-stone-900">
                {templates.filter((t) => t.status === 'Draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TemplateStatus | '')}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TemplateType | '')}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Types</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Template List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-100" />
          ))
        ) : filteredTemplates.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No templates found</h3>
            <p className="mt-1 text-xs text-stone-500">
              {search || statusFilter || typeFilter
                ? 'Try adjusting your filters.'
                : 'Create a new template to get started.'}
            </p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const StatusIcon = STATUS_ICONS[template.status];
            return (
              <div
                key={template.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-stone-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-stone-100 p-2.5">
                      <FileText className="h-5 w-5 text-stone-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-900">{template.name}</h3>
                      <p className="mt-0.5 text-sm text-stone-500">{template.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                          {template.type}
                        </span>
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[template.status])}>
                          <StatusIcon className="h-3 w-3" />
                          {template.status}
                        </span>
                        <span className="text-xs text-stone-400">
                          v{template.version}
                        </span>
                        <span className="text-xs text-stone-400">
                          Updated {formatDate(template.lastUpdated)}
                        </span>
                        <span className="text-xs text-stone-400">
                          {template.signatureCount} signatures
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openPreview(template)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                    {template.status === 'Active' && (
                      <button
                        onClick={() => openAssign(template)}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">{selectedTemplate.name}</h2>
                <p className="mt-0.5 text-sm text-stone-500">Version {selectedTemplate.version}</p>
              </div>
              <button
                onClick={() => { setShowPreview(false); setSelectedTemplate(null); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700">
                {selectedTemplate.content}
              </pre>
            </div>
            <div className="flex justify-end gap-3 border-t border-stone-200 px-6 py-4">
              <button
                onClick={() => { setShowPreview(false); setSelectedTemplate(null); }}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Close
              </button>
              {selectedTemplate.status === 'Active' && (
                <button
                  onClick={() => {
                    setShowPreview(false);
                    openAssign(selectedTemplate);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign to Patient
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign to Patient Modal */}
      {showAssign && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Assign Consent Form</h2>
              <button
                onClick={() => { setShowAssign(false); setSelectedTemplate(null); setAssignSubmitted(false); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {assignSubmitted ? (
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-stone-900">Form Assigned!</p>
                <p className="mt-1 text-xs text-stone-500">
                  {assignMethod === 'email'
                    ? 'The form has been sent to the patient via email.'
                    : assignMethod === 'portal'
                    ? 'The form is now available in the patient portal.'
                    : 'Ready for in-office signature.'}
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg bg-stone-50 p-3">
                  <p className="text-xs font-medium text-stone-500">Form</p>
                  <p className="mt-0.5 text-sm font-medium text-stone-900">{selectedTemplate.name}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Select Patient</label>
                  <select
                    value={assignPatient}
                    onChange={(e) => setAssignPatient(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Choose a patient...</option>
                    {MOCK_PATIENTS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Signature Method</label>
                  <div className="space-y-2">
                    {[
                      { value: 'in-office' as const, label: 'In-Office (Tablet)', desc: 'Patient signs on office tablet' },
                      { value: 'email' as const, label: 'Email', desc: 'Send form via email for e-signature' },
                      { value: 'portal' as const, label: 'Patient Portal', desc: 'Make available in patient portal' },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                          assignMethod === opt.value
                            ? 'border-teal-300 bg-teal-50'
                            : 'border-stone-200 hover:border-stone-300'
                        )}
                      >
                        <input
                          type="radio"
                          name="method"
                          value={opt.value}
                          checked={assignMethod === opt.value}
                          onChange={() => setAssignMethod(opt.value)}
                          className="mt-0.5 accent-teal-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-stone-900">{opt.label}</p>
                          <p className="text-xs text-stone-500">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => { setShowAssign(false); setSelectedTemplate(null); }}
                    className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={!assignPatient}
                    className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PenLine className="h-4 w-4" />
                    Send for Signature
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
