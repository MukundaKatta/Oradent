'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Printer,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  DollarSign,
  CheckCircle,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type PaymentMethod = 'cash' | 'check' | 'card' | 'insurance';

interface ProcedureItem {
  id: string;
  cdtCode: string;
  description: string;
  tooth: string;
  fee: number;
}

interface InsuranceAdjustment {
  id: string;
  description: string;
  amount: number;
}

interface PatientCheckout {
  id: string;
  name: string;
  dob: string;
  insuranceProvider: string;
  policyNumber: string;
  procedures: ProcedureItem[];
  adjustments: InsuranceAdjustment[];
}

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_PATIENTS: PatientCheckout[] = [
  {
    id: 'p1',
    name: 'Sarah Johnson',
    dob: '1985-03-15',
    insuranceProvider: 'Delta Dental PPO',
    policyNumber: 'DDG-88421-01',
    procedures: [
      { id: 'pr1', cdtCode: 'D2740', description: 'Crown - porcelain/ceramic substrate', tooth: '#14', fee: 1250 },
      { id: 'pr2', cdtCode: 'D2950', description: 'Core buildup, including any pins', tooth: '#14', fee: 320 },
      { id: 'pr3', cdtCode: 'D0120', description: 'Periodic oral evaluation', tooth: '-', fee: 65 },
    ],
    adjustments: [
      { id: 'a1', description: 'Delta Dental PPO - Crown allowance', amount: -375 },
      { id: 'a2', description: 'Delta Dental PPO - Core buildup', amount: -96 },
      { id: 'a3', description: 'Delta Dental PPO - Exam copay waiver', amount: -65 },
    ],
  },
  {
    id: 'p2',
    name: 'Michael Chen',
    dob: '1992-07-22',
    insuranceProvider: 'Cigna DHMO',
    policyNumber: 'CIG-55102-03',
    procedures: [
      { id: 'pr4', cdtCode: 'D3330', description: 'Endodontic therapy, molar', tooth: '#19', fee: 1150 },
      { id: 'pr5', cdtCode: 'D0220', description: 'Periapical radiograph', tooth: '#19', fee: 35 },
    ],
    adjustments: [
      { id: 'a4', description: 'Cigna DHMO - Endo coverage 50%', amount: -575 },
      { id: 'a5', description: 'Cigna DHMO - Radiograph', amount: -35 },
    ],
  },
  {
    id: 'p3',
    name: 'Emily Rodriguez',
    dob: '1978-11-08',
    insuranceProvider: 'MetLife',
    policyNumber: 'ML-77234-02',
    procedures: [
      { id: 'pr6', cdtCode: 'D1110', description: 'Prophylaxis - adult', tooth: '-', fee: 110 },
      { id: 'pr7', cdtCode: 'D0120', description: 'Periodic oral evaluation', tooth: '-', fee: 65 },
      { id: 'pr8', cdtCode: 'D0274', description: 'Bitewings - four radiographic images', tooth: '-', fee: 72 },
    ],
    adjustments: [
      { id: 'a6', description: 'MetLife - Preventive 100% coverage', amount: -110 },
      { id: 'a7', description: 'MetLife - Exam 100% coverage', amount: -65 },
      { id: 'a8', description: 'MetLife - Radiograph 100% coverage', amount: -72 },
    ],
  },
  {
    id: 'p4',
    name: 'James Wilson',
    dob: '1965-01-30',
    insuranceProvider: 'Self-Pay',
    policyNumber: '-',
    procedures: [
      { id: 'pr9', cdtCode: 'D2391', description: 'Resin composite - 1 surface, posterior', tooth: '#5', fee: 210 },
      { id: 'pr10', cdtCode: 'D2392', description: 'Resin composite - 2 surfaces, posterior', tooth: '#12', fee: 280 },
    ],
    adjustments: [],
  },
];

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'check', label: 'Check', icon: FileText },
  { value: 'insurance', label: 'Insurance Only', icon: Building2 },
];

// ═══════════════════ MAIN PAGE ═══════════════════

