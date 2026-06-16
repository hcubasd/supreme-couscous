// Color formatting (kept apart from number formatting — different concern).

export type Rgb = { r: number; g: number; b: number };

export const toRgb = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`;
