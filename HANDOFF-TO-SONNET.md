# Handoff to Sonnet — EconSim follow-up tasks

You are picking up mid-project on **EconSim**, an agent-based political-economy
simulator. Read `CLAUDE.md` first (it is authoritative on stack, architecture,
and invariants), then this file for the task list. Do not re-litigate prior
design decisions — they were debated with the user already. Just execute.

## 1. Context — what was just done

The previous session overhauled the economic model and UI. You are inheriting a
working app. Key recent changes, so you know the shape of the code:

- **New config fields** (`src/engine/types.ts` → `SimulationConfig`):
  `taxProgressivity`, `essentialsSubsidyRatio`, `workerConsumptionPropensity`,
  `capitalistConsumptionPropensity`, `publicEmployeeConsumptionPropensity`.
- **New state fields** (`StateEntity`): mirror of the above plus `subsidyPool`
  (a carve-out from treasury set in Phase 5 and drained in Phase 6).
- **Phase 4 (taxation)** — progressive: agents with `wealth > median` pay
  `base * taxProgressivity`, capped at 0.95.
- **Phase 5 (state expenditure)** — sets aside `treasury * essentialsSubsidyRatio`
  into `state.subsidyPool` at the end.
- **Phase 6 (consumption)** — rewritten. Assumes infinite supply. Agents spend
  at most `available × propensityFor(role)`; whatever they don't spend becomes
  `flows.totalHoarded`. For food/energy/housing purchases by non-capitalists,
  the subsidy pool covers part of the clearing price (firms still receive full
  price; agents pay less). An agent lands in `social_exclusion` only if they
  cannot afford the lowest tier of any essential.
- **Metrics** — `YearMetrics` gained `circulationRate` (consumption / income
  inflow) and `toxicityIndex` (weighted composite of top5, exclusion, gini,
  unemployment). See `src/engine/metrics.ts`.
- **Initialization** — log-normal wealth draws via `logNormalPool()` in
  `src/engine/initialization.ts`; `WEALTH_INEQUALITY_SIGMA = 0.8`. Pool total
  is preserved exactly after rescale (money conservation intact).
- **Presets** — 5 narrative scenarios in `src/presets.ts`, ordered
  Laissez-faire → Neoliberal austerity → Mixed economy → Social democracy →
  State socialism, with `PRESET_DESCRIPTIONS` for the UI.
- **Theme** — `src/theme.ts` is the single source of truth for colors. Three
  disjoint palettes: `ROLE_COLORS`, `TIER_COLORS`, `INSTITUTION_COLORS`, plus
  `METRIC_COLORS` and `COMPARE_COLORS`. Notably, `TIER_COLORS.lower = '#64748B'`
  (slate) to not collide with `ROLE_COLORS.capitalist = '#F59E0B'` (amber).
  **Do not re-introduce inline hex literals** in components; import from theme.
- **UI** — `ParamSliders` has four groups (Population & wealth / Fiscal /
  Production / Behavior). `KPIRow` shows 6 cards including Toxicity and
  Circulation. `AppShell` has sticky header, 1280px max width.

Invariants that still must hold (see `CLAUDE.md`): money conservation, role
conservation, employment bidirectional consistency, `wealth ≥ 0`, ratio bounds.
Run through them mentally after any engine change.

## 2. Your five tasks

Do them in this order. Each task has acceptance criteria — don't skip them.

### Task 1 — Remove the `public_employee` role

Rationale: the user wants the `State` to remain the fiscal intermediary
(collecting taxes, running welfare, owning firms, paying subsidies) but no
longer wants a distinct *public-employee agent class*. Public firms should
simply employ workers like private firms do. The state is not an employer in
v2.

Concretely:

- `Role` type becomes `'worker' | 'capitalist'` everywhere.
  Remove `'public_employee'` from `src/engine/types.ts`.
- Remove `publicEmployeeRatio` and `publicEmployeeConsumptionPropensity` from
  `SimulationConfig`, `StateEntity`, `DEFAULT_CONFIG`, all presets in
  `src/presets.ts`, and the UI (`ParamSliders.tsx`).
- The `applyCoupledUpdate` triple in `ParamSliders.tsx` becomes a *pair*
  (`workerRatio + capitalistRatio = 1`). Simplify `rebalanceTriple` to a
  two-key version, or inline. Update `DerivedIndicators` to show only the
  two-sum. Keep wealth-share rebalancing as a triple (capitalist/worker/state)
  — that one stays.
