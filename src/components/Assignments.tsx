import { useLayoutEffect } from "react";
import { fmt } from "../helpers/number";
import { recolor } from "../helpers/layout";
import { t } from "../helpers/locale";
import type { SolveResult, Vehicle } from "../helpers/optimizer";
import { Assignment } from "./Assignment";
import { TableCell, TableLabel } from "./primitives";

// A solve plus the context needed to render it: the vehicle classes (for names)
// and their palette colors, captured at solve time so later param edits don't
// recolor a stale result.
export type Solved = {
	result: SolveResult;
	vehicles: Vehicle[];
	colors: string[]; // per vehicle class
	cargoColors: string[]; // per cargo id
};

// Split to mirror an AssignedVehicle's nesting: identity (Ordem, Classe), then the
// flex:5 per-carreta group, then the rig-level costs (Peso cobrado, Custo). Same
// nesting depth ⇒ the 1px gaps line up with the body rows.
const LEFT_HEADERS = [t.order, t.klass];
const CARRETA_HEADERS = [
	t.trailer,
	t.quantity,
	t.cargos,
	t.weightKg,
	t.dimensionM,
];
const RIGHT_HEADERS = [t.freightCost, t.tollCost, t.cost];

// The results table: a single column header over a scrolling list of Assignments
// (one per optimal composition in the sample).
export function Assignments({ solved }: { solved: Solved | null }) {
	// New rows/results are freshly mounted bg divs that need coloring; recolor on
	// every solve. We do NOT squeeze here — squeezeFg runs only on mount and
	// resize, and the headers (which it fits) are always present.
	useLayoutEffect(() => {
		recolor();
	}, [solved]);

	// Headers are always on screen — part of the static chrome squeezed on mount,
	// not gated on having a result.
	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<div className="bg">
				<TableLabel>{t.composition}</TableLabel>
				<div className="bg" style={{ flex: 10, minWidth: 0 }}>
					{LEFT_HEADERS.map((header) => (
						<TableLabel key={header}>{header}</TableLabel>
					))}
					<div className="bg" style={{ flex: 5, minWidth: 0 }}>
						{CARRETA_HEADERS.map((header) => (
							<TableLabel key={header}>{header}</TableLabel>
						))}
					</div>
					{RIGHT_HEADERS.map((header) => (
						<TableLabel key={header}>{header}</TableLabel>
					))}
				</div>
			</div>
			<div
				className="bg"
				style={{ flex: 1, flexDirection: "column", overflowY: "auto" }}
			>
				<AssignmentsBody solved={solved} />
			</div>
		</div>
	);
}

function AssignmentsBody({ solved }: { solved: Solved | null }) {
	if (!solved) return null;

	const { result, vehicles, colors } = solved;

	if (result.status !== "success") {
		// Invalid input gets the specific guidance message (it's actionable); a
		// valid-but-unsolvable problem just reports that nothing was found.
		const message =
			result.status === "invalid"
				? t.errors[result.messageKey]
				: t.noComposition;
		return (
			<div
				className="bg"
				style={{ flexShrink: 0 }}
			>
				<TableCell>{message}</TableCell>
			</div>
		);
	}

	return (
		<>
			{result.compositions.map((composition, ci) => (
				<Assignment
					// biome-ignore lint/suspicious/noArrayIndexKey: compositions are positional and stable for a given solve
					key={ci}
					composition={composition}
					index={ci}
					vehicles={vehicles}
					colors={colors}
					cargoColors={solved.cargoColors}
				/>
			))}
			{result.compositionCount > result.compositions.length && (
				<div
					className="bg"
					style={{ flexShrink: 0 }}
				>
					<TableCell>
						{t.showingOptima(
							String(result.compositions.length),
							fmt(result.compositionCount),
						)}
					</TableCell>
				</div>
			)}
		</>
	);
}
