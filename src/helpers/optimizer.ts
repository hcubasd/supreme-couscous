// Pure sequential-partitioning optimizer ported from automatic-goggles.
// Given an ordered list of cargos and a limited fleet of vehicle classes, it
// finds the cheapest way to cut the sequence into contiguous trips. No DOM, no
// I/O — just the math.
//
// Per-trip cargo capacity is inferred from geometry (cargo lengths + gaps), so
// there is no separate unit-count constraint.

export type Item = { w: number; l: number };

export type Vehicle = {
	name: string;
	fleet: number; // vehicles available of this class
	W: number; // weight capacity (whole vehicle — a regulatory total, weighed as one)
	wmin: number; // minimum charged weight
	L: number; // usable length per trailer
	gap: number; // spacing between cargos
	carretas?: number; // number of trailers the rig pulls; L is the length of each
	// one and a cargo can't span two trailers (default 1)
	freight?: number; // R$/kg charged on the billable weight (optional)
	axles?: number; // number of axles (eixos), for the per-trip toll (optional)
	toll?: number; // R$ per axle (pedágio/eixo); per-trip toll = axles × toll (optional)
};

export type Objective = "cost" | "vehicles";

export type Config = {
	useWeight: boolean;
	useLength: boolean;
	useMinCharge: boolean;
	useFleet: boolean;
	useFreight: boolean;
};

export type Analysis =
	| { valid: false; message: string }
	| { valid: true; message: string; config: Config };

// One trailer's load within a trip: which cargos ride it (global indices) and
// the physical quantities that belong to a single compartment. These are
// additive — the trailers' values sum to the trip's. Billing and cost are not
// here: they're rig-level (min-charge floor, per-rig toll), so they live on Trip.
export type Trailer = {
	cargos: number[]; // global cargo indices on this trailer, ascending
	w: number; // real weight on this trailer
	l: number; // occupied length on this trailer (Σℓ + internal gaps)
};

// One trip in a reconstructed solution.
export type Trip = {
	start: number; // first cargo index (inclusive)
	end: number; // last cargo index (inclusive)
	vIdx: number; // vehicle class index
	units: number; // cargos loaded (end - start + 1)
	w: number; // real weight carried
	l: number; // occupied length
	c: number; // charged (billable) weight
	r: number; // trip cost in R$ (billable weight × freight + axles × toll); = c when no freight
	// One feasible per-trailer breakdown, filled only for materialized
	// compositions. Always at least one trailer (a single-trailer rig, or when
	// geometry is inactive, puts the whole block on one bed).
	beds?: Trailer[];
};

export type SolveResult =
	| {
			status: "invalid" | "infeasible";
			message: string;
			compositions: null;
			objectiveValue: null;
			statesExplored: number;
	  }
	| {
			status: "success";
			message: string;
			// Partitions that achieve the optimal objective value, capped at
			// MAX_COMPOSITIONS. When ties are abundant the true count can be
			// astronomically large, so this list is only a sample — see
			// compositionCount for how many optima actually exist.
			compositions: Trip[][];
			// Total number of optimal partitions, counted over the predecessor DAG
			// without materializing them. May exceed compositions.length.
			compositionCount: number;
			objectiveValue: number;
			statesExplored: number;
			config: Config;
	  };

// Upper bound on how many optimal partitions we expand into `compositions`. The
// count can be exponential (a polynomial DAG encodes exponentially many paths),
// so we list a sample and report the true total via compositionCount.
const MAX_COMPOSITIONS = 100;

function hasNegative(values: number[]): boolean {
	return values.some((value) => value < 0);
}

function hasAnyPositive(values: number[]): boolean {
	return values.some((value) => value > 0);
}

function hasAllPositive(values: number[]): boolean {
	return values.every((value) => value > 0);
}

