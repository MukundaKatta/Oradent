'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Brain,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Check,
} from 'lucide-react';
import { ptBR } from "@/i18n";
import { cn } from '@/lib/utils';
import { useReviewAnalysis, useRunXrayAnalysis, useXrayAnalysis, type XrayFinding } from '@/hooks/useAIAnalysis';
import { localizeErrorMessage } from '@/lib/errorMessages';

interface AIAnalysisPanelProps {
  imageId: string;
  patientId: string;
  onClose: () => void;
}

const SEVERITY_STYLES: Record<XrayFinding['severity'], { bg: string; icon: typeof CheckCircle2 }> = {
  mild: { bg: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle2 },
  moderate: { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: Info },
  severe: { bg: 'bg-red-50 border-red-200 text-red-800', icon: AlertTriangle },
};

export function AIAnalysisPanel({
  imageId,
  patientId,
  onClose,
}: AIAnalysisPanelProps) {
  const copy = ptBR.patientWorkflow.imaging;
  const { data: analysis, isLoading } = useXrayAnalysis(imageId);
  const runAnalysis = useRunXrayAnalysis();
  const reviewAnalysis = useReviewAnalysis();

  const findings = analysis?.output.findings ?? analysis?.findings ?? [];
  const hasResults = !!analysis && findings.length > 0;
  const isRunning = runAnalysis.isPending;

  return (
    <Dialog.Root open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-teal-600" />
              <Dialog.Title className="text-lg font-semibold text-stone-900">
                {copy.analysisPanelTitle}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                <p className="mt-3 text-sm text-stone-500">{copy.loadingAnalysis}</p>
              </div>
            ) : isRunning ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <Brain className="h-12 w-12 text-teal-600" />
                  <Loader2 className="absolute -right-1 -top-1 h-5 w-5 animate-spin text-teal-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-stone-700">
                  {copy.analyzingTitle}
                </h3>
                <p className="mt-1 text-center text-sm text-stone-500">
                  {copy.analyzingDescription}
                </p>
              </div>
            ) : hasResults ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <h3 className="text-sm font-semibold text-stone-700">
                    {copy.summary}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {analysis.output.summary}
                  </p>
                </div>

                {/* Review status */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => reviewAnalysis.mutate({ analysisId: analysis.id, accepted: true })}
                    disabled={reviewAnalysis.isPending}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
                      analysis.accepted
                        ? 'bg-green-600 text-white'
                        : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {analysis.accepted ? copy.accepted : copy.accept}
                  </button>
                  {!analysis.accepted && (
                    <button
                      onClick={() => reviewAnalysis.mutate({ analysisId: analysis.id, accepted: false })}
                      disabled={reviewAnalysis.isPending}
                      className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                    >
                      {copy.reject}
                    </button>
                  )}
                </div>

                {/* Findings */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-stone-700">
                    {copy.findingsCount.replace('{{count}}', String(findings.length))}
                  </h3>
                  <div className="space-y-3">
                    {findings.map((finding, i) => {
                      const style = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.mild;
                      const Icon = style.icon;
                      return (
                        <div
                          key={i}
                          className={cn(
                            'rounded-lg border p-4',
                            style.bg
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {finding.finding_type}
                                  {finding.tooth_number ? ` - ${copy.toothPrefix} #${finding.tooth_number}` : ''}
                                </p>
                                <span className="text-xs font-medium opacity-75">
                                  {copy.confidencePercent.replace('{{percent}}', String(Math.round(finding.confidence * 100)))}
                                </span>
                              </div>
                              <p className="mt-1 text-sm opacity-90">
                                {finding.description}
                              </p>
                              {finding.recommendation && (
                                <p className="mt-1 text-xs opacity-75">
                                  {copy.recommendation}: {finding.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-stone-300" />
                <h3 className="mt-4 text-lg font-medium text-stone-700">
                  {copy.noAnalysis}
                </h3>
                <p className="mt-1 text-center text-sm text-stone-500">
                  {copy.noAnalysisDescription}
                </p>
                {runAnalysis.isError && (
                  <p className="mt-2 text-center text-sm text-red-600">
                    {localizeErrorMessage(runAnalysis.error instanceof Error ? runAnalysis.error.message : undefined, copy.analysisFailed)}
                  </p>
                )}
                <button
                  onClick={() => runAnalysis.mutate({ imageId, patientId })}
                  disabled={runAnalysis.isPending}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  <Brain className="h-4 w-4" />
                  {copy.runAnalysis}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {hasResults && (
            <div className="border-t border-stone-200 px-6 py-4">
              <p className="text-xs text-stone-400">
                {copy.analysisDisclaimer}
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
