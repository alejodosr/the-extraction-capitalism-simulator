import { useSimulationStore, type Tab } from '../../store/simulationStore';
import { SetupView } from '../setup/SetupView';
import { DashboardView } from '../dashboard/DashboardView';
import { CompareView } from '../compare/CompareView';
import { ModelView } from '../model/ModelView';

const TABS: { id: Tab; label: string; alwaysEnabled?: boolean }[] = [
  { id: 'setup', label: 'Setup', alwaysEnabled: true },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'compare', label: 'Compare' },
  { id: 'model', label: 'System Explained', alwaysEnabled: true },
];

export function AppShell() {
  const tab = useSimulationStore((s) => s.tab);
  const setTab = useSimulationStore((s) => s.setTab);
  const runs = useSimulationStore((s) => s.runs);

  return (
    <div className="min-h-full w-full bg-econ-bg">
      <header className="sticky top-0 z-10 border-b border-econ-border bg-econ-card/90 backdrop-blur">
        <div className="mx-auto max-w-[1280px] px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <h1 className="font-serif text-xl font-light tracking-tight sm:text-2xl">
                The Extraction
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-econ-accent font-medium sm:text-[11px]">
                Capitalism Simulator
              </span>
            </div>
            <nav className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              {TABS.map((t) => {
                const disabled = !t.alwaysEnabled && runs.length === 0;
                const isModel = t.id === 'model';
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    disabled={disabled}
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition sm:px-4 ${
                      isActive
                        ? 'bg-econ-ink text-white'
                        : disabled
                          ? 'cursor-not-allowed text-econ-border'
                          : isModel
                            ? 'border border-econ-accent bg-econ-accent/10 text-econ-accent hover:bg-econ-accent/20'
                            : 'text-econ-muted hover:bg-econ-bg hover:text-econ-ink'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8">
        {tab === 'setup' && <SetupView />}
        {tab === 'dashboard' && <DashboardView />}
        {tab === 'compare' && <CompareView />}
        {tab === 'model' && <ModelView />}
      </main>
      <footer className="border-t border-econ-border bg-econ-card/60 py-4 text-center text-xs text-econ-muted">
        Made with ❤️ by{' '}
        <a
          href="https://substack.com/@postcapitalistrobots"
          target="_blank"
          rel="noopener noreferrer"
          className="text-econ-accent hover:underline"
        >
          postcapitalistrobots
        </a>
        {' · '}
        <a
          href="https://github.com/alejodosr/the-extraction-capitalism-simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="text-econ-accent hover:underline"
        >
          source code
        </a>
      </footer>
    </div>
  );
}
