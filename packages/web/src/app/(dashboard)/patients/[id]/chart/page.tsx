'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useDentalChart, useUpdateTooth } from '@/hooks/useDentalChart';
import DentalChart, { type ToothRecord } from '@/components/dental-chart/DentalChart';
import { toTeethDataMap, toUpdateToothInput } from '@/components/dental-chart/legacyAdapter';
import { AdvancedOdontogramContainer } from '@/components/dental-chart/advanced/AdvancedOdontogramContainer';
import { ptBR } from '@/i18n';
import { cn } from '@/lib/utils';

// Feature flag: which odontogram opens by default. Either mode stays
// available via the toggle below, so this only controls the starting point
// — flipping the env var and redeploying is not required for rollback.
const ADVANCED_DEFAULT = process.env.NEXT_PUBLIC_ADVANCED_ODONTOGRAM_ENABLED === 'true';

type ChartMode = 'legacy' | 'advanced';

export default function DentalChartPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [mode, setMode] = useState<ChartMode>(ADVANCED_DEFAULT ? 'advanced' : 'legacy');

  const { data: chartData, isLoading, refetch } = useDentalChart(mode === 'legacy' ? patientId : undefined);
  const updateTooth = useUpdateTooth(patientId);
  const chartText = ptBR.patientWorkflow.chart;

  const teethData = useMemo(() => (chartData ? toTeethDataMap(chartData) : {}), [chartData]);

  const handleToothSave = (toothNumber: number, record: ToothRecord) => {
    updateTooth.mutate(toUpdateToothInput(toothNumber, record));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">{chartText.dentalChart}</h2>

        <div className="flex items-center gap-2">
          <div className="glass flex rounded-full p-1 text-sm">
            <button
              onClick={() => setMode('legacy')}
              className={cn(
                'rounded-full px-3 py-1.5 font-medium transition-colors',
                mode === 'legacy'
                  ? 'bg-teal-600 text-white shadow-apple-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              )}
            >
              {chartText.classicChart}
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={cn(
                'rounded-full px-3 py-1.5 font-medium transition-colors',
                mode === 'advanced'
                  ? 'bg-teal-600 text-white shadow-apple-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              )}
            >
              {chartText.advancedChart}
            </button>
          </div>

          {mode === 'legacy' && (
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-full border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 shadow-apple-sm hover:bg-white dark:hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              {ptBR.patientWorkflow.common.refresh}
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      {mode === 'legacy' ? (
        isLoading ? (
          <div className="h-[500px] animate-pulse rounded-2xl bg-stone-200/60 dark:bg-white/5" />
        ) : (
          <div className="glass-card p-6">
            <DentalChart teethData={teethData} onToothSave={handleToothSave} />
          </div>
        )
      ) : (
        <AdvancedOdontogramContainer patientId={patientId} />
      )}
    </div>
  );
}
