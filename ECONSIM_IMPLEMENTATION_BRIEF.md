# The Extraction: Capitalism Simulator — Implementation Brief

## What this is

An agent-based economic simulation of a closed (autarchic) economy. The user configures initial conditions (population ratios, tax policy, ownership structure), runs a 50-year simulation, and explores the results through a dashboard. Multiple runs can be saved and compared side-by-side.

The goal is to make the political-economy dynamics of surplus extraction, redistribution, and inequality *visible and explorable*.

---

## Tech stack

- **Frontend**: React + TypeScript (Vite)
- **Charts**: Recharts for time series, bar charts, stacked areas
- **Sankey**: D3-sankey (for the money-flow diagram)
- **Styling**: Tailwind CSS
- **Persistence**: localStorage for local dev, upgrade path to a backend later
- **Simulation engine**: Pure TypeScript, runs in a Web Worker to keep UI responsive

No backend for v1. The simulation runs entirely in the browser. Runs are serialized to localStorage so they survive page refresh.

---

## Project structure

```
econsim/
├── src/
│   ├── engine/                  # Simulation engine (pure logic, no UI)
│   │   ├── types.ts             # All type definitions
│   │   ├── simulation.ts        # Main simulation loop (8 phases)
│   │   ├── production.ts        # Phase 1: production
│   │   ├── pricing.ts           # Phase 2: pricing
│   │   ├── income.ts            # Phase 3: income distribution
│   │   ├── taxation.ts          # Phase 4: taxation
│   │   ├── state.ts             # Phase 5: state expenditure
│   │   ├── consumption.ts       # Phase 6: market clearing
│   │   ├── classification.ts    # Phase 7: agent classification
│   │   ├── reinvestment.ts      # Phase 8: reinvestment & expansion
│   │   ├── initialization.ts    # Generate initial world state from params
│   │   ├── metrics.ts           # Compute Gini, class distribution, etc.
│   │   └── worker.ts            # Web Worker wrapper for simulation
│   ├── store/
│   │   ├── simulationStore.ts   # Zustand store for current simulation state
│   │   └── persistence.ts       # localStorage read/write for saved runs
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppShell.tsx      # Top-level layout with tab navigation
│   │   ├── setup/
│   │   │   ├── SetupView.tsx     # Full setup screen
│   │   │   ├── PresetSelector.tsx
│   │   │   └── ParamSliders.tsx  # Grouped slider sections
│   │   ├── dashboard/
│   │   │   ├── DashboardView.tsx # Full dashboard screen
│   │   │   ├── KPIRow.tsx        # Top KPI cards with sparklines
│   │   │   ├── SankeyFlow.tsx    # Money flow Sankey diagram
│   │   │   ├── ClassTimeline.tsx # Stacked area: class distribution over time
│   │   │   ├── WealthHistogram.tsx
│   │   │   └── TimelineScrubber.tsx  # Year scrubber at bottom
│   │   └── compare/
│   │       ├── CompareView.tsx   # Full comparison screen
│   │       ├── RunSelector.tsx   # Pick which saved runs to overlay
│   │       ├── MetricChart.tsx   # Reusable overlay line chart
│   │       └── ClassBar.tsx      # Horizontal stacked bar for final-year class composition
│   ├── presets.ts               # Predefined scenario configurations
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## Core types (src/engine/types.ts)

```typescript
// -- Enums --
type Role = 'worker' | 'capitalist' | 'public_employee';
type Sector = 'food' | 'clothing' | 'energy' | 'transportation' | 'housing';
type ClassTier = 'upper' | 'middle' | 'lower' | 'social_exclusion';

// -- Entities --
interface Agent {
  id: number;
  role: Role;
  wealth: number;
  income: number;           // reset each step
  employedAt: number | null; // firm id
  class: ClassTier;
  consumptionSatisfied: Record<Sector, number>; // 0.0–1.0
}