// Validate the inputs and decide which constraints are actually active (a
// column is only enforced when at least one positive value is present).
export function analyzeProblem(items: Item[], vehicles: Vehicle[]): Analysis {
	if (!items.length || !vehicles.length) {
		return {
			valid: false,
			message: "Informe ao menos uma carga e uma classe de veículo.",
		};
	}

	const itemWeights = items.map((item) => item.w);
	const itemLengths = items.map((item) => item.l);
	const vehicleWeights = vehicles.map((vehicle) => vehicle.W);
	const vehicleMinCharges = vehicles.map((vehicle) => vehicle.wmin);
	const vehicleLengths = vehicles.map((vehicle) => vehicle.L);
	const vehicleGaps = vehicles.map((vehicle) => vehicle.gap);
	const vehicleCarretas = vehicles.map((vehicle) => vehicle.carretas ?? 0);
	const vehicleFleet = vehicles.map((vehicle) => vehicle.fleet);
	const vehicleFreight = vehicles.map((vehicle) => vehicle.freight ?? 0);
	const vehicleAxles = vehicles.map((vehicle) => vehicle.axles ?? 0);
	const vehicleToll = vehicles.map((vehicle) => vehicle.toll ?? 0);

	if (
		hasNegative(itemWeights) ||
		hasNegative(itemLengths) ||
		hasNegative(vehicleWeights) ||
		hasNegative(vehicleMinCharges) ||
		hasNegative(vehicleLengths) ||
		hasNegative(vehicleGaps) ||
		hasNegative(vehicleCarretas) ||
		hasNegative(vehicleFleet) ||
		hasNegative(vehicleFreight) ||
		hasNegative(vehicleAxles) ||
		hasNegative(vehicleToll)
	) {
		return {
			valid: false,
			message: "Use apenas valores maiores ou iguais a zero.",
		};
	}

	const itemLengthAny = hasAnyPositive(itemLengths);
	const itemWeightAll = hasAllPositive(itemWeights);
	const itemLengthAll = hasAllPositive(itemLengths);
	const vehicleWeightAny = hasAnyPositive(vehicleWeights);
	const vehicleLengthAny = hasAnyPositive(vehicleLengths);

	if (!itemWeightAll) {
		return {
			valid: false,
			message: "Informe pesos não nulos para todas as cargas.",
		};
	}

	if (itemLengthAny && !itemLengthAll) {
		return {
			valid: false,
			message:
				"Se informar um comprimento, informe comprimentos não nulos para todas as cargas.",
		};
	}

	if (!vehicleWeightAny) {
		return {
			valid: false,
			message: "Informe ao menos um Peso Máx. não nulo na frota.",
		};
	}

	// Freight is all-or-nothing: a rate on one class but not another would silently
	// price some trips in R$ and others at a meaningless rate of 1.
	const freightAny = hasAnyPositive(vehicleFreight);
	const freightAll = hasAllPositive(vehicleFreight);
	if (freightAny && !freightAll) {
		return {
			valid: false,
			message: "Se informar um frete, informe fretes não nulos para todas as classes.",
		};
	}

	// Toll is in R$, so it only composes with a R$ objective — it needs a freight.
	if (hasAnyPositive(vehicleToll) && !freightAny) {
		return {
			valid: false,
			message: "Para considerar pedágio, informe o frete (R$/kg) das classes.",
		};
	}

	return {
		valid: true,
		message: "pronto para calcular",
		config: {
			useWeight: true,
			useLength: itemLengthAll && vehicleLengthAny,
			useMinCharge: hasAnyPositive(vehicleMinCharges),
			useFleet: hasAnyPositive(vehicleFleet),
			useFreight: freightAny,
		},
	};
}

// Float tolerance for the multi-trailer packing test: folding the gap into each
// cargo's length adds/removes a gap term, so compare with a small slack.
const EPS = 1e-9;

