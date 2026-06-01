'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Printer,
  Check,
  X,
  FileText,
  DollarSign,
  Shield,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';

// ═══════════════════ TYPES ═══════════════════

interface TreatmentPlanItem {
  id: string;
  toothNumber: number | null;
  surfaces: string[];
  cdtCode: string;
  description: string;
  fee: number;
  insurancePays: number;
  patientPays: number;
  priority: number;
  status: string;
  sortOrder: number;
}

interface TreatmentPlanDetail {
  id: string;
  patientId: string;
  patient?: { firstName: string; lastName: string; dateOfBirth: string };
  name: string;
  status: string;
  items: TreatmentPlanItem[];
  totalFee: number;
  insuranceEst: number;
  patientEst: number;
  presentedAt: string | null;
  acceptedAt: string | null;
  notes: string | null;
  createdAt: string;
}

// ═══════════════════ SIGNATURE CANVAS ═══════════════════

function SignatureCanvas({
  onSignatureChange,
}: {
  onSignatureChange: (hasSignature: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  }, []);

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const ctx = getContext();
      if (!ctx) return;
      isDrawing.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    },
    [getContext, getPos]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const ctx = getContext();
      if (!ctx) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [getContext, getPos]
  );

  const endDraw = useCallback(() => {
    isDrawing.current = false;
    onSignatureChange(true);
  }, [onSignatureChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange(false);
  }, [onSignatureChange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-stone-700">Patient Signature</label>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={150}
        className="w-full rounded-lg border-2 border-dashed border-stone-300 bg-white cursor-crosshair touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <p className="mt-1 text-xs text-stone-400">Sign above using your mouse or touch screen</p>
    </div>
  );
}

// ═══════════════════ PRIORITY BADGE ═══════════════════

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
  2: { label: 'High', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  4: { label: 'Low', color: 'bg-stone-100 text-stone-600' },
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function TreatmentPlanPresentPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const planId = params.planId as string;
  const [hasSignature, setHasSignature] = useState(false);

  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['treatment-plan', planId],
    queryFn: () => apiGet<TreatmentPlanDetail>(`/api/treatments/plans/${planId}`),
    enabled: !!planId,
  });

  const acceptMutation = useMutation({
    mutationFn: () =>
      apiPost(`/api/treatments/plans/${planId}/accept`, { signedAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plan', planId] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => apiPost(`/api/treatments/plans/${planId}/decline`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plan', planId] });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-lg font-semibold text-stone-900">Treatment Plan Not Found</h2>
        <p className="mt-2 text-sm text-stone-500">
          The treatment plan could not be loaded. It may have been deleted or you may not have access.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isAccepted = plan.status === 'ACCEPTED' || plan.status === 'IN_PROGRESS' || plan.status === 'COMPLETED';
  const isDeclined = plan.status === 'DECLINED';
  const canRespond = plan.status === 'PROPOSED' || plan.status === 'PRESENTED';

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-none print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Treatment Plan</h1>
          <p className="mt-1 text-sm text-stone-500">{plan.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              isAccepted
                ? 'bg-green-100 text-green-700'
                : isDeclined
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
            )}
          >
            {plan.status}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* Patient Info */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-center gap-3 mb-1">
          <FileText className="h-5 w-5 text-teal-600 print:hidden" />
          <h2 className="text-lg font-semibold text-stone-900">Patient Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <span className="text-stone-500">Patient:</span>{' '}
            <span className="font-medium text-stone-900">
              {plan.patient ? `${plan.patient.firstName} ${plan.patient.lastName}` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-stone-500">DOB:</span>{' '}
            <span className="font-medium text-stone-900">
              {plan.patient ? formatDate(plan.patient.dateOfBirth) : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-stone-500">Plan Date:</span>{' '}
            <span className="font-medium text-stone-900">{formatDate(plan.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Procedures Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm print:border-0 print:shadow-none">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Recommended Procedures</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-4 py-3 text-left font-medium text-stone-500">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">CDT Code</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Procedure</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Tooth</th>
                <th className="px-4 py-3 text-right font-medium text-stone-500">Fee</th>
                <th className="px-4 py-3 text-right font-medium text-stone-500">Insurance Est.</th>
                <th className="px-4 py-3 text-right font-medium text-stone-500">Your Cost</th>
              </tr>
            </thead>
            <tbody>
              {plan.items
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((item) => {
                  const priority = PRIORITY_LABELS[item.priority] ?? PRIORITY_LABELS[3];
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-stone-100 hover:bg-stone-50 transition-colors print:hover:bg-transparent"
                    >
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', priority.color)}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-600">{item.cdtCode}</td>
                      <td className="px-4 py-3 font-medium text-stone-900">{item.description}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {item.toothNumber ? `#${item.toothNumber}` : '--'}
                        {item.surfaces.length > 0 && (
                          <span className="ml-1 text-stone-400">({item.surfaces.join(',')})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-900">{formatCurrency(item.fee)}</td>
                      <td className="px-4 py-3 text-right text-teal-700">{formatCurrency(item.insurancePays)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-900">
                        {formatCurrency(item.patientPays)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-5 w-5 text-teal-600 print:hidden" />
          <h2 className="text-lg font-semibold text-stone-900">Cost Summary</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600">Total Treatment Fee</span>
            <span className="font-medium text-stone-900">{formatCurrency(plan.totalFee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-stone-600">
              <Shield className="h-4 w-4 text-teal-600" />
              Estimated Insurance Coverage
            </span>
            <span className="font-medium text-teal-700">-{formatCurrency(plan.insuranceEst)}</span>
          </div>
          <div className="border-t border-stone-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-stone-900">Estimated Patient Responsibility</span>
              <span className="text-xl font-bold text-stone-900">{formatCurrency(plan.patientEst)}</span>
            </div>
          </div>
        </div>

        {plan.notes && (
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            <span className="font-medium">Notes: </span>
            {plan.notes}
          </div>
        )}
      </div>

      {/* Signature & Response */}
      {canRespond && (
        <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:hidden">
          <SignatureCanvas onSignatureChange={setHasSignature} />

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-5">
            <button
              onClick={() => declineMutation.mutate()}
              disabled={declineMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              {declineMutation.isPending ? 'Declining...' : 'Decline Plan'}
            </button>
            <button
              onClick={() => acceptMutation.mutate()}
              disabled={!hasSignature || acceptMutation.isPending}
              className={cn(
                'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors',
                hasSignature && !acceptMutation.isPending
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'cursor-not-allowed bg-stone-300'
              )}
            >
              <Check className="h-4 w-4" />
              {acceptMutation.isPending ? 'Accepting...' : 'Accept Treatment Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Status Banner */}
      {isAccepted && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 print:hidden">
          <Check className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">Treatment Plan Accepted</p>
            <p className="text-xs text-green-600">
              Accepted on {formatDate(plan.acceptedAt)}
            </p>
          </div>
        </div>
      )}
      {isDeclined && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 print:hidden">
          <X className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800">Treatment Plan Declined</p>
            <p className="text-xs text-red-600">The patient has declined this treatment plan.</p>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav, header, aside, .print\\:hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
