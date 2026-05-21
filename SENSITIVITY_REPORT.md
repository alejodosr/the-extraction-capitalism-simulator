# Scenario Sensitivity Report

> Generated 2026-04-24. Analysis is analytical/mechanistic — derived from engine logic and preset baselines without re-running the simulation. All "→" arrows show the direction to push a parameter to achieve the described outcome.

---

## PART A — Minimum-parameter failure prescriptions

> These are the actionable recipes. Each gives the **fewest parameters** needed to flip a scenario, the **exact values**, and the **mechanism** that makes the shift stable (not oscillating) or growing toward the end of the 50-year run.

### Structural formula

The affordability of the lower basket from **wages alone** (no savings, no welfare) is determined by a single ratio:

```
R = (4.5 × (1 + effective_markup)) / (productivity × workerConsumptionPropensity)
```

- `R < 1` → workers can permanently afford lower basket from wages → no exclusion floor
- `R > 1` → workers cannot afford lower basket from wages alone → exclusion WHEN savings deplete

Effective markup = `ownershipRatio × privateMarkup + (1−ownershipRatio) × publicMarkup`

| Preset | Effective markup | R | Interpretation |
|--------|-----------------|---|----------------|
| Extractivist | 0.44 | **1.305** | Workers structurally excluded once savings deplete |
| Socialism | 0.09 | **0.557** | Workers always afford lower basket from wages alone |
| State-led | 0.02 | **0.586** | Same — never structurally excluded |

The scenarios below exploit this ratio and the **wealth depletion speed** (how fast savings drain toward zero).

---

### A1. Extractivist → Stable zero exclusion

**Minimum change: 1 parameter**

| Parameter | From | To |
|-----------|------|----|
| `defaultProductivity` | 5.0 | **7.0** |

**New R = 4.5 × 1.45 / (7.0 × 0.97) = 6.525 / 6.79 = 0.961 < 1 ✓**

Workers now earn enough from wages alone to clear the lower basket, with a small budget margin left (wage budget = wage × 0.97 = 3.88 against basket cost = 3.73 at productivity 7). This holds structurally, independent of treasury, savings, or welfare — so it produces **zero oscillation** even in year 1 and all subsequent years.

Why not raise `minimumWage` instead? Because unit cost = `minimumWage / productivity`, so prices scale exactly with wages. Doubling the wage doubles basket prices — R is unchanged. Wage increases never help; only the markup/productivity ratio does.

**What changes:** exclusion drops to 0% immediately and stays there. Gini and top-5% are **unchanged** — capitalists still own 75% of wealth and hoard at propensity 0.06. The extractivist concentration is fully preserved. Workers just aren't destitute.

---

### A1b. Extractivist → Stabilize to mostly upper + middle class (no lower / no exclusion)

**Context:** Raising `defaultProductivity: 5.0 → 7.0` (A1) eliminates social exclusion but leaves ~50% of workers in the lower class. This section addresses the stronger target: making upper + middle class the dominant outcome.

**Root cause of lower-class persistence**

Classification depends on which basket an agent can fully afford. The middle basket costs **6.5 units** across all sectors. Because worker income = `minimumWage` (fixed), and unit price = `(minWage / productivity) × (1 + markup)`, the **real wage** simplifies to:

```
real_wage = productivity / (1 + markup)
```

Raising `minimumWage` alone inflates prices proportionally — R is unchanged. Only productivity ↑ or markup ↓ increases real purchasing power.

**Middle basket threshold:**
```
productivity / (1 + markup) ≥ 6.5
```

| Config | Real wage | Outcome |
|--------|-----------|---------|
| Baseline (P=5, M=0.45) | 3.45 | ~37% exclusion |
| A1 test (P=7, M=0.45) | 4.83 | ~50% lower class |
| P=10, M=0.45 | **6.90** | ≥ middle class ✓ |
| P=9, M=0.35 | **6.67** | ≥ middle class ✓ |
| P=8, M=0.22 | **6.56** | middle class threshold |

**Minimum change: 2 parameters**

| Parameter | From | To |
|-----------|------|----|
| `defaultProductivity` | 5.0 | **8.0** |
| `privateMarkup` | 0.45 | **0.22** |

**New real wage = 8.0 / 1.22 = 6.56 ≥ 6.5 ✓**

This is the minimal-distance change from the extractivist baseline that crosses the middle basket threshold. Changing only productivity requires going to ≥ 9.43 (Δ = 4.43), whereas the combined path costs Δproductivity=3.0 + Δmarkup=0.23, which is a smaller total deviation.

