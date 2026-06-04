import { describe, expect, it } from "vitest";
import {
	analyzeProblem,
	type Config,
	type Item,
	solve,
	type Trip,
	type Vehicle,
} from "../src/helpers/optimizer";

// --- builders -------------------------------------------------------------

const item = (w: number, l = 0): Item => ({ w, l });

let vehicleSeq = 0;
// A vehicle that constrains nothing by default (huge capacities, plenty of
// fleet); override only the fields a test cares about.
const veh = (over: Partial<Vehicle> = {}): Vehicle => ({
	name: `V${vehicleSeq++}`,
	fleet: 100,
	W: Number.MAX_SAFE_INTEGER,
	wmin: 0,
	L: Number.MAX_SAFE_INTEGER,
	gap: 0,
	...over,
});

// --- composition validator ------------------------------------------------

// Assert a single composition is a legal solution to the instance: a contiguous
// tiling of 0..n-1 that respects every active constraint, and whose objective
// accounting matches the reported optimum.
function expectValidComposition(
	comp: Trip[],
	items: Item[],
	vehicles: Vehicle[],
	config: Config,
	objective: "cost" | "vehicles",
	objectiveValue: number,
) {
	expect(comp.length).toBeGreaterThan(0);
	expect(comp[0].start).toBe(0);
	expect(comp[comp.length - 1].end).toBe(items.length - 1);

	let costSum = 0;
	const usageByClass = new Map<number, number>();

	comp.forEach((trip, i) => {
		// contiguity + unit count
		expect(trip.units).toBe(trip.end - trip.start + 1);
		if (i > 0) expect(trip.start).toBe(comp[i - 1].end + 1);

		const block = items.slice(trip.start, trip.end + 1);
		const v = vehicles[trip.vIdx];

		if (config.useWeight) {
			const w = block.reduce((s, x) => s + x.w, 0);
			expect(w).toBeLessThanOrEqual(v.W + 1e-9);
		}
		if (config.useLength) {
			const len =
				block.reduce((s, x) => s + x.l, 0) + (trip.units - 1) * v.gap;
			expect(len).toBeLessThanOrEqual(v.L + 1e-9);
		}

		usageByClass.set(trip.vIdx, (usageByClass.get(trip.vIdx) ?? 0) + 1);
		costSum += trip.c;
	});

	if (config.useFleet) {
		for (const [vIdx, used] of usageByClass) {
			expect(used).toBeLessThanOrEqual(vehicles[vIdx].fleet);
		}
	}

	if (objective === "vehicles") {
		expect(comp.length).toBe(objectiveValue);
	} else {
		expect(costSum).toBeCloseTo(objectiveValue, 6);
	}
}

// Run solve and assert success, returning the narrowed result.
function solveOk(items: Item[], vehicles: Vehicle[], objective: "cost" | "vehicles") {
	const result = solve(items, vehicles, objective);
	expect(result.status).toBe("success");
	if (result.status !== "success") throw new Error("unreachable");
	// every composition must be valid and share the optimal value
	for (const comp of result.compositions) {
		expectValidComposition(
			comp,
			items,
			vehicles,
			result.config,
			objective,
			result.objectiveValue,
		);
	}
	return result;
}

// --- analyzeProblem -------------------------------------------------------

