'use client';

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Megaphone,
  FileText,
  Search,
  Plus,
  Mail,
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  X,
  Eye,
  BarChart3,
  MousePointerClick,
  Copy,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type TabId = 'messages' | 'campaigns' | 'templates';

type MessageChannel = 'sms' | 'email';
type MessageStatus = 'delivered' | 'pending' | 'failed' | 'read';

interface Message {
  id: string;
  patientName: string;
  channel: MessageChannel;
  subject: string;
  preview: string;
  status: MessageStatus;
  sentAt: string;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'completed' | 'draft' | 'scheduled';
  sentCount: number;
  openRate: number;
  clickRate: number;
  sentDate: string;
}

interface Template {
  id: string;
  name: string;
  channel: MessageChannel;
  subject: string;
  body: string;
  variables: string[];
  lastUsed: string;
}

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    patientName: 'Sarah Johnson',
    channel: 'sms',
    subject: 'Appointment Reminder',
    preview: 'Hi Sarah, this is a reminder about your cleaning appointment tomorrow at 10:00 AM...',
    status: 'delivered',
    sentAt: '2026-06-01T09:30:00Z',
  },
  {
    id: '2',
    patientName: 'Michael Chen',
    channel: 'email',
    subject: 'Treatment Plan Follow-up',
    preview: 'Dear Michael, we wanted to follow up on the treatment plan we discussed during your last visit...',
    status: 'read',
    sentAt: '2026-06-01T08:15:00Z',
  },
  {
    id: '3',
    patientName: 'Emily Rodriguez',
    channel: 'sms',
    subject: 'Appointment Confirmation',
    preview: 'Your appointment has been confirmed for June 5th at 2:30 PM with Dr. Williams...',
    status: 'delivered',
    sentAt: '2026-05-31T16:45:00Z',
  },
  {
    id: '4',
    patientName: 'James Wilson',
    channel: 'email',
    subject: 'Invoice #1042',
    preview: 'Dear James, please find attached your invoice for services rendered on May 28th...',
    status: 'pending',
    sentAt: '2026-05-31T14:20:00Z',
  },
  {
    id: '5',
    patientName: 'Lisa Thompson',
    channel: 'sms',
    subject: 'Recall Notice',
    preview: 'Hi Lisa, it has been 6 months since your last cleaning. We recommend scheduling your next...',
    status: 'failed',
    sentAt: '2026-05-31T11:00:00Z',
  },
  {
    id: '6',
    patientName: 'David Park',
    channel: 'email',
    subject: 'Post-Procedure Instructions',
    preview: 'Dear David, following your root canal procedure today, please follow these care instructions...',
    status: 'read',
    sentAt: '2026-05-30T17:30:00Z',
  },
  {
    id: '7',
    patientName: 'Amanda Foster',
    channel: 'sms',
    subject: 'Appointment Reminder',
    preview: 'Hi Amanda, just a friendly reminder about your crown appointment on June 3rd at 9:00 AM...',
    status: 'delivered',
    sentAt: '2026-05-30T10:00:00Z',
  },
  {
    id: '8',
    patientName: 'Robert Kim',
    channel: 'email',
    subject: 'Insurance Verification',
    preview: 'Dear Robert, we need to verify your updated insurance information before your upcoming visit...',
    status: 'pending',
    sentAt: '2026-05-29T15:45:00Z',
  },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Summer Whitening Special',
    type: 'Promotion',
    status: 'active',
    sentCount: 842,
    openRate: 34.2,
    clickRate: 8.7,
    sentDate: '2026-05-25',
  },
  {
    id: '2',
    name: 'Recall - 6 Month Checkup',
    type: 'Recall',
    status: 'active',
    sentCount: 156,
    openRate: 48.1,
    clickRate: 22.4,
    sentDate: '2026-05-20',
  },
  {
    id: '3',
    name: 'New Patient Welcome',
    type: 'Onboarding',
    status: 'completed',
    sentCount: 67,
    openRate: 72.5,
    clickRate: 45.3,
    sentDate: '2026-05-15',
  },
  {
    id: '4',
    name: 'Holiday Hours Announcement',
    type: 'Informational',
    status: 'draft',
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    sentDate: '',
  },
  {
    id: '5',
    name: 'Annual Insurance Reminder',
    type: 'Reminder',
    status: 'scheduled',
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    sentDate: '2026-06-15',
  },
];