// Free-placement packing for a multi-trailer rig: distribute these cargos across
// `beds` trailers — any cargo on any trailer, no order imposed within the rig —
// so that every trailer's occupied length stays within `bedLength`. A trailer
// holding m cargos occupies Σℓ + (m−1)·gap. Returns one feasible assignment as
// arrays of indices into `lengths` (one array per trailer), or null if none fits.
//
// Folding the inter-cargo gap into each cargo (size ℓ+gap, capacity bedLength+gap)
// turns this into classic bin-packing into a fixed number of bins: a trailer of m
// cargos is feasible iff Σ(ℓ+gap) ≤ bedLength+gap. That's weakly NP-hard in
// general, but a per-trip block holds only a handful of cargos, so an exhaustive
// best-fit search with symmetry pruning settles it instantly. The witnessing
// assignment is arbitrary among possibly many — it proves feasibility and shows
// the operator one valid way to load the rig.
function fitTrailers(
	lengths: number[],
	gap: number,
	beds: number,
	bedLength: number,
): number[][] | null {
	const capacity = bedLength + gap;
	const sizes = lengths.map((l) => l + gap);

	// A single cargo too long for one trailer kills it outright; so does a block
	// whose total can't fit the trailers' combined capacity.
	if (sizes.some((s) => s > capacity + EPS)) return null;
	if (sizes.reduce((sum, s) => sum + s, 0) > beds * capacity + EPS) return null;

	// Place the largest cargos first (stronger pruning) and, at each step, skip
	// trailers whose current load we've already tried at this depth — equal-load
	// trailers are interchangeable, which also keeps us from opening more than one
	// empty trailer.
	const order = sizes.map((_, i) => i).sort((a, b) => sizes[b] - sizes[a]);
	const loads = new Array<number>(beds).fill(0);
	const assignment: number[][] = Array.from({ length: beds }, () => []);
	const place = (k: number): boolean => {
		if (k === order.length) return true;
		const idx = order[k];
		const size = sizes[idx];
		const tried = new Set<number>();
		for (let b = 0; b < beds; b++) {
			if (tried.has(loads[b])) continue;
			tried.add(loads[b]);
			if (loads[b] + size <= capacity + EPS) {
				loads[b] += size;
				assignment[b].push(idx);
				if (place(k + 1)) return true;
				assignment[b].pop();
				loads[b] -= size;
			}
		}
		return false;
	};
	return place(0) ? assignment : null;
}

// Does the cargo block items[start..end] fit the vehicle? A single-trailer rig
// (the default) just lays everything end-to-end within L; a multi-trailer rig
// packs the cargos across its `beds` trailers, each L long, via the test above.
function lengthFits(
	items: Item[],
	start: number,
	end: number,
	occupiedLength: number,
	vehicle: Vehicle,
): boolean {
	const beds = Math.max(1, Math.trunc(vehicle.carretas ?? 1));
	if (beds <= 1) return occupiedLength <= vehicle.L;

	const lengths: number[] = [];
	for (let i = start; i <= end; i++) lengths.push(items[i].l);
	return fitTrailers(lengths, vehicle.gap, beds, vehicle.L) !== null;
}

// Build a Trailer (weight + occupied length) from a set of global cargo indices.
function makeTrailer(
	items: Item[],
	cargos: number[],
	gap: number,
	useLength: boolean,
): Trailer {
	const w = cargos.reduce((sum, i) => sum + items[i].w, 0);
	const l = useLength
		? cargos.reduce((sum, i) => sum + items[i].l, 0) +
			Math.max(0, cargos.length - 1) * gap
		: 0;
	return { cargos, w, l };
}

// One feasible per-trailer breakdown for a chosen trip: each trailer used, its
// cargos sorted ascending, the trailers ordered by their first cargo. A single-
// trailer rig (or an instance without geometry) puts the whole block on one bed.
// Display-only: the optimizer needs feasibility, this shows how to load.
function assignTrailers(
	items: Item[],
	start: number,
	end: number,
	vehicle: Vehicle,
	useLength: boolean,
): Trailer[] {
	const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
	const beds = Math.max(1, Math.trunc(vehicle.carretas ?? 1));
	if (!useLength || beds <= 1) {
		return [makeTrailer(items, indices, vehicle.gap, useLength)];
	}

	const local = fitTrailers(
		indices.map((i) => items[i].l),
		vehicle.gap,
		beds,
		vehicle.L,
	);
	// A trip only exists because it already passed lengthFits, so `local` is
	// non-null here; fall back to a single group defensively.
	if (!local) return [makeTrailer(items, indices, vehicle.gap, useLength)];

	return local
		.filter((bed) => bed.length > 0)
		.map((bed) =>
			makeTrailer(
				items,
				bed.map((li) => start + li).sort((a, b) => a - b),
				vehicle.gap,
				useLength,
			),
		)
		.sort((a, b) => a.cargos[0] - b.cargos[0]);
}