describe("analyzeProblem", () => {
	it("rejects empty cargo or empty fleet", () => {
		expect(analyzeProblem([], [veh()]).valid).toBe(false);
		expect(analyzeProblem([item(10)], []).valid).toBe(false);
	});

	it("rejects negative values", () => {
		expect(analyzeProblem([item(-5)], [veh()]).valid).toBe(false);
		expect(analyzeProblem([item(10)], [veh({ W: -1 })]).valid).toBe(false);
	});

	it("requires every cargo to have a positive weight", () => {
		expect(analyzeProblem([item(10), item(0)], [veh()]).valid).toBe(false);
	});

	it("requires all-or-nothing lengths across cargo", () => {
		// one length given, another missing → invalid
		const mixed = analyzeProblem(
			[item(10, 2), item(10, 0)],
			[veh({ L: 5 })],
		);
		expect(mixed.valid).toBe(false);
	});

	it("requires at least one vehicle with positive weight capacity", () => {
		expect(analyzeProblem([item(10)], [veh({ W: 0 })]).valid).toBe(false);
	});

	it("activates constraints based on the data present", () => {
		const analysis = analyzeProblem(
			[item(10, 2), item(12, 3)],
			[veh({ W: 100, wmin: 50, L: 6, gap: 0.2, fleet: 3 })],
		);
		expect(analysis.valid).toBe(true);
		if (!analysis.valid) throw new Error("unreachable");
		expect(analysis.config).toEqual({
			useWeight: true,
			useLength: true,
			useMinCharge: true,
			useFleet: true,
		});
	});

	it("disables length, min-charge and fleet when their data is absent", () => {
		const analysis = analyzeProblem(
			[item(10), item(12)],
			[veh({ W: 100, wmin: 0, L: 0, gap: 0, fleet: 0 })],
		);
		expect(analysis.valid).toBe(true);
		if (!analysis.valid) throw new Error("unreachable");
		expect(analysis.config).toEqual({
			useWeight: true,
			useLength: false,
			useMinCharge: false,
			useFleet: false,
		});
	});
});

// --- solve: basics --------------------------------------------------------

describe("solve – basics", () => {
	it("returns invalid status (not a throw) for bad input", () => {
		const result = solve([], [veh()], "cost");
		expect(result.status).toBe("invalid");
		expect(result.compositions).toBeNull();
	});

	it("solves a single cargo with a single vehicle", () => {
		const items = [item(100)];
		const vehicles = [veh({ W: 200 })];
		const result = solveOk(items, vehicles, "cost");
		expect(result.compositions).toHaveLength(1);
		expect(result.objectiveValue).toBe(100);
		const [trip] = result.compositions[0];
		expect(trip).toMatchObject({ start: 0, end: 0, vIdx: 0, units: 1, c: 100 });
	});

	it("applies the minimum charge floor", () => {
		const result = solveOk([item(100)], [veh({ W: 200, wmin: 150 })], "cost");
		expect(result.objectiveValue).toBe(150);
		expect(result.compositions[0][0].c).toBe(150);
	});

	it("splits when a block exceeds weight capacity", () => {
		const result = solveOk(
			[item(100), item(100)],
			[veh({ W: 150, fleet: 5 })],
			"cost",
		);
		expect(result.compositions).toHaveLength(1);
		expect(result.compositions[0]).toHaveLength(2);
		expect(result.objectiveValue).toBe(200);
	});
});

// --- solve: edge cases ----------------------------------------------------

describe("solve – edge cases", () => {
	it("is infeasible when a cargo fits no vehicle", () => {
		const result = solve([item(1000)], [veh({ W: 100 })], "cost");
		expect(result.status).toBe("infeasible");
		expect(result.compositions).toBeNull();
		expect(result.objectiveValue).toBeNull();
	});

	it("is infeasible when the fleet is too small to cover the sequence", () => {
		// three singletons required (any pair is 100 > 60) but only 2 vehicles
		const result = solve(
			[item(50), item(50), item(50)],
			[veh({ W: 60, fleet: 2 })],
			"cost",
		);
		expect(result.status).toBe("infeasible");
	});

	it("prefers a single trip when the minimum charge penalizes splitting", () => {
		// pairing: max(100,80)=100; splitting: 80+80=160
		const result = solveOk(
			[item(50), item(50)],
			[veh({ W: 100, wmin: 80, fleet: 5 })],
			"cost",
		);
		expect(result.compositions).toHaveLength(1);
		expect(result.compositions[0]).toHaveLength(1);
		expect(result.objectiveValue).toBe(100);
	});

	it("counts inter-unit spacing toward the length limit", () => {
		// two 2m units in a 4.2m vehicle: 4.0 fits, but +0.3 gap → 4.3 does not
		const items = [item(10, 2), item(10, 2)];
		const withGap = solveOk(items, [veh({ L: 4.2, gap: 0.3, fleet: 5 })], "cost");
		expect(withGap.compositions[0]).toHaveLength(2); // forced to split

		const noGap = solveOk(items, [veh({ L: 4.2, gap: 0, fleet: 5 })], "cost");
		// without the gap the pair fits, so a single trip is among the optima
		expect(
			noGap.compositions.some((comp) => comp.length === 1),
		).toBe(true);
	});

	it("treats fleet=0 across all classes as unconstrained, not zero capacity", () => {
		// useFleet only activates when some fleet value is positive
		const result = solveOk([item(50), item(50)], [veh({ W: 60, fleet: 0 })], "cost");
		expect(result.config.useFleet).toBe(false);
		expect(result.status).toBe("success");
	});
});

