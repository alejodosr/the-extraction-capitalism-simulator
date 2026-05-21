import type { SimulationRun } from '../engine/types';

const STORAGE_KEY = 'econsim_runs';

function toSerializable(run: SimulationRun): SimulationRun {
  // `finalState` is already a compact summary (wealth bins), so we can persist as-is.
  // If it grows, strip here.
  return run;
}

export function saveRun(run: SimulationRun): void {
  const runs = loadAllRuns();
  runs.push(toSerializable(run));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch (err) {
    // If storage is full, drop the oldest run and retry once.
    if (runs.length > 1) {
      runs.shift();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
        return;
      } catch {
        /* fallthrough */
      }
    }
    console.error('Failed to save simulation run', err);
  }
}

export function loadAllRuns(): SimulationRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SimulationRun[];
  } catch {
    return [];
  }
}

export function deleteRun(id: string): void {
  const runs = loadAllRuns().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

export function clearAllRuns(): void {
  localStorage.removeItem(STORAGE_KEY);
}
