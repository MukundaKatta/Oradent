'use client';

import { useState } from 'react';
import { Printer, Calendar, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_APPOINTMENTS = [
  {
    id: '1',
    time: '8:00 AM',
    endTime: '8:30 AM',
    patientName: 'Sarah Johnson',
    provider: 'Dr. Emily Carter',
    procedure: 'Prophylaxis / Cleaning',
    chair: 'Chair 1',
    status: 'Confirmed' as const,
    notes: 'Patient prefers fluoride varnish',
  },
  {
    id: '2',
    time: '8:30 AM',
    endTime: '9:30 AM',
    patientName: 'Michael Chen',
    provider: 'Dr. James Wilson',
    procedure: 'Crown Prep #14',
    chair: 'Chair 3',
    status: 'Confirmed' as const,
    notes: 'PFM crown, shade A2',
  },
  {
    id: '3',
    time: '9:00 AM',
    endTime: '9:30 AM',
    patientName: 'Lisa Martinez',
    provider: 'Dr. Emily Carter',
    procedure: 'Periodic Exam',
    chair: 'Chair 1',
    status: 'Checked In' as const,
    notes: '',
  },
  {
    id: '4',
    time: '9:30 AM',
    endTime: '10:30 AM',
    patientName: 'Robert Williams',
    provider: 'Dr. James Wilson',
    procedure: 'Root Canal #19',
    chair: 'Chair 3',
    status: 'Confirmed' as const,
    notes: 'Referred by Dr. Patel. Patient anxious - offer nitrous.',
  },
  {
    id: '5',
    time: '10:00 AM',
    endTime: '10:30 AM',
    patientName: 'Jennifer Davis',
    provider: 'Dr. Emily Carter',
    procedure: 'Composite Filling #5',
    chair: 'Chair 2',
    status: 'Unconfirmed' as const,
    notes: '',
  },
  {
    id: '6',
    time: '10:30 AM',
    endTime: '11:00 AM',
    patientName: 'David Brown',
    provider: 'Dr. Emily Carter',
    procedure: 'Post-op Check',
    chair: 'Chair 1',
    status: 'Confirmed' as const,
    notes: 'Follow-up from extraction #32',
  },
  {
    id: '7',
    time: '11:00 AM',
    endTime: '12:00 PM',
    patientName: 'Amanda Thompson',
    provider: 'Dr. James Wilson',
    procedure: 'Implant Consultation',
    chair: 'Chair 3',
    status: 'Confirmed' as const,
    notes: 'Bring CBCT scan results',
  },
  {
    id: '8',
    time: '1:00 PM',
    endTime: '1:30 PM',
    patientName: 'Kevin Lee',
    provider: 'Dr. Emily Carter',
    procedure: 'Sealants',
    chair: 'Chair 2',
    status: 'Confirmed' as const,
    notes: 'Pediatric patient - age 8',
  },
  {
    id: '9',
    time: '1:30 PM',
    endTime: '2:30 PM',
    patientName: 'Patricia Garcia',
    provider: 'Dr. James Wilson',
    procedure: 'Denture Adjustment',
    chair: 'Chair 3',
    status: 'Unconfirmed' as const,
    notes: 'Lower denture - sore spots',
  },
  {
    id: '10',
    time: '2:00 PM',
    endTime: '3:00 PM',
    patientName: 'Thomas Anderson',
    provider: 'Dr. Emily Carter',
    procedure: 'Deep Cleaning (SRP)',
    chair: 'Chair 1',
    status: 'Confirmed' as const,
    notes: 'UR & LR quads today',
  },
];

const STATUS_STYLES: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  'Checked In': 'bg-blue-100 text-blue-700',
  Unconfirmed: 'bg-amber-100 text-amber-700',
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function AppointmentPrintPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          /* Hide dashboard sidebar, header, and nav */
          nav,
          aside,
          header,
          [data-sidebar],
          [data-header] {
            display: none !important;
          }
          /* Hide the controls bar */
          .print-hide {
            display: none !important;
          }
          /* Full width for content */
          main {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          /* Print-optimized table */
          .print-table {
            font-size: 11px !important;
          }
          .print-table th,
          .print-table td {
            padding: 6px 8px !important;
            border: 1px solid #d6d3d1 !important;
          }
          /* Ensure background colors print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: white !important;
          }
          @page {
            margin: 0.5in;
            size: landscape;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Controls Bar - hidden when printing */}
        <div className="print-hide flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Print Daily Schedule</h1>
            <p className="mt-1 text-sm text-stone-500">
              Preview and print the appointment schedule for any day.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-stone-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Printer className="h-4 w-4" />
              Print Schedule
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          {/* Practice Header */}
          <div className="mb-6 border-b border-stone-200 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                  <Building2 className="h-7 w-7 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Bright Smile Dental</h2>
                  <p className="text-sm text-stone-500">
                    123 Main Street, Suite 200, Springfield, IL 62701
                  </p>
                  <p className="text-sm text-stone-500">
                    Phone: (555) 123-4567 | Fax: (555) 123-4568
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-stone-900">Daily Schedule</p>
                <p className="text-sm text-stone-600">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Summary Row */}
          <div className="mb-4 flex gap-6 text-sm text-stone-600">
            <span>
              <span className="font-medium text-stone-900">{MOCK_APPOINTMENTS.length}</span>{' '}
              appointments
            </span>
            <span>
              <span className="font-medium text-stone-900">
                {MOCK_APPOINTMENTS.filter((a) => a.status === 'Confirmed').length}
              </span>{' '}
              confirmed
            </span>
            <span>
              <span className="font-medium text-stone-900">
                {MOCK_APPOINTMENTS.filter((a) => a.status === 'Unconfirmed').length}
              </span>{' '}
              unconfirmed
            </span>
            <span>
              <span className="font-medium text-stone-900">2</span> providers
            </span>
          </div>

          {/* Appointments Table */}
          <div className="overflow-x-auto">
            <table className="print-table w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-stone-300 bg-stone-50">
                  <th className="px-4 py-3 font-semibold text-stone-700">Time</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Patient Name</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Provider</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Procedure</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Chair</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-stone-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_APPOINTMENTS.map((appt, index) => (
                  <tr
                    key={appt.id}
                    className={cn(
                      'border-b border-stone-200 transition-colors',
                      index % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-900">
                      {appt.time}
                      <span className="block text-xs font-normal text-stone-400">
                        to {appt.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">{appt.patientName}</td>
                    <td className="px-4 py-3 text-stone-600">{appt.provider}</td>
                    <td className="px-4 py-3 text-stone-600">{appt.procedure}</td>
                    <td className="px-4 py-3 text-stone-600">{appt.chair}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_STYLES[appt.status] || 'bg-stone-100 text-stone-600'
                        )}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-stone-500">
                      {appt.notes || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-6 border-t border-stone-200 pt-4 text-xs text-stone-400">
            <div className="flex items-center justify-between">
              <span>Generated on {new Date().toLocaleString()}</span>
              <span>Bright Smile Dental - Confidential</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
