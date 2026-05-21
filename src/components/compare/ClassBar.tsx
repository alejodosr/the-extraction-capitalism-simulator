import type { SimulationRun } from '../../engine/types';
import { TIER_COLORS } from '../../theme';

interface Props {
  runs: SimulationRun[];
}

const COLORS = TIER_COLORS;

export function ClassBar({ runs }: Props) {
  return (
    <div className="rounded-lg border border-econ-border bg-econ-card p-4">
      <h3 className="mb-2 text-sm font-semibold">Final-year class composition</h3>
      <div className="flex flex-col gap-3">
        {runs.map((run) => {
          const final = run.metrics[run.metrics.length - 1];
          if (!final) return null;
          const d = final.classDistribution;
          return (
            <div key={run.id}>
              <div className="mb-1 flex items-baseline justify-between font-mono text-xs text-econ-muted">
                <span className="text-econ-ink">{run.config.name}</span>
                <span>year {final.year}</span>
              </div>
              <div className="flex h-6 w-full overflow-hidden rounded">
                <Segment fraction={d.upper} color={COLORS.upper} label="Upper" />
                <Segment fraction={d.middle} color={COLORS.middle} label="Middle" />
                <Segment fraction={d.lower} color={COLORS.lower} label="Lower" />
                <Segment
                  fraction={d.social_exclusion}
                  color={COLORS.social_exclusion}
                  label="Social exclusion"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-econ-muted">
        {Object.entries(COLORS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: v }}
            />
            {k.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}

function Segment({
  fraction,
  color,
  label,
}: {
  fraction: number;
  color: string;
  label: string;
}) {
  if (fraction <= 0) return null;
  return (
    <div
      style={{ width: `${fraction * 100}%`, backgroundColor: color }}
      title={`${label}: ${(fraction * 100).toFixed(1)}%`}
      className="flex items-center justify-center text-[10px] font-medium text-white"
    >
      {fraction > 0.08 ? `${Math.round(fraction * 100)}%` : ''}
    </div>
  );
}
