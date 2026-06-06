import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { PresetSelector } from './PresetSelector';
import { ParamSliders } from './ParamSliders';
import type {
  WorkerOutboundMessage,
} from '../../engine/worker';

export function SetupView() {
  const config = useSimulationStore((s) => s.config);
  const updateConfig = useSimulationStore((s) => s.updateConfig);
  const isRunning = useSimulationStore((s) => s.isRunning);
  const progressYear = useSimulationStore((s) => s.progressYear);
  const progressTotal = useSimulationStore((s) => s.progressTotal);
  const lastError = useSimulationStore((s) => s.lastError);
  const startRun = useSimulationStore((s) => s.startRun);
  const finishRun = useSimulationStore((s) => s.finishRun);
  const failRun = useSimulationStore((s) => s.failRun);
  const setProgress = useSimulationStore((s) => s.setProgress);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const handleRun = () => {
    if (isRunning) return;
    startRun();
    const worker = new Worker(new URL('../../engine/worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
      const msg = event.data;
      if (msg.kind === 'progress') {
        setProgress(msg.year, msg.totalYears, msg.metrics);
      } else if (msg.kind === 'complete') {
        finishRun(msg.run);
        worker.terminate();
        workerRef.current = null;
      } else if (msg.kind === 'error') {
        failRun(msg.message);
        worker.terminate();
        workerRef.current = null;
      }
    };
    worker.onerror = (err) => {
      failRun(err.message);
      worker.terminate();
      workerRef.current = null;
    };
    worker.postMessage(config);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-econ-border bg-econ-card p-6 shadow-card">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Configure your simulation</h2>
            <p className="text-sm text-econ-muted">
              Pick a scenario preset or craft your own. Coupled sliders keep role and wealth
              shares summing to 100%.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-econ-muted">
              <span>Name</span>
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value })}
                className="w-full rounded-md border border-econ-border bg-econ-bg px-3 py-1 text-sm text-econ-ink focus:outline-none focus:ring-2 focus:ring-econ-ink sm:w-auto"
              />
            </label>
          </div>
        </div>
        <PresetSelector />
      </div>

      <ParamSliders />

      <div className="flex flex-wrap items-center gap-4">
        <button
          disabled={isRunning}
          onClick={handleRun}
          className={`rounded-md px-6 py-2.5 text-sm font-semibold transition ${
            isRunning
              ? 'cursor-not-allowed bg-econ-border text-econ-muted'
              : 'bg-econ-ink text-white hover:bg-black'
          }`}
        >
          {isRunning ? `Running… year ${progressYear}/${progressTotal}` : 'Run simulation'}
        </button>
        {isRunning && progressTotal > 0 && (
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-econ-border">
            <div
              className="h-full bg-econ-ink transition-[width] duration-150"
              style={{ width: `${(progressYear / progressTotal) * 100}%` }}
            />
          </div>
        )}
        {lastError && (
          <div className="font-mono text-xs text-econ-exclusion">Error: {lastError}</div>
        )}
      </div>
    </div>
  );
}
