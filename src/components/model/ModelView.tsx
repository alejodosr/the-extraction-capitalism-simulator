import { TIER_COLORS } from '../../theme';

export function ModelView() {
  return (
    <div className="flex flex-col gap-6">
      {/* What the simulator models */}
      <section className="rounded-xl border border-econ-border bg-econ-card p-6 shadow-card">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">What the simulator models</h2>
        <p className="max-w-[72ch] leading-relaxed text-econ-muted">
          The Extraction is an agent-based redistribution sandbox. At each run you configure a
          population of <strong className="text-econ-ink">N heterogeneous agents</strong> across
          two roles — <em>workers</em> and <em>capitalists</em> — alongside a{' '}
          <strong className="text-econ-ink">state</strong> that acts as a pure fiscal
          intermediary (collecting taxes, distributing welfare, owning the public share of firms,
          and subsidising essentials). Production happens across{' '}
          <strong className="text-econ-ink">five sectors</strong> — food, clothing, energy,
          transportation, and housing — with food, energy, and housing treated as essentials
          eligible for state subsidy. Every firm is a blend of private and public ownership set by
          the default ownership ratio: surplus is split between the capitalist owner and the
          treasury in that proportion. Time is discrete: one step = one year. All dynamics emerge
          from the interaction of agent propensities, firm ownership, and state redistribution
          rules over the chosen number of years.
        </p>
      </section>

      {/* 8-phase pipeline */}
      <section className="rounded-xl border border-econ-border bg-econ-card p-6 shadow-card">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">The 8-phase yearly pipeline</h2>
        <p className="mb-4 max-w-[72ch] text-sm text-econ-muted">
          Every year the engine executes these phases in strict order against a mutable world
          state. Phases are deterministic for a given config and seed.
        </p>
        <ol className="flex max-w-[72ch] flex-col gap-3">
          {PHASES.map(({ n, name, desc }) => (
            <li key={n} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-econ-ink font-mono text-xs font-bold text-white">
                {n}
              </span>
              <div>
                <span className="font-semibold">{name}</span>
                <span className="text-econ-muted"> — {desc}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* How to read the wealth concentration chart */}
      <section className="rounded-xl border border-econ-border bg-econ-card p-6 shadow-card">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">
          How to read the wealth concentration chart
        </h2>
        <p className="max-w-[72ch] leading-relaxed text-econ-muted">
          The upper chart on the Dashboard is a stacked-area view of{' '}
          <strong className="text-econ-ink">who owns the wealth</strong>, year by year. Each band
          is a percentile bracket — Top 1%, Top 2–5%, Top 6–10%, P50–P90, and Bottom 50% — and the
          stack always sums to 100%. As inequality grows, the top bands fatten and the bottom band
          gets squeezed. Below it, a second stacked area shows the{' '}
          <strong className="text-econ-ink">role mix inside the top 5%</strong>: green for
          workers, amber for capitalists. In a typical run the top-5% slice starts mixed and
          drifts toward fully amber as capital compounds. Class tier color-coding in the timeline
          encodes <strong className="text-econ-ink">what an agent can afford</strong>, not who
          they are:
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          {TIER_LEGEND.map(({ label, color, desc }) => (
            <div key={label} className="flex items-start gap-2">
              <span
                className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <div className="max-w-[18ch] text-xs leading-snug text-econ-muted">
                <span className="font-semibold text-econ-ink">{label}</span> — {desc}
              </div>
            </div>
          ))}
        </div>
        <blockquote className="mt-5 max-w-[72ch] border-l-2 border-econ-ink/20 pl-4 text-sm italic leading-relaxed text-econ-muted">
          A healthy economy keeps the bottom-50% band thick and the top-1% band thin throughout
          the run. A pathological economy shows the top-1% band swelling year on year while the
          bottom-50% band collapses toward a sliver — the visual signature of compound
          accumulation under weak redistribution.
        </blockquote>
      </section>

      {/* Key metrics */}
      <section className="rounded-xl border border-econ-border bg-econ-card p-6 shadow-card">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Key metrics</h2>
        <dl className="flex max-w-[72ch] flex-col gap-4">
          {METRICS.map(({ term, def }) => (
            <div key={term}>
              <dt className="font-semibold">{term}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-econ-muted">{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Invariants */}
      <section className="rounded-xl border border-econ-border bg-econ-card p-6 shadow-card">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Engine invariants</h2>
        <p className="mb-3 max-w-[72ch] text-sm text-econ-muted">
          These are hard correctness properties, not approximations. Violating any of them is a
          bug, not a model choice.
        </p>
        <ul className="flex max-w-[72ch] flex-col gap-2 text-sm text-econ-muted">
          {INVARIANTS.map((inv) => (
            <li key={inv} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-econ-ink" />
              <span>{inv}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Parameter definitions */}
      <section className="rounded-xl border border-econ-border bg-econ-card p-6 shadow-card">
        <h2 className="mb-1 text-xl font-semibold tracking-tight">Parameter reference</h2>
        <p className="mb-5 max-w-[72ch] text-sm text-econ-muted">
          Every slider in the Setup screen maps to one of the parameters below. Understanding what
          each parameter does — and what it does <em>not</em> do — is essential for interpreting
          simulation results.
        </p>
        {PARAM_GROUPS.map(({ group, params }) => (
          <div key={group} className="mb-6 last:mb-0">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-econ-muted">
              {group}
            </h3>
            <dl className="flex max-w-[72ch] flex-col gap-4">
              {params.map(({ name, def }) => (
                <div key={name}>
                  <dt className="font-semibold">{name}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-econ-muted">{def}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      {/* Scope & limitations */}
      <section className="rounded-xl border border-econ-border bg-econ-card p-6 shadow-card">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Scope &amp; limitations</h2>
        <p className="max-w-[72ch] leading-relaxed text-econ-muted">
          The Extraction is a <strong className="text-econ-ink">redistribution sandbox</strong>,
          not a forecasting tool. It has no role mobility (a worker stays a worker, a capitalist
          stays a capitalist for the entire run), no firm bankruptcy or market exit, no price
          inflation dynamics (prices are set by markup over unit cost, not by a monetary
          authority), no international trade or external shocks, no debt or credit markets, and no
          intra-year dynamics — each year collapses into one discrete step. These omissions are
          deliberate: they keep the model legible enough to read off causal chains between
          redistribution parameters and outcomes. Use it to build intuition about how surplus flows
          (or stagnates), not to predict real economies.
        </p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const PHASES = [
  {
    n: 1,
    name: 'Production',
    desc: 'Each firm computes its output (productivity × headcount) and commits to a wage bill at the minimum wage.',
  },
  {
    n: 2,
    name: 'Pricing',
    desc: 'Firms set unit prices as markup over unit labor cost; public firms use the public markup, private firms the private markup.',
  },
  {
    n: 3,
    name: 'Income',
    desc: 'Revenue is distributed: workers receive wages, capitalist owners receive their ownership share of surplus, and the state receives the remainder.',
  },
  {
    n: 4,
    name: 'Taxation',
    desc: 'Income and profit taxes are levied; agents whose wealth exceeds the population median pay a progressivity multiplier on top of the base rate.',
  },
  {
    n: 5,
    name: 'State expenditure',
    desc: 'The treasury is carved up into a welfare pool (paid to socially excluded or unemployed agents), an investment pool (for Phase 8 hiring), and an essentials subsidy pool (for Phase 6).',
  },
  {
    n: 6,
    name: 'Consumption (market clearing)',
    desc: 'Agents spend up to their propensity fraction of disposable resources on the highest tier basket they can afford; the subsidy pool covers part of the price of food, energy, and housing for workers.',
  },
  {
    n: 7,
    name: 'Classification',
    desc: 'Each agent is assigned a class tier (upper / middle / lower / social exclusion) based on the basket tier they achieved in Phase 6.',
  },
  {
    n: 8,
    name: 'Reinvestment',
    desc: 'Capitalists with reserves hire from the unemployed pool in sectors where demand exceeded supply; the state does the same using the public investment pool for hybrid/public firms.',
  },
];

const TIER_LEGEND = [
  {
    label: 'Upper',
    color: TIER_COLORS.upper,
    desc: 'Top decile — afforded the luxury basket',
  },
  {
    label: 'Middle',
    color: TIER_COLORS.middle,
    desc: 'Stable — afforded the middle basket',
  },
  {
    label: 'Lower',
    color: TIER_COLORS.lower,
    desc: 'Pressured — afforded only the basic basket',
  },
  {
    label: 'Social exclusion',
    color: TIER_COLORS.social_exclusion,
    desc: 'Could not afford even the cheapest essential this year',
  },
];

const METRICS = [
  {
    term: 'Gini coefficient',
    def: 'Wealth inequality across all agents. 0 = perfect equality; 1 = all wealth held by one agent. The engine uses the standard area-between-Lorenz-curve formula.',
  },
  {
    term: 'Top-5% share',
    def: 'Fraction of total wealth held by the wealthiest 5% of agents. A direct read on concentration at the top.',
  },
  {
    term: 'Exclusion rate',
    def: 'Share of the population that could not afford the cheapest essential (food, energy, or housing) in a given year. The clearest signal of acute poverty.',
  },
  {
    term: 'Circulation rate',
    def: 'Of every unit of income that entered agent pockets this year (wages + private surplus + welfare transfers), how much returned to firms as consumption spending. Low circulation means surplus is accumulating as unspent wealth rather than buying output.',
  },
  {
    term: 'Toxicity index',
    def: 'A composite crisis indicator: 0.35 × top-5% share + 0.30 × exclusion rate + 0.20 × Gini + 0.15 × unemployment rate. Values above 0.5 are flagged as crisis territory. Designed to be sensitive to both acute exclusion and chronic accumulation.',
  },
];

const PARAM_GROUPS = [
  {
    group: 'Population & wealth',
    params: [
      {
        name: 'Population',
        def: 'Total number of agents in the simulation. Larger populations produce smoother, more statistically stable distributions but increase computation time. Values above 5,000 are recommended for studying tail dynamics.',
      },
      {
        name: 'Capitalist ratio',
        def: 'Share of agents who start as capitalists. The worker ratio is derived automatically as 1 minus this value — every non-capitalist agent is a worker. Capitalists own the private share of firms and receive surplus revenue beyond wages; workers earn the minimum wage from whichever firm employs them.',
      },
      {
        name: 'Total money supply',
        def: 'The fixed stock of money circulating in the economy, measured in dollars. Money conservation is a hard invariant: no money is created or destroyed during the run. A larger supply raises absolute wealth levels but does not by itself change distributional outcomes.',
      },
      {
        name: 'Capitalist wealth share',
        def: "Fraction of the initial money supply assigned to capitalist agents at t=0. This determines how much of a head-start the capitalist class has. It is coupled with the worker and state wealth shares: adjusting any one slider automatically rescales the other two so they always sum to 1.",
      },
      {
        name: 'Worker wealth share',
        def: 'Fraction of the initial money supply distributed across worker agents at t=0. Coupled with the other two wealth shares. A high starting share for workers tends to delay the onset of social exclusion under otherwise extractive fiscal settings.',
      },
      {
        name: 'State wealth share',
        def: 'Fraction of the initial money supply held in the state treasury at t=0. This becomes the initial pool from which welfare, investment, and subsidy allocations are made in year one. Coupled with capitalist and worker wealth shares.',
      },
    ],
  },
  {
    group: 'Fiscal policy',
    params: [
      {
        name: 'Income tax rate',
        def: 'Flat rate applied to all agent income each year. Agents whose wealth exceeds the population median pay an additional multiplier on top of this base rate, controlled by the tax progressivity slider. Revenue goes to the state treasury.',
      },
      {
        name: 'Profit tax rate',
        def: 'Tax rate applied to the surplus received by capitalist owners from their firms. Separating it from the income tax allows targeting capital accumulation specifically without raising taxes on labor income.',
      },
      {
        name: 'Tax progressivity (× for above-median wealth)',
        def: 'Multiplier applied to both the income and profit tax rates for agents whose wealth exceeds the current population median. 1× means a flat tax; 2× means above-median agents pay double the base rate; 3× is the maximum. Does not affect agents below the median.',
      },
      {
        name: 'Minimum wage',
        def: 'Floor wage in dollars per worker per year. Firms must pay at least this amount regardless of their productivity, output, or revenue. Setting it above the natural equilibrium wage acts as a redistribution mechanism but can reduce firm profitability and slow reinvestment.',
      },
      {
        name: 'Welfare budget ratio',
        def: 'Share of the state treasury carved off each year for welfare transfers. Transfers are paid to socially excluded agents (those who could not afford any essential basket) and unemployed workers. Higher values reduce exclusion but leave less for investment and subsidies.',
      },
      {
        name: 'Public investment ratio',
        def: 'Share of the treasury directed toward public-sector hiring in the reinvestment phase. The state uses this pool to hire unemployed workers into the firms it part-owns (any firm with ownership ratio below 1) wherever demand exceeded supply that year. This is the main counter-cyclical lever: when private capitalists choose not to expand, the state can.',
      },
      {
        name: 'Essentials subsidy (food/energy/housing)',
        def: 'Share of the treasury used to subsidise the price of essential goods — food, energy, and housing — during the consumption phase. The subsidy applies to all non-capitalist agents and reduces the effective price they pay; firms still receive the full clearing price, with the state covering the difference. Makes the basic basket easier to reach and reduces social exclusion without raising wages directly.',
      },
    ],
  },
  {
    group: 'Behavior (propensities)',
    params: [
      {
        name: 'Worker consumption propensity',
        def: 'Fraction of disposable resources that workers spend on consumption each year. At 1.0 workers spend everything they have; at 0.3 they spend only 30%, saving the rest as accumulated wealth. Higher values raise circulation and aggregate demand but reduce individual precautionary saving.',
      },
      {
        name: 'Capitalist consumption propensity (low = hoarding)',
        def: 'Fraction of disposable resources that capitalists spend on consumption. When this is low, capitalists retain most of their income as idle wealth rather than buying output — the classic hoarding dynamic. The unspent surplus accumulates in wealth but does not circulate through the market, reducing aggregate demand and driving up inequality over time.',
      },
    ],
  },
  {
    group: 'Production',
    params: [
      {
        name: 'Default ownership ratio (private share)',
        def: 'Default fraction of each firm that is privately owned by a capitalist. At 1.0 the firm is fully private and all surplus above wages goes to the owner. At 0.0 the firm is fully state-owned and surplus flows to the treasury. This is the main structural lever for the public/private mix.',
      },
      {
        name: 'Default productivity (units/worker)',
        def: 'Units of output produced per worker per year, applied uniformly to all firms. Higher productivity expands real GDP and lowers unit costs, but does not by itself alter the distribution of income — that depends on how the surplus is taxed and redistributed.',
      },
      {
        name: 'Private markup',
        def: 'Profit margin that private firms add over their unit labor cost when setting prices. A 30% markup means consumers pay 1.3× the wage cost per unit. Higher markups increase capitalist surplus extraction and push up the price level, making essential baskets harder for low-wealth agents to afford.',
      },
      {
        name: 'Public markup',
        def: 'Profit margin that public and hybrid firms add over their unit labor cost. Public firms are typically set to zero or near-zero markup to keep essential goods affordable, especially when combined with essentials subsidies. The difference between private and public markup drives the price gap between sectors.',
      },
      {
        name: 'Years to simulate',
        def: 'Number of discrete yearly steps the engine will run before halting. Short runs (10–30 years) reveal immediate distributional shocks from parameter changes. Long runs (100–200 years) expose compound dynamics: wealth concentration, structural exclusion, or convergence to steady states that are invisible at short horizons.',
      },
    ],
  },
];

const INVARIANTS = [
  'Money conservation — sum of all agent wealth + agent income + state treasury + firm capital reserves equals the configured total money supply at the end of every year.',
  'Population & role conservation — agents are never created, destroyed, or role-changed after initialization.',
  "Employment consistency — every agent's employedAt points to an existing firm, and every firm's employeeIds list points back (bidirectional).",
  'Non-negative wealth — consumption caps spending so wealth never goes below zero.',
  'Ratio bounds — Gini ∈ [0,1]; class distribution sums to 1; satisfaction per sector ∈ [0,1].',
];
