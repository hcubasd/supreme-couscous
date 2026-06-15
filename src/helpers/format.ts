// Shared formatting and parsing. Display follows the active locale; parsing is
// locale-agnostic (a single separator, '.' or ',', is read as the decimal), so the
// optimizer never depends on which locale produced a value.

import { LOCALE } from "./locale";

export type Rgb = { r: number; g: number; b: number };

export const toRgb = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`;

export const fmt = (n: number): string => n.toLocaleString(LOCALE);

export const fmtLen = (n: number): string =>
	n.toLocaleString(LOCALE, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

// Monetary values are shown as plain locale numbers (two decimals, no currency
// symbol): the column labels ("Custo", "… por kg/eixo") carry the meaning, which
// keeps the display locale-neutral.
export const fmtMoney = (n: number): string =>
	n.toLocaleString(LOCALE, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

// Accept either decimal separator; the NumberCell filter guarantees at most one,
// so a plain comma→dot swap before parseFloat resolves both locales.
export const parseNumber = (value: string): number =>
	parseFloat(value.replace(/,/g, ".")) || 0;
