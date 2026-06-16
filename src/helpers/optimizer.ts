// Pure sequential-partitioning optimizer.
// Given an ordered list of cargos and a fleet of vehicle classes, find the
// cheapest way to cut the sequence into contiguous trips. No DOM, no I/O.
//
// Every constraint is always on — there are no feature flags. The operator
// supplies every field and a literal 0 is a valid value the math handles on its
// own: a zero cost-param simply drops out of the objective (and, because the
// objective is lexicographic, an all-zero cost turns "minimize cost" into
// "minimize trips"), while a zero capacity is taken literally — you disable a
// limit by making it large, not by zeroing it.

export type Item = { w: number; l: number };

// One trailer (carreta) of a rig — a bin in the 2-D packing. Heterogeneous: each
// trailer carries its own physical weight capacity, length, and inter-cargo gap.
export type Carreta = {
	capacity: number; // physical weight capacity (kg)
	length: number; // physical length capacity (m)
	gap: number; // spacing between cargos on this trailer (m)
};

export type Vehicle = {
	name: string; // class name (unique identifier)
	fleet: number; // vehicles available of this class
	pesoMax: number; // regulatory max total weight for the whole rig (kg)
	minCharge: number; // minimum charge (R$); floors the freight, toll added on top
	freight: number; // R$/kg on the carried weight
	axles: number; // eixos
	toll: number; // R$ per axle (pedágio/eixo); per-trip toll = axles × toll
	carretas: Carreta[]; // ≥1 trailers — the bins of the 2-D packing
};

// The validation failures the optimizer can report. The UI maps these keys to
// localized text — the optimizer stays free of UI strings.
export type InvalidKey = "needCargoAndVehicle" | "needCarreta" | "nonNegative";

export type Analysis =
	| { valid: false; messageKey: InvalidKey }
	| { valid: true };

// One trailer's load within a trip: which cargos ride it (global indices) and the
// physical quantities of a single compartment. Additive — the trailers' values
// sum to the trip's. Billing/cost are rig-level (min-charge floor, per-rig toll),
// so they live on Trip, not here.
export type Trailer = {
	cargos: number[]; // global cargo indices on this trailer, ascending
	w: number; // real weight on this trailer
	l: number; // occupied length on this trailer (Σℓ + internal gaps)
};

// One trip in a reconstructed solution. The cost is split into its two components
// for display; r (their sum) is what the DP optimizes. Real weight isn't on the
// trip — it's per-trailer (beds) and sums up in the results' Total row.
export type Trip = {
	start: number; // first cargo index (inclusive)
	end: number; // last cargo index (inclusive)
	vIdx: number; // vehicle class index
	units: number; // cargos loaded (end - start + 1)
	freight: number; // freight charge: max(weight × freight rate, minCharge)
	toll: number; // per-trip toll: axles × toll
	r: number; // total cost = freight + toll
	// One feasible per-trailer breakdown, filled only for materialized
	// compositions. Always at least one trailer.
	beds?: Trailer[];
};

export type SolveResult =
	| {
			status: "invalid";
			messageKey: InvalidKey;
			compositions: null;
			objectiveValue: null;
			statesExplored: number;
	  }
	| {
			status: "infeasible";
			compositions: null;
			objectiveValue: null;
			statesExplored: number;
	  }
	| {
			status: "success";
			// Partitions achieving the optimal objective value, capped at
			// MAX_COMPOSITIONS — a sample when ties are abundant. compositionCount
			// reports how many optima actually exist.
			compositions: Trip[][];
			compositionCount: number;
			objectiveValue: number;
			statesExplored: number;
	  };

// Upper bound on how many optimal partitions we expand into `compositions`. The
// count can be exponential, so we list a sample and report the true total.
const MAX_COMPOSITIONS = 100;

// Float tolerance for the packing comparisons (gaps accumulate rounding dust).
const EPS = 1e-9;

// Validate the inputs. Every value must be non-negative (zero is allowed and the
// math handles it), each class needs at least one trailer, and there must be at
// least one cargo and one class. Feasibility itself is reported by solve, not here.
export function analyzeProblem(items: Item[], vehicles: Vehicle[]): Analysis {
	if (!items.length || !vehicles.length) {
		return { valid: false, messageKey: "needCargoAndVehicle" };
	}

	if (vehicles.some((v) => v.carretas.length === 0)) {
		return { valid: false, messageKey: "needCarreta" };
	}

	const itemBad = items.some((i) => i.w < 0 || i.l < 0);
	const vehicleBad = vehicles.some(
		(v) =>
			v.fleet < 0 ||
			v.pesoMax < 0 ||
			v.minCharge < 0 ||
			v.freight < 0 ||
			v.axles < 0 ||
			v.toll < 0 ||
			v.carretas.some((c) => c.capacity < 0 || c.length < 0 || c.gap < 0),
	);
	if (itemBad || vehicleBad) {
		return { valid: false, messageKey: "nonNegative" };
	}

	return { valid: true };
}