type TripCandidate = {
	end: number;
	vehicleIdx: number;
	totalW: number;
	totalL: number;
	totalUnits: number;
	charged: number; // billable weight (kg)
	reais: number; // billable weight × freight, rounded to centavos (= charged when no freight)
};

// For every start position, enumerate the feasible trips: contiguous runs of
// cargos starting there that fit some vehicle class under the active
// constraints.
function buildTrips(
	items: Item[],
	vehicles: Vehicle[],
	config: Config,
): TripCandidate[][] {
	const tripsFrom: TripCandidate[][] = Array.from(
		{ length: items.length },
		() => [],
	);

	for (let start = 0; start < items.length; start++) {
		let sumW = 0;
		let sumL = 0;

		for (let end = start; end < items.length; end++) {
			sumW += items[end].w;
			sumL += items[end].l;
			const nItems = end - start + 1;

			vehicles.forEach((vehicle, vehicleIdx) => {
				const occupiedLength = config.useLength
					? sumL + (nItems > 1 ? (nItems - 1) * vehicle.gap : 0)
					: 0;
				const weightOk = !config.useWeight || sumW <= vehicle.W;
				const lengthOk =
					!config.useLength ||
					lengthFits(items, start, end, occupiedLength, vehicle);
				const charged = config.useMinCharge
					? Math.max(config.useWeight ? sumW : 0, vehicle.wmin)
					: config.useWeight
						? sumW
						: 0;
				// Money cost: billable weight × R$/kg plus the per-trip toll
				// (axles × R$/axle), rounded to centavos so ties are exact on cents
				// rather than fragile on floating-point dust. Without a freight rate the
				// cost stays the raw billable weight (rate 1) and tolls don't apply.
				const reais = config.useFreight
					? Math.round(
							(charged * (vehicle.freight ?? 0) +
								(vehicle.axles ?? 0) * (vehicle.toll ?? 0)) *
								100,
						) / 100
					: charged;

				if (weightOk && lengthOk) {
					tripsFrom[start].push({
						end,
						vehicleIdx,
						totalW: config.useWeight ? sumW : 0,
						totalL: occupiedLength,
						totalUnits: nItems,
						charged,
						reais,
					});
				}
			});
		}
	}

	return tripsFrom;
}

// An incoming edge into a DP state: the trip taken plus the state it came from.
type Edge = Trip & { prev: string };

// The DP cost is lexicographic: the chosen objective is primary, the other
// metric breaks ties. For "cost" that's (R$ charged, trip count); for "vehicles"
// it's (trip count, R$ charged). The R$ is billable weight × freight, or just
// billable weight when no freight rate is given. Both components are additive
// over trips, so they compose along a path like an ordinary shortest-path cost —
// no remodeling, just a richer comparison. The tiebreaker never overrides the
// primary; it only orders solutions that already tie on it.
type Cost = [primary: number, secondary: number];

const lexLess = (a: Cost, b: Cost): boolean =>
	a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1];

const lexEqual = (a: Cost, b: Cost): boolean =>
	a[0] === b[0] && a[1] === b[1];

