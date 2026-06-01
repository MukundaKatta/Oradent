'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CalendarDays,
  Plus,
  X,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface Referral {
  id: string;
  patientName: string;
  referringSource: string;
  date: string;
  type: 'INCOMING' | 'OUTGOING';
  status: 'PENDING' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'DECLINED';
  notes: string;
}

// ═══════════════════ SEED DATA ═══════════════════

const INITIAL_REFERRALS: Referral[] = [
  { id: '1', patientName: 'Sarah Johnson', referringSource: 'Dr. Michael Torres (Ortho)', date: '2026-05-28', type: 'INCOMING', status: 'SCHEDULED', notes: 'Needs crown evaluation' },
  { id: '2', patientName: 'James Wilson', referringSource: 'Google Search', date: '2026-05-25', type: 'INCOMING', status: 'COMPLETED', notes: 'New patient intake done' },
  { id: '3', patientName: 'Emily Chen', referringSource: 'Dr. Lisa Park (Perio)', date: '2026-05-22', type: 'OUTGOING', status: 'PENDING', notes: 'Referred for periodontal assessment' },
  { id: '4', patientName: 'Robert Davis', referringSource: 'Patient Referral - Mary Davis', date: '2026-05-20', type: 'INCOMING', status: 'CONTACTED', notes: 'Wife referred him for cleaning' },
  { id: '5', patientName: 'Maria Garcia', referringSource: 'Dr. David Kim (Endo)', date: '2026-05-18', type: 'OUTGOING', status: 'COMPLETED', notes: 'Root canal treatment needed' },
  { id: '6', patientName: 'Thomas Brown', referringSource: 'Insurance Network', date: '2026-05-15', type: 'INCOMING', status: 'DECLINED', notes: 'Patient chose different provider' },
  { id: '7', patientName: 'Amanda White', referringSource: 'Dr. Rachel Green (Oral Surgery)', date: '2026-05-12', type: 'OUTGOING', status: 'SCHEDULED', notes: 'Wisdom teeth extraction referral' },
  { id: '8', patientName: 'Kevin Lee', referringSource: 'Website Contact Form', date: '2026-06-01', type: 'INCOMING', status: 'PENDING', notes: 'Interested in cosmetic dentistry' },
];

// ═══════════════════ HELPERS ═══════════════════

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONTACTED: 'Contacted',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function ReferralTrackingPage() {
  const [referrals, setReferrals] = useState<Referral[]>(INITIAL_REFERRALS);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formPatient, setFormPatient] = useState('');
  const [formSource, setFormSource] = useState('');
  const [formType, setFormType] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
  const [formNotes, setFormNotes] = useState('');

  // Stats
  const totalReferrals = referrals.length;
  const thisMonth = referrals.filter((r) => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const conversionRate =
    referrals.length > 0
      ? Math.round(
          (referrals.filter((r) => r.status === 'COMPLETED' || r.status === 'SCHEDULED').length /
            referrals.length) *
            100
        )
      : 0;

  const filteredReferrals = useMemo(() => {
    let result = referrals.filter((r) => r.type === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.referringSource.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [referrals, activeTab, search]);

  const handleSubmit = () => {
    if (!formPatient.trim() || !formSource.trim()) return;
    const newReferral: Referral = {
      id: generateId(),
      patientName: formPatient.trim(),
      referringSource: formSource.trim(),
      date: new Date().toISOString().split('T')[0],
      type: formType,
      status: 'PENDING',
      notes: formNotes.trim(),
    };
    setReferrals((prev) => [newReferral, ...prev]);
    setFormPatient('');
    setFormSource('');
    setFormType('INCOMING');
    setFormNotes('');
    setShowModal(false);
  };

  // Simulate initial loading
  useState(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Referral Tracking</h1>
          <p className="mt-1 text-sm text-stone-500">
            Track incoming and outgoing patient referrals
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Referral
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-50 p-2.5">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Referrals</p>
              <p className="text-xl font-bold text-stone-900">{totalReferrals}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <CalendarDays className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">This Month</p>
              <p className="text-xl font-bold text-stone-900">{thisMonth}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">Conversion Rate</p>
              <p className="text-xl font-bold text-stone-900">{conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
          <button
            onClick={() => setActiveTab('INCOMING')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'INCOMING'
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Incoming
          </button>
          <button
            onClick={() => setActiveTab('OUTGOING')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'OUTGOING'
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
            Outgoing
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, source, or notes..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="py-16 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">
              No {activeTab.toLowerCase()} referrals found
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              {search ? 'Try adjusting your search terms.' : 'Add a referral to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Patient Name</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">
                    {activeTab === 'INCOMING' ? 'Referring Source' : 'Referred To'}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-stone-100 transition-colors hover:bg-stone-50"
                  >
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {referral.patientName}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{referral.referringSource}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {new Date(referral.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_COLORS[referral.status]
                        )}
                      >
                        {STATUS_LABELS[referral.status]}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-stone-500">
                      {referral.notes || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Referral Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Add Referral</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={formPatient}
                  onChange={(e) => setFormPatient(e.target.value)}
                  placeholder="Search for patient..."
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Referring Source / Referred To
                </label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder="e.g., Dr. Smith, Google, Patient Referral"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      checked={formType === 'INCOMING'}
                      onChange={() => setFormType('INCOMING')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-stone-700">Incoming</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      checked={formType === 'OUTGOING'}
                      onChange={() => setFormType('OUTGOING')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-stone-700">Outgoing</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
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
                disabled={!formPatient.trim() || !formSource.trim()}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Referral
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
