import type { SimulationConfig } from '../../engine/types';
import { useSimulationStore } from '../../store/simulationStore';

interface SliderDef {
  key: keyof SimulationConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  tooltip?: string;
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
const money = (v: number) => `$${v.toLocaleString()}`;
const num = (v: number) => v.toLocaleString();
const mkup = (v: number) => `+${(v * 100).toFixed(0)}%`;

const POP_WEALTH: SliderDef[] = [
  {
    key: 'totalPopulation',
    label: 'Population',
    min: 1000,
    max: 20_000,
    step: 500,
    format: num,
    tooltip: 'Total number of agents. Larger values yield smoother distributions but increase compute time.',
  },
  {
    key: 'capitalistRatio',
    label: 'Capitalist ratio',
    min: 0,
    max: 0.5,
    step: 0.005,
    format: pct,
    tooltip: 'Share of agents who are capitalists. Worker ratio is automatically derived as 1 minus this value.',
  },
  {
    key: 'totalMoneySupply',
    label: 'Total money supply',
    min: 1_000_000,
    max: 50_000_000,
    step: 500_000,
    format: money,
    tooltip: 'Fixed stock of money in the economy. Money is conserved throughout the run — never created or destroyed.',
  },
  {
    key: 'capitalistWealthShare',
    label: 'Capitalist wealth share',
    min: 0,
    max: 1,
    step: 0.01,
    format: pct,
    tooltip: 'Fraction of the initial money supply given to capitalists. Coupled: the three wealth shares always sum to 1.',
  },
  {
    key: 'workerWealthShare',
    label: 'Worker wealth share',
    min: 0,
    max: 1,
    step: 0.01,
    format: pct,
    tooltip: 'Fraction of the initial money supply distributed to workers. Coupled with the other two wealth shares.',
  },
  {
    key: 'stateWealthShare',
    label: 'State wealth share',
    min: 0,
    max: 1,
    step: 0.01,
    format: pct,
    tooltip: 'Fraction of the initial money supply held in the state treasury. Coupled with the other two wealth shares.',
  },
];

const FISCAL: SliderDef[] = [
  {
    key: 'incomeTaxRate',
    label: 'Income tax rate',
    min: 0,
    max: 0.6,
    step: 0.01,
    format: pct,
    tooltip: 'Flat rate on all agent income. Above-median-wealth agents pay an additional progressivity multiplier on top.',
  },
  {
    key: 'profitTaxRate',
    label: 'Profit tax rate',
    min: 0,
    max: 0.8,
    step: 0.01,
    format: pct,
    tooltip: 'Tax on surplus received by capitalist owners from their firms. Revenue goes to the state treasury.',
  },
  {
    key: 'taxProgressivity',
    label: 'Tax progressivity (× for above-median wealth)',
    min: 1,
    max: 3,
    step: 0.05,
    format: (v) => `${v.toFixed(2)}×`,
    tooltip: 'Multiplier on base tax rates for agents above the wealth median. 1× = flat; 3× = highly progressive. Does not affect below-median agents.',
  },
  {
    key: 'minimumWage',
    label: 'Minimum wage',
    min: 0,
    max: 30,
    step: 0.5,
    format: (v) => `$${v.toFixed(1)}`,
    tooltip: 'Floor wage per worker per year. Firms must pay at least this regardless of productivity or revenue.',
  },
  {
    key: 'welfareBudgetRatio',
    label: 'Welfare budget ratio',
    min: 0,
    max: 0.6,
    step: 0.01,
    format: pct,
    tooltip: 'Share of the treasury paid as welfare transfers to unemployed and socially excluded agents each year.',
  },
  {
    key: 'investmentBudgetRatio',
    label: 'Public investment ratio',
    min: 0,
    max: 0.5,
    step: 0.01,
    format: pct,
    tooltip: 'Share of the treasury directed to public-sector hiring and capital in the reinvestment phase.',
  },
  {
    key: 'essentialsSubsidyRatio',
    label: 'Essentials subsidy (food/energy/housing)',
    min: 0,
    max: 0.8,
    step: 0.01,
    format: pct,
    tooltip: 'Share of the treasury used to discount food, energy, and housing prices for workers during consumption.',
  },
];

const BEHAVIOR: SliderDef[] = [
  {
    key: 'workerConsumptionPropensity',
    label: 'Worker consumption propensity',
    min: 0.3,
    max: 1,
    step: 0.01,
    format: pct,
    tooltip: 'Fraction of disposable income workers spend each year. 1.0 = spend everything; lower values mean workers save more.',
  },
  {
    key: 'capitalistConsumptionPropensity',
    label: 'Capitalist consumption propensity (low = hoarding)',
    min: 0.05,
    max: 1,
    step: 0.01,
    format: pct,
    tooltip: 'Fraction of disposable income capitalists spend. Low values mean surplus accumulates as idle wealth rather than circulating in the market.',
  },
];

const PRODUCTION: SliderDef[] = [
  {
    key: 'defaultOwnershipRatio',
    label: 'Default ownership ratio (private share)',
    min: 0,
    max: 1,
    step: 0.01,
    format: pct,
    tooltip: 'Default fraction of each firm owned by a capitalist. 1.0 = fully private; 0.0 = fully state-owned.',
  },
  {
    key: 'defaultProductivity',
    label: 'Default productivity (units/worker)',
    min: 1,
    max: 25,
    step: 0.5,
    format: (v) => v.toFixed(1),
    tooltip: 'Output units produced per worker per year. Raises GDP but does not change distribution on its own.',
  },
  {
    key: 'privateMarkup',
    label: 'Private markup',
    min: 0,
    max: 1,
    step: 0.01,
    format: mkup,
    tooltip: 'Profit margin private firms add over unit labor cost. Higher markups raise capitalist surplus and consumer prices.',
  },
  {
    key: 'publicMarkup',
    label: 'Public markup',
    min: 0,
    max: 0.5,
    step: 0.01,
    format: mkup,
    tooltip: 'Profit margin public firms add over unit labor cost. Usually kept near zero to keep essential goods affordable.',
  },
  {
    key: 'years',
    label: 'Years to simulate',
    min: 10,
    max: 200,
    step: 1,
    format: num,
    tooltip: 'Number of discrete yearly steps to run. Longer runs reveal compound inequality dynamics invisible at short horizons.',
  },
];

export function ParamSliders() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <SliderGroup title="Population & wealth" defs={POP_WEALTH} couplings="wealth-shares" />
      <SliderGroup title="Fiscal policy" defs={FISCAL} />
      <SliderGroup title="Production" defs={PRODUCTION} />
      <SliderGroup title="Behavior (propensities)" defs={BEHAVIOR} />
    </div>
  );
}