// Occupied length of m cargos sharing a trailer: Σℓ + (m−1)·gap.
function occupiedLength(lengths: number[], gap: number): number {
	if (lengths.length === 0) return 0;
	return lengths.reduce((sum, l) => sum + l, 0) + (lengths.length - 1) * gap;
}

// Free-placement packing for a rig: distribute these cargos across its trailers —
// any cargo on any trailer, no order within the rig — so every trailer b stays
// within both its weight capacity and its length:
//   Σweight ≤ carretas[b].capacity   and   Σℓ + (m−1)·gap_b ≤ carretas[b].length.
// Returns one feasible assignment (indices per trailer) or null. This is vector
// (2-D) bin-packing into a fixed set of *heterogeneous* bins — NP-hard in general,
// but a per-trip block is a handful of cargos, so exhaustive backtracking with
// symmetry pruning settles it instantly. The witness is arbitrary among many.
function fitTrailers(
	weights: number[],
	lengths: number[],
	carretas: Carreta[],
): number[][] | null {
	const beds = carretas.length;

	// A cargo that fits no single trailer (by weight or length) kills the block.
	for (let i = 0; i < weights.length; i++) {
		const fitsSome = carretas.some(
			(c) => weights[i] <= c.capacity + EPS && lengths[i] <= c.length + EPS,
		);
		if (!fitsSome) return null;
	}

	// Heaviest first for stronger pruning.
	const order = weights.map((_, i) => i).sort((a, b) => weights[b] - weights[a]);
	const wLoads = new Array<number>(beds).fill(0);
	const lLoads = new Array<number>(beds).fill(0); // raw occupied length so far
	const counts = new Array<number>(beds).fill(0);
	const assignment: number[][] = Array.from({ length: beds }, () => []);

	const place = (k: number): boolean => {
		if (k === order.length) return true;
		const idx = order[k];
		const w = weights[idx];
		const l = lengths[idx];
		const tried = new Set<string>();
		for (let b = 0; b < beds; b++) {
			const c = carretas[b];
			// Skip a trailer interchangeable with one already tried at this depth —
			// same spec and same current load (also avoids opening duplicate empties).
			const sig = `${c.capacity}|${c.length}|${c.gap}|${wLoads[b]}|${lLoads[b]}`;
			if (tried.has(sig)) continue;
			tried.add(sig);
			// First cargo on a trailer adds no gap; each later one adds this gap.
			const lInc = counts[b] === 0 ? l : l + c.gap;
			if (
				wLoads[b] + w <= c.capacity + EPS &&
				lLoads[b] + lInc <= c.length + EPS
			) {
				wLoads[b] += w;
				lLoads[b] += lInc;
				counts[b] += 1;
				assignment[b].push(idx);
				if (place(k + 1)) return true;
				assignment[b].pop();
				counts[b] -= 1;
				lLoads[b] -= lInc;
				wLoads[b] -= w;
			}
		}
		return false;
	};

	return place(0) ? assignment : null;
}

// Does the cargo block items[start..end] fit the vehicle? The whole rig's weight
// must be within the regulatory pesoMax, and the cargos must pack across the
// trailers under their per-trailer weight and length limits.
function rigFits(
	items: Item[],
	start: number,
	end: number,
	sumW: number,
	vehicle: Vehicle,
): boolean {
	if (sumW > vehicle.pesoMax + EPS) return false;
	const weights: number[] = [];
	const lengths: number[] = [];
	for (let i = start; i <= end; i++) {
		weights.push(items[i].w);
		lengths.push(items[i].l);
	}
	return fitTrailers(weights, lengths, vehicle.carretas) !== null;
}

function makeTrailer(items: Item[], cargos: number[], gap: number): Trailer {
	const w = cargos.reduce((sum, i) => sum + items[i].w, 0);
	const l = occupiedLength(
		cargos.map((i) => items[i].l),
		gap,
	);
	return { cargos, w, l };
}

// One feasible per-trailer breakdown for a chosen trip: each used trailer with its
// cargos ascending, trailers ordered by their first cargo. Display-only — solve
// needs feasibility; this shows the operator one valid way to load the rig.
function assignTrailers(
	items: Item[],
	start: number,
	end: number,
	vehicle: Vehicle,
): Trailer[] {
	const local = fitTrailers(
		Array.from({ length: end - start + 1 }, (_, k) => items[start + k].w),
		Array.from({ length: end - start + 1 }, (_, k) => items[start + k].l),
		vehicle.carretas,
	);
	// A trip exists only because it passed rigFits, so `local` is non-null here;
	// fall back to a single group defensively.
	if (!local) {
		const all = Array.from({ length: end - start + 1 }, (_, k) => start + k);
		return [makeTrailer(items, all, vehicle.carretas[0].gap)];
	}
	return local
		.map((bed, b) => ({ bed, gap: vehicle.carretas[b].gap }))
		.filter(({ bed }) => bed.length > 0)
		.map(({ bed, gap }) =>
			makeTrailer(
				items,
				bed.map((li) => start + li).sort((a, b) => a - b),
				gap,
			),
		)
		.sort((a, b) => a.cargos[0] - b.cargos[0]);
}