- Phase 1 (production / labor assignment): currently public firms may hire
  public_employees preferentially. After the change, both firm types pull from
  the same worker pool. Make sure unemployment math still works.
- Phase 3 (income): public-employee wage branches go away; public-firm
  employees earn wages the same way private-firm employees do (from firm
  revenue / state top-up — keep whatever mechanism exists, just drop the
  special case).
- Phase 6 (consumption): `propensityFor(role, world)` loses the
  public-employee arm. Subsidy eligibility was "non-capitalist" — that still
  makes sense (workers get it, capitalists don't).
- Phase 7 (classification): class tiers are independent of role, so this phase
  should be untouched — but double-check any filter predicates that split by
  role.
- Metrics & UI: `ClassTimeline`, `WealthHistogram`, `SankeyFlow`,
  `compare/ClassBar`, `RunSelector` — audit every consumer of
  `ROLE_COLORS.public_employee`. Remove the key from `ROLE_COLORS` last (so
  TypeScript flags every stale reference for you). Sankey flow diagram: the
  "state → public-employee wages" edge merges into "state → workers" or just
  disappears depending on how wages are currently plumbed.
- Presets: redistribute `publicEmployeeRatio` into `workerRatio` (add it) so
  each preset still sums to 1.0 on the two remaining role keys.

**Acceptance**: project builds with zero TS errors, all 5 presets run to
completion, money conservation holds at every year end (add a dev-only
`console.assert` in `runYear` if not already present), no references to
`public_employee` remain anywhere (`grep -r public_employee src/` returns
nothing).

### Task 2 — Allow simulating up to 200 years

- Bump `years` slider max in `ParamSliders.tsx` from 100 to 200. Step stays 1.
- `persistence.ts`: a 200-year run stores 200 `YearMetrics` plus config.
  Quick check: `JSON.stringify(run).length` should stay well under 100 KB per
  run even at 200 years (metrics are ~15 numbers each). If we ever hit
  localStorage pressure, *then* degrade `finalState` — not before. Just don't
  break it.
- Verify the dashboard timeline scrubber and Recharts time series scale
  correctly with 200 ticks (they should; X-axis is continuous).

**Acceptance**: set years=200 on any preset, run completes in < 20s on an M1,
all charts render without clipping, localStorage round-trip works.

### Task 3 — Simplify: remove `firmsPerSector` from UI

The firms-per-sector control isn't doing interesting work for the user's
questions (surplus accumulation dynamics don't depend on intra-sector
competition in this model). Hardcode it to `1` in `DEFAULT_CONFIG` and all
presets, and remove the slider from `ParamSliders.tsx`. Keep the field in
`SimulationConfig` for now (engine still reads it) so we don't have to rewrite
initialization — just stop exposing it.

**Acceptance**: slider gone from Production group; every preset has
`firmsPerSector: 1`; engine still works.

### Task 4 — New "Model" tab explaining the ontology

Add a fourth tab `'model'` to the `Tab` union in `src/store/simulationStore.ts`
and to the `TABS` array in `AppShell.tsx`. Unlike Dashboard and Compare, this
tab should be **always enabled** (don't gate it on `runs.length > 0`).

Create `src/components/model/ModelView.tsx`. Content sections (use semantic
headings, the existing card styling `rounded-xl border border-econ-border
bg-econ-card p-6 shadow-card`, and prose classes — no new chart libraries):

1. **What the simulator models** — short paragraph: N heterogeneous agents
   across two roles (worker, capitalist), three sectors (food, energy,
   housing), a state acting as fiscal intermediary, discrete yearly time.
2. **The 8-phase pipeline** — ordered list with one-sentence descriptions each.
   Production → Pricing → Income → Taxation → State expenditure → Consumption
   (market clearing) → Classification → Reinvestment.
3. **How to read the wealth distribution histogram** — literal copy:

   > The x-axis is wealth, binned logarithmically. The y-axis is number of
   > agents in that bin. Color encodes **class tier**, not role: purple = upper
   > (top decile), teal = middle, slate = lower, red = social exclusion (could
   > not afford the cheapest essential this year). A healthy economy shows a
   > single-peaked, right-skewed mass with a small red sliver; a pathological
   > economy shows a bimodal distribution with a thick red tail and a detached
   > purple cluster on the far right.

4. **Key metrics** — short glossary: Gini, Top-5% share, Exclusion rate,
   Circulation rate, Toxicity index. For toxicity, give the weights:
   `0.35 × top5 + 0.30 × exclusion + 0.20 × gini + 0.15 × unemployment`.
5. **Invariants** — bullet list copy-pasted from `CLAUDE.md` section
   "Invariants the engine must preserve". This tells power users "we don't
   silently leak money".
6. **Scope & limitations** — one paragraph, frank: no role mobility, no firm
   bankruptcy, no inflation dynamics, no international trade, no debt/credit,
   discrete one-year steps. This is a **redistribution sandbox**, not a
   forecaster.

Keep it readable — max ~700 words. Use `max-w-[72ch]` on prose blocks.

**Acceptance**: `Model` tab visible and always clickable; renders without
runs; content covers all six sections; no new deps added.

### Task 5 — Tune three scenarios until they tell the intended story

The user wants three scenarios whose end-state reliably demonstrates a
specific narrative. Current presets are close but un-validated against
targets. Build a small headless harness and iterate on parameters until each
scenario hits its targets.

Create `scripts/run-scenario.ts` that imports `runSimulation` directly (no
worker), runs a given config for 200 years, and prints final `YearMetrics`
plus average over the last 20 years. Run it via `npx tsx scripts/run-scenario.ts <name>`
(install `tsx` as a dev dep if not present).

Place target specs in `scripts/scenarios/`:

- `extractive.json` — starting from `Laissez-faire` preset. **Targets (last-20
  avg)**: `top5Share ≥ 0.60`, `exclusionRate ≥ 0.15`, `toxicityIndex ≥ 0.55`,
  `circulationRate ≤ 0.70`.
- `state-led.json` — starting from `State socialism` preset, but with an
  explicit **zero capitalist population** (`capitalistRatio: 0.0`,
  `capitalistWealthShare: 0.0` — bump worker/state wealth to absorb). Targets:
  `gini ≤ 0.30`, `exclusionRate ≤ 0.03`, `toxicityIndex ≤ 0.25`,
  `circulationRate ≥ 0.85`.
- `balanced.json` — starting from `Social democracy`. Targets: `gini` in
  `[0.32, 0.42]`, `top5Share ≤ 0.40`, `exclusionRate ≤ 0.05`,
  `toxicityIndex ≤ 0.35`, `circulationRate ≥ 0.80`.

If a preset misses its target, tune it — nudge `taxProgressivity`,
`essentialsSubsidyRatio`, markups, propensities, welfare ratio. Do NOT tune by
changing the engine; only by changing preset parameters.

Log every attempt in `scripts/tuning-log.md` — one row per run with the delta
you tried and the resulting last-20 metrics. Keep tuning until all three hit
targets simultaneously with a fixed RNG seed. Then update
`src/presets.ts` with the final values.

**Acceptance**: `scripts/tuning-log.md` exists with ≥ 3 iterations per
scenario showing convergence; final `npx tsx scripts/run-scenario.ts <name>`
for each of the three meets every target; presets in `src/presets.ts` updated
to the tuned values.

## 3. Engineering notes

- **Order matters**: Task 1 touches almost every file; do it first. Task 2–3
  are trivial. Task 4 is isolated. Task 5 depends on the presets being
  settled, so do it last.
- **Deterministic seeding**: `src/engine/initialization.ts` uses `mulberry32`.
  For Task 5's headless harness, hardcode a seed (e.g., `0xC0FFEE`) so tuning
  is reproducible.
- **Palette discipline**: every new chart/UI piece must import from
  `src/theme.ts`. No inline hex. No Tailwind arbitrary color values.
- **No new dependencies** for Tasks 1–4. Task 5 may add `tsx` as a devDep only.
- **Test by running presets**: after Task 1, click through all 5 presets and
  run each for 50 years; charts should render cleanly and no preset should
  produce NaNs or negative wealth.

## 4. What "done" looks like

- `grep -r public_employee src/` → no output.
- Years slider max = 200, `firmsPerSector` slider gone.
- Four tabs: Setup / Dashboard / Compare / Model. Model tab is always enabled
  and explains the six sections above.
- `npx tsx scripts/run-scenario.ts extractive|state-led|balanced` prints
  metrics that meet each scenario's targets.
- `scripts/tuning-log.md` documents the tuning journey.
- `npm run build` passes with zero errors. Money conservation still holds.

Work top-to-bottom. Ask the user only if something in this brief contradicts
itself or `CLAUDE.md` — otherwise proceed.
