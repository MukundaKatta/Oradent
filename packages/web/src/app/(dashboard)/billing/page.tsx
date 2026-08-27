'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { InvoiceTable } from '@/components/billing/InvoiceTable';
import { CreateInvoice } from '@/components/billing/CreateInvoice';
import { PaymentModal } from '@/components/billing/PaymentModal';
import { InsuranceClaimForm } from '@/components/billing/InsuranceClaimForm';
import { LedgerView } from '@/components/billing/LedgerView';
import { billingText, formatBillingCurrency, getClaimStatusLabel } from '@/components/billing/billingLabels';
import {
  INVOICE_STATUS_COLORS,
} from '@/lib/constants';

interface BillingSummary {
  totalOutstanding: number;
  mtdRevenue: number;
  pendingClaims: number;
  collectionRate: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  status: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  cdtCode: string;
  description: string;
  quantity: number;
  fee: number;
  toothNumber?: string;
}

interface Claim {
  id: string;
  claimNumber: string;
  patientName: string;
  insuranceProvider: string;
  submittedDate: string;
  amount: number;
  status: string;
}

// Shape the API actually returns from GET /billing/invoices — patient is a
// nested object (not a flat patientName), and line items aren't included in
// the list response, only a treatments count.
interface RawInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  total: number;
  status: string;
  patient: { id: string; firstName: string; lastName: string };
  payments: { amount: number }[];
}

function toInvoice(raw: RawInvoice): Invoice {
  const amountPaid = raw.payments.reduce((sum, p) => sum + p.amount, 0);
  return {
    id: raw.id,
    invoiceNumber: raw.invoiceNumber,
    patientId: raw.patient.id,
    patientName: `${raw.patient.firstName} ${raw.patient.lastName}`,
    date: raw.date,
    dueDate: raw.dueDate,
    total: raw.total,
    amountPaid,
    status: raw.status,
    items: [],
  };
}

interface FeeScheduleEntry {
  id: string;
  cdtCode: string;
  description: string;
  category: string;
  fee: number;
}