const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Appointment Reminder',
    channel: 'sms',
    subject: 'Appointment Reminder',
    body: 'Hi {{patient_first_name}}, this is a reminder about your {{appointment_type}} appointment on {{appointment_date}} at {{appointment_time}} with {{provider_name}}. Reply C to confirm or call us to reschedule.',
    variables: ['patient_first_name', 'appointment_type', 'appointment_date', 'appointment_time', 'provider_name'],
    lastUsed: '2026-06-01',
  },
  {
    id: '2',
    name: 'Treatment Plan Follow-up',
    channel: 'email',
    subject: 'Follow-up on Your Treatment Plan',
    body: 'Dear {{patient_name}},\n\nWe wanted to follow up on the treatment plan we discussed during your visit on {{visit_date}}. If you have any questions about the recommended {{treatment_type}}, please do not hesitate to reach out.\n\nBest regards,\n{{practice_name}}',
    variables: ['patient_name', 'visit_date', 'treatment_type', 'practice_name'],
    lastUsed: '2026-05-28',
  },
  {
    id: '3',
    name: 'Recall Notice',
    channel: 'sms',
    subject: 'Time for Your Checkup',
    body: 'Hi {{patient_first_name}}, it has been {{months_since_visit}} months since your last visit to {{practice_name}}. We recommend scheduling your next cleaning and exam. Call us at {{practice_phone}} or reply to book.',
    variables: ['patient_first_name', 'months_since_visit', 'practice_name', 'practice_phone'],
    lastUsed: '2026-05-25',
  },
  {
    id: '4',
    name: 'Post-Procedure Care',
    channel: 'email',
    subject: 'Post-Procedure Care Instructions',
    body: 'Dear {{patient_name}},\n\nFollowing your {{procedure_name}} procedure today, please follow these care instructions:\n\n{{care_instructions}}\n\nIf you experience any unusual symptoms, please call us immediately at {{practice_phone}}.\n\nBest regards,\n{{provider_name}}',
    variables: ['patient_name', 'procedure_name', 'care_instructions', 'practice_phone', 'provider_name'],
    lastUsed: '2026-05-20',
  },
  {
    id: '5',
    name: 'Invoice / Payment Reminder',
    channel: 'email',
    subject: 'Payment Reminder - Invoice #{{invoice_number}}',
    body: 'Dear {{patient_name}},\n\nThis is a friendly reminder that your invoice #{{invoice_number}} for {{amount_due}} is due on {{due_date}}. You can make a payment through our patient portal or by calling our office.\n\nThank you,\n{{practice_name}}',
    variables: ['patient_name', 'invoice_number', 'amount_due', 'due_date', 'practice_name'],
    lastUsed: '2026-05-18',
  },
];

// ═══════════════════ CONSTANTS ═══════════════════

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'templates', label: 'Templates', icon: FileText },
];

const STATUS_CONFIG: Record<MessageStatus, { label: string; icon: React.ComponentType<{ className?: string }>; class: string }> = {
  delivered: { label: 'Delivered', icon: CheckCircle2, class: 'bg-green-100 text-green-700' },
  read: { label: 'Read', icon: Eye, class: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pending', icon: Clock, class: 'bg-amber-100 text-amber-700' },
  failed: { label: 'Failed', icon: XCircle, class: 'bg-red-100 text-red-700' },
};

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  draft: 'bg-stone-100 text-stone-600 border-stone-200',
  scheduled: 'bg-amber-100 text-amber-700 border-amber-200',
};

