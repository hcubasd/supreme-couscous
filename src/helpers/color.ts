// Color formatting and palette generation (kept apart from number formatting).

import { matchColors } from "miniature-waffle";

export type Rgb = { r: number; g: number; b: number };

export const toRgb = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`;

// matchColors caps a palette at 256 colors and returns that many rotations of it.
const MAX = 256;

// `n` evenly-spread colors at lightness L, taking the given rotation. matchColors
// throws past 256, so for n > 256 we cycle the 256-color spread — color 257
// repeats color 1, and so on. (256 perceptually distinct colors is already plenty;
// this just keeps it from throwing.)
export function palette(n: number, L: number, variation: number): Rgb[] {
	if (n < 1) return [];
	const size = Math.min(n, MAX);
	const base = matchColors(size, L)[variation % MAX];
	return Array.from({ length: n }, (_, i) => base[i % size]);
}

// A random rotation index, picked once per mount so the vehicle and cargo palettes
// start at different hues and their first colors don't coincide.
export const randomVariation = (): number => Math.floor(Math.random() * MAX);

// ANSI hues projected onto a uniform lightness (L=75) via matchColors, so the
// button fills are a harmonious, equal-lightness set. Order is fixed below.
const ansi = matchColors(
	[
		{ r: 0, g: 255, b: 0 }, // green
		{ r: 255, g: 0, b: 0 }, // red
		{ r: 255, g: 255, b: 0 }, // yellow
		{ r: 0, g: 255, b: 255 }, // cyan
		{ r: 255, g: 0, b: 255 }, // magenta
	],
	75,
);
export const ANSI = {
	green: toRgb(ansi[0]), // Import
	red: toRgb(ansi[1]), // Clear
	yellow: toRgb(ansi[2]), // Export
	cyan: toRgb(ansi[3]), // Minimize cost
	magenta: toRgb(ansi[4]), // Minimize vehicles
};
