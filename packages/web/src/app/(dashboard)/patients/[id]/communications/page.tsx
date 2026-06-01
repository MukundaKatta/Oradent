'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  FileText,
  Plus,
  X,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type CommType = 'Email' | 'SMS' | 'Phone' | 'Letter';
type CommStatus = 'Sent' | 'Failed' | 'Pending';

interface Communication {
  id: string;
  date: string;
  type: CommType;
  subject: string;
  status: CommStatus;
  notes: string;
}

// ═══════════════════ CONSTANTS ═══════════════════

const COMM_TYPES: CommType[] = ['Email', 'SMS', 'Phone', 'Letter'];

const TYPE_ICONS: Record<CommType, typeof Mail> = {
  Email: Mail,
  SMS: MessageSquare,
  Phone: Phone,
  Letter: FileText,
};

const TYPE_COLORS: Record<CommType, string> = {
  Email: 'bg-blue-50 text-blue-600',
  SMS: 'bg-teal-50 text-teal-600',
  Phone: 'bg-amber-50 text-amber-600',
  Letter: 'bg-purple-50 text-purple-600',
};

const STATUS_COLORS: Record<CommStatus, string> = {
  Sent: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Pending: 'bg-amber-100 text-amber-700',
};

const STATUS_ICONS: Record<CommStatus, typeof CheckCircle> = {
  Sent: CheckCircle,
  Failed: XCircle,
  Pending: Clock,
};

// ═══════════════════ SEED DATA ═══════════════════

function getInitialComms(): Communication[] {
  return [
    { id: '1', date: '2026-06-01T09:30:00', type: 'Email', subject: 'Appointment Reminder - June 3', status: 'Sent', notes: 'Automated reminder for upcoming cleaning' },
    { id: '2', date: '2026-05-28T14:15:00', type: 'SMS', subject: 'Appointment Confirmation', status: 'Sent', notes: 'Patient confirmed via text reply' },
    { id: '3', date: '2026-05-25T11:00:00', type: 'Phone', subject: 'Follow-up call re: treatment plan', status: 'Sent', notes: 'Discussed crown options and scheduling' },
    { id: '4', date: '2026-05-20T16:45:00', type: 'Email', subject: 'Insurance Pre-Authorization Update', status: 'Sent', notes: 'Notified about approved pre-auth for D2740' },
    { id: '5', date: '2026-05-18T08:00:00', type: 'SMS', subject: '48-Hour Appointment Reminder', status: 'Failed', notes: 'Invalid phone number on file' },
    { id: '6', date: '2026-05-10T10:30:00', type: 'Letter', subject: 'Recall Notice - 6 Month Checkup', status: 'Sent', notes: 'Mailed recall postcard' },
    { id: '7', date: '2026-05-05T13:00:00', type: 'Email', subject: 'Treatment Plan Summary', status: 'Pending', notes: 'Awaiting provider review before sending' },
  ];
}

// ═══════════════════ HELPERS ═══════════════════

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function PatientCommunicationsPage() {
  const params = useParams();
  const patientId = params.id as string;

  const storageKey = `oradent-comms-${patientId}`;
  const [communications, setCommunications] = useLocalStorage<Communication[]>(
    storageKey,
    getInitialComms()
  );
  const [typeFilter, setTypeFilter] = useState<CommType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formType, setFormType] = useState<CommType>('Email');
  const [formSubject, setFormSubject] = useState('');
  const [formStatus, setFormStatus] = useState<CommStatus>('Sent');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredComms = useMemo(() => {
    let result = communications;
    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [communications, typeFilter]);

  const handleSubmit = () => {
    if (!formSubject.trim()) return;
    const newComm: Communication = {
      id: generateId(),
      date: new Date().toISOString(),
      type: formType,
      subject: formSubject.trim(),
      status: formStatus,
      notes: formNotes.trim(),
    };
    setCommunications((prev) => [newComm, ...prev]);
    setFormType('Email');
    setFormSubject('');
    setFormStatus('Sent');
    setFormNotes('');
    setShowModal(false);
  };

  // Stats
  const totalComms = communications.length;
  const sentCount = communications.filter((c) => c.status === 'Sent').length;
  const failedCount = communications.filter((c) => c.status === 'Failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2">
            <Link
              href={`/patients/${patientId}`}
              className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Patient
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Communication Log</h1>
          <p className="mt-1 text-sm text-stone-500">
            Timeline of all patient communications
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Communication
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <MessageSquare className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Messages</p>
              <p className="text-xl font-bold text-stone-900">{totalComms}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Sent Successfully</p>
              <p className="text-xl font-bold text-stone-900">{sentCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Failed</p>
              <p className="text-xl font-bold text-stone-900">{failedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-stone-400" />
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
          <button
            onClick={() => setTypeFilter('')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              typeFilter === '' ? 'bg-teal-600 text-white' : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            All
          </button>
          {COMM_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type];
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  typeFilter === type
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          </div>
        ) : filteredComms.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No communications found</h3>
            <p className="mt-1 text-xs text-stone-500">
              {typeFilter ? 'Try removing the filter.' : 'Log a communication to get started.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredComms.map((comm) => {
              const TypeIcon = TYPE_ICONS[comm.type];
              const StatusIcon = STATUS_ICONS[comm.status];
              return (
                <div key={comm.id} className="flex gap-4 px-6 py-4 transition-colors hover:bg-stone-50">
                  {/* Icon */}
                  <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', TYPE_COLORS[comm.type])}>
                    <TypeIcon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-900">{comm.subject}</p>
                        {comm.notes && (
                          <p className="mt-1 text-sm text-stone-500">{comm.notes}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                            STATUS_COLORS[comm.status]
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {comm.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                      <span>{formatDateTime(comm.date)}</span>
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-500">
                        {comm.type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Communication Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Log Communication</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Type</label>
                <div className="flex gap-2">
                  {COMM_TYPES.map((type) => {
                    const Icon = TYPE_ICONS[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setFormType(type)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                          formType === type
                            ? 'border-teal-300 bg-teal-50 text-teal-700'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Subject</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g., Appointment reminder call"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as CommStatus)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Sent">Sent</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional details..."
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formSubject.trim()}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Log Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
