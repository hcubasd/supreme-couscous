import { describe, expect, it } from "vitest";
import {
	analyzeProblem,
	type Carreta,
	type Item,
	solve,
	type Trip,
	type Vehicle,
} from "../src/helpers/optimizer";

// --- builders -------------------------------------------------------------

const item = (w: number, l = 0): Item => ({ w, l });

// A trailer that constrains nothing by default; override what a test cares about.
const carreta = (over: Partial<Carreta> = {}): Carreta => ({
	capacity: Number.MAX_SAFE_INTEGER,
	length: Number.MAX_SAFE_INTEGER,
	gap: 0,
	...over,
});

let vehicleSeq = 0;
// A vehicle that constrains nothing by default (huge caps, plenty of fleet, one
// unconstrained trailer) with freight 1 so a trip's cost equals its weight unless
// a test overrides the money params. Override only the fields a test cares about.
const veh = (over: Partial<Vehicle> = {}): Vehicle => ({
	name: `V${vehicleSeq++}`,
	fleet: 100,
	pesoMax: Number.MAX_SAFE_INTEGER,
	minCharge: 0,
	freight: 1,
	axles: 0,
	toll: 0,
	carretas: [carreta()],
	...over,
});

// --- composition validator ------------------------------------------------

// Assert a composition is a legal solution: a contiguous tiling of 0..n-1 that
// respects the regulatory rig weight and the fleet, with its cost summing to the
// reported optimum. (Per-trailer packing feasibility is the solver's job; we
// sanity-check that the breakdown's parts sum to the trip.)
function expectValidComposition(
	comp: Trip[],
	items: Item[],
	vehicles: Vehicle[],
	objectiveValue: number,
) {
	expect(comp.length).toBeGreaterThan(0);
	expect(comp[0].start).toBe(0);
	expect(comp[comp.length - 1].end).toBe(items.length - 1);

	let costSum = 0;
	const usageByClass = new Map<number, number>();

	comp.forEach((trip, i) => {
		expect(trip.units).toBe(trip.end - trip.start + 1);
		if (i > 0) expect(trip.start).toBe(comp[i - 1].end + 1);

		const block = items.slice(trip.start, trip.end + 1);
		const v = vehicles[trip.vIdx];
		const w = block.reduce((s, x) => s + x.w, 0);

		// regulatory rig cap
		expect(w).toBeLessThanOrEqual(v.pesoMax + 1e-9);
		// the breakdown's trailers partition the block and sum to its weight
		const beds = trip.beds ?? [];
		const cargoCount = beds.reduce((s, b) => s + b.cargos.length, 0);
		expect(cargoCount).toBe(trip.units);
		expect(beds.reduce((s, b) => s + b.w, 0)).toBeCloseTo(w, 6);

		usageByClass.set(trip.vIdx, (usageByClass.get(trip.vIdx) ?? 0) + 1);
		costSum += trip.r;
	});

	for (const [vIdx, used] of usageByClass) {
		expect(used).toBeLessThanOrEqual(vehicles[vIdx].fleet);
	}

	expect(costSum).toBeCloseTo(objectiveValue, 6);
}

function solveOk(items: Item[], vehicles: Vehicle[]) {
	const result = solve(items, vehicles);
	expect(result.status).toBe("success");
	if (result.status !== "success") throw new Error("unreachable");
	for (const comp of result.compositions) {
		expectValidComposition(comp, items, vehicles, result.objectiveValue);
	}
	return result;
}

// --- analyzeProblem -------------------------------------------------------

describe("analyzeProblem", () => {
	it("rejects empty cargo or empty fleet", () => {
		expect(analyzeProblem([], [veh()]).valid).toBe(false);
		expect(analyzeProblem([item(10)], []).valid).toBe(false);
	});

	it("rejects negative values (cargo, class fields, trailer fields)", () => {
		expect(analyzeProblem([item(-5)], [veh()]).valid).toBe(false);
		expect(analyzeProblem([item(10)], [veh({ pesoMax: -1 })]).valid).toBe(false);
		expect(
			analyzeProblem([item(10)], [veh({ carretas: [carreta({ length: -1 })] })])
				.valid,
		).toBe(false);
	});

	it("rejects a class with no trailers", () => {
		expect(analyzeProblem([item(10)], [veh({ carretas: [] })]).valid).toBe(false);
	});

	it("accepts zeros — they are valid literal values", () => {
		const analysis = analyzeProblem(
			[item(10, 0)],
			[
				veh({
					pesoMax: 100,
					minCharge: 0,
					freight: 0,
					toll: 0,
					fleet: 0,
					carretas: [carreta({ capacity: 100, length: 0, gap: 0 })],
				}),
			],
		);
		expect(analysis.valid).toBe(true);
	});
});

// --- solve: basics --------------------------------------------------------

