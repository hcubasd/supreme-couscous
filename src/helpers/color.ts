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
