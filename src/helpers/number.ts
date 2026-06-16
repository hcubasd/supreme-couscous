// The single home for number ↔ string conversion. Display follows the active
// locale; parsing is locale-agnostic; CSV cells convert in (from the file's
// decimal char) and out (to the active locale's). No other module formats or
// parses numbers — csv.ts handles only structure, the optimizer only numbers.

import { DECIMAL, LOCALE } from "./locale";

// string → number. Accepts either decimal separator (the input filter guarantees
// at most one), so it never depends on which locale produced the value.
export const parseNumber = (value: string): number =>
	parseFloat(value.replace(/,/g, ".")) || 0;

// number → display string, in the active locale.
export const fmt = (n: number): string => n.toLocaleString(LOCALE);

export const fmtLen = (n: number): string =>
	n.toLocaleString(LOCALE, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

// Monetary values are shown as plain locale numbers (two decimals, no currency
// symbol) — the column labels carry the meaning, keeping display locale-neutral.
export const fmtMoney = (n: number): string =>
	n.toLocaleString(LOCALE, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

// A numeric string shown with the active locale's decimal char (≤ one separator,
// guaranteed by the input filter); names/blanks pass through. Used for seed data.
export function localizeDecimal(value: string): string {
	if (value === "" || !/^\d*[.,]?\d*$/.test(value)) return value;
	return value.replace(/[.,]/, DECIMAL);
}

// A raw CSV cell, read with the file's decimal char, into an active-locale input
// string: drop the file's thousands group, then set the active decimal char.
// Names/blanks pass through.
export function csvCellToInput(cell: string, fileDecimal: string): string {
	if (!/^[\d.,]+$/.test(cell)) return cell;
	const grouping = fileDecimal === "," ? "." : ",";
	return cell.split(grouping).join("").replace(fileDecimal, DECIMAL);
}

// An input string → a CSV cell in the active locale: parse (locale-agnostic) and
// emit the active decimal char, no thousands group. Names/blanks pass through.
export function csvNumber(value: string): string {
	if (value.trim() === "" || !/^\d*[.,]?\d*$/.test(value)) return value;
	return String(parseFloat(value.replace(/,/g, "."))).replace(".", DECIMAL);
}

// A number → a CSV cell in the active locale, rounded to drop the float dust that
// gap sums accumulate.
export const numberToCsv = (n: number): string =>
	String(Math.round(n * 1000) / 1000).replace(".", DECIMAL);
