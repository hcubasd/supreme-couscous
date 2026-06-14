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

// Refit the global font size to the layout, then re-center the controls panel
// against the results h3. Needed on resize and on any structural change.
export function refit(el: HTMLDivElement = getRoot()): void {
	document.documentElement.style.setProperty(
		"--font-size",
		`${squeezeFg(el, .8)}px`,
	);

	// Param rows are input-driven and taller than plain text. Measure a real one
	// (there's always at least the trailing empty row) and expose its height so
	// the text-driven output rows can match it exactly.
	const paramRow = el.querySelector<HTMLElement>("[data-param-row]");
	if (paramRow) {
		document.documentElement.style.setProperty(
			"--row-height",
			`${paramRow.getBoundingClientRect().height}px`,
		);
	}

	const h3 = document.querySelector("h3");
	const controls = document.getElementById("controls");
	if (!h3 || !controls) return;

	const h3Margin = parseFloat(getComputedStyle(h3).marginBlockStart);
	const h3Height = parseFloat(getComputedStyle(h3).height);
	const controlsHeight = parseFloat(getComputedStyle(controls).height);
	const margin = Math.max(0, h3Margin + h3Height / 2 - controlsHeight / 2);

	document.documentElement.style.setProperty(
		"--controls-margin",
		`${margin}px`,
	);
}
