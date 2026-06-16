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