interface Firm {
  id: number;
  sector: Sector;
  ownershipRatio: number;   // 0.0 = fully public, 1.0 = fully private
  ownerId: number | null;   // capitalist agent id
  employeeIds: number[];
  markup: number;            // the capitalist's desired markup
  capitalReserves: number;
  productivity: number;
}

interface StateEntity {
  treasury: number;
  incomeTaxRate: number;
  profitTaxRate: number;
  consumptionTaxRate: number;  // 0 for v1
  publicMarkupPolicy: number;
  minimumWage: number;
  welfareBudgetRatio: number;
  investmentBudgetRatio: number;
}

interface MarketSnapshot {
  sector: Sector;
  totalSupply: number;
  totalDemand: number;
  clearingPrice: number;
  unmetDemand: number;
}

// -- World state (one per time step) --
interface WorldState {
  year: number;
  agents: Agent[];
  firms: Firm[];
  state: StateEntity;
  markets: MarketSnapshot[];
}

// -- Metrics computed per step --
interface YearMetrics {
  year: number;
  gdp: number;
  gini: number;
  unemploymentRate: number;
  socialExclusionRate: number;
  classDistribution: Record<ClassTier, number>; // fractions
  surplusExtractionRate: number;
  stateCapacity: number;
  wealthConcentrationTop5: number;
  priceIndex: number;
  unmetDemand: Record<Sector, number>;
  // For the Sankey diagram
  flows: {
    totalWages: number;
    totalPrivateSurplus: number;
    totalPublicSurplus: number;
    totalIncomeTax: number;
    totalProfitTax: number;
    totalWelfare: number;
    totalPublicInvestment: number;
    totalConsumption: number;
  };
}

// -- Simulation config (what the user configures) --
interface SimulationConfig {
  name: string;
  years: number;                    // 30–50
  totalPopulation: number;
  workerRatio: number;
  capitalistRatio: number;
  publicEmployeeRatio: number;      // derived: 1 - worker - capitalist
  totalMoneySupply: number;
  capitalistWealthShare: number;
  workerWealthShare: number;
  stateWealthShare: number;         // derived: 1 - cap - worker
  firmsPerSector: number;
  defaultOwnershipRatio: number;
  defaultProductivity: number;
  privateMarkup: number;
  publicMarkup: number;
  incomeTaxRate: number;
  profitTaxRate: number;
  minimumWage: number;
  welfareBudgetRatio: number;
  investmentBudgetRatio: number;
}

// -- A completed simulation run --
interface SimulationRun {
  id: string;                       // uuid
  config: SimulationConfig;
  createdAt: string;                // ISO timestamp
  metrics: YearMetrics[];           // one per year
  finalState: WorldState;           // for detailed inspection
}
```

---

## Simulation engine logic

The engine is stateless and functional: `runSimulation(config) => SimulationRun`. It does NOT touch the DOM or any store. It runs inside a Web Worker.

### Initialization (initialization.ts)

Given a `SimulationConfig`, generate the initial `WorldState`:

1. Create `totalPopulation` agents. Assign roles proportionally (e.g., 70% workers, 5% capitalists, 25% public employees). Shuffle the assignment randomly.
2. Distribute initial wealth:
   - Capitalists share `capitalistWealthShare` of `totalMoneySupply`, divided equally among them.
   - Workers share `workerWealthShare`, divided equally.
   - State treasury gets `stateWealthShare`.
   - Public employees start with zero personal wealth (they'll earn from the state).
3. Create `firmsPerSector × 5` firms (5 sectors). Each firm gets `defaultOwnershipRatio`. Assign each firm an owner by round-robin across capitalists (so each capitalist owns roughly `firmsPerSector * 5 / numCapitalists` firms).
4. Assign workers to firms: distribute workers roughly evenly across all firms. Some may be unemployed if firms can't absorb all (shouldn't happen at init, but handle it). Public employees are NOT assigned to firms — they are employed by the state implicitly.
5. Set all agents' initial class to `lower` (will be properly classified after year 1).

### Simulation loop (simulation.ts)

```
for year = 1 to config.years:
    worldState = runYear(worldState)
    metrics[year] = computeMetrics(worldState)
