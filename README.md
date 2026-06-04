# supreme-couscous

An exact fleet allocator for heavy-cargo transport operations — a browser tool
that, given an ordered list of cargo and a heterogeneous fleet, computes the
**cheapest** (or **fewest-trip**) way to split the cargo into vehicle loads.

This repository is a **concrete application** of a more general optimization
model studied in the accompanying research,
[`hcubasd/symmetrical-chainsaw`](https://github.com/hcubasd/symmetrical-chainsaw).
The paper develops the model in the abstract — its set-partitioning formulation,
its dynamic-programming equivalents, and the broader class of problems it covers.
This repo is one specific instantiation of that model: a particular set of
restrictions (weight and geometry), a particular cost function, and an
interactive implementation in TypeScript intended to serve as a field-testing
tool for real operations.

> The interface is in Brazilian Portuguese (`pt-BR`), matching the motivating
> operation: the distribution of imported steel coils in Brazilian bonded
> warehouses.

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
it enters the model. **This application picks two such restrictions** and solves
the resulting concrete problem.

## The problem this app solves

Let $N = \{1,\dots,n\}$ be the cargo units in physical order and
$K = \{1,\dots,m\}$ the vehicle classes. Each cargo unit $t$ has a weight $w_t$
and a length $\ell_t$. Each class $k$ has a weight capacity $W_k$, a usable
length $L_k$, a required inter-unit spacing $g_k$, an available fleet size
$M_k$, and a minimum billable weight $q_k$.

A **trip** is a contiguous block $i,\dots,j$ carried by a vehicle of class $k$.
It is feasible when it satisfies both restrictions:

$$
\underbrace{\sum_{t=i}^{j} w_t \le W_k}_{\text{weight}}
\qquad\text{and}\qquad
\underbrace{\sum_{t=i}^{j} \ell_t + (j - i)\, g_k \le L_k}_{\text{geometry (length + spacing)}}
$$

The geometric restriction is *affine* and class-dependent: a block of $j-i+1$
units needs $j-i$ inter-unit gaps, so spacing scales with how many units share
the vehicle. The charged cost of a feasible trip floors the carried weight by
the contractual minimum:

$$
c_{ijk} = \max\!\left(\sum_{t=i}^{j} w_t,\; q_k\right)
$$

A solution selects a set of trips that **partitions** the whole sequence
(each unit covered exactly once — which, for contiguous intervals, forces a
left-to-right tiling), uses at most $M_k$ vehicles of each class, and minimizes
the objective. Two objectives are supported:

$$
\min \sum_{\text{trips}} c_{ijk}
\qquad\text{(total charged cost)}
\qquad\text{or}\qquad
\min \; \bigl\lvert \{\text{trips}\} \bigr\rvert
\qquad\text{(number of vehicles)}
$$

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

Two things are specific to this implementation:

- **It enumerates *all* optimal compositions, not just one.** When several
  partitions tie for the optimum, the tool reports every one of them, so an
  operator sees the full set of equally-good options rather than an arbitrary
  pick. (The single-optimum variant is what the paper's reference listing
  presents; enumerating the whole optimal set is an output-side extension.)
- **Constraints auto-activate from the data.** A restriction is only enforced
  when the relevant values are present — e.g. lengths are ignored unless every
  cargo has one and some vehicle has a usable length. This keeps the tool usable
  with partial data.

## The optimizer API

The engine lives in [`src/helpers/optimizer.ts`](src/helpers/optimizer.ts) and is
pure (no DOM, no I/O):

```ts
type Item = { w: number; l: number };

type Vehicle = {
  name: string;
  fleet: number; // M_k — vehicles available of this class
  W: number;     // weight capacity
  wmin: number;  // q_k — minimum charged weight
  L: number;     // usable length
  gap: number;   // g_k — inter-unit spacing
};

type Objective = "cost" | "vehicles";

function solve(items: Item[], vehicles: Vehicle[], objective: Objective): SolveResult;
```

A successful `SolveResult` carries `compositions: Trip[][]` — every partition
achieving `objectiveValue` — along with the resolved `config` (which constraints
were active) and `statesExplored`. Each `Trip` records its block range, vehicle
class, unit count, real weight, occupied length, and charged weight.

The suite in [`tests/optimizer.test.ts`](tests/optimizer.test.ts) covers
validation, the min-charge floor, the length-with-spacing limit, infeasibility,
fleet binding, all-optima tie enumeration, and larger fixtures.

## Project structure

```
src/
  App.tsx          UI: parameter tables (cargo + fleet) and results
  index.tsx        entry point
  styles.css
  helpers/
    optimizer.ts   the optimization engine (pure)
    rows.ts        growing-row tables with one trailing empty row + localStorage
    layout.ts      recolor/refit hooks (see deps below)
tests/
  optimizer.test.ts
```

The UI uses two companion libraries from the same author:
[`miniature-waffle`](https://www.npmjs.com/package/miniature-waffle) for color
generation and [`psychic-potato`](https://www.npmjs.com/package/psychic-potato)
for the auto-fitting/coloring layout. Cargo and fleet parameters persist to
`localStorage`, so they survive a reload; results are recomputed on demand and
are not stored.

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
