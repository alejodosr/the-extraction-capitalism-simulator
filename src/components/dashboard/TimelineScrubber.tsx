import { useEffect, useState } from 'react';

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}

export function TimelineScrubber({ min, max, value, onChange }: Props) {
  // Local state for fluid input, debounced to avoid heavy re-renders (Sankey layout)
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    if (local === value) return;
    const handle = setTimeout(() => onChange(local), 100);
    return () => clearTimeout(handle);
  }, [local, value, onChange]);

  return (
    <div className="rounded-lg border border-econ-border bg-econ-card p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold">Timeline</span>
        <span className="font-mono text-xs text-econ-muted">
          Year {local} / {max}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={local}
        onChange={(e) => setLocal(parseInt(e.target.value, 10))}
        className="w-full"
      />
    </div>
  );
}
