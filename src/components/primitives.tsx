// Small presentational building blocks shared across the tables. They encode the
// bg/fg contract: background layers carry color/layout, foreground carries text.
//
// Two flavors of text, by squeeze participation:
//   .fg   — static chrome (titles, column headers, controls). squeezeFg measures
//           these and fits the global font so they all show. Use Label/TableLabel.
//   .cell — dynamic values (inputs aside). They inherit the squeezed --font-size
//           and crop (overflow hidden) rather than driving the fit. Use Cell/
//           TableCell. squeezeFg's collectPairs ignores them (they aren't .fg).

import { matchGrays } from "miniature-waffle";
import type { CSSProperties, ReactNode } from "react";

export const BOLD: CSSProperties = { fontWeight: "bold" };

// Muted gray for ghost rows (the trailing empty "new" row's auto number).
const [mutedGray] = matchGrays(1, 75);
export const MUTED = `rgb(${mutedGray.r}, ${mutedGray.g}, ${mutedGray.b})`;

// A centered chrome label: content sits in an fg so squeezeFg sizes it, nowrap
// keeps it on one line. Stretches to its parent's height (flex default), so the
// text centers vertically across however tall the row is.
export function Label({
	children,
	style,
}: {
	children: ReactNode;
	style?: CSSProperties;
}) {
	return (
		<div
			className="bg"
			style={{ justifyContent: "center", alignItems: "center", ...style }}
		>
			<div className="fg" style={{ whiteSpace: "nowrap" }}>
				{children}
			</div>
		</div>
	);
}

// A Label that flexes to share a row equally with its siblings — i.e. one table
// column header.
export function TableLabel({
	children,
	style,
}: {
	children: ReactNode;
	style?: CSSProperties;
}) {
	return <Label style={{ flex: 1, minWidth: 0, ...style }}>{children}</Label>;
}

// A single flex:1 slot for a PanelHeader — either the title or one action
// word. The text is a .cell, not a .fg, and deliberately not part of
// squeezeFg: PanelHeader swaps title and actions in and out of the DOM on the
// menu toggle, and squeezeFg only ever runs at UI mount and on resize, never
// on that toggle. A .fg that mounted fresh after a toggle would carry no
// imperative font-size (squeezeFg sets that directly on the DOM node, which
// React doesn't preserve across an unmount/remount) and would fall back to
// its unsqueezed CSS default. Reading --font-size live, like every other
// .cell, sidesteps that entirely. paddingBlock keeps every header — title or
// buttons — the same height regardless of which is currently showing; the bg
// wrapper crops instead of pushing the layout, same reasoning as Cell.
function HeaderCell({
	children,
	flex = 1,
	cellStyle,
	onClick,
}: {
	children: ReactNode;
	flex?: number;
	cellStyle?: CSSProperties;
	onClick?: () => void;
}) {
	return (
		<div
			className="bg"
			style={{
				flex,
				minWidth: 0,
				justifyContent: "center",
				alignItems: "center",
				overflow: "hidden",
				cursor: onClick ? "pointer" : undefined,
			}}
			onClick={onClick}
		>
			<div className="cell" style={{ paddingBlock: "1em", ...cellStyle }}>
				{children}
			</div>
		</div>
	);
}

// A clickable colored word in a panel header (Import, Export, Clear, ...). A
// HeaderCell with a click handler and color layered on; `flex` defaults to 1
// (equal share); a solo action sitting directly on a PanelHeader row overrides
// it to match that row's left/title/right ratio.
export function ActionLabel({
	children,
	onClick,
	color,
	disabled,
	flex = 1,
}: {
	children: ReactNode;
	onClick: () => void;
	color?: string;
	disabled?: boolean;
	flex?: number;
}) {
	return (
		<HeaderCell
			flex={flex}
			onClick={disabled ? undefined : onClick}
			cellStyle={{ userSelect: "none", color, opacity: disabled ? 0.4 : 1 }}
		>
			{children}
		</HeaderCell>
	);
}

// A row-level bg grouping 2+ header actions that share a side of a PanelHeader
// (e.g. Import + Export). One depth level below the row itself, matching the
// depth a table's own column-header row puts its TableLabels at — so colorBg
// shades a button group the same as the column headers below it, instead of
// the shallower, mismatched depth a bare row of actions would sit at. A solo
// action (nothing to group) skips this and sits directly on the row instead.
// `flex` (default 1) sets the group's own share of the row, matching the title
// and the opposite slot's ratio; the two actions inside it stay 1:1 with each
// other regardless — no gap/align override — plain .bg defaults (1px gap,
// stretch) apply, same as every other bg.
export function ActionGroup({
	children,
	flex = 1,
}: {
	children: ReactNode;
	flex?: number;
}) {
	return (
		<div className="bg" style={{ flex, minWidth: 0 }}>
			{children}
		</div>
	);
}

// A panel's header row: either the title, or every action word grouped
// together (an ActionGroup — Cargoes/Vehicles get Import+Export+Clear,
// Compositions gets Calculate+Export+Clear), never both — the menu toggle
// swaps one for the other rather than splitting the row between them. Plain
// .bg defaults, same as every other row: whichever side is showing is the
// row's only flex child, so its flex:1 naturally fills the full width with no
// extra style needed.
//
// `showActions` is the global menu-toggle state.
export function PanelHeader({
	title,
	actions,
	showActions,
}: {
	title: ReactNode;
	actions?: ReactNode;
	showActions: boolean;
}) {
	return (
		<div className="bg">
			{showActions ? actions : <HeaderCell>{title}</HeaderCell>}
		</div>
	);
}

// A centered data cell: inherits --font-size and crops (the bg wrapper hides
// overflow) so a long value clips instead of forcing the whole layout to shrink.
// Does not participate in squeezeFg. Stretches to its parent's height like Label.
export function Cell({
	children,
	style,
}: {
	children: ReactNode;
	style?: CSSProperties;
}) {
	return (
		<div
			className="bg"
			style={{
				justifyContent: "center",
				alignItems: "center",
				overflow: "hidden",
				...style,
			}}
		>
			<div className="cell">{children}</div>
		</div>
	);
}

// A Cell that flexes to share a row equally — i.e. one table column's value.
export function TableCell({
	children,
	style,
}: {
	children: ReactNode;
	style?: CSSProperties;
}) {
	return <Cell style={{ flex: 1, minWidth: 0, ...style }}>{children}</Cell>;
}

// A parameter (input) row. Rows hold their content height and overflow into the
// scroll container — they must not shrink vertically when space gets tight.
export function Parameter({ children }: { children: ReactNode }) {
	return (
		<div className="bg" style={{ alignItems: "center", flexShrink: 0 }}>
			{children}
		</div>
	);
}

// A numeric field. We use a text input (not type="number") so a decimal comma is
// always accepted regardless of device locale; the filter keeps the value to a
// single number with at most one separator, and parseNumber resolves it at read
// time.
export function NumberCell({
	value,
	onChange,
	required,
	style,
}: {
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
	style?: CSSProperties;
}) {
	return (
		<div
			className="bg"
			style={{ flex: 1, minWidth: 0, justifyContent: "center", alignItems: "center", ...style }}
		>
			<input
				type="text"
				inputMode="decimal"
				required={required}
				style={{ width: "100%" }}
				value={value}
				onChange={(e) => {
					const next = e.target.value;
					if (next === "" || /^\d*[.,]?\d*$/.test(next)) onChange(next);
				}}
			/>
		</div>
	);
}
