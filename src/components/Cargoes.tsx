import { useLayoutEffect } from "react";
import { type Rgb, toRgb } from "../helpers/color";
import { toCsv } from "../helpers/csv";
import { recolor } from "../helpers/layout";
import { CSV_DELIMITER, t } from "../helpers/locale";
import { csvCellToInput, csvNumber } from "../helpers/number";
import type { Row } from "../helpers/rows";
import { Cargo } from "./Cargo";
import { ClearButton } from "./ClearButton";
import { ControlBar } from "./ControlBar";
import { ExportButton } from "./ExportButton";
import { ImportButton } from "./ImportButton";
import { Label, TableLabel } from "./primitives";

const CARGO_HEADER = [t.weightKg, t.lengthM];

// The cargo parameter table: the title over everything else, where everything else
// is the controls over the column labels and the editable rows.
export function Cargoes({
	rows,
	setCell,
	onImport,
	onClear,
	palette,
}: {
	rows: Row[];
	setCell: (id: string, field: number, value: string) => void;
	onImport: (rows: string[][]) => void;
	onClear: () => void;
	palette: Rgb[];
}) {
	// Recolor whenever the set of rows changes — added, removed, or replaced by an
	// import — so freshly mounted bg divs get their color. We key on row identity
	// (not just count) because an import mints fresh ids for brand-new DOM nodes
	// that carry no color yet, and the replacement can leave the count unchanged
	// (the trailing empty row). Cell edits keep ids stable, so this won't fire on
	// every keystroke. We do NOT squeeze here — squeezeFg runs only on mount and
	// resize; new rows are .cell content that inherits --font-size and crops.
	const rowKey = rows.map((row) => row.id).join(",");
	useLayoutEffect(() => {
		recolor();
	}, [rowKey]);

	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h3>{t.cargo}</h3>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<ControlBar>
					<ImportButton
						columns={2}
						onRows={(imported, decimal) =>
							onImport(
								imported.map((row) => row.map((c) => csvCellToInput(c, decimal))),
							)
						}
					/>
					<ExportButton
						filename={t.cargoFile}
						build={() =>
							toCsv(
								CARGO_HEADER,
								rows
									.map((row) => row.values)
									.filter((values) => values.some((v) => v.trim() !== ""))
									.map((values) => values.map(csvNumber)),
								CSV_DELIMITER,
							)
						}
					/>
					<ClearButton onClear={onClear} confirm={t.clearCargoConfirm} />
				</ControlBar>
				<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
					<div className="bg">
						<TableLabel>
							<b>{t.order}</b>
						</TableLabel>
						<TableLabel>
							<b>{t.weightKg}</b>
						</TableLabel>
						<TableLabel>
							<b>{t.lengthM}</b>
						</TableLabel>
					</div>
					<div
						className="bg"
						style={{ flex: 1, flexDirection: "column", overflowY: "auto" }}
					>
						{rows.map((row, i) => (
							<Cargo
								key={row.id}
								order={i + 1}
								values={row.values}
								onChange={(field, value) => setCell(row.id, field, value)}
								muted={i === rows.length - 1}
								color={toRgb(palette[i])}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
