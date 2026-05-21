import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WealthBin } from '../../engine/types';
import { ROLE_COLORS } from '../../theme';

interface Props {
  bins: WealthBin[];
  year: number;
}

const ROLE_COLOR = {
  workers: ROLE_COLORS.worker,
  capitalists: ROLE_COLORS.capitalist,
} as const;

const ROLE_LABEL = {
  workers: 'Workers',
  capitalists: 'Capitalists',
} as const;

export function WealthHistogram({ bins, year }: Props) {
  // Stacked bar per decile: each segment ≈ role's share of the bucket × bin avg wealth.
  // Approximation caveat: the segments are proportional (not absolute $ by role)
  // since we don't track per-role avg inside a bin. Capitalists remain visible
  // even when outnumbered because they cluster in the top bucket.
  const data = bins.map((b, i) => {
    const total = b.workers + b.capitalists;
    const scale = total > 0 ? b.avgWealth : 0;
    return {
      label: `${b.percentile.toFixed(0)}-${Math.min(100, b.percentile + 10).toFixed(0)}`,
      workers: (b.workers / Math.max(1, total)) * scale,
      capitalists: (b.capitalists / Math.max(1, total)) * scale,
      index: i,
    };
  });

  return (
    <div className="h-full rounded-xl border border-econ-border bg-econ-card p-5 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Wealth distribution by decile</h3>
        <span className="font-mono text-xs text-econ-muted">Year {year}</span>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              stroke="#6B6760"
              label={{ value: 'Percentile', position: 'insideBottom', offset: -2, fontSize: 10 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#6B6760"
              tickFormatter={(v) => formatMoney(v)}
            />
            <Tooltip
              formatter={(v: number, name: string) => [formatMoney(v), labelFor(name)]}
              labelFormatter={(l) => `Percentile ${l}`}
            />
            <Bar dataKey="workers" stackId="a" fill={ROLE_COLOR.workers} />
            <Bar dataKey="capitalists" stackId="a" fill={ROLE_COLOR.capitalists} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-econ-muted">
        {(Object.keys(ROLE_COLOR) as Array<keyof typeof ROLE_COLOR>).map((role) => (
          <span key={role} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: ROLE_COLOR[role] }}
            />
            {ROLE_LABEL[role]}
          </span>
        ))}
      </div>
    </div>
  );
}

function labelFor(name: string): string {
  if (name === 'workers' || name === 'capitalists') {
    return ROLE_LABEL[name];
  }
  return name;
}

function formatMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}
