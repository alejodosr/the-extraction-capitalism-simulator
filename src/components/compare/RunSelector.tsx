import { useSimulationStore } from '../../store/simulationStore';
import { COMPARE_COLORS as THEME_COMPARE } from '../../theme';

export const COMPARE_COLORS = THEME_COMPARE;

export function RunSelector() {
  const runs = useSimulationStore((s) => s.runs);
  const selected = useSimulationStore((s) => s.compareSelection);
  const toggle = useSimulationStore((s) => s.toggleCompare);

  if (runs.length === 0) {
    return (
      <div className="font-mono text-sm text-econ-muted">No runs to compare yet.</div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-econ-muted">Overlay (max 4):</span>
      {runs.map((run) => {
        const idx = selected.indexOf(run.id);
        const active = idx !== -1;
        const color = active ? COMPARE_COLORS[idx % COMPARE_COLORS.length] : '#E5E3DE';
        return (
          <button
            key={run.id}
            onClick={() => toggle(run.id)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
              active
                ? 'border-econ-ink bg-econ-ink text-white'
                : 'border-econ-border bg-econ-card text-econ-ink hover:border-econ-ink'
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {run.config.name}
          </button>
        );
      })}
    </div>
  );
}
