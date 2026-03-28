'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  MessageSquare,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Mail,
  Phone,
  Smartphone,
  Bell,
  FileText,
  Printer,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Loader2,
  BarChart3,
  Inbox,
  TrendingUp,
} from 'lucide-react';

// ---------- Types ----------

type CommunicationType = 'EMAIL' | 'SMS' | 'PHONE_CALL' | 'IN_APP' | 'LETTER' | 'FAX';
type CommunicationDirection = 'OUTBOUND' | 'INBOUND';
type CommunicationStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'BOUNCED' | 'DRAFT';

interface Communication {
  id: string;
  patientId: string;
  patientName: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  subject?: string;
  body: string;
  sentAt: string;
  createdAt: string;
}

interface CommunicationListResponse {
  data: Communication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CommunicationStats {
  totalThisMonth: number;
  byType: Record<CommunicationType, number>;
  outboundCount: number;
  inboundCount: number;
  responseRate: number;
}

interface PatientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
}

interface NewCommunication {
  patientId: string;
  type: CommunicationType;
  direction: 'OUTBOUND';
  subject?: string;
  body: string;
}

interface BulkSendPayload {
  patientIds: string[];
  type: CommunicationType;
  subject?: string;
  body: string;
}

// ---------- Constants ----------

const COMMUNICATION_TYPES: { value: CommunicationType; label: string }[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'PHONE_CALL', label: 'Phone Call' },
  { value: 'IN_APP', label: 'In-App' },
  { value: 'LETTER', label: 'Letter' },
  { value: 'FAX', label: 'Fax' },
];

const TYPE_BADGE_STYLES: Record<CommunicationType, string> = {
  EMAIL: 'bg-blue-50 text-blue-700',
  SMS: 'bg-green-50 text-green-700',
  PHONE_CALL: 'bg-amber-50 text-amber-700',
  IN_APP: 'bg-teal-50 text-teal-700',
  LETTER: 'bg-stone-100 text-stone-700',
  FAX: 'bg-purple-50 text-purple-700',
};

const TYPE_ICONS: Record<CommunicationType, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  SMS: <Smartphone className="h-3.5 w-3.5" />,
  PHONE_CALL: <Phone className="h-3.5 w-3.5" />,
  IN_APP: <Bell className="h-3.5 w-3.5" />,
  LETTER: <FileText className="h-3.5 w-3.5" />,
  FAX: <Printer className="h-3.5 w-3.5" />,
};

const STATUS_BADGE_STYLES: Record<CommunicationStatus, string> = {
  SENT: 'bg-teal-50 text-teal-700',
  DELIVERED: 'bg-green-50 text-green-700',
  READ: 'bg-blue-50 text-blue-700',
  FAILED: 'bg-red-50 text-red-700',
  BOUNCED: 'bg-amber-50 text-amber-700',
  DRAFT: 'bg-stone-100 text-stone-600',
};

// ---------- Component ----------