const CLAIM_PIPELINE_STAGES = ['DRAFTED', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'PAID'];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [summary, setSummary] = useState<BillingSummary>({
    totalOutstanding: 0,
    mtdRevenue: 0,
    pendingClaims: 0,
    collectionRate: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [feeSchedule, setFeeSchedule] = useState<FeeScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingFee, setEditingFee] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [summaryResult, invoiceResult, claimResult, feeResult] = await Promise.allSettled([
      apiGet<BillingSummary>('/api/billing/summary'),
      apiGet<{ invoices: RawInvoice[] }>('/api/billing/invoices'),
      apiGet<Claim[]>('/api/billing/claims'),
      apiGet<FeeScheduleEntry[]>('/api/billing/fee-schedule'),
    ]);
    if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value);
    else console.error('Failed to fetch billing summary:', summaryResult.reason);
    if (invoiceResult.status === 'fulfilled') setInvoices(invoiceResult.value.invoices.map(toInvoice));
    else console.error('Failed to fetch invoices:', invoiceResult.reason);
    if (claimResult.status === 'fulfilled') setClaims(claimResult.value);
    else console.error('Failed to fetch claims:', claimResult.reason);
    if (feeResult.status === 'fulfilled') setFeeSchedule(feeResult.value);
    else console.error('Failed to fetch fee schedule:', feeResult.reason);
    setLoading(false);
  };

  const claimsByStage = CLAIM_PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = claims.filter((c) => c.status === stage);
      return acc;
    },
    {} as Record<string, Claim[]>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="glass-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/60 dark:divide-white/10">
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
            <AlertCircle className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-sm font-medium">{billingText.outstanding}</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums font-mono text-stone-900 dark:text-stone-100">
            {formatBillingCurrency(summary.totalOutstanding)}
          </p>
        </div>
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-sm font-medium">{billingText.monthlyRevenue}</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums font-mono text-stone-900 dark:text-stone-100">
            {formatBillingCurrency(summary.mtdRevenue)}
          </p>
        </div>
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
            <FileText className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-sm font-medium">{billingText.pendingClaims}</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums font-mono text-stone-900 dark:text-stone-100">
            {formatBillingCurrency(summary.pendingClaims)}
          </p>
        </div>
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
            <DollarSign className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-sm font-medium">{billingText.collectionRate}</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-stone-900 dark:text-stone-100">
            {summary.collectionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <Tabs.List className="glass flex gap-1 rounded-full p-1">
            {['invoices', 'payments', 'claims', 'fee-schedule'].map((tab) => (
              <Tabs.Trigger
                key={tab}
                value={tab}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-teal-600 text-white shadow-apple-sm'
                    : 'text-stone-600 hover:bg-stone-900/5 dark:text-stone-400 dark:hover:bg-white/5'
                )}
              >
                {tab === 'invoices' ? billingText.invoices : tab === 'payments' ? billingText.payments : tab === 'claims' ? billingText.claims : billingText.feeSchedule}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {activeTab === 'invoices' && (
            <button
              onClick={() => setShowCreateInvoice(true)}
              className="flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-apple-sm transition-all hover:bg-teal-700 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              {billingText.newInvoice}
            </button>
          )}
          {activeTab === 'claims' && (
            <button
              onClick={() => setShowClaimForm(true)}
              className="flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-apple-sm transition-all hover:bg-teal-700 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              {billingText.newClaim}
            </button>
          )}
        </div>

        {/* Invoices Tab */}
        <Tabs.Content value="invoices" className="mt-4">
          {loading ? (
            <div className="glass-card divide-y divide-stone-100 dark:divide-white/5 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-stone-200/40 dark:bg-white/5" />
              ))}
            </div>
          ) : (
            <InvoiceTable
              invoices={invoices}
              onRecordPayment={(invoice) => {
                setSelectedInvoice(invoice);
                setShowPaymentModal(true);
              }}
              onViewLedger={(invoice) => {
                setSelectedInvoice(invoice);
              }}
            />
          )}
        </Tabs.Content>

        {/* Payments Tab */}
        <Tabs.Content value="payments" className="mt-4">
          {selectedInvoice ? (
            <LedgerView
              patientId={selectedInvoice.patientId}
              patientName={selectedInvoice.patientName}
              onBack={() => setSelectedInvoice(null)}
            />
          ) : (
            <div className="glass-card flex flex-col items-center gap-2 p-8 text-center">
              <DollarSign className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" strokeWidth={1.5} />
              <h3 className="text-base font-medium text-stone-700 dark:text-stone-200">{billingText.paymentHistory}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {billingText.selectInvoice}
              </p>
            </div>
          )}
        </Tabs.Content>

        {/* Claims Tab - Pipeline View */}
        <Tabs.Content value="claims" className="mt-4">
          <div className="grid grid-cols-5 gap-3">
            {CLAIM_PIPELINE_STAGES.map((stage) => (
              <div key={stage} className="glass-card p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    {getClaimStatusLabel(stage)}
                  </h4>
                  <span className="rounded-full bg-stone-900/5 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-stone-600 dark:text-stone-300">
                    {claimsByStage[stage]?.length || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {claimsByStage[stage]?.map((claim) => (
                    <div
                      key={claim.id}
                      className="rounded-xl border border-stone-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3"
                    >
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {claim.patientName}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                        {claim.claimNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                        {claim.insuranceProvider}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-700 dark:text-stone-200">
                        {formatBillingCurrency(claim.amount)}
                      </p>
                    </div>
                  ))}
                  {(!claimsByStage[stage] || claimsByStage[stage].length === 0) && (
                    <p className="py-4 text-center text-xs text-stone-400 dark:text-stone-500">
                      {billingText.noClaims}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Tabs.Content>

        {/* Fee Schedule Tab */}
        <Tabs.Content value="fee-schedule" className="mt-4">
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-white/10">
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">{billingText.cdtCode}</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">{billingText.description}</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">{billingText.category}</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400">{billingText.fee}</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400">{billingText.actions}</th>
                </tr>
              </thead>
              <tbody>
                {feeSchedule.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-stone-100 dark:border-white/5 hover:bg-stone-900/[0.03] dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-stone-900 dark:text-stone-100">
                      {entry.cdtCode}
                    </td>
                    <td className="px-4 py-3 text-stone-700 dark:text-stone-300">{entry.description}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-stone-600 dark:text-stone-300">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingFee === entry.id ? (
                        <input
                          type="number"
                          defaultValue={entry.fee}
                          className="w-24 rounded-lg border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 px-2 py-1 text-right text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          onBlur={(e) => {
                            setEditingFee(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingFee(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {formatBillingCurrency(entry.fee)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingFee(entry.id)}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                      >
                        {billingText.edit}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {feeSchedule.length === 0 && !loading && (
              <div className="py-12 text-center text-sm text-stone-400 dark:text-stone-500">
                {billingText.noFeeSchedule}
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Modals */}
      {showCreateInvoice && (
        <CreateInvoice
          open={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          onSave={() => {
            setShowCreateInvoice(false);
            fetchData();
          }}
        />
      )}

      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          onSave={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            fetchData();
          }}
          invoice={selectedInvoice}
        />
      )}

      {showClaimForm && (
        <InsuranceClaimForm
          open={showClaimForm}
          onClose={() => setShowClaimForm(false)}
          onSave={() => {
            setShowClaimForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