return { config, metrics, finalState: worldState }
```

`runYear` executes the 8 phases in sequence, each mutating a copy of the world state (use structuredClone or immer for immutability):

**Phase 1 — Production** (production.ts): For each firm, compute output and labor cost. Firms with no employees produce nothing.

**Phase 2 — Pricing** (pricing.ts): For each firm, compute unit cost and apply blended markup. Store the clearing price per sector as the weighted-average price (weighted by output volume) across all firms in that sector.

**Phase 3 — Income distribution** (income.ts): Distribute revenue. Workers get wages. Capitalists get their ownership share of surplus. State accumulates its share of surplus from hybrid/public firms.

**Phase 4 — Taxation** (taxation.ts): Apply income tax to workers and public employees. Apply profit tax to capitalists. All tax revenue goes to state treasury.

**Phase 5 — State expenditure** (state.ts): Pay public employees from treasury. Compute welfare pool and investment pool. If treasury goes negative, reduce welfare proportionally (state can't deficit spend in v1).

**Phase 6 — Consumption** (consumption.ts): This is the most complex phase. Important implementation details:

- Since we're at statistical scale (10k agents), don't iterate per-agent for purchasing. Instead, use distribution-based clearing:
  - Sort agents into wealth brackets.
  - For each bracket, compute aggregate demand per sector.
  - Clear from wealthiest bracket down (they can always afford it).
  - When supply runs out in a sector, remaining agents get partial or zero.
- Track how much each agent spent and their satisfaction per sector.
- Revenue from consumption goes back to firms proportionally.

- Agents consume from their `income + wealth`. Whatever is unspent remains as wealth.

**Phase 7 — Classification** (classification.ts): For each agent, determine the highest basket they could *fully satisfy* this step, based on their actual consumption. Update their class tier.

**Phase 8 — Reinvestment** (reinvestment.ts): Capitalists with capital reserves and unmet demand in their sector hire from the unemployed pool. State does the same for public firms using the investment pool. If no unmet demand, surplus accumulates as capitalist wealth.

### Metrics computation (metrics.ts)

After each year, compute all metrics from the world state:

- **Gini**: Standard formula over all agents' wealth values.
- **GDP**: Sum of (output × clearing_price) across all firms.
- **Class distribution**: Count agents in each tier / total population.
- **Unemployment**: Count workers with `employedAt === null` / total workers.
- **Social exclusion rate**: Count agents with class `social_exclusion` / total population.
- **Surplus extraction rate**: Total private surplus / GDP.
- **State capacity**: (Treasury + public firm output value) / GDP.
- **Wealth concentration**: Sum wealth of top 5% agents / total wealth.
- **Price index**: Cost of the minimum basket at current clearing prices.
- **Flows** (for Sankey): Aggregate the monetary flows from phases 3–5 into the flows object.

### Web Worker (worker.ts)

The simulation runs in a Web Worker so it doesn't block the UI:

```typescript
// worker.ts
self.onmessage = (event) => {
  const config: SimulationConfig = event.data;
  const run = runSimulation(config);
  self.postMessage(run);
};
```

The UI posts a config, shows a progress state, and receives the completed run.

Optional: post intermediate results (per-year metrics) back to the UI during the run for a live progress feel. Use `postMessage` after each year.

---

## Consumption baskets

Defined as constants, but parameterizable later:

```typescript
const BASKETS: Record<ClassTier, Record<Sector, number>> = {
  social_exclusion: { food: 0, clothing: 0, energy: 0, transportation: 0, housing: 0 },
  lower:  { food: 1.5, clothing: 0.5, energy: 1.0, transportation: 0.5, housing: 0.5 },
  middle: { food: 2.0, clothing: 1.0, energy: 1.5, transportation: 1.0, housing: 1.0 },
  upper:  { food: 3.0, clothing: 2.0, energy: 2.5, transportation: 2.0, housing: 2.0 },
};

