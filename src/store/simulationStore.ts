import { create } from 'zustand';
import type { SimulationConfig, SimulationRun, YearMetrics } from '../engine/types';
import { DEFAULT_CONFIG } from '../presets';
import { loadAllRuns, saveRun, deleteRun, clearAllRuns } from './persistence';

export type Tab = 'setup' | 'dashboard' | 'compare' | 'model';

interface SimulationStore {
  tab: Tab;
  setTab: (t: Tab) => void;

  config: SimulationConfig;
  setConfig: (c: SimulationConfig) => void;
  updateConfig: (patch: Partial<SimulationConfig>) => void;

  runs: SimulationRun[];
  currentRunId: string | null;
  selectRun: (id: string) => void;
  addRun: (run: SimulationRun) => void;
  removeRun: (id: string) => void;

  // Progress state
  isRunning: boolean;
  progressYear: number;
  progressTotal: number;
  progressMetrics: YearMetrics[]; // streaming preview
  setProgress: (year: number, total: number, metrics: YearMetrics) => void;
  startRun: () => void;
  finishRun: (run: SimulationRun) => void;
  failRun: (message: string) => void;
  lastError: string | null;

  // Compare: selected run ids (max 4)
  compareSelection: string[];
  toggleCompare: (id: string) => void;
  clearAllRuns: () => void;

  // Dashboard: selected year to scrub to
  selectedYear: number;
  setSelectedYear: (y: number) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  tab: 'setup',
  setTab: (t) => set({ tab: t }),

  config: { ...DEFAULT_CONFIG },
  setConfig: (c) => set({ config: c }),
  updateConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),

  runs: loadAllRuns(),
  currentRunId: null,
  selectRun: (id) =>
    set((s) => {
      const run = s.runs.find((r) => r.id === id);
      return {
        currentRunId: id,
        selectedYear: run ? run.metrics.length : s.selectedYear,
      };
    }),
  addRun: (run) => {
    saveRun(run);
    set((s) => ({
      runs: [...s.runs, run],
      currentRunId: run.id,
      selectedYear: run.metrics.length,
    }));
  },
  removeRun: (id) => {
    deleteRun(id);
    set((s) => ({
      runs: s.runs.filter((r) => r.id !== id),
      currentRunId: s.currentRunId === id ? null : s.currentRunId,
      compareSelection: s.compareSelection.filter((rid) => rid !== id),
    }));
  },

  isRunning: false,
  progressYear: 0,
  progressTotal: 0,
  progressMetrics: [],
  lastError: null,
  setProgress: (year, total, metrics) =>
    set((s) => ({
      progressYear: year,
      progressTotal: total,
      progressMetrics: [...s.progressMetrics, metrics],
    })),
  startRun: () =>
    set({
      isRunning: true,
      progressYear: 0,
      progressTotal: get().config.years,
      progressMetrics: [],
      lastError: null,
    }),
  finishRun: (run) => {
    get().addRun(run);
    set({ isRunning: false, progressYear: run.metrics.length, tab: 'dashboard' });
  },
  failRun: (message) =>
    set({
      isRunning: false,
      lastError: message,
    }),

  compareSelection: [],
  clearAllRuns: () => {
    clearAllRuns();
    set({ runs: [], currentRunId: null, compareSelection: [] });
  },
  toggleCompare: (id) =>
    set((s) => {
      if (s.compareSelection.includes(id)) {
        return { compareSelection: s.compareSelection.filter((r) => r !== id) };
      }
      if (s.compareSelection.length >= 4) return s;
      return { compareSelection: [...s.compareSelection, id] };
    }),

  selectedYear: 1,
  setSelectedYear: (y) => set({ selectedYear: y }),
}));
