'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, PanelsTopLeft } from 'lucide-react';
import { useAdvancedOdontogram } from '@/hooks/useAdvancedOdontogram';
import { ptBR } from '@/i18n';
import { cn } from '@/lib/utils';

// react-advanced-odontogram is a client-only widget: it reads the DOM on
// mount and keeps its data as a module-level singleton engine (one instance
// per page — see ODONTOGRAM_DATA_MAPPING.md). We therefore load it lazily
// inside an effect rather than as a static/next-dynamic import, and drive it
// through its imperative API (initOdontogram/importStatus/getStatusChart/
// onStateChange) instead of props, since it has no controlled-data props.
//
// Mount order matters: initOdontogram() "wires up" DOM controls that
// <OdontogramShell> itself renders — it does not create them. So the shell
// must already be mounted in the DOM before initOdontogram() runs, not
// after. Gating the shell's render on engineReady (as an earlier version of
// this component did) is backwards and throws inside the package
// ("Cannot set properties of null (setting 'innerHTML')") because
// initOdontogram can't find the elements yet.
type OdontogramModule = typeof import('react-advanced-odontogram');

function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains('dark'));
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

interface AdvancedOdontogramContainerProps {
  patientId: string;
  readOnly?: boolean;
}

export function AdvancedOdontogramContainer({ patientId, readOnly = false }: AdvancedOdontogramContainerProps) {
  const [mod, setMod] = useState<OdontogramModule | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [perioOpen, setPerioOpen] = useState(false);
  const hydratedForRef = useRef<string | null>(null);
  const isDark = useIsDarkMode();
  const chartText = ptBR.patientWorkflow.chart;

  const { chart, isLoading, saveStatus, save, refetch } = useAdvancedOdontogram(patientId);

  // Load the package + its stylesheet once, client-side only.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      import('react-advanced-odontogram'),
      // @ts-expect-error -- CSS side-effect import, no type declarations
      import('react-advanced-odontogram/style.css'),
    ]).then(([m]) => {
      if (!cancelled) setMod(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Init/destroy the engine and wire the autosave subscription. Runs after
  // <OdontogramShell> below has committed to the DOM (same render pass),
  // which is what initOdontogram() needs to find.
  useEffect(() => {
    if (!mod) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    mod.initOdontogram().then(() => {
      if (cancelled) return;
      setEngineReady(true);
      unsubscribe = mod.onStateChange(() => {
        if (readOnly) return;
        save(mod.getStatusChart());
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
      mod.destroyOdontogram();
      setEngineReady(false);
      hydratedForRef.current = null;
    };
  }, [mod, readOnly, save]);

  // Hydrate from the fetched chart exactly once per patient, and keep
  // read-only mode in sync.
  useEffect(() => {
    if (!mod || !engineReady || isLoading) return;
    if (hydratedForRef.current !== patientId) {
      if (chart?.statusChart) {
        mod.importStatus(chart.statusChart);
      }
      hydratedForRef.current = patientId;
    }
    mod.setReadOnly(readOnly);
  }, [mod, engineReady, isLoading, chart, patientId, readOnly]);

  const handleReload = () => {
    hydratedForRef.current = null;
    void refetch();
  };

  if (!mod) {
    return (
      <div className="glass-card flex h-[600px] items-center justify-center text-sm text-stone-500 dark:text-stone-400">
        {chartText.loadingAdvanced}
      </div>
    );
  }

  const { OdontogramShell, PerioChart } = mod;
  const notReady = !engineReady || isLoading;
  const statusMessage = chartText.saveStatus[saveStatus];

  return (
    <div className="glass-card overflow-hidden relative">
      {notReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm text-sm text-stone-500 dark:text-stone-400">
          {chartText.loadingAdvanced}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 px-4 py-2">
        <div className="flex items-center gap-2 text-xs">
          {saveStatus === 'conflict' || saveStatus === 'error' ? (
            <span className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {statusMessage}
              {saveStatus === 'conflict' && (
                <button
                  onClick={handleReload}
                  className="ml-1 rounded-full bg-red-100 dark:bg-red-500/15 px-2 py-0.5 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/25"
                >
                  {chartText.reloadChart}
                </button>
              )}
            </span>
          ) : (
            <span className={cn('text-stone-500 dark:text-stone-400', saveStatus === 'saving' && 'animate-pulse')}>
              {statusMessage}
            </span>
          )}
        </div>
        <button
          onClick={() => setPerioOpen(true)}
          disabled={notReady}
          className="flex items-center gap-1.5 rounded-full border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1 text-xs font-medium text-stone-600 dark:text-stone-300 shadow-apple-sm hover:bg-white dark:hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <PanelsTopLeft className="h-3.5 w-3.5" />
          {chartText.openPerio}
        </button>
      </div>

      <OdontogramShell
        language="pt-br"
        numberingSystem="FDI"
        darkMode={isDark}
        readOnly={readOnly}
        enableNotes
      />

      {engineReady && <PerioChart open={perioOpen} onClose={() => setPerioOpen(false)} />}
    </div>
  );
}
