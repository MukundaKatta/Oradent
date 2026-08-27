'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DollarSign, FileText, CreditCard, Plus } from 'lucide-react';
import { usePatientLedger } from '@/hooks/useBilling';
import { usePatient } from '@/hooks/usePatient';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CreateInvoice } from '@/components/billing/CreateInvoice';
import { PaymentModal } from "@/components/billing/PaymentModal";
import { ptBR } from "@/i18n";

const invoiceStatusStyle: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  VOID: 'bg-stone-100 text-stone-500',
  WRITE_OFF: 'bg-stone-100 text-stone-500',
};

export default function PatientBillingPage() {
  const params = useParams<{ id: string }>();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { data: patient } = usePatient(params.id);
  const { data: ledger, isLoading } = usePatientLedger(params.id);

  const invoices = ledger?.invoices ?? [];
  const payments = invoices
    .flatMap((inv) => inv.payments.map((p) => ({ ...p, invoiceNumber: inv.invoiceNumber })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalBalance = ledger?.summary.balance ?? 0;
  const totalPaid = ledger?.summary.totalPayments ?? 0;

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);
  const selectedInvoicePaid = selectedInvoice
    ? selectedInvoice.payments.reduce((sum, p) => sum + p.amount, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-900">{ptBR.patientWorkflow.profile.billing.title}</h2>
        <button
          onClick={() => setShowCreateInvoice(true)}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {ptBR.patientWorkflow.profile.billing.newInvoice}
        </button>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5">
              <DollarSign className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-stone-500">{ptBR.patientWorkflow.profile.billing.outstandingBalance}</p>
              <p className="text-xl font-bold text-stone-900">
                {isLoading ? (
                  <span className="inline-block h-7 w-24 animate-pulse rounded bg-stone-200" />
                ) : (
                  formatCurrency(totalBalance)
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">{ptBR.patientWorkflow.profile.billing.totalPaid}</p>
              <p className="text-xl font-bold text-stone-900">
                {isLoading ? (
                  <span className="inline-block h-7 w-24 animate-pulse rounded bg-stone-200" />
                ) : (
                  formatCurrency(totalPaid)
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-stone-500">{ptBR.patientWorkflow.profile.billing.invoices}</p>
              <p className="text-xl font-bold text-stone-900">
                {isLoading ? (
                  <span className="inline-block h-7 w-24 animate-pulse rounded bg-stone-200" />
                ) : (
                  invoices.length
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-stone-900">{ptBR.patientWorkflow.profile.billing.invoices}</h3>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-200" />
            ))}
          </div>
        ) : invoices.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-6 py-3 text-left font-medium text-stone-500">{ptBR.patientWorkflow.profile.billing.invoiceNumber}</th>
                <th className="px-6 py-3 text-left font-medium text-stone-500">{ptBR.patientWorkflow.common.date}</th>
                <th className="px-6 py-3 text-left font-medium text-stone-500">{ptBR.patientWorkflow.common.status}</th>
                <th className="px-6 py-3 text-right font-medium text-stone-500">{ptBR.patientWorkflow.profile.billing.total}</th>
                <th className="px-6 py-3 text-right font-medium text-stone-500">{ptBR.patientWorkflow.profile.balance}</th>
                <th className="px-6 py-3 text-right font-medium text-stone-500">{ptBR.patientWorkflow.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
                return (
                  <tr key={invoice.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-stone-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-3 text-stone-600">{formatDate(invoice.date)}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          invoiceStatusStyle[invoice.status] ?? 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {ptBR.invoice.status[invoice.status] ?? invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-stone-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-stone-900">
                      {formatCurrency(invoice.total - paid)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {invoice.status !== 'PAID' && invoice.status !== 'VOID' && invoice.status !== 'WRITE_OFF' && (
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(invoice.id);
                            setShowPayment(true);
                          }}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                          {ptBR.patientWorkflow.profile.billing.recordPayment}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-sm text-stone-400">
            {ptBR.patientWorkflow.profile.billing.noInvoices}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-stone-900">{ptBR.patientWorkflow.profile.billing.paymentHistory}</h3>
        </div>
        {payments.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-6 py-3 text-left font-medium text-stone-500">{ptBR.patientWorkflow.common.date}</th>
                <th className="px-6 py-3 text-left font-medium text-stone-500">{ptBR.patientWorkflow.profile.billing.method}</th>
                <th className="px-6 py-3 text-left font-medium text-stone-500">{ptBR.patientWorkflow.profile.billing.reference}</th>
                <th className="px-6 py-3 text-right font-medium text-stone-500">{ptBR.patientWorkflow.profile.billing.amount}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-3 text-stone-600">{formatDate(payment.date)}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                      {ptBR.payment.method[payment.method] ?? payment.method.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-stone-500">{payment.reference || '-'}</td>
                  <td className="px-6 py-3 text-right font-medium text-green-700">
                    +{formatCurrency(payment.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-sm text-stone-400">
            {ptBR.patientWorkflow.profile.billing.noPayments}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateInvoice && (
        <CreateInvoice
          open={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          onSave={() => setShowCreateInvoice(false)}
          defaultPatientId={params.id}
        />
      )}

      {showPayment && selectedInvoice && (
        <PaymentModal
          open={showPayment}
          onClose={() => {
            setShowPayment(false);
            setSelectedInvoiceId(null);
          }}
          onSave={() => {
            setShowPayment(false);
            setSelectedInvoiceId(null);
          }}
          invoice={{
            id: selectedInvoice.id,
            invoiceNumber: selectedInvoice.invoiceNumber,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
            total: selectedInvoice.total,
            amountPaid: selectedInvoicePaid,
          }}
        />
      )}
    </div>
  );
}