function SliderGroup({
  title,
  defs,
  couplings,
}: {
  title: string;
  defs: SliderDef[];
  couplings?: 'wealth-shares';
}) {
  return (
    <section className="rounded-xl border border-econ-border bg-econ-card p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-econ-muted">
        {title}
      </h3>
      <div className="flex flex-col gap-4">
        {defs.map((d) => (
          <SliderRow key={d.key} def={d} coupling={couplings} />
        ))}
        {couplings === 'wealth-shares' && <DerivedIndicators />}
      </div>
    </section>
  );
}

function SliderRow({
  def,
  coupling,
}: {
  def: SliderDef;
  coupling?: 'wealth-shares';
}) {
  const config = useSimulationStore((s) => s.config);
  const updateConfig = useSimulationStore((s) => s.updateConfig);
  const raw = config[def.key] as number;
  const format = def.format ?? ((v: number) => v.toString());

  const onChange = (v: number) => {
    if (coupling === 'wealth-shares') {
      updateConfig(applyCoupledUpdate(config, def.key, v));
    } else {
      updateConfig({ [def.key]: v } as Partial<SimulationConfig>);
    }
  };

  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <div className="group relative flex items-center gap-1">
          <span className="text-sm">{def.label}</span>
          {def.tooltip && (
            <>
              <span className="cursor-help select-none text-[10px] leading-none text-econ-muted/50">ⓘ</span>
              <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 hidden w-60 rounded-lg border border-econ-border bg-econ-card p-2.5 text-xs leading-snug text-econ-muted shadow-lg group-hover:block">
                {def.tooltip}
              </div>
            </>
          )}
        </div>
        <span className="font-mono text-xs tabular-nums text-econ-muted">{format(raw)}</span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={raw}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

function DerivedIndicators() {
  const config = useSimulationStore((s) => s.config);
  const wealthSum =
    config.capitalistWealthShare + config.workerWealthShare + config.stateWealthShare;
  // workerRatio is always derived as 1 - capitalistRatio
  const derivedWorkerRatio = 1 - config.capitalistRatio;
  return (
    <div className="mt-2 rounded-md bg-econ-bg p-3 font-mono text-xs text-econ-muted">
      <div>Worker ratio (derived) = {(derivedWorkerRatio * 100).toFixed(1)}%</div>
      <div>Wealth shares sum = {(wealthSum * 100).toFixed(1)}%</div>
    </div>
  );
}

/**
 * Enforce capitalistWealthShare + workerWealthShare + stateWealthShare = 1.
 * When the user moves one slider, the other two are scaled proportionally so
 * the sum stays at 1.0.
 *
 * workerRatio is fully derived (= 1 - capitalistRatio) and updated whenever
 * capitalistRatio changes, without needing a triple rebalance.
 */
function applyCoupledUpdate(
  config: SimulationConfig,
  key: keyof SimulationConfig,
  v: number,
): Partial<SimulationConfig> {
  const WEALTH_KEYS = ['capitalistWealthShare', 'workerWealthShare', 'stateWealthShare'] as const;
  type WealthKey = (typeof WEALTH_KEYS)[number];

  // When capitalistRatio changes, derive workerRatio automatically.
  if (key === 'capitalistRatio') {
    const clamped = Math.min(1, Math.max(0, v));
    return { capitalistRatio: clamped, workerRatio: 1 - clamped };
  }

  if ((WEALTH_KEYS as readonly string[]).includes(key as string)) {
    return rebalanceTriple(config, WEALTH_KEYS, key as WealthKey, v);
  }
  return { [key]: v } as Partial<SimulationConfig>;
}

function rebalanceTriple<K extends keyof SimulationConfig>(
  config: SimulationConfig,
  keys: readonly [K, K, K],
  changed: K,
  v: number,
): Partial<SimulationConfig> {
  const clamped = Math.min(1, Math.max(0, v));
  const others = keys.filter((k) => k !== changed) as K[];
  const a = config[others[0]] as unknown as number;
  const b = config[others[1]] as unknown as number;
  const remain = 1 - clamped;
  const prevOtherSum = a + b;
  let na: number;
  let nb: number;
  if (prevOtherSum > 1e-9) {
    na = (a / prevOtherSum) * remain;
    nb = remain - na;
  } else {
    na = remain / 2;
    nb = remain / 2;
  }
  return {
    [changed]: clamped,
    [others[0]]: Math.max(0, na),
    [others[1]]: Math.max(0, nb),
  } as Partial<SimulationConfig>;
}
