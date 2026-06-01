'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  Search,
  Plus,
  RotateCcw,
  FileText,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type PaymentMethod = 'cash' | 'check' | 'card' | 'insurance';
type PaymentStatus = 'completed' | 'pending' | 'refunded';

interface Payment {
  id: string;
  date: string;
  patientName: string;
  invoiceNumber: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  status: PaymentStatus;
}

interface PatientOption {
  id: string;
  name: string;
  invoices: { id: string; number: string; balance: number }[];
}

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_PATIENTS: PatientOption[] = [
  { id: 'p1', name: 'Sarah Johnson', invoices: [{ id: 'inv1', number: 'INV-1051', balance: 750 }, { id: 'inv2', number: 'INV-1038', balance: 320 }] },
  { id: 'p2', name: 'Michael Chen', invoices: [{ id: 'inv3', number: 'INV-1049', balance: 65 }] },
  { id: 'p3', name: 'Emily Rodriguez', invoices: [{ id: 'inv4', number: 'INV-1048', balance: 1150 }] },
  { id: 'p4', name: 'James Wilson', invoices: [{ id: 'inv5', number: 'INV-1047', balance: 110 }] },
  { id: 'p5', name: 'Lisa Thompson', invoices: [{ id: 'inv6', number: 'INV-1045', balance: 210 }] },
  { id: 'p6', name: 'David Park', invoices: [{ id: 'inv7', number: 'INV-1044', balance: 135 }, { id: 'inv8', number: 'INV-1032', balance: 450 }] },
];

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', date: '2026-06-01', patientName: 'Sarah Johnson', invoiceNumber: 'INV-1051', amount: 500, method: 'card', referenceNumber: 'TXN-88901', status: 'completed' },
  { id: '2', date: '2026-06-01', patientName: 'Michael Chen', invoiceNumber: 'INV-1049', amount: 65, method: 'cash', referenceNumber: 'RCP-44210', status: 'completed' },
  { id: '3', date: '2026-06-01', patientName: 'James Wilson', invoiceNumber: 'INV-1047', amount: 110, method: 'check', referenceNumber: 'CHK-7823', status: 'completed' },
  { id: '4', date: '2026-05-31', patientName: 'Lisa Thompson', invoiceNumber: 'INV-1045', amount: 210, method: 'card', referenceNumber: 'TXN-88845', status: 'completed' },
  { id: '5', date: '2026-05-31', patientName: 'David Park', invoiceNumber: 'INV-1044', amount: 150, method: 'insurance', referenceNumber: 'CLM-33421', status: 'pending' },
  { id: '6', date: '2026-05-31', patientName: 'Amanda Foster', invoiceNumber: 'INV-1043', amount: 225, method: 'card', referenceNumber: 'TXN-88799', status: 'completed' },
  { id: '7', date: '2026-05-30', patientName: 'Robert Kim', invoiceNumber: 'INV-1042', amount: 675, method: 'card', referenceNumber: 'TXN-88756', status: 'completed' },
  { id: '8', date: '2026-05-30', patientName: 'Jennifer Martinez', invoiceNumber: 'INV-1041', amount: 350, method: 'insurance', referenceNumber: 'CLM-33398', status: 'completed' },
  { id: '9', date: '2026-05-30', patientName: 'William Taylor', invoiceNumber: 'INV-1040', amount: 85, method: 'cash', referenceNumber: 'RCP-44195', status: 'refunded' },
  { id: '10', date: '2026-05-29', patientName: 'Catherine Lee', invoiceNumber: 'INV-1039', amount: 420, method: 'check', referenceNumber: 'CHK-7810', status: 'completed' },
];

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string }> = {
  cash: { label: 'Cash', icon: Banknote, bg: 'bg-green-50', text: 'text-green-700' },
  check: { label: 'Check', icon: FileText, bg: 'bg-blue-50', text: 'text-blue-700' },
  card: { label: 'Card', icon: CreditCard, bg: 'bg-purple-50', text: 'text-purple-700' },
  insurance: { label: 'Insurance', icon: Building2, bg: 'bg-teal-50', text: 'text-teal-700' },
};

const STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; text: string }> = {
  completed: { label: 'Completed', bg: 'bg-green-50', text: 'text-green-700' },
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700' },
  refunded: { label: 'Refunded', bg: 'bg-red-50', text: 'text-red-700' },
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function PaymentProcessingPage() {
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [showForm, setShowForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Payment | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [referenceNumber, setReferenceNumber] = useState('');

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return [];
    return MOCK_PATIENTS.filter((p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase())
    );
  }, [patientSearch]);

  const todayPayments = useMemo(() => {
    return payments.filter((p) => p.date === '2026-06-01');
  }, [payments]);

  const dailySummary = useMemo(() => {
    const completed = todayPayments.filter((p) => p.status === 'completed');
    const total = completed.reduce((sum, p) => sum + p.amount, 0);
    const byMethod = completed.reduce(
      (acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
      },
      {} as Record<string, number>
    );
    return { total, byMethod };
  }, [todayPayments]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleRecordPayment = () => {
    if (!selectedPatient || !selectedInvoice || !paymentAmount) return;
    const newPayment: Payment = {
      id: `new-${Date.now()}`,
      date: '2026-06-01',
      patientName: selectedPatient.name,
      invoiceNumber: selectedInvoice,
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      referenceNumber: referenceNumber || `AUTO-${Date.now().toString().slice(-5)}`,
      status: 'completed',
    };
    setPayments((prev) => [newPayment, ...prev]);
    setShowForm(false);
    setPatientSearch('');
    setSelectedPatient(null);
    setSelectedInvoice('');
    setPaymentAmount('');
    setPaymentMethod('card');
    setReferenceNumber('');
  };

  const handleRefund = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: 'refunded' as PaymentStatus } : p))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Payment Processing</h1>
          <p className="mt-1 text-sm text-stone-500">Record and manage patient payments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </button>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-100 p-2.5">
              <DollarSign className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-teal-700">Total Collected Today</p>
              <p className="text-xl font-bold text-teal-900">{formatCurrency(dailySummary.total)}</p>
            </div>
          </div>
        </div>
        {(Object.entries(METHOD_CONFIG) as [PaymentMethod, typeof METHOD_CONFIG[PaymentMethod]][]).map(([method, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={method} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2.5', cfg.bg)}>
                  <Icon className={cn('h-5 w-5', cfg.text)} />
                </div>
                <div>
                  <p className="text-xs text-stone-500">{cfg.label}</p>
                  <p className="text-lg font-bold text-stone-900">
                    {formatCurrency(dailySummary.byMethod[method] || 0)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Record Payment Form */}
      {showForm && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
            <h2 className="text-base font-semibold text-stone-900">Record New Payment</h2>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Patient Search */}
            <div className="relative flex flex-col gap-1">
              <label className="text-xs font-medium text-stone-500">Patient</label>
              <div className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={selectedPatient ? selectedPatient.name : patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setSelectedPatient(null);
                    setSelectedInvoice('');
                  }}
                  placeholder="Search patient..."
                  className="flex-1 border-0 bg-transparent text-sm text-stone-700 focus:outline-none"
                />
              </div>
              {filteredPatients.length > 0 && !selectedPatient && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-stone-200 bg-white shadow-lg">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientSearch('');
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Invoice Select */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-stone-500">Invoice</label>
              <select
                value={selectedInvoice}
                onChange={(e) => setSelectedInvoice(e.target.value)}
                disabled={!selectedPatient}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-stone-50 disabled:text-stone-400"
              >
                <option value="">Select invoice...</option>
                {selectedPatient?.invoices.map((inv) => (
                  <option key={inv.id} value={inv.number}>
                    {inv.number} - Balance: {formatCurrency(inv.balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-stone-500">Amount</label>
              <div className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2">
                <DollarSign className="h-4 w-4 text-stone-400" />
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="flex-1 border-0 bg-transparent text-sm text-stone-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-stone-500">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>

            {/* Reference Number */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-stone-500">Reference Number</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Optional"
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <button
                onClick={handleRecordPayment}
                disabled={!selectedPatient || !selectedInvoice || !paymentAmount}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                <CheckCircle className="h-4 w-4" />
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Payments Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-900">Recent Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Patient</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Invoice</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Method</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Reference</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const methodCfg = METHOD_CONFIG[payment.method];
                const statusCfg = STATUS_CONFIG[payment.status];
                const MethodIcon = methodCfg.icon;
                return (
                  <tr key={payment.id} className="border-b border-stone-50 transition-colors hover:bg-stone-50">
                    <td className="px-5 py-3 text-stone-700">{payment.date}</td>
                    <td className="px-5 py-3 font-medium text-stone-900">{payment.patientName}</td>
                    <td className="px-5 py-3 font-mono text-xs text-stone-600">{payment.invoiceNumber}</td>
                    <td className="px-5 py-3 text-right font-medium text-stone-900">{formatCurrency(payment.amount)}</td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', methodCfg.bg, methodCfg.text)}>
                        <MethodIcon className="h-3 w-3" />
                        {methodCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-stone-500">{payment.referenceNumber}</td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusCfg.bg, statusCfg.text)}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setShowReceipt(payment)}
                          className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                          title="View Receipt"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => handleRefund(payment.id)}
                            className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Refund"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <h3 className="text-base font-semibold text-stone-900">Payment Receipt</h3>
              <button
                onClick={() => setShowReceipt(null)}
                className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="text-center">
                <h4 className="text-lg font-bold text-stone-900">BrightSmile Dental</h4>
                <p className="text-xs text-stone-500">123 Main Street, Suite 100</p>
                <p className="text-xs text-stone-500">Phone: (555) 000-1234</p>
              </div>
              <div className="border-t border-dashed border-stone-300 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Date:</span>
                  <span className="font-medium text-stone-900">{showReceipt.date}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-stone-500">Patient:</span>
                  <span className="font-medium text-stone-900">{showReceipt.patientName}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-stone-500">Invoice:</span>
                  <span className="font-mono text-stone-900">{showReceipt.invoiceNumber}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-stone-500">Method:</span>
                  <span className="font-medium text-stone-900">{METHOD_CONFIG[showReceipt.method].label}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-stone-500">Reference:</span>
                  <span className="font-mono text-stone-900">{showReceipt.referenceNumber}</span>
                </div>
              </div>
              <div className="border-t border-dashed border-stone-300 pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-stone-900">Amount Paid</span>
                  <span className="text-lg font-bold text-teal-600">{formatCurrency(showReceipt.amount)}</span>
                </div>
              </div>
              <p className="text-center text-xs text-stone-400">Thank you for your payment!</p>
            </div>
            <div className="border-t border-stone-100 px-6 py-4">
              <button
                onClick={() => setShowReceipt(null)}
                className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
