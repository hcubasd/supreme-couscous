# supreme-couscous

An exact fleet allocator for heavy-cargo transport operations — a browser tool
that, given an ordered list of cargo and a heterogeneous fleet, computes the
**cheapest** way to split the cargo into vehicle loads (breaking ties by the
**fewest vehicles**).

This repository is a **concrete application** of a more general optimization
model studied in the accompanying research,
[`hcubasd/symmetrical-chainsaw`](https://github.com/hcubasd/symmetrical-chainsaw).
The paper develops the model in the abstract — its set-partitioning formulation,
its dynamic-programming equivalents, and the broader class of problems it covers.
This repo is one specific instantiation of that model: a particular set of
restrictions (a regulatory rig weight plus per-trailer weight and geometry), a
particular cost function, and an interactive implementation in TypeScript
intended to serve as a field-testing tool for real operations.

> The interface auto-detects its language: **`pt-BR`** for Brazilian-Portuguese
> browsers (the motivating operation is the distribution of imported steel coils
> in Brazilian bonded warehouses), **`en-US`** for everyone else.

## Background

In some logistics settings the cargo is laid out in a **physical access
sequence** — you can only reach the units in order. That single fact makes any
allocation that doesn't respect block **contiguity** infeasible: a vehicle load
must be a consecutive run of the sequence, never a cherry-picked subset. The
decision is therefore *where to cut* the sequence and *which vehicle class*
serves each piece.

The research generalizes this into a model over contiguous intervals with
resource constraints, and shows it is equivalent to a resource-constrained
shortest path problem. It treats every restriction uniformly — what differs
between restrictions is only *how a quantity accumulates over a block*, not how
it enters the model. **This application picks a concrete set** of those
restrictions and solves the resulting problem.

## The problem this app solves

Let $N = \{1,\dots,n\}$ be the cargo units in physical order and
$K = \{1,\dots,m\}$ the vehicle classes. Each cargo unit $t$ has a weight $w_t$
and a length $\ell_t$.

A vehicle class $k$ is a **rig** pulling one or more **trailers** (*carretas*).
Per class: an available fleet $M_k$, a regulatory whole-rig weight limit $P_k$, a
minimum charge $q_k$ (R\$), a freight rate $f_k$ (R\$/kg), an axle count $a_k$,
and a toll rate $\tau_k$ (R\$/axle). Each trailer $r$ of the class has its own
physical weight capacity $W_{k,r}$, usable length $L_{k,r}$, and inter-cargo
spacing $g_{k,r}$.

A **trip** is a contiguous block $i,\dots,j$ carried by a class-$k$ rig. It is
feasible when the block's total weight is within the regulatory limit **and** the
units can be distributed across the rig's trailers so that every trailer stays
within both its weight capacity and its length:

$$
\sum_{t=i}^{j} w_t \le P_k
\qquad\text{and}\qquad
\exists\ \text{a partition into trailers } S_r \text{ with }
\sum_{t \in S_r} w_t \le W_{k,r}, \;\;
\sum_{t \in S_r} \ell_t + (|S_r|-1)\, g_{k,r} \le L_{k,r}.
$$

The geometric term is *affine* and trailer-dependent: a trailer holding $|S_r|$
units needs $|S_r|-1$ inter-cargo gaps, so spacing scales with how many units
share it. Distributing the block across heterogeneous trailers is a **vector
(2-D) bin-packing** problem — NP-hard in general, but a per-trip block is a
handful of units, so it's settled instantly (see below).

The charged cost floors the freight on the carried weight by the minimum charge,
then adds the per-trip toll:

$$
c_{ijk} = \max\!\left(f_k \sum_{t=i}^{j} w_t,\; q_k\right) + a_k\, \tau_k
$$

A solution selects a set of trips that **partitions** the whole sequence (each
unit covered exactly once — which, for contiguous intervals, forces a
left-to-right tiling), uses at most $M_k$ vehicles of each class, and minimizes a
**single lexicographic objective**: total cost first, then the number of trips.

$$
\min \Bigl(\textstyle\sum_{\text{trips}} c_{ijk},\;\; \bigl\lvert\{\text{trips}\}\bigr\rvert\Bigr)
$$

That is: *no operation under these parameters can be cheaper than the one
returned, and among the cheapest it uses the fewest vehicles.* "Fewer vehicles
even if more expensive" isn't a competing objective — the legitimate version of
that need is a fleet limit $M_k$ (a constraint), and the per-trip costs ($q_k$,
toll) already pull toward fewer trips.

> **On unit-count limits.** A "maximum units per vehicle" rule would be another
> valid restriction, but in the motivating operation it is redundant: the unit
> capacity operators use is itself an estimate derived from cargo dimensions on
> the port manifest (*mapeamento do porto*). Modeling the geometry directly
> replaces that hand-estimated proxy with the exact constraint, so this app
> collects geometry rather than a unit count. See the research for the full
> discussion.

## How it's solved

The engine implements the **complete dynamic program** from the research: a
shortest-path search over states $(p, u_1, \dots, u_m)$, where $p$ is the first
uncovered unit and $u_k$ is how many vehicles of class $k$ have been used so
far. A transition consumes a feasible trip from $p$, provided $u_k < M_k$. This
is exactly the resource-constrained shortest path on the acyclic state graph.

Three things are specific to this implementation:

- **The trailer packing is a firewalled NP-hard sub-problem.** Deciding whether a
  block fits a multi-trailer rig is 2-D bin-packing into heterogeneous bins,
  solved exactly by exhaustive best-fit backtracking with symmetry pruning.
  Because a per-trip block is tiny and the weight cap bounds how many units a rig
  can hold, this is effectively instant. It runs entirely while *enumerating
  feasible trips* — the DP itself only ever sees a flat list of feasible trips
  and their scalar costs.
- **It enumerates *all* optimal compositions, not just one** (capped at a sample
  of 100, with the true total reported). When several partitions tie for the
  optimum, the operator sees the full set of equally-good options rather than an
  arbitrary pick.
- **Every constraint is always on; values are taken literally.** There are no
  feature flags — the operator supplies every field, and a literal `0` is a valid
  value the math handles on its own. A zero cost-param simply drops out of the
  objective; a capacity or fleet of `0` is a real (maximally tight) limit, so you
  disable a limit by making it large, not by zeroing it.

## The optimizer API

The engine lives in [`src/helpers/optimizer.ts`](src/helpers/optimizer.ts) and is
pure (no DOM, no I/O):

```ts
type Item = { w: number; l: number };

type Carreta = {
  capacity: number; // physical weight capacity (kg)
  length: number;   // usable length (m)
  gap: number;      // inter-cargo spacing (m)
};

type Vehicle = {
  name: string;
  fleet: number;       // M_k — vehicles available of this class
  pesoMax: number;     // P_k — regulatory whole-rig weight limit
  minCharge: number;   // q_k — minimum charge (R$)
  freight: number;     // f_k — R$/kg
  axles: number;       // a_k
  toll: number;        // τ_k — R$/axle
  carretas: Carreta[]; // ≥1 trailers — the bins of the 2-D packing
};

function solve(items: Item[], vehicles: Vehicle[]): SolveResult;
```

A successful `SolveResult` carries `compositions: Trip[][]` (a sample of the
optimal partitions, ≤100), `compositionCount` (how many optima exist),
`objectiveValue` (the minimum total cost), and `statesExplored`. Each `Trip`
records its block range, vehicle class, unit count, the cost split (`freight`,
`toll`, total `r`), and `beds` — one feasible per-trailer breakdown for display.

The suite in [`tests/optimizer.test.ts`](tests/optimizer.test.ts) covers
validation, the minimum-charge floor and per-trip toll, the heterogeneous 2-D
trailer packing, the length-with-spacing limit, the literal-zero edge cases,
infeasibility, fleet binding, all-optima tie enumeration, and larger fixtures.

## Localization and data

- The UI **auto-detects the locale** (`pt-BR` vs `en-US`) from the browser and
  sets `<html lang>` accordingly. Numbers display in the locale's convention;
  parsing accepts either decimal separator, so the optimizer never depends on it.
- Monetary values are shown as **plain numbers, no currency symbol** — the
  column labels carry the meaning.
- **CSV import auto-detects the delimiter** (`;` ⇒ comma decimal, `,` ⇒ dot
  decimal), so a file authored in one locale imports correctly in another;
  **export** writes the active locale's format. Files carry a header row, and the
  vehicle CSV groups rows by class name (one row per trailer, class fields
  repeated). Cargo and fleet tables also persist to `localStorage`.

## Project structure

```
src/
  App.tsx          scaffolding: shared state, solve/clear handlers, page skeleton
  index.tsx        entry point
  styles.css
  components/      Parameters, Results; Cargoes/Cargo, Vehicles/Vehicle/Carreta,
                   Controls/ControlBar, Assignments/Assignment/AssignedVehicle,
                   Import/Export/ClearButton, primitives
  helpers/
    optimizer.ts   the optimization engine (pure)
    fleet.ts       nested vehicle/trailer rows (growing, persisted) + CSV grouping
    rows.ts        growing cargo rows (one trailing empty row, persisted)
    mapping.ts     rows → optimizer domain types
    csv.ts         pure CSV parse / serialize (no locale)
    number.ts      number ↔ string (locale display, locale-agnostic parse)
    color.ts       palette generation + the ANSI button fills
    locale.ts      pt-BR / en-US detection and strings
    layout.ts      recolor + squeeze hooks
tests/
  optimizer.test.ts
```

The UI uses two companion libraries from the same author:
[`miniature-waffle`](https://www.npmjs.com/package/miniature-waffle) for color
generation and [`psychic-potato`](https://www.npmjs.com/package/psychic-potato)
for the auto-fitting/coloring layout. Squeezing the foreground font to fit runs
on mount and resize; coloring the background layers runs when rows are
added/removed or results render.

## Development

```bash
npm install
npm run dev       # Vite dev server
npm test          # Vitest (watch locally; single run under CI)
npm run build     # production build to dist/
npm run preview   # serve the production build
```

CI (`.github/workflows/integration.yaml`) runs the tests and build on every
push.

## Deployment

Pushing a `vX.Y.Z` tag triggers
[`.github/workflows/deployment.yaml`](.github/workflows/deployment.yaml), which
builds, publishes to **GitHub Pages**, and cuts a GitHub release. The app is
served under the `/supreme-couscous/` base path at
<https://hcubasd.github.io/supreme-couscous/>.

## Research

The general model, its formulations and equivalences, the systematic literature
review, and the planned empirical validation are documented in the accompanying
paper: [`hcubasd/symmetrical-chainsaw`](https://github.com/hcubasd/symmetrical-chainsaw).
This repository is the implemented prototype referenced there.
