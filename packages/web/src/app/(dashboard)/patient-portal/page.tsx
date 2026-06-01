'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  FileText,
  DollarSign,
  MessageSquare,
  Clock,
  Shield,
  Eye,
  Settings,
  User,
  Send,
  CreditCard,
  Download,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_APPOINTMENTS = [
  { id: '1', date: '2026-06-05', time: '9:00 AM', provider: 'Dr. Sarah Miller', type: 'Cleaning', status: 'Confirmed' },
  { id: '2', date: '2026-06-18', time: '2:30 PM', provider: 'Dr. James Park', type: 'Crown Prep', status: 'Pending' },
  { id: '3', date: '2026-07-10', time: '10:00 AM', provider: 'Dr. Sarah Miller', type: 'Follow-up', status: 'Confirmed' },
];

const MOCK_TREATMENTS = [
  { id: '1', date: '2026-05-15', procedure: 'Composite Filling #14', provider: 'Dr. James Park', cost: 225 },
  { id: '2', date: '2026-04-20', procedure: 'Dental Cleaning & Exam', provider: 'Dr. Sarah Miller', cost: 180 },
  { id: '3', date: '2026-03-10', procedure: 'X-Rays (Full Mouth)', provider: 'Dr. Sarah Miller', cost: 150 },
  { id: '4', date: '2026-02-05', procedure: 'Root Canal #19', provider: 'Dr. James Park', cost: 950 },
];

const MOCK_DOCUMENTS = [
  { id: '1', name: 'Treatment Plan - Crown #14', date: '2026-05-20', type: 'Treatment Plan' },
  { id: '2', name: 'Insurance Explanation of Benefits', date: '2026-05-01', type: 'Insurance' },
  { id: '3', name: 'Dental X-Ray Report', date: '2026-04-20', type: 'Imaging' },
  { id: '4', name: 'HIPAA Privacy Notice', date: '2026-01-15', type: 'Consent' },
];

