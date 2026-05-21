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
import { ROLE_COLORS } from '../../theme';

interface Props {
  metrics: YearMetrics[];
  selectedYearIndex: number;
}

// Concentration bands — stacked bottom-to-top: top1 at bottom, bottom50 at top.
// This matches the Piketty-style convention: as inequality grows the top-1%
// band (near y=0) fattens and squeezes the bottom-50% band (near y=1).
// 900-level colors so this chart is visually distinct from flow (600) and tier (700) charts.
const BAND_COLORS = {
  top1: '#881337',       // rose-900 — most concentrated
  top5excl1: '#7C2D12',  // orange-900
  top10excl5: '#78350F', // amber-900
  mid10to50: '#14532D',  // green-900
  bottom50: '#1E3A8A',   // blue-900 — most distributed
} as const;

const BAND_LABELS: Record<keyof typeof BAND_COLORS, string> = {
  top1: 'Top 1%',
  top5excl1: 'Top 2–5%',
  top10excl5: 'Top 6–10%',
  mid10to50: 'P50–P90',
  bottom50: 'Bottom 50%',
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function WealthConcentration({ metrics, selectedYearIndex }: Props) {
  const selectedYear =
    metrics[Math.min(Math.max(selectedYearIndex, 0), metrics.length - 1)]?.year ?? 0;

  const concentrationData = metrics.map((m) => {
    const { top1, top5, top10, bottom50 } = m.wealthConcentration;
    return {
      year: m.year,
      top1,
      top5excl1: top5 - top1,
      top10excl5: top10 - top5,
      mid10to50: 1 - top10 - bottom50,
      bottom50,
    };
  });

  const roleData = metrics.map((m) => ({
    year: m.year,
    capitalists: m.wealthConcentration.top5CapShare,
    workers: m.wealthConcentration.top5WorkerShare,
  }));

  return (
    <div className="h-full rounded-xl border border-econ-border bg-econ-card p-5 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Wealth concentration over time</h3>
        <span className="font-mono text-xs text-econ-muted">% of total wealth</span>
      </div>

      {/* View 1 — share of total wealth by percentile bracket */}
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={concentrationData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#6B6760" />
            <YAxis
              tickFormatter={pct}
              tick={{ fontSize: 10 }}
              stroke="#6B6760"
              domain={[0, 1]}
            />
            <Tooltip
              formatter={(v: number, key: string) => [
                pct(v),
                BAND_LABELS[key as keyof typeof BAND_LABELS] ?? key,
              ]}
              labelFormatter={(y) => `Year ${y}`}
            />
            {(Object.keys(BAND_COLORS) as Array<keyof typeof BAND_COLORS>).map((band) => (
              <Area
                key={band}
                type="monotone"
                dataKey={band}
                stackId="1"
                stroke={BAND_COLORS[band]}
                fill={BAND_COLORS[band]}
                fillOpacity={0.85}
              />
            ))}
            <ReferenceLine x={selectedYear} stroke="#1A1815" strokeDasharray="2 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <BandLegend />

      {/* View 2 — within the top 5%, capitalists vs workers */}
      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Who sits at the top 5%?</h3>
        <span className="font-mono text-xs text-econ-muted">share of top-5% wealth</span>
      </div>

      <div className="mt-2 h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={roleData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#6B6760" />
            <YAxis
              tickFormatter={pct}
              tick={{ fontSize: 10 }}
              stroke="#6B6760"
              domain={[0, 1]}
            />
            <Tooltip
              formatter={(v: number, key: string) => [
                pct(v),
                key === 'capitalists' ? 'Capitalists' : 'Workers',
              ]}
              labelFormatter={(y) => `Year ${y}`}
            />
            <Area
              type="monotone"
              dataKey="workers"
              stackId="r"
              stroke={ROLE_COLORS.worker}
              fill={ROLE_COLORS.worker}
              fillOpacity={0.85}
            />
            <Area
              type="monotone"
              dataKey="capitalists"
              stackId="r"
              stroke={ROLE_COLORS.capitalist}
              fill={ROLE_COLORS.capitalist}
              fillOpacity={0.85}
            />
            <ReferenceLine x={selectedYear} stroke="#1A1815" strokeDasharray="2 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-econ-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ROLE_COLORS.worker }} />
          Workers
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ROLE_COLORS.capitalist }} />
          Capitalists
        </span>
      </div>
    </div>
  );
}

function BandLegend() {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-econ-muted">
      {(Object.keys(BAND_COLORS) as Array<keyof typeof BAND_COLORS>)
        .slice()
        .reverse()
        .map((band) => (
          <span key={band} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: BAND_COLORS[band] }}
            />
            {BAND_LABELS[band]}
          </span>
        ))}
    </div>
  );
}
