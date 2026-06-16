import { useLayoutEffect } from "react";
import { toCsv } from "../helpers/csv";
import {
	classesToRows,
	type FleetController,
	rowsToClasses,
} from "../helpers/fleet";
import { type Rgb, toRgb } from "../helpers/color";
import { recolor } from "../helpers/layout";
import { CSV_DELIMITER, t } from "../helpers/locale";
import { csvCellToInput, csvNumber } from "../helpers/number";
import { ClearButton } from "./ClearButton";
import { ControlBar } from "./ControlBar";
import { ExportButton } from "./ExportButton";
import { ImportButton } from "./ImportButton";
import { Label, TableLabel } from "./primitives";
import { Vehicle } from "./Vehicle";

const CLASS_HEADERS = [
	t.klass,
	t.availableQty,
	t.maxWeightKg,
	t.minCharge,
	t.freightPerKg,
	t.axles,
	t.tollPerAxle,
];
const TRAILER_HEADERS = [
	t.trailer,
	t.trailerCapacityKg,
	t.trailerLengthM,
	t.spacingM,
];

// The vehicle (fleet) parameter table: heading + the 11 column labels + one
// editable class block per vehicle class. The trailer columns (Carreta + three
// physical fields) are grouped under each class's tall per-class cells.
export function Vehicles({
	fleet,
	palette,
}: {
	fleet: FleetController;
	palette: Rgb[];
}) {
	const { classes, setClassCell, setTrailerCell } = fleet;

	// Recolor when the structure changes (a class or trailer added/removed) so
	// freshly mounted bg divs get their color. Key on the class/trailer identities,
	// not cell values, so this doesn't fire on every keystroke. No squeeze here —
	// that runs only on mount and resize.
	const structureKey = classes
		.map((c) => `${c.id}:${c.trailers.map((t) => t.id).join("-")}`)
		.join(",");
	useLayoutEffect(() => {
		recolor();
	}, [structureKey]);

	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h3>{t.vehicles}</h3>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<ControlBar>
						<ImportButton
							columns={CLASS_HEADERS.length + TRAILER_HEADERS.length}
							onRows={(rows, decimal) =>
								fleet.replace(
									rowsToClasses(
										rows.map((row) => row.map((c) => csvCellToInput(c, decimal))),
									),
								)
							}
						/>
						<ExportButton
							filename={t.vehiclesFile}
							build={() =>
								toCsv(
									[...CLASS_HEADERS, ...TRAILER_HEADERS],
									classesToRows(classes).map((row) => row.map(csvNumber)),
									CSV_DELIMITER,
								)
							}
						/>
						<ClearButton onClear={fleet.clear} />
			</ControlBar>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				{/* Mirror each Vehicle block's nesting (7 class cells + a flex:4 trailer
				    group) so the 1px gaps line up at the same nesting depth. */}
				<div className="bg">
					{CLASS_HEADERS.map((header) => (
						<TableLabel key={header}>
							<b>{header}</b>
						</TableLabel>
					))}
					<div className="bg" style={{ flex: 4, minWidth: 0 }}>
						{TRAILER_HEADERS.map((header) => (
							<TableLabel key={header}>
								<b>{header}</b>
							</TableLabel>
						))}
					</div>
				</div>
				<div
					className="bg"
					style={{ flex: 1, flexDirection: "column", overflowY: "auto" }}
				>
					{classes.map((klass, i) => (
						<Vehicle
							key={klass.id}
							klass={klass}
							color={toRgb(palette[i])}
							onClassCell={(field, value) => setClassCell(klass.id, field, value)}
							onTrailerCell={(trailerId, field, value) =>
								setTrailerCell(klass.id, trailerId, field, value)
							}
						/>
					))}
				</div>
			</div>
			</div>
		</div>
	);
}