// Shortest-path DP over states `position | fleet-usage`. Each edge consumes a
// feasible trip; the edge cost is the lexicographic pair (see Cost above). Every
// predecessor edge achieving a state's best cost is kept, so all optimal
// partitions can be reconstructed — not just one.
export function solve(
	items: Item[],
	vehicles: Vehicle[],
	objective: Objective,
): SolveResult {
	const analysis = analyzeProblem(items, vehicles);
	if (!analysis.valid) {
		return {
			status: "invalid",
			message: analysis.message,
			compositions: null,
			objectiveValue: null,
			statesExplored: 0,
		};
	}

	const { config } = analysis;
	const tripsFrom = buildTrips(items, vehicles, config);
	const best = new Map<string, Cost>();
	const parents = new Map<string, Edge[]>();
	const statesByPos: string[][] = Array.from(
		{ length: items.length + 1 },
		() => [],
	);
	const startKey = `0|${Array(vehicles.length).fill(0).join(",")}`;

	best.set(startKey, [0, 0]);
	parents.set(startKey, []);
	statesByPos[0].push(startKey);

	for (let position = 0; position < items.length; position++) {
		for (const currentKey of statesByPos[position]) {
			const currentCost = best.get(currentKey) ?? [0, 0];
			const usage = currentKey.split("|")[1].split(",").map(Number);

			for (const trip of tripsFrom[position]) {
				const vehicleIndex = trip.vehicleIdx;
				if (
					config.useFleet &&
					usage[vehicleIndex] >= vehicles[vehicleIndex].fleet
				) {
					continue;
				}

				const nextUsage = config.useFleet ? [...usage] : usage;
				if (config.useFleet) {
					nextUsage[vehicleIndex] += 1;
				}

				const nextKey = `${trip.end + 1}|${nextUsage.join(",")}`;
				const [primInc, secInc]: Cost =
					objective === "vehicles" ? [1, trip.reais] : [trip.reais, 1];
				const candidate: Cost = [
					currentCost[0] + primInc,
					currentCost[1] + secInc,
				];
				const existing = best.get(nextKey);

				const edge: Edge = {
					prev: currentKey,
					start: position,
					end: trip.end,
					vIdx: vehicleIndex,
					units: trip.totalUnits,
					w: trip.totalW,
					l: trip.totalL,
					c: trip.charged,
					r: trip.reais,
				};

				if (existing === undefined || lexLess(candidate, existing)) {
					if (existing === undefined) {
						statesByPos[trip.end + 1].push(nextKey);
					}
					best.set(nextKey, candidate);
					parents.set(nextKey, [edge]);
				} else if (lexEqual(candidate, existing)) {
					parents.get(nextKey)?.push(edge);
				}
			}
		}
	}

	const finalStates = statesByPos[items.length];
	let bestCost: Cost | null = null;
	for (const key of finalStates) {
		const value = best.get(key);
		if (value && (bestCost === null || lexLess(value, bestCost))) {
			bestCost = value;
		}
	}

	if (bestCost === null) {
		return {
			status: "infeasible",
			message: "Nenhuma solução viável para a configuração informada.",
			compositions: null,
			objectiveValue: null,
			statesExplored: best.size,
		};
	}

	const optimalCost = bestCost;
	const optimalFinals = finalStates.filter((key) => {
		const value = best.get(key);
		return value !== undefined && lexEqual(value, optimalCost);
	});

	// Count the optimal partitions without materializing them: the number of
	// paths from a state back to the start is the sum over its predecessor edges
	// of the paths into each predecessor (the start state counts as one path).
	// The graph is acyclic (position strictly decreases along `prev`), so a
	// memoized recursion is polynomial — even when the count itself is huge.
	const pathCache = new Map<string, number>();
	const countPaths = (key: string): number => {
		const cached = pathCache.get(key);
		if (cached !== undefined) return cached;
		const edges = parents.get(key);
		let total = 0;
		if (!edges || edges.length === 0) {
			total = 1;
		} else {
			for (const edge of edges) total += countPaths(edge.prev);
		}
		pathCache.set(key, total);
		return total;
	};
	const compositionCount = optimalFinals.reduce(
		(sum, key) => sum + countPaths(key),
		0,
	);

	// Materialize only a sample: enumerate paths from the optimal end-states back
	// to the start, stopping at MAX_COMPOSITIONS. The start state is the only one
	// with no incoming edges (the recursion base).
	const compositions: Trip[][] = [];
	const walk = (key: string, acc: Trip[]): void => {
		if (compositions.length >= MAX_COMPOSITIONS) return;
		const edges = parents.get(key);
		if (!edges || edges.length === 0) {
			compositions.push([...acc].reverse());
			return;
		}
		for (const { prev, ...trip } of edges) {
			if (compositions.length >= MAX_COMPOSITIONS) return;
			// Attach the per-trailer breakdown for display. Always at least one
			// trailer; only splits when geometry is active and the rig has several.
			trip.beds = assignTrailers(
				items,
				trip.start,
				trip.end,
				vehicles[trip.vIdx],
				config.useLength,
			);
			acc.push(trip);
			walk(prev, acc);
			acc.pop();
		}
	};

	for (const key of optimalFinals) {
		if (compositions.length >= MAX_COMPOSITIONS) break;
		walk(key, []);
	}

	return {
		status: "success",
		message: "pronto",
		compositions,
		compositionCount,
		objectiveValue: optimalCost[0],
		statesExplored: best.size,
		config,
	};
}