type TripCandidate = {
	end: number;
	vehicleIdx: number;
	totalUnits: number;
	freight: number; // max(w × freight rate, minCharge), rounded to centavos
	toll: number; // axles × toll, rounded to centavos
	reais: number; // freight + toll
};

// For every start position, enumerate the feasible trips: contiguous runs of
// cargos from there that fit some vehicle class.
function buildTrips(items: Item[], vehicles: Vehicle[]): TripCandidate[][] {
	const tripsFrom: TripCandidate[][] = Array.from(
		{ length: items.length },
		() => [],
	);
	const maxPeso = Math.max(...vehicles.map((v) => v.pesoMax));

	for (let start = 0; start < items.length; start++) {
		let sumW = 0;
		for (let end = start; end < items.length; end++) {
			sumW += items[end].w;
			// Weight only grows; once past every class's regulatory cap, no longer
			// block from this start can fit, so stop extending.
			if (sumW > maxPeso + EPS) break;
			const nItems = end - start + 1;

			vehicles.forEach((vehicle, vehicleIdx) => {
				if (!rigFits(items, start, end, sumW, vehicle)) return;
				// Cost components, each rounded to centavos (so they're exact line items
				// and their sum is exact too): freight on the carried weight floored by
				// the minimum charge, and the per-trip toll (axles × R$/axle).
				const freight =
					Math.round(Math.max(sumW * vehicle.freight, vehicle.minCharge) * 100) /
					100;
				const toll = Math.round(vehicle.axles * vehicle.toll * 100) / 100;
				tripsFrom[start].push({
					end,
					vehicleIdx,
					totalUnits: nItems,
					freight,
					toll,
					reais: freight + toll,
				});
			});
		}
	}

	return tripsFrom;
}

// An incoming edge into a DP state: the trip taken plus the state it came from.
type Edge = Trip & { prev: string };

// The DP cost is lexicographic: total R$ is primary, trip count breaks ties — the
// cheapest operation, and among the cheapest, the one using the fewest vehicles.
// Both components are additive over trips, so they compose along a path like an
// ordinary shortest-path cost. The tiebreaker never overrides the primary; it only
// orders solutions that already tie on cost.
type Cost = [cost: number, trips: number];

const lexLess = (a: Cost, b: Cost): boolean =>
	a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1];

const lexEqual = (a: Cost, b: Cost): boolean =>
	a[0] === b[0] && a[1] === b[1];

// Shortest-path DP over states `position | fleet-usage`. Each edge consumes a
// feasible trip; every predecessor edge achieving a state's best cost is kept, so
// all optimal partitions can be reconstructed — not just one.
export function solve(items: Item[], vehicles: Vehicle[]): SolveResult {
	const analysis = analyzeProblem(items, vehicles);
	if (!analysis.valid) {
		return {
			status: "invalid",
			messageKey: analysis.messageKey,
			compositions: null,
			objectiveValue: null,
			statesExplored: 0,
		};
	}

	const tripsFrom = buildTrips(items, vehicles);
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
				if (usage[vehicleIndex] >= vehicles[vehicleIndex].fleet) continue;

				const nextUsage = [...usage];
				nextUsage[vehicleIndex] += 1;

				const nextKey = `${trip.end + 1}|${nextUsage.join(",")}`;
				// Cost primary, one trip added to the count as the tiebreaker.
				const candidate: Cost = [
					currentCost[0] + trip.reais,
					currentCost[1] + 1,
				];
				const existing = best.get(nextKey);

				const edge: Edge = {
					prev: currentKey,
					start: position,
					end: trip.end,
					vIdx: vehicleIndex,
					units: trip.totalUnits,
					freight: trip.freight,
					toll: trip.toll,
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

	// Count the optimal partitions without materializing them: paths from a state
	// back to the start sum over its predecessor edges. The graph is acyclic
	// (position strictly decreases along `prev`), so memoized recursion is
	// polynomial even when the count itself is huge.
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
	// to the start, stopping at MAX_COMPOSITIONS.
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
			// Attach the per-trailer breakdown for display.
			trip.beds = assignTrailers(items, trip.start, trip.end, vehicles[trip.vIdx]);
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
		compositions,
		compositionCount,
		objectiveValue: optimalCost[0],
		statesExplored: best.size,
	};
}
