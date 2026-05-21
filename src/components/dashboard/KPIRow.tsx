import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { YearMetrics } from '../../engine/types';
import { METRIC_COLORS } from '../../theme';

interface KPIProps {
  label: string;
  hint?: string;
  format: (v: number) => string;
  value: number;
  baseline: number;
  improvingDirection: 'up' | 'down';
  series: number[];
  color: string;
  alert?: boolean;
}

function KPI({
  label,
  hint,
  format,
  value,
  baseline,
  improvingDirection,
  series,
  color,
  alert,
}: KPIProps) {
  const delta = value - baseline;
  const isImproving =
    delta === 0
      ? null
      : improvingDirection === 'up'
        ? delta > 0
        : delta < 0;
  const deltaClass =
    isImproving === null
      ? 'text-econ-muted'
      : isImproving
        ? 'text-econ-middle'
        : 'text-econ-exclusion';
  const deltaSign = delta >= 0 ? '+' : '';
  const data = series.map((v, i) => ({ x: i, y: v }));

  return (
    <div
      className={`rounded-xl border bg-econ-card p-4 shadow-card transition ${
        alert ? 'border-econ-exclusion/40' : 'border-econ-border'
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-econ-muted">{label}</span>
        {alert && (
          <span className="rounded-full bg-econ-exclusion/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-econ-exclusion">
            crisis
          </span>
        )}
      </div>
      <div className="mb-0.5 font-mono text-2xl tabular-nums text-econ-ink">{format(value)}</div>
      <div className={`mb-1.5 font-mono text-xs ${deltaClass}`}>
        {deltaSign}
        {format(delta)} vs. year 1
      </div>
      {hint && <div className="mb-2 font-mono text-[10px] text-econ-muted">{hint}</div>}
      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="y"
              stroke={color}
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface KPIRowProps {
  metrics: YearMetrics[];
  selectedYearIndex: number;
}

export function KPIRow({ metrics, selectedYearIndex }: KPIRowProps) {
  if (metrics.length === 0) return null;
  const clamped = Math.min(Math.max(selectedYearIndex, 0), metrics.length - 1);
  const current = metrics[clamped];
  const baseline = metrics[0];

  const fmtMoney = (v: number) =>
    Math.abs(v) >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : Math.abs(v) >= 1_000
        ? `$${(v / 1_000).toFixed(1)}k`
        : `$${v.toFixed(0)}`;
  const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const fmtNum = (v: number) => v.toFixed(3);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <KPI
        label="GDP"
        format={fmtMoney}
        value={current.gdp}
        baseline={baseline.gdp}
        improvingDirection="up"
        series={metrics.map((m) => m.gdp)}
        color={METRIC_COLORS.gdp}
      />
      <KPI
        label="Toxicity"
        hint="concentration × exclusion × Gini × unemp."
        format={fmtNum}
        value={current.toxicityIndex}
        baseline={baseline.toxicityIndex}
        improvingDirection="down"
        series={metrics.map((m) => m.toxicityIndex)}
        color={METRIC_COLORS.toxic}
        alert={current.toxicityIndex >= 0.5}
      />
      <KPI
        label="Circulation"
        hint="consumption ÷ income+welfare"
        format={fmtPct}
        value={current.circulationRate}
        baseline={baseline.circulationRate}
        improvingDirection="up"
        series={metrics.map((m) => m.circulationRate)}
        color={METRIC_COLORS.circulation}
      />
      <KPI
        label="Gini"
        format={fmtNum}
        value={current.gini}
        baseline={baseline.gini}
        improvingDirection="down"
        series={metrics.map((m) => m.gini)}
        color={METRIC_COLORS.gini}
      />
      <KPI
        label="Unemployment"
        format={fmtPct}
        value={current.unemploymentRate}
        baseline={baseline.unemploymentRate}
        improvingDirection="down"
        series={metrics.map((m) => m.unemploymentRate)}
        color={METRIC_COLORS.unemployment}
      />
      <KPI
        label="Social exclusion"
        format={fmtPct}
        value={current.socialExclusionRate}
        baseline={baseline.socialExclusionRate}
        improvingDirection="down"
        series={metrics.map((m) => m.socialExclusionRate)}
        color={METRIC_COLORS.exclusion}
      />
    </div>
  );
}
