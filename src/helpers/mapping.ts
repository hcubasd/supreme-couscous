// Map editable rows (raw strings) into the optimizer's domain types. A row counts
// only if at least one cell is non-blank, so the trailing empty "new row" and any
// stray blanks are skipped.

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

// Column order mirrors DUMMY_VEHICLES / the Veículos table headers.
export function toVehicles(rows: Row[]): Vehicle[] {
	return rows.filter(isFilled).map((row, i) => ({
		name: row.values[0] || `Classe ${i + 1}`,
		fleet: Math.trunc(parseNumber(row.values[1])),
		W: parseNumber(row.values[2]),
		carretas: Math.trunc(parseNumber(row.values[3])),
		L: parseNumber(row.values[4]),
		gap: parseNumber(row.values[5]),
		wmin: parseNumber(row.values[6]),
		freight: parseNumber(row.values[7]),
		axles: Math.trunc(parseNumber(row.values[8])),
		toll: parseNumber(row.values[9]),
	}));
}
