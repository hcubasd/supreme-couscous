// Shared formatting and parsing for the pt-BR UI. Pure — no React, no DOM.

export type Rgb = { r: number; g: number; b: number };

export const toRgb = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`;

export const fmt = (n: number): string => n.toLocaleString("pt-BR");

export const fmtLen = (n: number): string =>
	n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export const fmtBRL = (n: number): string =>
	n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Accept the Brazilian decimal comma as well as a dot. The NumberCell filter
// guarantees at most one separator, so a plain comma→dot swap is enough.
export const parseNumber = (value: string): number =>
	parseFloat(value.replace(/,/g, ".")) || 0;
