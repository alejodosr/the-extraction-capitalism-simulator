import { useMemo } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { KPIRow } from './KPIRow';
import { SankeyFlow } from './SankeyFlow';
import { ClassTimeline } from './ClassTimeline';
import { WealthConcentration } from './WealthConcentration';
import { TimelineScrubber } from './TimelineScrubber';

export function DashboardView() {
  const runs = useSimulationStore((s) => s.runs);
  const currentRunId = useSimulationStore((s) => s.currentRunId);
  const selectRun = useSimulationStore((s) => s.selectRun);
  const removeRun = useSimulationStore((s) => s.removeRun);
  const selectedYear = useSimulationStore((s) => s.selectedYear);
  const setSelectedYear = useSimulationStore((s) => s.setSelectedYear);

  const currentRun = useMemo(() => {
    if (currentRunId) return runs.find((r) => r.id === currentRunId) ?? runs[runs.length - 1];
    return runs[runs.length - 1];
  }, [runs, currentRunId]);

  if (!currentRun) {
    return (
      <div className="rounded-lg border border-econ-border bg-econ-card p-8 text-center text-econ-muted">
        No simulations yet. Head to <span className="font-semibold">Setup</span> to run one.
      </div>
    );
  }

  const maxYear = currentRun.metrics.length;
  const yearIndex = Math.min(Math.max(selectedYear - 1, 0), maxYear - 1);
  const selectedMetric = currentRun.metrics[yearIndex];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{currentRun.config.name}</h2>
          <p className="font-mono text-xs text-econ-muted">
            {currentRun.metrics.length} years · created{' '}
            {new Date(currentRun.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={currentRun.id}
            onChange={(e) => selectRun(e.target.value)}
            className="rounded-md border border-econ-border bg-econ-card px-3 py-1.5 text-sm"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.config.name} · {new Date(r.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>
          <button
            onClick={() => removeRun(currentRun.id)}
            className="rounded-md border border-econ-border px-3 py-1.5 text-sm text-econ-muted hover:border-econ-exclusion hover:text-econ-exclusion"
          >
            Delete
          </button>
        </div>
      </div>

      <KPIRow metrics={currentRun.metrics} selectedYearIndex={yearIndex} />

      <SankeyFlow metric={selectedMetric} year={yearIndex + 1} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ClassTimeline metrics={currentRun.metrics} selectedYearIndex={yearIndex} />
        <WealthConcentration metrics={currentRun.metrics} selectedYearIndex={yearIndex} />
      </div>

      <TimelineScrubber
        min={1}
        max={maxYear}
        value={yearIndex + 1}
        onChange={(y) => setSelectedYear(y)}
      />
    </div>
  );
}