**What stays the same:** 97% private ownership, 7%/8% tax rates, 1% welfare, 0% subsidies, `minimumWage=4.0`, `capitalistConsumptionPropensity=0.06`. Capitalists still capture ~97% of surplus and hoard it. Gini and top-5% are essentially unchanged.

**Narrative shift:** This is "high-productivity extractivism" — a Gilded Age boom or Gulf-state oil economy. Immense inequality and zero redistribution coexist with sufficient productive output that even workers' real wages clear middle-class consumption. The extractivist logic is fully preserved; the improvement comes entirely from the supply side (cheaper goods), not from redistribution.

**Optional buffer** (for early-year wealth-buildup lag):

| Parameter | From | To |
|-----------|------|----|
| `defaultProductivity` | 5.0 | **8.0** |
| `privateMarkup` | 0.45 | **0.20** |
| `essentialsSubsidyRatio` | 0.0 | **0.05** |

Real wage = 8.0 / 1.20 = 6.67, plus a thin state cushion on food/energy/housing for years before workers accumulate enough wealth buffer. This reduces sensitivity to early-year initialization variance.

---

### A2. Socialism → Lower class and exclusion grow toward year 40–50

**Minimum change: 2 parameters**

| Parameter | From | To |
|-----------|------|----|
| `defaultProductivity` | 11.0 | **5.0** |
| `profitTaxRate` | 0.50 | **0.12** |

**New R (productivity=5, eff_markup=0.09, propensity=0.88) = 4.5 × 1.09 / (5.0 × 0.88) = 4.905 / 4.40 = 1.115 > 1**

Workers can no longer afford the lower basket from wages alone. They now need savings to bridge the gap. But whether savings actually deplete — and how fast — depends on capitalist extraction. That's what `profitTaxRate: 0.12` controls.

**Why two parameters, not one?**

`defaultProductivity: 5.0` alone raises R above 1, but workers start with ~343 wealth each. They can dip into savings for many years without hitting exclusion. The question is when savings deplete. Without the second parameter, capitalists pay 50% profit tax and the treasury redistributes most of it — welfare partially replenishes workers. The drain is slow and may never reach exclusion within 50 years.

`profitTaxRate: 0.12` means capitalists keep 88% of surplus. They spend only 28% of that (propensity=0.28), hoarding 72%. Net drain per year from the worker-state pool ≈ `privateSurplus × 0.88 × 0.72 ≈ 0.63 × privateSurplus`. This is a compounding leak. Treasury thins year over year, welfare shrinks, and worker savings deplete faster.

**Trajectory:**
- **Years 1–15:** Workers have savings → budget = (343 + wage) × 0.88 → upper/middle class maintained
- **Years 15–30:** Capitalist hoards grow, treasury thins, welfare shrinks. Workers near the savings floor fall to middle, then lower class
- **Years 30–50:** Workers with below-average starting wealth hit zero savings → basket cost (R=1.115 × wage) exceeds wage budget → lower and social exclusion grow

**What stays the same:** The socialist institutional structure (35% private ownership, welfare system, subsidy 0.28) is untouched. The failure comes from gutting profit taxes and crashing productivity — a "hollowed-out" socialism that keeps the labels but loses the engine.

---

### A3. State-led → Lower/exclusion grows + top-5% accumulates toward year 40–50

**Minimum change: 3 parameters**

| Parameter | From | To |
|-----------|------|----|
| `taxProgressivity` | 2.0 | **1.0** |
| `welfareBudgetRatio` | 0.40 | **0.06** |
| `investmentBudgetRatio` | 0.30 | **0.04** |

**Why the state-led case needs 3 parameters:** unlike the other two scenarios, state-led has no capitalists, so there is no extraction mechanism to drain worker wealth. The failure must come entirely from internal worker stratification. Three conditions are needed simultaneously: (1) top workers must be allowed to keep advantage, (2) unemployed workers must lose their safety net, (3) the state must stop expanding employment so unemployment persists.

**Mechanism — the "employed elite" dynamic:**

In state-led, workers split into two functional groups:
- **Employed workers** earn `minimumWage=13` per year
- **Unemployed workers** earn only welfare

With `investmentBudgetRatio=0.04`, the state barely hires. Workers who start unemployed (or become unemployed due to firm capacity constraints) stay unemployed. Their welfare with `welfareBudgetRatio=0.06` from a thin treasury is near-zero.

