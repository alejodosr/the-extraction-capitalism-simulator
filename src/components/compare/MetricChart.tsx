import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SimulationRun, YearMetrics } from '../../engine/types';
import { COMPARE_COLORS } from './RunSelector';

interface Props {
  title: string;
  runs: SimulationRun[];
  getValue: (m: YearMetrics) => number;
  format?: (v: number) => string;
  yDomain?: [number | 'auto', number | 'auto'];
}

export function MetricChart({ title, runs, getValue, format, yDomain }: Props) {
  const maxYears = Math.max(0, ...runs.map((r) => r.metrics.length));
  const data = Array.from({ length: maxYears }, (_, i) => {
    const row: Record<string, number> = { year: i + 1 };
    runs.forEach((run, idx) => {
      const m = run.metrics[i];
      if (m) row[`run_${idx}`] = getValue(m);
    });
    return row;
  });

  return (
    <div className="rounded-lg border border-econ-border bg-econ-card p-4">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#6B6760" />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#6B6760"
              tickFormatter={format}
              domain={yDomain}
            />
            <Tooltip
              formatter={(v: number) => (format ? format(v) : v.toFixed(3))}
              labelFormatter={(l) => `Year ${l}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {runs.map((run, idx) => (
              <Line
                key={run.id}
                type="monotone"
                dataKey={`run_${idx}`}
                name={run.config.name}
                stroke={COMPARE_COLORS[idx % COMPARE_COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