describe("solve – basics", () => {
	it("returns invalid status (not a throw) for bad input", () => {
		const result = solve([], [veh()]);
		expect(result.status).toBe("invalid");
		expect(result.compositions).toBeNull();
	});

	it("solves a single cargo with a single vehicle", () => {
		const result = solveOk([item(100)], [veh({ pesoMax: 200 })]);
		expect(result.compositions).toHaveLength(1);
		expect(result.objectiveValue).toBe(100);
		const [trip] = result.compositions[0];
		expect(trip).toMatchObject({ start: 0, end: 0, vIdx: 0, units: 1, r: 100 });
	});

	it("applies the minimum charge floor (in R$, on the cost)", () => {
		// weight 100 × freight 1 = 100, floored to the R$150 minimum charge
		const result = solveOk([item(100)], [veh({ pesoMax: 200, minCharge: 150 })]);
		expect(result.objectiveValue).toBe(150);
		// the floor lands on the freight component (no weight floor anymore)
		expect(result.compositions[0][0].freight).toBe(150);
		expect(result.compositions[0][0].toll).toBe(0);
		expect(result.compositions[0][0].r).toBe(150);
	});

	it("adds the per-trip toll on top of the (floored) freight", () => {
		// max(100×1, 0) + 3×10 = 130
		const result = solveOk([item(100)], [veh({ pesoMax: 200, axles: 3, toll: 10 })]);
		expect(result.objectiveValue).toBe(130);
	});

	it("splits when a block exceeds the regulatory rig weight", () => {
		const result = solveOk(
			[item(100), item(100)],
			[veh({ pesoMax: 150, fleet: 5 })],
		);
		expect(result.compositions).toHaveLength(1);
		expect(result.compositions[0]).toHaveLength(2);
		expect(result.objectiveValue).toBe(200);
	});
});

// --- solve: trailers (2-D heterogeneous packing) --------------------------

describe("solve – trailers", () => {
	it("splits a block across two trailers by per-trailer weight", () => {
		// two 8t trailers; 3×6t cannot share two bins (one bin would need 12 > 8)
		const tight = solve(
			[item(6), item(6), item(6)],
			[veh({ pesoMax: 99, fleet: 1, carretas: [carreta({ capacity: 8 }), carreta({ capacity: 8 })] })],
		);
		expect(tight.status).toBe("infeasible");

		// {6,4} + {6} fits two 10t trailers
		const ok = solveOk(
			[item(6), item(4), item(6)],
			[veh({ pesoMax: 99, fleet: 1, carretas: [carreta({ capacity: 10 }), carreta({ capacity: 10 })] })],
		);
		const beds = ok.compositions[0][0].beds ?? [];
		expect(beds).toHaveLength(2);
		for (const b of beds) expect(b.w).toBeLessThanOrEqual(10);
	});

	it("handles heterogeneous trailers (different length capacities)", () => {
		// one short trailer (2m) + one long (10m); a 3m cargo can only ride the long
		const result = solveOk(
			[item(1, 3), item(1, 1)],
			[
				veh({
					pesoMax: 99,
					fleet: 1,
					carretas: [carreta({ length: 2 }), carreta({ length: 10 })],
				}),
			],
		);
		expect(result.compositions[0]).toHaveLength(1); // both ride one rig
	});

	it("counts inter-cargo spacing toward a trailer's length", () => {
		const items = [item(10, 2), item(10, 2)];
		const withGap = solveOk(
			items,
			[veh({ fleet: 5, carretas: [carreta({ length: 4.2, gap: 0.3 })] })],
		);
		expect(withGap.compositions[0]).toHaveLength(2); // 4.0 + 0.3 gap > 4.2 → split

		const noGap = solveOk(
			items,
			[veh({ fleet: 5, carretas: [carreta({ length: 4.2, gap: 0 })] })],
		);
		expect(noGap.compositions.some((comp) => comp.length === 1)).toBe(true);
	});
});

// --- solve: edge cases (literal-zero handling) ----------------------------

