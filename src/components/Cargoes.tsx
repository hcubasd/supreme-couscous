import { useLayoutEffect } from "react";
import { toCsv } from "../helpers/csv";
import { recolor } from "../helpers/layout";
import { CSV_DELIMITER, t } from "../helpers/locale";
import { csvCellToInput, csvNumber } from "../helpers/number";
import type { Row } from "../helpers/rows";
import { Cargo } from "./Cargo";
import { ExportButton } from "./ExportButton";
import { ImportButton } from "./ImportButton";
import { TableHeading } from "./TableHeading";
import { TableLabel } from "./primitives";

const CARGO_HEADER = [t.weightKg, t.lengthM];

// The cargo parameter table: heading + column labels + the editable rows.
export function Cargoes({
	rows,
	setCell,
	onImport,
}: {
	rows: Row[];
	setCell: (id: string, field: number, value: string) => void;
	onImport: (rows: string[][]) => void;
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
			<TableHeading
				title={t.cargo}
				before={
					<ImportButton
						columns={2}
						onRows={(imported, decimal) =>
							onImport(
								imported.map((row) => row.map((c) => csvCellToInput(c, decimal))),
							)
						}
					/>
				}
				after={
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
				}
			/>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<div className="bg">
					<TableLabel>
						<h4>{t.order}</h4>
					</TableLabel>
					<TableLabel>
						<h4>{t.weightKg}</h4>
					</TableLabel>
					<TableLabel>
						<h4>{t.lengthM}</h4>
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
						/>
					))}
				</div>
			</div>
		</div>
	);
}