With `taxProgressivity=1.0` (flat tax), high-wage employed workers pay the same rate as low-wage workers. The progressive redistribution that compressed wealth is gone. Employed workers accumulate; unemployed workers deplete.

**Top-5% mechanism:** The top-5% wealthiest workers — who start with higher initial wealth due to heterogeneous initialization — are almost all employed (richer workers got placed at firms first, or have accumulated savings that let them weather unemployment). With flat tax, they keep a larger after-tax share of wages. After 50 years of compounding, they hold a disproportionate share of total worker wealth.

**Trajectory:**
- **Years 1–15:** Unemployment partially hidden; workers have substantial savings (workerWealthShare=0.45 = 450 per worker starting). Even unemployed workers manage middle/lower class from savings
- **Years 15–30:** Unemployed workers deplete savings at ~welfare_per_year vs living costs. Savings → zero → lower class. Employed workers save portions of their 13/year wage
- **Years 30–50:** Unemployed workers hit zero savings → social exclusion with thin welfare; top employed workers compound their wealth gap → top-5% share visibly diverges

**What stays the same:** Zero capitalists, public ownership structure (96% public), minimum wage, productivity. The state still exists but has withdrawn from its two key functions: job creation and redistribution. This is "austerity within socialism" — formal equality with de facto stratification.

---

### Summary table

| Scenario | Desired outcome | Parameters to change | # changes |
|----------|----------------|---------------------|-----------|
| Extractivist | Stable zero exclusion (year 1 onward) | `defaultProductivity: 5.0 → 7.0` | **1** |
| Extractivist | Mostly upper + middle class (no lower / no exclusion) | `defaultProductivity: 5.0 → 8.0` + `privateMarkup: 0.45 → 0.22` | **2** |
| Socialism | Lower + exclusion grow years 30–50 | `defaultProductivity: 11.0 → 5.0` + `profitTaxRate: 0.50 → 0.12` | **2** |
| State-led | Lower + exclusion grow years 30–50; top-5% accumulates | `taxProgressivity: 2.0 → 1.0` + `welfareBudgetRatio: 0.40 → 0.06` + `investmentBudgetRatio: 0.30 → 0.04` | **3** |

---

---

## 1. Extractivist → Eliminate Social Exclusion (while preserving concentration)

**Baseline:** top-5% = 87.9%, exclusion = 36.9%, Gini = 0.954

The key insight here is that **exclusion and concentration are decoupled levers**. Exclusion is driven by the absolute floor (can agents afford the survival basket?), not by how concentrated wealth is at the top. A system can be maximally extractive *and* have zero exclusion if a wage floor is high enough.

### Mechanism

The lower basket costs ~4.5 units across all sectors. At `privateMarkup=0.45` and `defaultProductivity=5.0`, prices are elevated. Workers earn `minimumWage=4.0` — insufficient to clear even the lower basket. State has almost no treasury (low taxes, near-zero welfare) to compensate.

### Most Sensitive Parameters (ranked by marginal impact on exclusion)

| Parameter | Baseline | Threshold to Eliminate Exclusion | Why |
|-----------|----------|----------------------------------|-----|
| `minimumWage` | 4.0 | **~10–11** | Single biggest lever. Wage directly funds basket spending. Raising to 10 puts most workers above the lower-basket cost even at 45% markup. Top-5% barely changes — capitalists still hoard at `propensity=0.06`. |
| `essentialsSubsidyRatio` | 0.0 | **0.15–0.20** | Subsidies reduce effective basket cost for food/energy/housing (the 3 priority items). Even a 15% subsidy shrinks the required income to clear survival by ~20%. Can substitute for half a minimum wage increase. |
| `defaultProductivity` | 5.0 | **~9–10** | Higher productivity → lower unit cost → cheaper baskets at same markup. Also raises total output → more wages distributed. |
| `welfareBudgetRatio` | 0.01 | **~0.12** | Only relevant if taxes exist to fund it. At current `incomeTaxRate=0.07`/`profitTaxRate=0.08`, the treasury is thin — welfare boost alone can't compensate without also raising tax revenue. |

### Key Insight

**Minimum wage is the single-parameter fix.** Raising it from 4.0 to 11 with no other changes is likely sufficient to eliminate exclusion while preserving:
- Gini ≈ 0.95 (unchanged — wealth distribution unchanged)
- Top-5% ≈ 85%+ (capitalists still hoard, workers still spend everything)
- `capitalistConsumptionPropensity=0.06` ensures wealth stays locked at the top

