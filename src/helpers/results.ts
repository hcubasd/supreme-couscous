// Serialize a solve's compositions to CSV — the flattened form of the on-screen
// results table. One row per carreta; the identity columns (Composição, Ordem,
// Classe) repeat down a trip's trailers for readability, while the rig-level
// amounts (Frete, Pedágio, Custo) sit on the trip's first carreta only so a column
// sum isn't double-counted. Each composition is closed by a Total row.

import { toCsv } from "./csv";
import { CSV_DELIMITER, t } from "./locale";
import { numberToCsv as num } from "./number";
import type { SolveResult, Vehicle } from "./optimizer";

const RESULTS_HEADER = [
	t.composition,
	t.order,
	t.klass,
	t.trailer,
	t.quantity,
	t.cargos,
	t.weightKg,
	t.dimensionM,
	t.freightCost,
	t.tollCost,
	t.cost,
];

export function buildResultsCsv(
	result: SolveResult,
	vehicles: Vehicle[],
): string {
	if (result.status !== "success") {
		return toCsv(RESULTS_HEADER, [], CSV_DELIMITER);
	}

	const rows: string[][] = [];
	result.compositions.forEach((composition, ci) => {
		let units = 0;
		let weight = 0;
		let length = 0;
		let freight = 0;
		let toll = 0;
		let cost = 0;
		composition.forEach((trip, ti) => {
			freight += trip.freight;
			toll += trip.toll;
			cost += trip.r;
			(trip.beds ?? []).forEach((trailer, bi) => {
				units += trailer.cargos.length;
				weight += trailer.w;
				length += trailer.l;
				rows.push([
					String(ci + 1),
					String(ti + 1),
					vehicles[trip.vIdx].name,
					String(bi + 1),
					String(trailer.cargos.length),
					trailer.cargos.map((i) => i + 1).join(", "),
					num(trailer.w),
					num(trailer.l),
					bi === 0 ? num(trip.freight) : "",
					bi === 0 ? num(trip.toll) : "",
					bi === 0 ? num(trip.r) : "",
				]);
			});
		});
		rows.push([
			"",
			"",
			"",
			"",
			String(units),
			"",
			num(weight),
			num(length),
			num(freight),
			num(toll),
			num(cost),
		]);
	});

	return toCsv(RESULTS_HEADER, rows, CSV_DELIMITER);
}
