import { useLayoutEffect } from "react";
import { fmt } from "../helpers/format";
import { recolor } from "../helpers/layout";
import type { SolveResult, Vehicle } from "../helpers/optimizer";
import { Assignment } from "./Assignment";
import { TableCell, TableLabel } from "./primitives";

// A solve plus the context needed to render it: the vehicle classes (for names)
// and their palette colors, captured at solve time so later param edits don't
// recolor a stale result.
export type Solved = {
	result: SolveResult;
	vehicles: Vehicle[];
	colors: string[];
};

// Split to mirror an AssignedVehicle's nesting: identity (Ordem, Classe), then the
// flex:5 per-carreta group, then the rig-level costs (Peso cobrado, Custo). Same
// nesting depth ⇒ the 1px gaps line up with the body rows.
const LEFT_HEADERS = ["Ordem", "Classe"];
const CARRETA_HEADERS = [
	"Carreta",
	"Quantidade de cargas",
	"Cargas selecionadas",
	"Peso utilizado (kg)",
	"Comprimento utilizado (m)",
];
const RIGHT_HEADERS = ["Peso cobrado (kg)", "Custo (R$)"];

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
				<TableLabel>
					<h4>Composição</h4>
				</TableLabel>
				<div className="bg" style={{ flex: 9, minWidth: 0 }}>
					{LEFT_HEADERS.map((header) => (
						<TableLabel key={header}>
							<h4>{header}</h4>
						</TableLabel>
					))}
					<div className="bg" style={{ flex: 5, minWidth: 0 }}>
						{CARRETA_HEADERS.map((header) => (
							<TableLabel key={header}>
								<h4>{header}</h4>
							</TableLabel>
						))}
					</div>
					{RIGHT_HEADERS.map((header) => (
						<TableLabel key={header}>
							<h4>{header}</h4>
						</TableLabel>
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
				? result.message
				: "Nenhuma composição encontrada";
		return (
			<div
				className="bg"
				style={{ flexShrink: 0, minHeight: "var(--row-height, 0px)" }}
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
				/>
			))}
			{result.compositionCount > result.compositions.length && (
				<div
					className="bg"
					style={{ flexShrink: 0, minHeight: "var(--row-height, 0px)" }}
				>
					<TableCell>
						Mostrando {result.compositions.length} de{" "}
						{fmt(result.compositionCount)} composições ótimas
					</TableCell>
				</div>
			)}
		</>
	);
}