This mirrors the "gilded floor" policy — workers are kept out of destitution but have no upward mobility. The extractivist logic is preserved; only the basement is raised.

**Second-order trap:** Raising `minimumWage` without also raising `defaultProductivity` may create a wage-price spiral (higher costs → higher prices → basket costs rise again). The safe combo is `minimumWage: 11, defaultProductivity: 9`.

---

## 2. Socialism → Increase Lower/Excluded Class + Accumulate Top-5% Wealth

**Baseline:** exclusion = 0%, upper = 83.3%, middle = 16.7%, Gini = 0.829, top-5% = 46.5%

The socialist preset is deliberately resilient — high welfare, high subsidy, high minimum wage, progressive taxation. To break it, you must simultaneously attack both the safety net and the redistribution mechanism.

### Mechanism

The system is held together by three pillars: (a) `welfareBudgetRatio=0.35` funds the excluded, (b) `essentialsSubsidyRatio=0.28` deflates basket costs, (c) `minimumWage=12.0` provides income floor. The small capitalist class (4%) is constrained by `profitTaxRate=0.50` and `capitalistConsumptionPropensity=0.28`.

### Most Sensitive Parameters

| Parameter | Baseline | Stress Direction | Expected Effect |
|-----------|----------|-----------------|-----------------|
| `welfareBudgetRatio` | 0.35 | **→ 0.05** | Most explosive lever. Welfare is the last line of defense for agents who cannot afford the lower basket from wages alone. Cutting from 0.35 → 0.05 immediately exposes the bottom ~15-20% of workers. |
| `essentialsSubsidyRatio` | 0.28 | **→ 0.05** | Removes the effective price discount on food/energy/housing. Basket cost spikes; agents who were barely middle class fall to lower/excluded. |
| `profitTaxRate` | 0.50 | **→ 0.18** | Allows capitalist surplus to compound. At 4% population but 30% starting wealth, even modest accumulation pushes top-5% above current 46.5%. |
| `capitalistConsumptionPropensity` | 0.28 | **→ 0.05** | Low propensity = extreme hoarding. Capitalists keep 95% of income rather than recirculating it. Combined with lower `profitTaxRate`, top-5% accumulation accelerates sharply. |
| `taxProgressivity` | 1.7 | **→ 1.0** | Flat tax removes the above-median surcharge. High-wealth workers pay same rate as low-wealth workers — less redistribution to treasury, less welfare funding available. |
| `minimumWage` | 12.0 | **→ 6.0** | Cuts income floor by half. Workers near the lower basket threshold tip into lower/excluded. |

### Stress Scenario: "Socialism in Name Only"

Apply these simultaneously:
```
welfareBudgetRatio:           0.35 → 0.05
essentialsSubsidyRatio:       0.28 → 0.05
profitTaxRate:                0.50 → 0.20
capitalistConsumptionPropensity: 0.28 → 0.05
minimumWage:                  12.0 → 6.0
taxProgressivity:              1.7 → 1.0
```

**Predicted outcome:** Exclusion rises to ~25-35%, top-5% climbs toward 65-70% (capitalists hoard aggressively), Gini approaches ~0.92. The public ownership structure (35% private) remains unchanged but becomes irrelevant — the redistribution apparatus is gutted.

### Key Insight

**`welfareBudgetRatio` is the fragility point.** Cutting it from 0.35 to 0.15 alone likely moves exclusion from 0% to ~10-15%. The system is held together not by public ownership (which is moderate at 35%) but by the transfer payments. This models the empirical observation that actually-existing socialist economies degraded fastest when welfare spending was cut — not when ownership changed.

**Counter-paradox:** Reducing `profitTaxRate` in Socialism causes top-5% concentration even though there are only 4% capitalists, because wealth compounds geometrically (hoarding × time). By year 30+, the small capitalist class dominates the top decile despite starting at 30% wealth share.

---

## 3. State-Led Growth → Increase Lower/Excluded Class + Accumulate Top-5% Wealth

**Baseline:** exclusion = 0%, 98.6% upper/middle, Gini = 0.767, top-5% = minimal

This is the most structurally interesting case. With **zero capitalists** (`capitalistRatio=0`), the top-5% wealth concentration can only emerge from *worker-to-worker inequality*. That inequality has one primary source: **employment differential**.

### Mechanism

In the state-led system, agents fall into two functional groups:
- **Employed workers** — earn wages via public firms
- **Unemployed workers** — receive welfare transfers only

