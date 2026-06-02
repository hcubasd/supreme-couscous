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
	W: number; // weight capacity
	wmin: number; // minimum charged weight
	L: number; // usable length
	gap: number; // spacing between cargos
};

export type Objective = "cost" | "vehicles";

export type Config = {
	useWeight: boolean;
	useLength: boolean;
	useMinCharge: boolean;
	useFleet: boolean;
};

export type Analysis =
	| { valid: false; message: string }
	| { valid: true; message: string; config: Config };

// One trip in a reconstructed solution.
export type Trip = {
	start: number; // first cargo index (inclusive)
	end: number; // last cargo index (inclusive)
	vIdx: number; // vehicle class index
	units: number; // cargos loaded (end - start + 1)
	w: number; // real weight carried
	l: number; // occupied length
	c: number; // charged weight
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
			// Every partition that achieves the optimal objective value. One entry
			// when the optimum is unique, several when there are ties.
			compositions: Trip[][];
			objectiveValue: number;
			statesExplored: number;
			config: Config;
	  };

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
	const vehicleFleet = vehicles.map((vehicle) => vehicle.fleet);

	if (
		hasNegative(itemWeights) ||
		hasNegative(itemLengths) ||
		hasNegative(vehicleWeights) ||
		hasNegative(vehicleMinCharges) ||
		hasNegative(vehicleLengths) ||
		hasNegative(vehicleGaps) ||
		hasNegative(vehicleFleet)
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

	return {
		valid: true,
		message: "pronto para calcular",
		config: {
			useWeight: true,
			useLength: itemLengthAll && vehicleLengthAny,
			useMinCharge: hasAnyPositive(vehicleMinCharges),
			useFleet: hasAnyPositive(vehicleFleet),
		},
	};
}

type TripCandidate = {
	end: number;
	vehicleIdx: number;
	totalW: number;
	totalL: number;
	totalUnits: number;
	charged: number;
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
				const lengthOk = !config.useLength || occupiedLength <= vehicle.L;
				const charged = config.useMinCharge
					? Math.max(config.useWeight ? sumW : 0, vehicle.wmin)
					: config.useWeight
						? sumW
						: 0;

				if (weightOk && lengthOk) {
					tripsFrom[start].push({
						end,
						vehicleIdx,
						totalW: config.useWeight ? sumW : 0,
						totalL: occupiedLength,
						totalUnits: nItems,
						charged,
					});
				}
			});
		}
	}

	return tripsFrom;
}

// An incoming edge into a DP state: the trip taken plus the state it came from.
type Edge = Trip & { prev: string };

// Shortest-path DP over states `position | fleet-usage`. Each edge consumes a
// feasible trip; cost is the charged weight (objective "cost") or 1 (objective
// "vehicles"). Every predecessor edge achieving a state's best cost is kept, so
// all optimal partitions can be reconstructed — not just one.
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
	const best = new Map<string, number>();
	const parents = new Map<string, Edge[]>();
	const statesByPos: string[][] = Array.from(
		{ length: items.length + 1 },
		() => [],
	);
	const startKey = `0|${Array(vehicles.length).fill(0).join(",")}`;

	best.set(startKey, 0);
	parents.set(startKey, []);
	statesByPos[0].push(startKey);

	for (let position = 0; position < items.length; position++) {
		for (const currentKey of statesByPos[position]) {
			const currentCost = best.get(currentKey) ?? 0;
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
				const increment = objective === "vehicles" ? 1 : trip.charged;
				const candidate = currentCost + increment;
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
				};

				if (existing === undefined || candidate < existing) {
					if (existing === undefined) {
						statesByPos[trip.end + 1].push(nextKey);
					}
					best.set(nextKey, candidate);
					parents.set(nextKey, [edge]);
				} else if (candidate === existing) {
					parents.get(nextKey)?.push(edge);
				}
			}
		}
	}

	const finalStates = statesByPos[items.length];
	let bestObjectiveValue = Infinity;
	for (const key of finalStates) {
		const value = best.get(key) ?? Infinity;
		if (value < bestObjectiveValue) bestObjectiveValue = value;
	}

	if (!Number.isFinite(bestObjectiveValue)) {
		return {
			status: "infeasible",
			message: "Nenhuma solução viável para a configuração informada.",
			compositions: null,
			objectiveValue: null,
			statesExplored: best.size,
		};
	}

	// Enumerate every path from an optimal end-state back to the start. The
	// start state is the only one with no incoming edges (the recursion base).
	const compositions: Trip[][] = [];
	const walk = (key: string, acc: Trip[]): void => {
		const edges = parents.get(key);
		if (!edges || edges.length === 0) {
			compositions.push([...acc].reverse());
			return;
		}
		for (const { prev, ...trip } of edges) {
			acc.push(trip);
			walk(prev, acc);
			acc.pop();
		}
	};

	for (const key of finalStates) {
		if ((best.get(key) ?? Infinity) === bestObjectiveValue) {
			walk(key, []);
		}
	}

	return {
		status: "success",
		message: "pronto",
		compositions,
		objectiveValue: bestObjectiveValue,
		statesExplored: best.size,
		config,
	};
}
