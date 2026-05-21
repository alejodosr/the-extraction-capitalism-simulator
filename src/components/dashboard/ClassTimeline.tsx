import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { YearMetrics } from '../../engine/types';
import { TIER_COLORS } from '../../theme';

interface Props {
  metrics: YearMetrics[];
  selectedYearIndex: number;
}

export function ClassTimeline({ metrics, selectedYearIndex }: Props) {
  const data = metrics.map((m) => ({
    year: m.year,
    upper: m.classDistribution.upper,
    middle: m.classDistribution.middle,
    lower: m.classDistribution.lower,
    exclusion: m.classDistribution.social_exclusion,
  }));
  const selectedYear =
    metrics[Math.min(Math.max(selectedYearIndex, 0), metrics.length - 1)]?.year ?? 0;

  return (
    <div className="h-full rounded-xl border border-econ-border bg-econ-card p-5 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Class distribution over time</h3>
        <span className="font-mono text-xs text-econ-muted">% of population</span>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#6B6760" />
            <YAxis
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 11 }}
              stroke="#6B6760"
              domain={[0, 1]}
            />
            <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
            <Area
              type="monotone"
              dataKey="exclusion"
              stackId="1"
              stroke={TIER_COLORS.social_exclusion}
              fill={TIER_COLORS.social_exclusion}
              fillOpacity={0.85}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stackId="1"
              stroke={TIER_COLORS.lower}
              fill={TIER_COLORS.lower}
              fillOpacity={0.85}
            />
            <Area
              type="monotone"
              dataKey="middle"
              stackId="1"
              stroke={TIER_COLORS.middle}
              fill={TIER_COLORS.middle}
              fillOpacity={0.85}
            />
            <Area
              type="monotone"
              dataKey="upper"
              stackId="1"
              stroke={TIER_COLORS.upper}
              fill={TIER_COLORS.upper}
              fillOpacity={0.9}
            />
            <ReferenceLine x={selectedYear} stroke="#1A1815" strokeDasharray="2 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <Legend />
    </div>
  );
}

function Legend() {
  const items = [
    { label: 'Upper', color: TIER_COLORS.upper },
    { label: 'Middle', color: TIER_COLORS.middle },
    { label: 'Lower', color: TIER_COLORS.lower },
    { label: 'Social exclusion', color: TIER_COLORS.social_exclusion },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-econ-muted">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: it.color }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
