'use client';

import { useState, Fragment } from 'react';
import { formatDate, formatCurrency } from '@/lib/formatters';
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Eye,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INVOICE_STATUS_LABELS } from '@/lib/constants';
import { billingText } from './billingLabels';

interface InvoiceItem {
  id: string;
  cdtCode: string;
  description: string;
  quantity: number;
  fee: number;
  toothNumber?: string;
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

interface InvoiceTableProps {
  invoices: Invoice[];
  onRecordPayment: (invoice: Invoice) => void;
  onViewLedger: (invoice: Invoice) => void;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  VOID: 'bg-stone-100 text-stone-500 dark:bg-white/10 dark:text-stone-400',
  WRITE_OFF: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
};

export function InvoiceTable({
  invoices,
  onRecordPayment,
  onViewLedger,
}: InvoiceTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'total' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = invoices
    .filter(
      (inv) =>
        inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'date') return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortField === 'total') return dir * (a.total - b.total);
      return dir * a.status.localeCompare(b.status);
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Search */}
      <div className="border-b border-stone-200 dark:border-white/10 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            placeholder={billingText.searchInvoices}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 py-2 pl-10 pr-3 text-sm text-stone-900 dark:text-stone-100 shadow-apple-sm backdrop-blur-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 dark:border-white/10">
            <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">{billingText.invoiceNumber}</th>
            <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">{billingText.patient}</th>
            <th
              className="cursor-pointer px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              onClick={() => toggleSort('date')}
            >
              <span className="flex items-center gap-1">
                {billingText.date} <SortIcon field="date" />
              </span>
            </th>
            <th
              className="cursor-pointer px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              onClick={() => toggleSort('total')}
            >
              <span className="flex items-center justify-end gap-1">
                {billingText.total} <SortIcon field="total" />
              </span>
            </th>
            <th className="px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400">{billingText.balance}</th>
            <th
              className="cursor-pointer px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              onClick={() => toggleSort('status')}
            >
              <span className="flex items-center gap-1">
                Status <SortIcon field="status" />
              </span>
            </th>
            <th className="px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400">{billingText.actions}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((invoice) => (
            <Fragment key={invoice.id}>
              <tr
                className="border-b border-stone-100 dark:border-white/5 hover:bg-stone-900/[0.03] dark:hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs font-medium text-teal-600 dark:text-teal-400">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
                  {invoice.patientName}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                  {formatDate(invoice.date)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-stone-900 dark:text-stone-100">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="px-4 py-3 text-right text-stone-600 dark:text-stone-300">
                  {formatCurrency(invoice.total - invoice.amountPaid)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_STYLES[invoice.status] || 'bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300'
                    )}
                  >
                    {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === invoice.id ? null : invoice.id)
                      }
                      className="rounded p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10 hover:text-stone-600 dark:hover:text-stone-300"
                      title={billingText.viewDetails}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
                      <button
                        onClick={() => onRecordPayment(invoice)}
                        className="rounded p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10 hover:text-stone-600 dark:hover:text-stone-300"
                        title={billingText.recordPayment}
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onViewLedger(invoice)}
                      className="rounded p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10 hover:text-stone-600 dark:hover:text-stone-300"
                      title={billingText.viewLedger}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              {expandedId === invoice.id && (
                <tr className="border-b border-stone-100 dark:border-white/5 bg-stone-900/[0.02] dark:bg-white/[0.03]">
                  <td colSpan={7} className="px-8 py-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      {billingText.lineItems}
                    </h4>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-stone-400 dark:text-stone-500">
                          <th className="pb-1 text-left font-medium">{billingText.cdtCode}</th>
                          <th className="pb-1 text-left font-medium">{billingText.description}</th>
                          <th className="pb-1 text-left font-medium">{billingText.tooth}</th>
                          <th className="pb-1 text-right font-medium">{billingText.quantity}</th>
                          <th className="pb-1 text-right font-medium">{billingText.fee}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr key={item.id} className="text-stone-600 dark:text-stone-300">
                            <td className="py-1 font-mono">{item.cdtCode}</td>
                            <td className="py-1">{item.description}</td>
                            <td className="py-1">{item.toothNumber || '-'}</td>
                            <td className="py-1 text-right">{item.quantity}</td>
                            <td className="py-1 text-right">{formatCurrency(item.fee)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-stone-400 dark:text-stone-500">
          {billingText.noInvoices}
        </div>
      )}
    </div>
  );
}