// ═══════════════════ HELPERS ═══════════════════

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('messages');
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeChannel, setComposeChannel] = useState<MessageChannel>('sms');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const filteredMessages = useMemo(() => {
    if (!search) return MOCK_MESSAGES;
    const q = search.toLowerCase();
    return MOCK_MESSAGES.filter(
      (m) =>
        m.patientName.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredCampaigns = useMemo(() => {
    if (!search) return MOCK_CAMPAIGNS;
    const q = search.toLowerCase();
    return MOCK_CAMPAIGNS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredTemplates = useMemo(() => {
    if (!search) return MOCK_TEMPLATES;
    const q = search.toLowerCase();
    return MOCK_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    );
  }, [search]);

  const handleComposeSend = () => {
    setShowCompose(false);
    setComposeRecipient('');
    setComposeChannel('sms');
    setComposeSubject('');
    setComposeBody('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Communications</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage patient messages, campaigns, and templates
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Compose Message
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch('');
                }}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          {filteredMessages.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No messages found</h3>
              <p className="mt-1 text-xs text-stone-500">
                {search ? 'Try adjusting your search.' : 'Send your first message to get started.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredMessages.map((message) => {
                const statusCfg = STATUS_CONFIG[message.status];
                const StatusIcon = statusCfg.icon;
                return (
                  <div
                    key={message.id}
                    className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-stone-50"
                  >
                    <div className="mt-0.5 shrink-0">
                      {message.channel === 'sms' ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                          <Smartphone className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-stone-900">
                          {message.patientName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                              statusCfg.class
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-stone-700">
                        {message.subject}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-stone-500">
                        {message.preview}
                      </p>
                      <p className="mt-1 text-xs text-stone-400">
                        {formatDate(message.sentAt)} at {formatTime(message.sentAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
              <Megaphone className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No campaigns found</h3>
              <p className="mt-1 text-xs text-stone-500">
                {search ? 'Try adjusting your search.' : 'Create your first campaign to reach patients.'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                        Campaign
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                        Type
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                        Sent
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                        Open Rate
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                        Click Rate
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="border-b border-stone-50 transition-colors hover:bg-stone-50"
                      >
                        <td className="px-5 py-3.5 font-medium text-stone-900">
                          {campaign.name}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                            {campaign.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
                              CAMPAIGN_STATUS_COLORS[campaign.status]
                            )}
                          >
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-stone-700">
                          {campaign.sentCount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {campaign.openRate > 0 ? (
                            <span className="flex items-center justify-end gap-1 text-stone-700">
                              <BarChart3 className="h-3 w-3 text-stone-400" />
                              {campaign.openRate}%
                            </span>
                          ) : (
                            <span className="text-stone-400">--</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {campaign.clickRate > 0 ? (
                            <span className="flex items-center justify-end gap-1 text-stone-700">
                              <MousePointerClick className="h-3 w-3 text-stone-400" />
                              {campaign.clickRate}%
                            </span>
                          ) : (
                            <span className="text-stone-400">--</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-stone-500">
                          {campaign.sentDate
                            ? formatDate(campaign.sentDate)
                            : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
              <FileText className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No templates found</h3>
              <p className="mt-1 text-xs text-stone-500">
                {search ? 'Try adjusting your search.' : 'Create reusable message templates.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-stone-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {template.channel === 'sms' ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                          <Smartphone className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-medium text-stone-900">
                          {template.name}
                        </h3>
                        <p className="text-xs text-stone-500">
                          Last used: {formatDate(template.lastUsed)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-stone-50 p-3">
                    <p className="text-xs leading-relaxed text-stone-600">
                      {template.body.length > 180
                        ? template.body.slice(0, 180) + '...'
                        : template.body}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.variables.map((v) => (
                      <span
                        key={v}
                        className="rounded-md bg-teal-50 px-2 py-0.5 font-mono text-xs text-teal-700"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-900">Compose Message</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              {/* Recipient */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Recipient
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={composeRecipient}
                    onChange={(e) => setComposeRecipient(e.target.value)}
                    placeholder="Search patient by name..."
                    className="w-full rounded-lg border border-stone-300 py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Channel */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Channel
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setComposeChannel('sms')}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                      composeChannel === 'sms'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    <Smartphone className="h-4 w-4" />
                    SMS
                  </button>
                  <button
                    onClick={() => setComposeChannel('email')}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                      composeChannel === 'email'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                </div>
              </div>

              {/* Subject */}
              {composeChannel === 'email' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Body */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Message
                </label>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  rows={5}
                  placeholder="Type your message..."
                  className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComposeSend}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