With `investmentBudgetRatio=0.30`, the state constantly expands public employment. With `welfareBudgetRatio=0.40` and `essentialsSubsidyRatio=0.35`, even unemployed agents can clear the lower/middle basket. The gap between groups is small, so the wealth distribution stays compressed (low Gini).

### Most Sensitive Parameters

| Parameter | Baseline | Stress Direction | Expected Effect |
|-----------|----------|-----------------|-----------------|
| `investmentBudgetRatio` | 0.30 | **→ 0.03** | The state stops hiring. Unemployment stays high, permanently. Employed workers compound savings; unemployed workers erode theirs. This creates the top-5% concentration — the consistently employed. |
| `welfareBudgetRatio` | 0.40 | **→ 0.05** | Cuts the bridge for unemployed agents. Without welfare, unemployed workers deplete savings → lower class → exclusion. Without capitalists to tax heavily, treasury may thin anyway. |
| `defaultProductivity` | 12.0 | **→ 3.0** | Lower productivity → lower wages per employed worker → less surplus to save. Also fewer total goods produced → prices rise → basket costs increase. |
| `essentialsSubsidyRatio` | 0.35 | **→ 0.0** | Removes the price subsidy. Essential goods (food/energy/housing) revert to full cost. Unemployed workers on thin welfare can't clear survival basket. |
| `workerConsumptionPropensity` | 0.88 | **→ 0.98** | Near-full spending means workers save almost nothing. This is counterintuitive: *higher* propensity collapses wealth differentiation for the top-5% (everyone spends), but *lower* propensity allows employed workers to accumulate faster. To get top-5% concentration, push propensity **→ 0.60** for a targeted subgroup (not directly configurable, but global propensity at 0.60 increases savings variance). |
| `taxProgressivity` | 2.0 | **→ 1.0** | With strong progressive taxation, the top earners (employed high-productivity workers) are taxed heavily back into the pool. Flat tax lets them keep their surplus. |

### Stress Scenario: "State Capture by Employed Elite"

```
investmentBudgetRatio:    0.30 → 0.03
welfareBudgetRatio:       0.40 → 0.05
essentialsSubsidyRatio:   0.35 → 0.00
defaultProductivity:      12.0 → 4.0
minimumWage:              13.0 → 4.0
taxProgressivity:          2.0 → 1.0
workerConsumptionPropensity: 0.88 → 0.65
```

**Predicted outcome:** Unemployment stays high (state doesn't hire). Employed workers save ~35% of wages; unemployed exhaust savings → lower/excluded. Top-5% = the chronically employed with growing savings. Gini rises toward ~0.85. Exclusion grows to ~20-35% depending on how fast unemployment compounds.

### Key Insight

**The state-led system doesn't fail through privatization — it fails through employment collapse.** When the state stops investing in public jobs (`investmentBudgetRatio → 0`), it creates a two-tier worker society: a privileged employed class and a marginalized unemployed underclass. This models "public sector austerity" — the state nominally exists but has withdrawn from its core function.

**The top-5% in this system are not capitalists — they are state-sector insiders** (workers who happen to have secure public employment). This is a model of bureaucratic capture or nomenklatura dynamics: formal equality coexists with sharp de facto stratification based on who has access to public-sector wages.

---

## Cross-Scenario Synthesis

| Finding | Mechanism | Implication |
|---------|-----------|-------------|
| **Exclusion is a floor problem, not a distribution problem** | Raising `minimumWage` can eliminate exclusion in Extractivist without changing Gini | Anti-poverty policy and anti-inequality policy are separable |
| **Socialist systems are welfare-fragile, not ownership-fragile** | Cutting `welfareBudgetRatio` breaks socialism faster than changing `defaultOwnershipRatio` | Public ownership without redistribution is inert |
| **Top-5% concentration in no-capitalist systems comes from employment access** | `investmentBudgetRatio` controls who gets hired; hired workers accumulate | State austerity creates internal class stratification without private capital |
| **`capitalistConsumptionPropensity` is the hoarding dial** | Very low values (0.05-0.06) compound top-5% concentration over time even under moderate tax | Behavioral hoarding is as potent as structural ownership for concentration |
| **The most robust parameter for exclusion across all scenarios is `essentialsSubsidyRatio`** | Subsidizing food/energy/housing reduces basket cost directly; floor works even at low wages | Targeted price controls on essentials are more efficient than wage increases at preventing exclusion |
