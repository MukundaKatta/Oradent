'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { billingText, getLedgerTypeLabel } from './billingLabels';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'charge' | 'payment' | 'adjustment' | 'insurance';
  amount: number;
  balance: number;
  reference?: string;
  provider?: string;
}

interface LedgerInvoicePayment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  date: string;
}

interface LedgerInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  total: number;
  payments: LedgerInvoicePayment[];
}

interface LedgerResponse {
  invoices: LedgerInvoice[];
  summary: { totalCharges: number; totalPayments: number; balance: number };
}

// The API returns raw invoices + nested payments, not a flat chronological
// ledger — flatten them into charge/payment entries with a running balance.
function buildLedgerEntries(data: LedgerResponse): LedgerEntry[] {
  const raw: Omit<LedgerEntry, 'balance'>[] = [];

  for (const invoice of data.invoices) {
    raw.push({
      id: `${invoice.id}-charge`,
      date: invoice.date,
      description: `Fatura ${invoice.invoiceNumber}`,
      type: 'charge',
      amount: invoice.total,
      reference: invoice.invoiceNumber,
    });
    for (const payment of invoice.payments) {
      raw.push({
        id: payment.id,
        date: payment.date,
        description: `Pagamento — Fatura ${invoice.invoiceNumber}`,
        type: payment.method === 'INSURANCE' ? 'insurance' : 'payment',
        amount: payment.amount,
        reference: payment.reference || invoice.invoiceNumber,
      });
    }
  }

  raw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let running = 0;
  const withBalance = raw.map((entry) => {
    running += entry.type === 'charge' ? entry.amount : -entry.amount;
    return { ...entry, balance: Math.round(running * 100) / 100 };
  });

  return withBalance.reverse();
}

interface LedgerViewProps {
  patientId: string;
  patientName: string;
  onBack: () => void;
}

export function LedgerView({ patientId, patientName, onBack }: LedgerViewProps) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summaryBalance, setSummaryBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, [patientId]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await apiGet<LedgerResponse>(`/api/billing/ledger/${patientId}`);
      setEntries(buildLedgerEntries(data));
      setSummaryBalance(data.summary.balance);
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const TYPE_STYLES: Record<string, { label: string; style: string; icon: typeof ArrowDownLeft }> = {
    charge: { label: getLedgerTypeLabel('charge'), style: 'text-red-600', icon: ArrowUpRight },
    payment: { label: getLedgerTypeLabel('payment'), style: 'text-green-600', icon: ArrowDownLeft },
    adjustment: { label: getLedgerTypeLabel('adjustment'), style: 'text-amber-600', icon: ArrowDownLeft },
    insurance: { label: getLedgerTypeLabel('insurance'), style: 'text-blue-600', icon: ArrowDownLeft },
  };

  const currentBalance = summaryBalance;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg p-1.5 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{billingText.patientLedger}</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">{patientName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500 dark:text-stone-400">{billingText.currentBalance}</p>
          <p
            className={cn(
              'text-lg font-bold',
              currentBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            )}
          >
            {formatCurrency(currentBalance)}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-200/40 dark:bg-white/5" />
          ))}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 dark:border-white/10">
              <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">{billingText.date}</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">{billingText.description}</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">{billingText.type}</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">{billingText.reference}</th>
              <th className="px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400">{billingText.amount}</th>
              <th className="px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400">{billingText.balance}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const typeInfo = TYPE_STYLES[entry.type] || TYPE_STYLES.charge;
              const Icon = typeInfo.icon;
              return (
                <tr
                  key={entry.id}
                  className="border-b border-stone-100 dark:border-white/5 hover:bg-stone-900/[0.03] dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
                    {entry.description}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Icon className={cn('h-3.5 w-3.5', typeInfo.style)} />
                      <span className={cn('text-xs font-medium', typeInfo.style)}>
                        {typeInfo.label}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500 dark:text-stone-400">
                    {entry.reference || '-'}
                  </td>
                  <td className={cn('px-4 py-3 text-right font-medium', typeInfo.style)}>
                    {entry.type === 'charge' ? '' : '-'}
                    {formatCurrency(Math.abs(entry.amount))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-stone-900 dark:text-stone-100">
                    {formatCurrency(entry.balance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {!loading && entries.length === 0 && (
        <div className="py-12 text-center text-sm text-stone-400 dark:text-stone-500">
          {billingText.noLedgerEntries}
        </div>
      )}
    </div>
  );
}
