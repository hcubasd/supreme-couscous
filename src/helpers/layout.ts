import { colorBg, squeezeFg } from "psychic-potato";

const ROOT_ID = "app-root";
const COLOR = { from: 0.75, to: 1 };

function getRoot(): HTMLDivElement {
	const el = document.getElementById(ROOT_ID);
	if (!el) throw new Error("No app-root element found");
	return el as HTMLDivElement;
}

// Recolor the bg layers by nesting depth. Only needed when the bg tree
// structure changes (e.g. rows added or removed) — colors don't depend on size.
export function recolor(el: HTMLDivElement = getRoot()): void {
	colorBg(el, COLOR);
}

// Refit the global font size to the layout: squeeze the foreground so every fg
// (titles, column headers, controls) fits, and expose the result as --font-size
// for the cells to inherit. The only measurement left — rows take their natural
// height and the controls carry a fixed margin, so nothing else is measured.
export function refit(el: HTMLDivElement = getRoot()): void {
	document.documentElement.style.setProperty(
		"--font-size",
		`${squeezeFg(el, 0.95)}px`,
	);
}