describe("solve – literal edge cases", () => {
	it("is infeasible when a cargo fits no vehicle", () => {
		const result = solve([item(1000)], [veh({ pesoMax: 100 })]);
		expect(result.status).toBe("infeasible");
		expect(result.objectiveValue).toBeNull();
	});

	it("is infeasible when the fleet is too small to cover the sequence", () => {
		const result = solve(
			[item(50), item(50), item(50)],
			[veh({ pesoMax: 60, fleet: 2 })],
		);
		expect(result.status).toBe("infeasible");
	});

	it("treats fleet 0 literally — that class is simply unavailable", () => {
		const result = solve([item(10)], [veh({ fleet: 0 })]);
		expect(result.status).toBe("infeasible");
	});

	it("treats pesoMax 0 literally — any positive cargo is infeasible", () => {
		const result = solve([item(10)], [veh({ pesoMax: 0 })]);
		expect(result.status).toBe("infeasible");
	});

	it("allows zero-length cargo (only weight binds)", () => {
		// length is irrelevant (0 length, 0 gap); the weight cap forces a split
		const result = solveOk(
			[item(100, 0), item(100, 0)],
			[veh({ pesoMax: 150, fleet: 5, carretas: [carreta({ length: 0, gap: 0 })] })],
		);
		expect(result.compositions[0]).toHaveLength(2);
	});

	it("allows zero-weight cargo (only length binds)", () => {
		// weightless cargos; a 1m trailer holds at most 1 (next would be 1+1 = 2m),
		// so two cargos need two rigs
		const result = solveOk(
			[item(0, 1), item(0, 1)],
			[veh({ fleet: 5, carretas: [carreta({ length: 1, gap: 0 })] })],
		);
		expect(result.objectiveValue).toBe(0); // weightless → zero cost
		expect(result.compositions[0]).toHaveLength(2);
	});

	it("lets gaps bind even at zero cargo length", () => {
		// zero-length cargos but a 1m gap: a 1m trailer fits (m−1)·1 ≤ 1 → 2 cargos max
		const fits2 = solveOk(
			[item(1, 0), item(1, 0)],
			[veh({ pesoMax: 99, carretas: [carreta({ length: 1, gap: 1 })] })],
		);
		expect(fits2.compositions[0]).toHaveLength(1); // both share one trailer

		const split = solveOk(
			[item(1, 0), item(1, 0), item(1, 0)],
			[veh({ pesoMax: 99, fleet: 5, carretas: [carreta({ length: 1, gap: 1 })] })],
		);
		expect(split.compositions[0]).toHaveLength(2); // third cargo needs a second rig
	});

	it("with all-zero costs, the trip-count tiebreaker minimizes vehicles", () => {
		// frete/pedágio/custoMín all 0 → every composition costs 0, so the
		// lexicographic tiebreaker (trip count) picks the fewest-trip tilings
		const result = solveOk(
			[item(50), item(50), item(50)],
			[veh({ pesoMax: 100, fleet: 5, freight: 0, toll: 0, minCharge: 0 })],
		);
		expect(result.objectiveValue).toBe(0);
		for (const comp of result.compositions) expect(comp).toHaveLength(2);
	});
});

// --- solve: all optima ----------------------------------------------------

describe("solve – all optimal compositions", () => {
	it("breaks cost ties by fewest trips (lexicographic tiebreaker)", () => {
		// 3×50 in a W=100 vehicle, freight 1: cost is 150 for every feasible
		// partition, so the trip-count tiebreaker drops the 3-trip all-singletons,
		// leaving the two 2-trip tilings: [01][2] and [0][12].
		const result = solveOk(
			[item(50), item(50), item(50)],
			[veh({ pesoMax: 100, fleet: 5 })],
		);
		expect(result.objectiveValue).toBe(150);
		expect(result.compositions).toHaveLength(2);
		for (const comp of result.compositions) expect(comp).toHaveLength(2);
	});

	it("enumerates ties across vehicle classes", () => {
		// 3 forced singletons, classes A and B each capped at 2: every assignment
		// with ≤2 of each is optimal → C(3,2)+C(3,1) = 6 compositions
		const result = solveOk(
			[item(50), item(50), item(50)],
			[veh({ pesoMax: 60, fleet: 2 }), veh({ pesoMax: 60, fleet: 2 })],
		);
		expect(result.objectiveValue).toBe(150);
		expect(result.compositions).toHaveLength(6);
	});
});

// --- solve: larger fixture ------------------------------------------------

describe("solve – larger fixture", () => {
	it("optimally pairs a 12-cargo sequence under a unique optimum", () => {
		// 12 units, 2 per trip (pesoMax 100), flat R$100 minimum charge per trip.
		// Cost is 100 per trip → fewest trips (6), uniquely the perfect pairing.
		const items = Array.from({ length: 12 }, () => item(50));
		const vehicles = [veh({ pesoMax: 100, minCharge: 100, fleet: 20 })];

		const result = solveOk(items, vehicles);
		expect(result.objectiveValue).toBe(600);
		expect(result.compositions).toHaveLength(1);
		expect(result.compositions[0]).toHaveLength(6);
		for (const trip of result.compositions[0]) {
			expect(trip.units).toBe(2);
			expect(trip.r).toBe(100);
		}
	});

	it("solves a heterogeneous instance with weight and length active", () => {
		const weights = [9000, 11000, 8000, 12000, 10000, 9500, 13000, 7000, 11500, 10500];
		const lengths = [1.5, 1.8, 1.4, 2.2, 1.6, 1.5, 2.0, 1.3, 1.7, 1.9];
		const items = weights.map((w, i) => item(w, lengths[i]));
		const vehicles = [
			veh({
				name: "A",
				pesoMax: 15000,
				minCharge: 10000,
				freight: 0.45,
				carretas: [carreta({ capacity: 15000, length: 5, gap: 0.2 })],
				fleet: 20,
			}),
			veh({
				name: "B",
				pesoMax: 35000,
				minCharge: 25000,
				freight: 0.38,
				carretas: [
					carreta({ capacity: 18000, length: 7, gap: 0.5 }),
					carreta({ capacity: 18000, length: 7, gap: 0.5 }),
				],
				fleet: 5,
			}),
		];

		const result = solveOk(items, vehicles);
		expect(result.objectiveValue).toBeGreaterThan(0);
		expect(result.compositions.length).toBeGreaterThan(0);
	});
});
