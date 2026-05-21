/// <reference lib="webworker" />
import type { SimulationConfig, SimulationRun, YearMetrics } from './types';
import { runSimulation } from './simulation';

export interface WorkerProgressMessage {
  kind: 'progress';
  year: number;
  totalYears: number;
  metrics: YearMetrics;
}

export interface WorkerCompleteMessage {
  kind: 'complete';
  run: SimulationRun;
}

export interface WorkerErrorMessage {
  kind: 'error';
  message: string;
}

export type WorkerInboundMessage = SimulationConfig;
export type WorkerOutboundMessage =
  | WorkerProgressMessage
  | WorkerCompleteMessage
  | WorkerErrorMessage;

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  try {
    const config = event.data;
    const run = runSimulation(config, (update) => {
      const msg: WorkerProgressMessage = {
        kind: 'progress',
        year: update.year,
        totalYears: update.totalYears,
        metrics: update.metrics,
      };
      ctx.postMessage(msg);
    });
    const complete: WorkerCompleteMessage = { kind: 'complete', run };
    ctx.postMessage(complete);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errMsg: WorkerErrorMessage = { kind: 'error', message };
    ctx.postMessage(errMsg);
  }
};