const MOCK_INSURANCE = {
  provider: 'Delta Dental PPO',
  memberId: 'DDL-2847391',
  groupNumber: 'GRP-104829',
  subscriber: 'Sarah Johnson',
  relationship: 'Self',
  effectiveDate: '2026-01-01',
  annualMax: 2000,
  used: 555,
  remaining: 1445,
  deductible: 50,
  deductibleMet: true,
  coverages: [
    { category: 'Preventive', percentage: 100 },
    { category: 'Basic', percentage: 80 },
    { category: 'Major', percentage: 50 },
    { category: 'Orthodontic', percentage: 0 },
  ],
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function PatientPortalPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'request' | 'message'>('overview');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Appointment request form
  const [reqDate, setReqDate] = useState('');
  const [reqTime, setReqTime] = useState('morning');
  const [reqReason, setReqReason] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqSubmitted, setReqSubmitted] = useState(false);

  // Message form
  const [msgSubject, setMsgSubject] = useState('');
  const [msgProvider, setMsgProvider] = useState('Dr. Sarah Miller');
  const [msgBody, setMsgBody] = useState('');
  const [msgSubmitted, setMsgSubmitted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const handleRequestSubmit = () => {
    if (!reqDate || !reqReason.trim()) return;
    setReqSubmitted(true);
    setTimeout(() => {
      setShowRequestModal(false);
      setReqSubmitted(false);
      setReqDate('');
      setReqTime('morning');
      setReqReason('');
      setReqNotes('');
    }, 1500);
  };

  const handleMessageSubmit = () => {
    if (!msgSubject.trim() || !msgBody.trim()) return;
    setMsgSubmitted(true);
    setTimeout(() => {
      setShowMessageModal(false);
      setMsgSubmitted(false);
      setMsgSubject('');
      setMsgBody('');
    }, 1500);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const outstandingBalance = 225;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-stone-200" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-stone-100" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Patient Portal Preview</h1>
          <p className="mt-1 text-sm text-stone-500">
            Preview and configure what patients see when they log in to their portal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            <Eye className="h-3.5 w-3.5" />
            Preview Mode
          </span>
          <button className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            <Settings className="h-4 w-4" />
            Configure
          </button>
        </div>
      </div>

      {/* Portal Preview Container */}
      <div className="rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-6">
        {/* Patient Welcome Header */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <User className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Welcome, Sarah!</h2>
              <p className="text-sm text-stone-500">Last login: May 28, 2026 at 3:15 PM</p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50"
          >
            <div className="rounded-lg bg-teal-50 p-2.5">
              <Calendar className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Request Appointment</p>
              <p className="text-xs text-stone-500">Book a new visit</p>
            </div>
          </button>
          <button
            onClick={() => setShowMessageModal(true)}
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50"
          >
            <div className="rounded-lg bg-blue-50 p-2.5">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Message Provider</p>
              <p className="text-xs text-stone-500">Send a secure message</p>
            </div>
          </button>
          <button className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50">
            <div className="rounded-lg bg-green-50 p-2.5">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Make Payment</p>
              <p className="text-xs text-stone-500">Pay balance online</p>
            </div>
          </button>
          <button className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50">
            <div className="rounded-lg bg-purple-50 p-2.5">
              <Download className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Download Forms</p>
              <p className="text-xs text-stone-500">Pre-visit paperwork</p>
            </div>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming Appointments */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                <Calendar className="h-4 w-4 text-teal-600" />
                Upcoming Appointments
              </h3>
              <button className="text-xs font-medium text-teal-600 hover:text-teal-700">View All</button>
            </div>
            <div className="divide-y divide-stone-100">
              {MOCK_APPOINTMENTS.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{apt.type}</p>
                    <p className="text-xs text-stone-500">{apt.provider}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-stone-900">
                      {new Date(apt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-stone-500">{apt.time}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      apt.status === 'Confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                <DollarSign className="h-4 w-4 text-teal-600" />
                Outstanding Balance
              </h3>
            </div>
            <div className="p-5">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-stone-900">{formatCurrency(outstandingBalance)}</p>
                <p className="text-sm text-stone-500">due</p>
              </div>
              <p className="mt-2 text-xs text-stone-500">Last payment: $180.00 on May 15, 2026</p>
              <button className="mt-4 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors">
                Pay Now
              </button>
              <button className="mt-2 w-full rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
                View Statement
              </button>
            </div>
          </div>

          {/* Recent Treatments */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                <FileText className="h-4 w-4 text-teal-600" />
                Recent Treatments
              </h3>
              <button className="text-xs font-medium text-teal-600 hover:text-teal-700">View All</button>
            </div>
            <div className="divide-y divide-stone-100">
              {MOCK_TREATMENTS.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{tx.procedure}</p>
                    <p className="text-xs text-stone-500">
                      {tx.provider} &middot;{' '}
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-stone-900">{formatCurrency(tx.cost)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                <FileText className="h-4 w-4 text-teal-600" />
                Documents
              </h3>
              <button className="text-xs font-medium text-teal-600 hover:text-teal-700">View All</button>
            </div>
            <div className="divide-y divide-stone-100">
              {MOCK_DOCUMENTS.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-stone-100 p-2">
                      <FileText className="h-4 w-4 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">{doc.name}</p>
                      <p className="text-xs text-stone-500">
                        {doc.type} &middot;{' '}
                        {new Date(doc.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-teal-600 transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insurance Info */}
        <div className="mt-6 rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Shield className="h-4 w-4 text-teal-600" />
              Insurance Information
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-stone-500">Provider</p>
                    <p className="mt-0.5 text-sm font-medium text-stone-900">{MOCK_INSURANCE.provider}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">Member ID</p>
                    <p className="mt-0.5 text-sm font-mono text-stone-900">{MOCK_INSURANCE.memberId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">Group Number</p>
                    <p className="mt-0.5 text-sm font-mono text-stone-900">{MOCK_INSURANCE.groupNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">Subscriber</p>
                    <p className="mt-0.5 text-sm text-stone-900">{MOCK_INSURANCE.subscriber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">Effective Date</p>
                    <p className="mt-0.5 text-sm text-stone-900">
                      {new Date(MOCK_INSURANCE.effectiveDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">Deductible</p>
                    <p className="mt-0.5 text-sm text-stone-900">
                      {formatCurrency(MOCK_INSURANCE.deductible)}{' '}
                      <span className={cn('text-xs', MOCK_INSURANCE.deductibleMet ? 'text-green-600' : 'text-amber-600')}>
                        ({MOCK_INSURANCE.deductibleMet ? 'Met' : 'Not Met'})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Annual Benefits Used</span>
                    <span className="font-medium text-stone-900">
                      {formatCurrency(MOCK_INSURANCE.used)} / {formatCurrency(MOCK_INSURANCE.annualMax)}
                    </span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{ width: `${(MOCK_INSURANCE.used / MOCK_INSURANCE.annualMax) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatCurrency(MOCK_INSURANCE.remaining)} remaining
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-stone-500">Coverage Levels</p>
                  {MOCK_INSURANCE.coverages.map((cov) => (
                    <div key={cov.category} className="flex items-center justify-between text-sm">
                      <span className="text-stone-700">{cov.category}</span>
                      <span className={cn('font-medium', cov.percentage > 0 ? 'text-stone-900' : 'text-stone-400')}>
                        {cov.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Appointment Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Request an Appointment</h2>
              <button
                onClick={() => { setShowRequestModal(false); setReqSubmitted(false); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {reqSubmitted ? (
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-stone-900">Request Submitted!</p>
                <p className="mt-1 text-xs text-stone-500">Our team will confirm your appointment shortly.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Preferred Date</label>
                  <input
                    type="date"
                    value={reqDate}
                    onChange={(e) => setReqDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Preferred Time</label>
                  <select
                    value={reqTime}
                    onChange={(e) => setReqTime(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="morning">Morning (8 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                    <option value="late">Late Afternoon (4 PM - 6 PM)</option>
                    <option value="any">Any Time</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Reason for Visit</label>
                  <select
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select a reason...</option>
                    <option value="cleaning">Cleaning & Exam</option>
                    <option value="toothache">Toothache / Pain</option>
                    <option value="broken">Broken / Chipped Tooth</option>
                    <option value="cosmetic">Cosmetic Consultation</option>
                    <option value="followup">Follow-up Visit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Additional Notes</label>
                  <textarea
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    rows={2}
                    placeholder="Any additional information..."
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestSubmit}
                    disabled={!reqDate || !reqReason}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Provider Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Message Your Provider</h2>
              <button
                onClick={() => { setShowMessageModal(false); setMsgSubmitted(false); }}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {msgSubmitted ? (
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-stone-900">Message Sent!</p>
                <p className="mt-1 text-xs text-stone-500">Your provider will respond within 1-2 business days.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">To</label>
                  <select
                    value={msgProvider}
                    onChange={(e) => setMsgProvider(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Dr. Sarah Miller">Dr. Sarah Miller</option>
                    <option value="Dr. James Park">Dr. James Park</option>
                    <option value="Front Desk">Front Desk</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Subject</label>
                  <input
                    type="text"
                    value={msgSubject}
                    onChange={(e) => setMsgSubject(e.target.value)}
                    placeholder="e.g., Question about my treatment"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Message</label>
                  <textarea
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    rows={4}
                    placeholder="Type your message..."
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMessageSubmit}
                    disabled={!msgSubject.trim() || !msgBody.trim()}
                    className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Send Message
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
