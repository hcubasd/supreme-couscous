import { useLayoutEffect, useRef } from "react";
import { ANSI, type Rgb, toRgb } from "../helpers/color";
import { downloadCsv, importRows, toCsv } from "../helpers/csv";
import { classesToRows, type FleetController, rowsToClasses } from "../helpers/fleet";
import { recolor } from "../helpers/layout";
import { CSV_DELIMITER, t } from "../helpers/locale";
import { csvCellToInput, csvNumber } from "../helpers/number";
import { ActionLabel, PanelHeader, PanelMenu, TableLabel } from "./primitives";
import { Vehicle } from "./Vehicle";

const CLASS_HEADERS = [
	t.klass, t.availableQty, t.maxWeightKg,
	t.minCharge, t.freightPerKg, t.axles, t.tollPerAxle,
];
const TRAILER_HEADERS = [t.trailer, t.trailerCapacityKg, t.trailerDimensionM, t.spacingM];
const VEHICLE_COLS = CLASS_HEADERS.length + TRAILER_HEADERS.length;

export function Vehicles({
	fleet,
	palette,
	menusVisible,
}: {
	fleet: FleetController;
	palette: Rgb[];
	menusVisible: boolean;
}) {
	const { classes, setClassCell, setTrailerCell } = fleet;
	const fileInputRef = useRef<HTMLInputElement>(null);

	const structureKey = classes
		.map((c) => `${c.id}:${c.trailers.map((t) => t.id).join("-")}`)
		.join(",");
	useLayoutEffect(() => {
		recolor();
	}, [structureKey]);

	const handleExport = () => {
		downloadCsv(
			t.vehiclesFile,
			toCsv(
				[...CLASS_HEADERS, ...TRAILER_HEADERS],
				classesToRows(fleet.classes).map((r) => r.map(csvNumber)),
				CSV_DELIMITER,
			),
		);
	};

	const handleClear = () => {
		if (window.confirm(t.clearVehiclesConfirm)) fleet.clear();
	};

	const handleImport = async (file: File) => {
		const result = importRows(await file.text(), VEHICLE_COLS);
		if (result.ok) {
			fleet.replace(
				rowsToClasses(
					result.rows.map((row) => row.map((c) => csvCellToInput(c, result.decimal))),
				),
			);
		} else {
			window.alert(
				result.error.kind === "empty"
					? t.importEmpty
					: t.importColumns(result.error.line, result.error.expected, result.error.got),
			);
		}
	};

	return (
		<div className="bg" style={{ flex: 11, flexDirection: "column" }}>
			<PanelHeader title={t.vehicles}>
				<PanelMenu visible={menusVisible}>
					<ActionLabel color={ANSI.green} onClick={() => fileInputRef.current?.click()}>
						{t.importBtn}
					</ActionLabel>
					<ActionLabel color={ANSI.yellow} onClick={handleExport}>
						{t.exportBtn}
					</ActionLabel>
					<ActionLabel color={ANSI.red} onClick={handleClear}>
						{t.clear}
					</ActionLabel>
				</PanelMenu>
			</PanelHeader>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<div className="bg">
					{CLASS_HEADERS.map((header) => (
						<TableLabel key={header}>{header}</TableLabel>
					))}
					<div className="bg" style={{ flex: 4, minWidth: 0 }}>
						{TRAILER_HEADERS.map((header) => (
							<TableLabel key={header}>{header}</TableLabel>
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
			<input
				ref={fileInputRef}
				type="file"
				accept=".csv,text/csv"
				style={{ display: "none" }}
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (file) await handleImport(file);
					e.target.value = "";
				}}
			/>
		</div>
	);
}