export default function CommunicationsPage() {
  const queryClient = useQueryClient();

  // Filter state
  const [typeFilter, setTypeFilter] = useState<CommunicationType | ''>('');
  const [directionFilter, setDirectionFilter] = useState<CommunicationDirection | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [composeType, setComposeType] = useState<CommunicationType>('EMAIL');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // Build query params
  const buildParams = () => {
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (directionFilter) params.set('direction', directionFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return params.toString();
  };

  // Queries
  const {
    data: communicationsData,
    isLoading: isLoadingList,
    isError: isListError,
  } = useQuery<CommunicationListResponse>({
    queryKey: ['communications', typeFilter, directionFilter, dateFrom, dateTo, page],
    queryFn: () => apiGet<CommunicationListResponse>(`/api/communications?${buildParams()}`),
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useQuery<CommunicationStats>({
    queryKey: ['communications-stats'],
    queryFn: () => apiGet<CommunicationStats>('/api/communications/stats'),
  });

  const {
    data: patientResults,
  } = useQuery<PatientSearchResult[]>({
    queryKey: ['patient-search', patientSearch],
    queryFn: () => apiGet<PatientSearchResult[]>(`/api/patients?search=${encodeURIComponent(patientSearch)}&limit=10`),
    enabled: patientSearch.length >= 2,
  });

  // Mutations
  const sendMutation = useMutation({
    mutationFn: (payload: NewCommunication) =>
      apiPost<Communication, NewCommunication>('/api/communications', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      queryClient.invalidateQueries({ queryKey: ['communications-stats'] });
      resetCompose();
    },
  });

  const bulkSendMutation = useMutation({
    mutationFn: (payload: BulkSendPayload) =>
      apiPost<{ sent: number }, BulkSendPayload>('/api/communications/bulk-send', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      queryClient.invalidateQueries({ queryKey: ['communications-stats'] });
      resetCompose();
    },
  });

  const resetCompose = () => {
    setShowCompose(false);
    setShowBulkSend(false);
    setComposeType('EMAIL');
    setComposeSubject('');
    setComposeBody('');
    setSelectedPatientId('');
    setSelectedPatientName('');
    setPatientSearch('');
  };

  const handleSend = () => {
    if (!selectedPatientId || !composeBody.trim()) return;
    sendMutation.mutate({
      patientId: selectedPatientId,
      type: composeType,
      direction: 'OUTBOUND',
      subject: composeSubject || undefined,
      body: composeBody,
    });
  };

  const handleSelectPatient = (patient: PatientSearchResult) => {
    setSelectedPatientId(patient.id);
    setSelectedPatientName(`${patient.firstName} ${patient.lastName}`);
    setPatientSearch('');
  };

  const communications = communicationsData?.data ?? [];
  const totalPages = communicationsData?.totalPages ?? 1;

  const showSubjectField = composeType === 'EMAIL' || composeType === 'LETTER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-50 p-2.5">
            <MessageSquare className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Communication Hub</h1>
            <p className="text-sm text-stone-500">Manage patient communications across all channels</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowBulkSend(true);
              setShowCompose(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Users className="h-4 w-4" />
            Bulk Send
          </button>
          <button
            onClick={() => {
              setShowCompose(true);
              setShowBulkSend(false);
            }}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Message
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <BarChart3 className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total This Month</p>
              {isLoadingStats ? (
                <div className="mt-1 h-6 w-16 animate-pulse rounded bg-stone-100" />
              ) : (
                <p className="text-xl font-bold text-stone-900">{stats?.totalThisMonth ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Outbound</p>
              {isLoadingStats ? (
                <div className="mt-1 h-6 w-16 animate-pulse rounded bg-stone-100" />
              ) : (
                <p className="text-xl font-bold text-stone-900">{stats?.outboundCount ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Inbox className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Inbound</p>
              {isLoadingStats ? (
                <div className="mt-1 h-6 w-16 animate-pulse rounded bg-stone-100" />
              ) : (
                <p className="text-xl font-bold text-stone-900">{stats?.inboundCount ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Response Rate</p>
              {isLoadingStats ? (
                <div className="mt-1 h-6 w-16 animate-pulse rounded bg-stone-100" />
              ) : (
                <p className="text-xl font-bold text-stone-900">
                  {(stats?.responseRate ?? 0).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compose Panel */}
      {(showCompose || showBulkSend) && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">
              {showBulkSend ? 'Bulk Send' : 'New Message'}
            </h2>
            <button
              onClick={resetCompose}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Patient Search (single message only) */}
            {showCompose && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Patient
                </label>
                {selectedPatientId ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900">
                      {selectedPatientName}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedPatientId('');
                        setSelectedPatientName('');
                      }}
                      className="rounded p-1 text-stone-400 hover:text-stone-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Search patients by name..."
                      className="w-full rounded-lg border border-stone-200 py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {patientSearch.length >= 2 && patientResults && patientResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                        {patientResults.map((patient) => (
                          <button
                            key={patient.id}
                            onClick={() => handleSelectPatient(patient)}
                            className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                          >
                            {patient.firstName} {patient.lastName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Type Selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Type</label>
              <div className="flex flex-wrap gap-2">
                {COMMUNICATION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setComposeType(t.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                      composeType === t.value
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    {TYPE_ICONS[t.value]}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            {showSubjectField && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            )}

            {/* Body */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Message</label>
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={resetCompose}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={
                  showCompose
                    ? !selectedPatientId || !composeBody.trim() || sendMutation.isPending
                    : !composeBody.trim() || bulkSendMutation.isPending
                }
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {(sendMutation.isPending || bulkSendMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {showBulkSend ? 'Send to All' : 'Send'}
              </button>
            </div>

            {/* Mutation Errors */}
            {sendMutation.isError && (
              <p className="text-sm text-red-600">
                Failed to send message. Please try again.
              </p>
            )}
            {bulkSendMutation.isError && (
              <p className="text-sm text-red-600">
                Failed to send bulk messages. Please try again.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as CommunicationType | '');
              setPage(1);
            }}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Types</option>
            {COMMUNICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={directionFilter}
            onChange={(e) => {
              setDirectionFilter(e.target.value as CommunicationDirection | '');
              setPage(1);
            }}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Directions</option>
            <option value="OUTBOUND">Outbound</option>
            <option value="INBOUND">Inbound</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        {(typeFilter || directionFilter || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setTypeFilter('');
              setDirectionFilter('');
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Communications Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {isLoadingList ? (
          <div className="space-y-3 p-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-stone-100" />
            ))}
          </div>
        ) : isListError ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-lg font-medium text-stone-700">Failed to load communications</h3>
            <p className="mt-1 text-sm text-stone-500">
              There was an error loading the communication list. Please try again later.
            </p>
          </div>
        ) : communications.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-lg font-medium text-stone-700">No communications found</h3>
            <p className="mt-1 text-sm text-stone-500">
              {typeFilter || directionFilter || dateFrom || dateTo
                ? 'Try adjusting your filters.'
                : 'Send your first message to get started.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="px-4 py-3 text-left font-medium text-stone-500 w-10" />
                <th className="px-4 py-3 text-left font-medium text-stone-500">Patient</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Type</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Subject / Preview</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {communications.map((comm) => (
                <tr
                  key={comm.id}
                  className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                >
                  {/* Direction icon */}
                  <td className="px-4 py-3">
                    {comm.direction === 'OUTBOUND' ? (
                      <ArrowUpRight className="h-4 w-4 text-blue-500" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-amber-500" />
                    )}
                  </td>
                  {/* Patient Name */}
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {comm.patientName}
                  </td>
                  {/* Type Badge */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        TYPE_BADGE_STYLES[comm.type]
                      )}
                    >
                      {TYPE_ICONS[comm.type]}
                      {COMMUNICATION_TYPES.find((t) => t.value === comm.type)?.label ?? comm.type}
                    </span>
                  </td>
                  {/* Subject / Preview */}
                  <td className="px-4 py-3 text-stone-700 max-w-xs truncate">
                    {comm.subject || comm.body.slice(0, 80)}
                    {!comm.subject && comm.body.length > 80 ? '...' : ''}
                  </td>
                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        STATUS_BADGE_STYLES[comm.status]
                      )}
                    >
                      {comm.status}
                    </span>
                  </td>
                  {/* Date/Time */}
                  <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                    {format(new Date(comm.sentAt || comm.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!isLoadingList && !isListError && communications.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
            <p className="text-sm text-stone-500">
              Page {page} of {totalPages} ({communicationsData?.total ?? 0} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