// Minimum survival basket (below this = social exclusion)
const SURVIVAL_BASKET: Record<Sector, number> = {
  food: 1.0, clothing: 0.2, energy: 0.5, transportation: 0.1, housing: 0.3
};

// Priority order for purchasing (survival needs first)
const PURCHASE_PRIORITY: Sector[] = ['food', 'energy', 'housing', 'clothing', 'transportation'];
```

---

## Scenario presets (src/presets.ts)

```typescript
const PRESETS: Record<string, Partial<SimulationConfig>> = {
  'Social democracy': {
    workerRatio: 0.73,
    capitalistRatio: 0.02,
    publicEmployeeRatio: 0.25,
    capitalistWealthShare: 0.40,
    workerWealthShare: 0.30,
    stateWealthShare: 0.30,
    defaultOwnershipRatio: 0.30,
    privateMarkup: 0.20,
    publicMarkup: 0.05,
    incomeTaxRate: 0.30,
    profitTaxRate: 0.40,
    minimumWage: 12.0,
    welfareBudgetRatio: 0.35,
    investmentBudgetRatio: 0.25,
  },
  'Laissez-faire': {
    workerRatio: 0.82,
    capitalistRatio: 0.08,
    publicEmployeeRatio: 0.10,
    capitalistWealthShare: 0.70,
    workerWealthShare: 0.25,
    stateWealthShare: 0.05,
    defaultOwnershipRatio: 0.95,
    privateMarkup: 0.40,
    publicMarkup: 0.02,
    incomeTaxRate: 0.10,
    profitTaxRate: 0.12,
    minimumWage: 6.0,
    welfareBudgetRatio: 0.10,
    investmentBudgetRatio: 0.05,
  },
  'State socialism': {
    workerRatio: 0.69,
    capitalistRatio: 0.01,
    publicEmployeeRatio: 0.30,
    capitalistWealthShare: 0.10,
    workerWealthShare: 0.30,
    stateWealthShare: 0.60,
    defaultOwnershipRatio: 0.05,
    privateMarkup: 0.15,
    publicMarkup: 0.03,
    incomeTaxRate: 0.35,
    profitTaxRate: 0.60,
    minimumWage: 10.0,
    welfareBudgetRatio: 0.40,
    investmentBudgetRatio: 0.30,
  },
  'Mixed economy': {
    workerRatio: 0.75,
    capitalistRatio: 0.05,
    publicEmployeeRatio: 0.20,
    capitalistWealthShare: 0.50,
    workerWealthShare: 0.30,
    stateWealthShare: 0.20,
    defaultOwnershipRatio: 0.50,
    privateMarkup: 0.25,
    publicMarkup: 0.05,
    incomeTaxRate: 0.22,
    profitTaxRate: 0.28,
    minimumWage: 10.0,
    welfareBudgetRatio: 0.25,
    investmentBudgetRatio: 0.20,
  },
};
```

---

## Persistence (src/store/persistence.ts)

All completed simulation runs are saved to localStorage:

```typescript
const STORAGE_KEY = 'econsim_runs';