export default function QuickCheckoutPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientCheckout | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isPaid, setIsPaid] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery || selectedPatient) return [];
    return MOCK_PATIENTS.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, selectedPatient]);

  const totals = useMemo(() => {
    if (!selectedPatient) return { procedureTotal: 0, adjustmentTotal: 0, patientResponsibility: 0 };
    const procedureTotal = selectedPatient.procedures.reduce((sum, p) => sum + p.fee, 0);
    const adjustmentTotal = selectedPatient.adjustments.reduce((sum, a) => sum + a.amount, 0);
    return {
      procedureTotal,
      adjustmentTotal,
      patientResponsibility: procedureTotal + adjustmentTotal,
    };
  }, [selectedPatient]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleCheckout = () => {
    setIsPaid(true);
  };

  const resetCheckout = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setPaymentMethod('card');
    setIsPaid(false);
    setShowReceipt(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Quick Checkout</h1>
        <p className="mt-1 text-sm text-stone-500">
          Process patient checkout for today&apos;s completed procedures
        </p>
      </div>

      {/* Patient Lookup */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-stone-400" />
            <h2 className="text-base font-semibold text-stone-900">Patient Lookup</h2>
          </div>
        </div>
        <div className="p-6">
          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-teal-900">{selectedPatient.name}</p>
                <p className="text-xs text-teal-700">
                  DOB: {selectedPatient.dob} &middot; {selectedPatient.insuranceProvider} &middot; {selectedPatient.policyNumber}
                </p>
              </div>
              {!isPaid && (
                <button
                  onClick={resetCheckout}
                  className="rounded-md p-1.5 text-teal-600 transition-colors hover:bg-teal-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient by name..."
                  className="flex-1 border-0 bg-transparent text-sm text-stone-700 focus:outline-none"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-stone-200 bg-white shadow-lg">
                  {searchResults.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setSearchQuery('');
                      }}
                      className="block w-full px-4 py-3 text-left transition-colors hover:bg-stone-50"
                    >
                      <p className="text-sm font-medium text-stone-900">{patient.name}</p>
                      <p className="text-xs text-stone-500">
                        {patient.insuranceProvider} &middot; {patient.procedures.length} procedure{patient.procedures.length !== 1 ? 's' : ''} today
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPatient && (
        <>
          {/* Procedures */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-6 py-4">
              <h2 className="text-base font-semibold text-stone-900">Today&apos;s Completed Procedures</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">CDT Code</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Description</th>
                    <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-stone-500">Tooth</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPatient.procedures.map((proc) => (
                    <tr key={proc.id} className="border-b border-stone-50 transition-colors hover:bg-stone-50">
                      <td className="px-5 py-3 font-mono text-xs font-medium text-teal-700">{proc.cdtCode}</td>
                      <td className="px-5 py-3 text-stone-700">{proc.description}</td>
                      <td className="px-5 py-3 text-center text-stone-600">{proc.tooth}</td>
                      <td className="px-5 py-3 text-right font-medium text-stone-900">{formatCurrency(proc.fee)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-stone-200 bg-stone-50">
                    <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-stone-700">Subtotal</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-stone-900">{formatCurrency(totals.procedureTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Insurance Adjustments */}
          {selectedPatient.adjustments.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="border-b border-stone-100 px-6 py-4">
                <h2 className="text-base font-semibold text-stone-900">Insurance Adjustments</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500">Description</th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-stone-500">Adjustment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPatient.adjustments.map((adj) => (
                      <tr key={adj.id} className="border-b border-stone-50 transition-colors hover:bg-stone-50">
                        <td className="px-5 py-3 text-stone-700">{adj.description}</td>
                        <td className="px-5 py-3 text-right font-medium text-green-700">{formatCurrency(adj.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-stone-200 bg-stone-50">
                      <td className="px-5 py-3 text-right text-sm font-semibold text-stone-700">Total Adjustments</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-green-700">{formatCurrency(totals.adjustmentTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Patient Responsibility & Payment */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-6 py-4">
              <h2 className="text-base font-semibold text-stone-900">Payment</h2>
            </div>
            <div className="p-6">
              {/* Total Due */}
              <div className="mb-6 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-6 py-4">
                <span className="text-lg font-semibold text-teal-900">Patient Responsibility</span>
                <span className="text-2xl font-bold text-teal-700">{formatCurrency(totals.patientResponsibility)}</span>
              </div>

              {!isPaid ? (
                <>
                  {/* Payment Method Selector */}
                  <div className="mb-6">
                    <label className="mb-2 block text-xs font-medium text-stone-500">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {METHOD_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setPaymentMethod(option.value)}
                            className={cn(
                              'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors',
                              paymentMethod === option.value
                                ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                                : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                            )}
                          >
                            <Icon className={cn('h-5 w-5', paymentMethod === option.value ? 'text-teal-600' : 'text-stone-400')} />
                            <span className={cn('text-xs font-medium', paymentMethod === option.value ? 'text-teal-700' : 'text-stone-600')}>
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCheckout}
                      className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Process Payment
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Payment Processed Successfully</p>
                      <p className="text-xs text-green-600">
                        {formatCurrency(totals.patientResponsibility)} via {METHOD_OPTIONS.find((m) => m.value === paymentMethod)?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowReceipt(true)}
                      className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
                    >
                      <Printer className="h-4 w-4" />
                      Print Receipt
                    </button>
                    <button
                      onClick={resetCheckout}
                      className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                    >
                      Next Patient
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Print Receipt Modal */}
      {showReceipt && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <h3 className="text-base font-semibold text-stone-900">Receipt</h3>
              <button
                onClick={() => setShowReceipt(false)}
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
                  <span className="font-medium text-stone-900">2026-06-01</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-stone-500">Patient:</span>
                  <span className="font-medium text-stone-900">{selectedPatient.name}</span>
                </div>
              </div>
              <div className="border-t border-dashed border-stone-300 pt-4 space-y-1">
                {selectedPatient.procedures.map((proc) => (
                  <div key={proc.id} className="flex justify-between text-xs">
                    <span className="text-stone-600">{proc.cdtCode} - {proc.description}</span>
                    <span className="font-medium text-stone-900">{formatCurrency(proc.fee)}</span>
                  </div>
                ))}
              </div>
              {selectedPatient.adjustments.length > 0 && (
                <div className="border-t border-dashed border-stone-300 pt-4 space-y-1">
                  {selectedPatient.adjustments.map((adj) => (
                    <div key={adj.id} className="flex justify-between text-xs">
                      <span className="text-stone-600">{adj.description}</span>
                      <span className="font-medium text-green-700">{formatCurrency(adj.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-dashed border-stone-300 pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-stone-900">Total Paid</span>
                  <span className="text-lg font-bold text-teal-600">{formatCurrency(totals.patientResponsibility)}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-stone-500">Method:</span>
                  <span className="text-stone-700">{METHOD_OPTIONS.find((m) => m.value === paymentMethod)?.label}</span>
                </div>
              </div>
              <p className="text-center text-xs text-stone-400">Thank you for choosing BrightSmile Dental!</p>
            </div>
            <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
              <button
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
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
