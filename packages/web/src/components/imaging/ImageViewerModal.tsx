'use client';

import { useEffect, useCallback } from 'react';
import { X, Calendar, Hash, FileText, Brain, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { DentalImage } from '@/types';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ImageViewerModalProps {
  image: DentalImage | null;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  PERIAPICAL: 'Periapical',
  BITEWING: 'Bitewing',
  PANORAMIC: 'Panoramic',
  CEPHALOMETRIC: 'Cephalometric',
  CBCT: 'CBCT',
  INTRAORAL_PHOTO: 'Intraoral Photo',
  EXTRAORAL_PHOTO: 'Extraoral Photo',
  OTHER: 'Other',
};

const SEVERITY_STYLES: Record<string, { bg: string; icon: typeof CheckCircle2 }> = {
  low: { bg: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle2 },
  medium: { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: Info },
  high: { bg: 'bg-red-50 border-red-200 text-red-800', icon: AlertTriangle },
};

export function ImageViewerModal({ image, onClose }: ImageViewerModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!image) return null;

  const analyses = image.aiAnalyses ?? [];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-lg bg-stone-900/60 p-2 text-white hover:bg-stone-900/80 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image area */}
        <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
          <img
            src={image.filePath}
            alt={image.fileName}
            className="max-h-full max-w-full rounded-lg object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('[data-placeholder]')) {
                const placeholder = document.createElement('div');
                placeholder.setAttribute('data-placeholder', 'true');
                placeholder.className =
                  'flex flex-col items-center justify-center rounded-xl bg-stone-800 p-12 text-stone-400';
                placeholder.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg><span class="text-sm">Image could not be loaded</span>';
                parent.appendChild(placeholder);
              }
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full border-t border-stone-700 bg-stone-900 lg:w-96 lg:border-l lg:border-t-0 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Image info */}
            <div>
              <h2 className="text-lg font-semibold text-white">{image.fileName}</h2>
              <span className="mt-2 inline-block rounded-full bg-teal-600/20 px-3 py-1 text-xs font-medium text-teal-400">
                {TYPE_LABELS[image.type] || image.type}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-stone-400" />
                <div>
                  <p className="text-stone-400">Date Taken</p>
                  <p className="text-white">{formatDate(image.dateTaken)}</p>
                </div>
              </div>

              {image.toothNumbers.length > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Hash className="h-4 w-4 text-stone-400" />
                  <div>
                    <p className="text-stone-400">Tooth Numbers</p>
                    <p className="text-white">
                      {image.toothNumbers.map((t) => `#${t}`).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {image.notes && (
                <div className="flex items-start gap-3 text-sm">
                  <FileText className="mt-0.5 h-4 w-4 text-stone-400" />
                  <div>
                    <p className="text-stone-400">Notes</p>
                    <p className="text-white">{image.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Analyses */}
            {analyses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-teal-400" />
                  <h3 className="text-sm font-semibold text-white">
                    AI Analysis ({analyses.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="rounded-lg border border-stone-700 bg-stone-800 p-4"
                    >
                      {analysis.confidence !== null && (
                        <p className="mb-2 text-xs font-medium text-stone-400">
                          Confidence: {Math.round(analysis.confidence * 100)}%
                        </p>
                      )}
                      {analysis.findings && analysis.findings.length > 0 && (
                        <div className="space-y-2">
                          {analysis.findings.map((finding, idx) => {
                            const severity = finding.severity || 'low';
                            const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.low;
                            const Icon = style.icon;
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  'rounded-md border p-3 text-xs',
                                  style.bg
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                  <div>
                                    <p className="font-medium">
                                      {finding.type}
                                      {finding.toothNumber
                                        ? ` - Tooth #${finding.toothNumber}`
                                        : ''}
                                    </p>
                                    <p className="mt-0.5 opacity-90">
                                      {finding.description}
                                    </p>
                                    {finding.recommendation && (
                                      <p className="mt-1 italic opacity-75">
                                        {finding.recommendation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
