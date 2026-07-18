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
// text centers vertically across however tall the row is. `fgStyle` reaches the
// inner fg node directly (`style` only reaches the outer bg) — used by
// PanelHeader to match the paddingBlock on PanelMenu's HeaderCells, so the
// title row and the menu row below it are the same height.
export function Label({
	children,
	style,
	fgStyle,
}: {
	children: ReactNode;
	style?: CSSProperties;
	fgStyle?: CSSProperties;
}) {
	return (
		<div
			className="bg"
			style={{ justifyContent: "center", alignItems: "center", ...style }}
		>
			<div className="fg" style={{ whiteSpace: "nowrap", ...fgStyle }}>
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

// A single flex:1 slot for one PanelMenu action word. The text is a .cell,
// not a .fg, and deliberately not part of squeezeFg: PanelMenu mounts and
// unmounts its whole row on the menu toggle, and squeezeFg only ever runs at
// UI mount and on resize, never on that toggle. A .fg that mounted fresh
// after a toggle would carry no imperative font-size (squeezeFg sets that
// directly on the DOM node, which React doesn't preserve across an
// unmount/remount) and would fall back to its unsqueezed CSS default.
// Reading --font-size live, like every other .cell, sidesteps that entirely.
// paddingBlock matches the title row's own height so the menu doesn't jump
// the layout when it appears; the bg wrapper crops instead of pushing the
// layout, same reasoning as Cell.
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

// A clickable colored word in a PanelMenu (Import, Export, Clear, ...). A
// HeaderCell with a click handler and color layered on; `flex` defaults to 1
// (equal share).
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

// A row-level bg grouping every action word in a PanelMenu (e.g.
// Import+Export+Clear). One depth level below the row itself, matching the
// depth a table's own column-header row puts its TableLabels at — so colorBg
// shades the button group the same as the column headers below it, instead of
// the shallower, mismatched depth a bare row of actions would sit at. `flex`
// (default 1) sets the group's own share of the row; the actions inside it
// stay 1:1 with each other regardless — no gap/align override — plain .bg
// defaults (1px gap, stretch) apply, same as every other bg.
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

// A panel's header row: always just the title, as a plain Label (.fg) —
// unlike the menu, this row never mounts or unmounts, so it participates in
// squeezeFg normally like any other static chrome. The paddingBlock matches
// PanelMenu's HeaderCells so the title and the menu are the same height.
// `position: relative` here (not on a wrapper of its own) establishes the
// anchor its PanelMenu child overlays against — see PanelMenu.
export function PanelHeader({
	title,
	children,
}: {
	title: ReactNode;
	children?: ReactNode;
}) {
	return (
		<div style={{ position: "relative", minWidth: 0 }}>
			<div className="bg">
				<Label style={{ flex: 1, minWidth: 0 }} fgStyle={{ paddingBlock: "1em" }}>
					{title}
				</Label>
			</div>
			{children}
		</div>
	);
}

// A panel's toggleable action row (Import/Export/Clear, or
// Calculate/Export/Clear), passed as a child of its PanelHeader. Always
// mounted — `visible` only drives a transform/opacity transition, not
// presence in the DOM — for two reasons: it lets the drop actually animate
// (an unmounted element can't transition), and it keeps the bg tree's shape,
// and therefore colorBg's depth-based grays, stable across the toggle instead
// of needing a recolor pass timed to match a delayed unmount. Tucked to
// translateY(-100%) (flush behind the header) and invisible/unclickable when
// closed, dropped to translateY(0) — 1px below the header, matching the .bg
// gap between ordinary flow siblings — when open. Positioned absolutely
// against its PanelHeader's `position: relative` anchor, so open or closed it
// overlays the rest of the panel rather than pushing it down. Its contents
// stay HeaderCells (.cell, reading --font-size live) rather than Labels
// (.fg): squeezeFg only measures on mount/resize, and while that's no longer
// strictly required now that this is always mounted, there's no reason for
// its buttons to enter the squeeze fit either.
export function PanelMenu({
	children,
	visible,
}: {
	children: ReactNode;
	visible: boolean;
}) {
	return (
		<div
			className="bg"
			style={{
				position: "absolute",
				top: "calc(100% + 1px)",
				left: 0,
				right: 0,
				zIndex: 10,
				transform: visible ? "translateY(0)" : "translateY(-100%)",
				opacity: visible ? 1 : 0,
				pointerEvents: visible ? "auto" : "none",
				transition: "transform 200ms ease, opacity 200ms ease",
			}}
		>
			<ActionGroup>{children}</ActionGroup>
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
