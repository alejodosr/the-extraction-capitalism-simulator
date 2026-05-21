import { useSimulationStore } from '../../store/simulationStore';
import { RunSelector } from './RunSelector';
import { MetricChart } from './MetricChart';
import { ClassBar } from './ClassBar';

export function CompareView() {
  const allRuns = useSimulationStore((s) => s.runs);
  const selection = useSimulationStore((s) => s.compareSelection);
  const clearAllRuns = useSimulationStore((s) => s.clearAllRuns);
  const runs = selection
    .map((id) => allRuns.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => r !== undefined);

  function handleClearAll() {
    if (confirm('Delete all saved simulations? This cannot be undone.')) {
      clearAllRuns();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-econ-border bg-econ-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <RunSelector />
          </div>
          {allRuns.length > 0 && (
            <button
              onClick={handleClearAll}
              className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:border-red-300"
            >
              Delete all
            </button>
          )}
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-lg border border-econ-border bg-econ-card p-8 text-center text-econ-muted">
          Select up to four saved runs above to overlay them.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MetricChart
            title="Gini coefficient"
            runs={runs}
            getValue={(m) => m.gini}
            format={(v) => v.toFixed(2)}
            yDomain={[0, 1]}
          />
          <MetricChart
            title="Social exclusion rate"
            runs={runs}
            getValue={(m) => m.socialExclusionRate}
            format={(v) => `${(v * 100).toFixed(0)}%`}
            yDomain={[0, 'auto']}
          />
          <MetricChart
            title="GDP"
            runs={runs}
            getValue={(m) => m.gdp}
            format={formatMoney}
          />
          <MetricChart
            title="Top 1% wealth share"
            runs={runs}
            getValue={(m) => m.wealthConcentration.top1}
            format={(v) => `${(v * 100).toFixed(1)}%`}
            yDomain={[0, 1]}
          />
          <MetricChart
            title="Top 5% wealth share"
            runs={runs}
            getValue={(m) => m.wealthConcentration.top5}
            format={(v) => `${(v * 100).toFixed(1)}%`}
            yDomain={[0, 1]}
          />
          <ClassBar runs={runs} />
        </div>
      )}
    </div>
  );
}

function formatMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}
