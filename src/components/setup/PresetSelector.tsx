import { applyPreset, PRESET_DESCRIPTIONS, PRESET_ORDER, PRESETS, type PresetName } from '../../presets';
import { useSimulationStore } from '../../store/simulationStore';

export function PresetSelector() {
  const config = useSimulationStore((s) => s.config);
  const setConfig = useSimulationStore((s) => s.setConfig);
  const activePreset = matchingPreset(config as unknown as Record<string, unknown>);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_ORDER.map((name) => {
          const active = activePreset === name;
          return (
            <button
              key={name}
              onClick={() => setConfig(applyPreset(config, name))}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? 'border-econ-ink bg-econ-ink text-white shadow-card'
                  : 'border-econ-border bg-econ-card text-econ-ink hover:border-econ-ink'
              }`}
            >
              {name}
            </button>
          );
        })}
        <span className="font-mono text-xs text-econ-muted">
          {activePreset ? `preset: ${activePreset}` : 'custom configuration'}
        </span>
      </div>
      {activePreset && (
        <p className="rounded-md border-l-2 border-econ-ink/20 bg-econ-softbg px-3 py-2 text-xs leading-relaxed text-econ-muted">
          {PRESET_DESCRIPTIONS[activePreset]}
        </p>
      )}
    </div>
  );
}

function matchingPreset(
  config: Record<string, unknown>,
): PresetName | null {
  for (const [name, patch] of Object.entries(PRESETS)) {
    let match = true;
    for (const [k, v] of Object.entries(patch)) {
      if (config[k] !== v) {
        match = false;
        break;
      }
    }
    if (match) return name as PresetName;
  }
  return null;
}