function saveRun(run: SimulationRun): void {
  const runs = loadAllRuns();
  runs.push(run);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

function loadAllRuns(): SimulationRun[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function deleteRun(id: string): void {
  const runs = loadAllRuns().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}
```

Note: localStorage has a ~5MB limit. Each run with 10k agents over 50 years will be large if we store full world states. **Only store metrics + config per run, not the full agent arrays.** The `finalState` field in `SimulationRun` should be omitted from persistence, or stored as a summary (wealth distribution histogram bins, not 10k agent records).

Estimated size per run (metrics only): ~50 years × ~500 bytes per YearMetrics ≈ 25KB. Comfortable for dozens of runs.

---

## UI screens

### Screen 1: Setup

- **Preset selector**: Row of chips. Clicking one populates all sliders. A "+ Custom" chip lets the user name and save their current config.
- **Slider groups**: Three sections — "Population & wealth", "Fiscal policy", "Production". Each slider shows label + current value. The three population ratio sliders are coupled: changing one adjusts the others to maintain sum = 1.0 (keep `publicEmployeeRatio` as the derived value: `1 - workerRatio - capitalistRatio`). Same for wealth shares.
- **"Run simulation" button**: Posts config to the Web Worker. Shows a progress bar while running. On completion, auto-navigates to the Dashboard tab and saves the run.

### Screen 2: Dashboard

Displays one completed run. If multiple runs exist, a dropdown at the top selects which run to view.

**Top row: 4 KPI cards**
- GDP (with sparkline of trajectory, YoY % change)
- Gini coefficient (sparkline, delta from year 1)
- Unemployment rate (sparkline, delta)
- Social exclusion rate (sparkline, delta)

Color the delta green if improving (GDP up, Gini/unemployment/exclusion down), red if worsening.

**Middle: Sankey flow diagram**
Shows money flows for the currently selected year. Nodes: Firms, Workers, Capitalists, State, Markets. Edges: wages, surplus, taxes, welfare, reinvestment, consumption. Edge thickness proportional to flow volume. Use d3-sankey.

The Sankey updates when the user scrubs the timeline.

**Bottom left: Class distribution (stacked area chart)**
X-axis = years, Y-axis = % of population. Four stacked areas: upper, middle, lower, social_exclusion. Use Recharts StackedAreaChart.

**Bottom right: Wealth distribution (histogram)**
Shows wealth distribution for the currently selected year. X-axis = population percentiles (or wealth buckets), Y-axis = wealth amount. Color bars by role (worker/capitalist/public_employee). Use Recharts BarChart.

**Timeline scrubber**
A range input at the bottom. Dragging it updates: the Sankey diagram, the wealth histogram, and the KPI card "current" values. The time-series charts (sparklines, stacked area) always show the full trajectory with a vertical marker at the selected year.

### Screen 3: Compare

- **Run selector**: Chips showing all saved runs. Click to toggle on/off (max 4 overlaid).
- **Four chart panels** (2×2 grid):
  1. Gini coefficient over time (overlaid lines, one color per run)
  2. Social exclusion rate over time
  3. GDP trajectory
  4. Class composition at final year (horizontal stacked bars, one per run)
- Each line chart uses Recharts LineChart with one Line per selected run.

---

## Visual design direction

**Name**: The Extraction: Capitalism Simulator

The aesthetic is clean editorial — white space, near-black ink, sky-blue accent. Think a high-end economics journal meets a precision data tool. Typography-forward: Cormorant Garamond headings give gravitas; Inter body is legible at small sizes; IBM Plex Mono anchors numeric KPIs.

- **Fonts**:
  - Display / headings: `Cormorant Garamond` (weights 300–600, italic variants)
  - Body / UI controls: `Inter` (weights 400–700)
  - KPI numbers: `IBM Plex Mono` (weights 400–600)
  - All imported from Google Fonts.
- **Chrome palette**:
  - Background: `#F5F8FA` (near-white, faint blue tint)
  - Card: `#FFFFFF`
  - Border: `#D2E4EF`
  - Ink (primary text): `#0A0E14`
  - Muted text: `#5C7585`
  - **Accent**: `#7AB3CF` (sky blue — primary interactive color, active states, CTAs)
- **Data palette** (semantic — keep consistent across all charts):
  - Upper class: `#4338CA` (indigo-700)
  - Middle class: `#0F766E` (teal-700)
  - Lower class: `#B45309` (amber-700)
  - Social exclusion: `#B91C1C` (red-700)
  - Workers flow: `#16A34A`
  - Capitalists flow: `#D97706`
  - State flow: `#2563EB`
  - Firms: `#9333EA`
- **Layout**: Max-width 1280px, centered. Generous padding. Cards have subtle 1px border + soft shadow.
- **Charts**: Minimal gridlines (light dashed `#D2E4EF`), clear axis labels, no chart borders. Tooltips on hover.

---

## Performance considerations

- With 10k agents, the simulation should complete in under 2 seconds. The per-year computation is O(n) where n = number of agents, and we're doing 50 iterations.
- If it's slow, the consumption phase is the bottleneck (sorting agents by wealth, iterating per sector). Optimize by pre-bucketing agents into wealth deciles and clearing at the bucket level rather than per-agent.
- The Web Worker prevents UI freezing regardless.
- For the Sankey, D3-sankey can be expensive to layout. Compute the layout once per selected year, not continuously during scrubbing. Debounce the scrubber input (100ms).

---

## Local development

```bash
npm create vite@latest econsim -- --template react-ts
cd econsim
npm install
npm install recharts d3-sankey zustand
npm install -D @types/d3-sankey tailwindcss @tailwindcss/vite
npm run dev
```

The app runs at `localhost:5173`. No backend, no env vars, no API keys.

---

## Future: Railway deployment

When ready to deploy:

1. Add a `Dockerfile` or use Railway's Nixpacks (auto-detects Vite).
2. Build command: `npm run build`
3. Serve the `dist/` folder with a static file server (e.g., `npx serve dist` or nginx).
4. For persistence beyond localStorage: add an Express or Hono backend with SQLite (via better-sqlite3) or a JSON file store. The API surface is tiny: `POST /runs`, `GET /runs`, `GET /runs/:id`, `DELETE /runs/:id`.

That upgrade is minimal — swap `persistence.ts` from localStorage calls to `fetch()` calls against the backend.

---

## Build order (suggested sequence)

1. **Engine types + initialization**: Get types.ts and initialization.ts working. Write a test that generates a world state from a config and validates population counts, firm assignments, wealth totals.
2. **Simulation phases 1–4**: Production through taxation. These are pure math. Test that money is conserved (total money in system stays constant — money doesn't appear or disappear, it just moves between agents and the state).
3. **Phases 5–8**: State expenditure, consumption, classification, reinvestment. The consumption phase is the hardest — test edge cases (zero supply, all agents broke, one sector missing firms).
4. **Metrics computation**: Run a full 50-year simulation, verify metrics are reasonable (Gini between 0 and 1, class percentages sum to 1, GDP positive).
5. **Web Worker integration**: Wrap the engine in a worker. Verify it runs asynchronously and posts results back.
6. **Setup UI**: Sliders, presets, run button. No charts yet — just verify configs are being created correctly.
7. **Dashboard — KPI cards + time series**: Wire up the metrics to KPI cards and the stacked area chart.
8. **Dashboard — Sankey**: The most complex visualization. Build last within the dashboard.
9. **Dashboard — scrubber + histogram**: Timeline interaction.
10. **Compare view**: Overlay charts for multiple runs.

---

## Critical invariants to test

These should hold at every simulation step:

1. **Money conservation**: Total money in the system (sum of all agent wealth + all agent income + state treasury + all firm capital reserves) should remain equal to `totalMoneySupply`. If it doesn't, there's a bug in a phase.
2. **Population conservation**: Total agents never changes. No agents are created or destroyed.
3. **Role conservation**: No agent changes role.
4. **Employment consistency**: Every `employedAt` firm id references a real firm. Every firm's `employeeIds` matches the agents that reference it.
5. **Ratio bounds**: Gini ∈ [0, 1]. Class percentages sum to 1.0. Satisfaction per sector ∈ [0, 1].
6. **Non-negative wealth**: No agent should have negative wealth (they can have zero). If consumption would drive wealth negative, the consumption phase should cap spending.