// --- solve: all optima ----------------------------------------------------

describe("solve – all optimal compositions", () => {
	it("enumerates every minimum-cost partition (cost is partition-invariant here)", () => {
		// 3×50 in a W=100 vehicle, no min charge: total cost is always 150, so
		// every feasible partition (sizes ≤2) is optimal: [0][1][2], [01][2], [0][12]
		const result = solveOk(
			[item(50), item(50), item(50)],
			[veh({ W: 100, fleet: 5 })],
			"cost",
		);
		expect(result.objectiveValue).toBe(150);
		expect(result.compositions).toHaveLength(3);
	});

	it("enumerates every minimum-trip partition", () => {
		// minimum is 2 trips, reachable as [01][2] or [0][12]
		const result = solveOk(
			[item(50), item(50), item(50)],
			[veh({ W: 100, fleet: 5 })],
			"vehicles",
		);
		expect(result.objectiveValue).toBe(2);
		expect(result.compositions).toHaveLength(2);
	});

	it("enumerates ties across vehicle classes", () => {
		// 3 forced singletons, classes A and B each capped at 2: every assignment
		// with ≤2 of each class is optimal → C(3,2)+C(3,1) = 6 compositions
		const result = solveOk(
			[item(50), item(50), item(50)],
			[veh({ W: 60, fleet: 2 }), veh({ W: 60, fleet: 2 })],
			"cost",
		);
		expect(result.objectiveValue).toBe(150);
		expect(result.compositions).toHaveLength(6);
	});
});

// --- solve: larger fixture ------------------------------------------------

describe("solve – larger fixture", () => {
	it("optimally pairs a 12-cargo sequence under a unique optimum", () => {
		// 12 identical units, capacity 2 per trip, min charge flat at 100. Cost is
		// 100 per trip, so the optimum is the fewest trips (6) — uniquely achieved
		// by the perfect contiguous pairing.
		const items = Array.from({ length: 12 }, () => item(50));
		const vehicles = [veh({ W: 100, wmin: 100, fleet: 20 })];

		const cost = solveOk(items, vehicles, "cost");
		expect(cost.objectiveValue).toBe(600);
		expect(cost.compositions).toHaveLength(1);
		expect(cost.compositions[0]).toHaveLength(6);
		for (const trip of cost.compositions[0]) {
			expect(trip.units).toBe(2);
			expect(trip.c).toBe(100);
		}

		const trips = solveOk(items, vehicles, "vehicles");
		expect(trips.objectiveValue).toBe(6);
		expect(trips.compositions).toHaveLength(1);
	});

	it("solves a heterogeneous instance with weight and length active", () => {
		const weights = [9000, 11000, 8000, 12000, 10000, 9500, 13000, 7000, 11500, 10500];
		const lengths = [1.5, 1.8, 1.4, 2.2, 1.6, 1.5, 2.0, 1.3, 1.7, 1.9];
		const items = weights.map((w, i) => item(w, lengths[i]));
		const vehicles = [
			veh({ name: "A", W: 15000, wmin: 10000, L: 5, gap: 0.2, fleet: 20 }),
			veh({ name: "B", W: 35000, wmin: 25000, L: 14, gap: 0.5, fleet: 5 }),
		];

		const result = solveOk(items, vehicles, "cost");
		expect(result.config.useWeight).toBe(true);
		expect(result.config.useLength).toBe(true);
		expect(result.objectiveValue).toBeGreaterThan(0);
		// solveOk already validated every returned composition
		expect(result.compositions.length).toBeGreaterThan(0);
	});
});
