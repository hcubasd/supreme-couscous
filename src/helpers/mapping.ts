// Map editable rows (raw strings) into the optimizer's domain types. A row counts
// only if at least one cell is non-blank, so trailing empty "new" rows and stray
// blanks are skipped.

import type { ClassRow } from "./fleet";
import { parseNumber } from "./format";
import type { Item, Vehicle } from "./optimizer";
import type { Row } from "./rows";

export function isFilled(row: Row): boolean {
	return row.values.some((value) => value.trim() !== "");
}

export function toItems(rows: Row[]): Item[] {
	return rows.filter(isFilled).map((row) => ({
		w: parseNumber(row.values[0]),
		l: parseNumber(row.values[1]),
	}));
}

const trailerFilled = (values: string[]): boolean =>
	values.some((v) => v.trim() !== "");
const classFilled = (c: ClassRow): boolean =>
	c.values.some((v) => v.trim() !== "") || c.trailers.some((t) => trailerFilled(t.values));

// Build the optimizer's vehicle classes from the nested fleet rows. Class field
// order: name, quantidade, pesoMáximo, custoMínimo, frete, eixos, pedágio; trailer
// fields: capacidade, comprimento, espaço. Empty trailers are dropped — a class
// left without a real trailer yields an empty carretas list, which analyzeProblem
// reports as an error.
export function toVehicles(classes: ClassRow[]): Vehicle[] {
	return classes.filter(classFilled).map((c, i) => ({
		name: c.values[0] || `Classe ${i + 1}`,
		fleet: Math.trunc(parseNumber(c.values[1])),
		pesoMax: parseNumber(c.values[2]),
		minCharge: parseNumber(c.values[3]),
		freight: parseNumber(c.values[4]),
		axles: Math.trunc(parseNumber(c.values[5])),
		toll: parseNumber(c.values[6]),
		carretas: c.trailers
			.filter((t) => trailerFilled(t.values))
			.map((t) => ({
				capacity: parseNumber(t.values[0]),
				length: parseNumber(t.values[1]),
				gap: parseNumber(t.values[2]),
			})),
	}));
}
