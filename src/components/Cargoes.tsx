import { useLayoutEffect, useRef } from "react";
import { ANSI, type Rgb, toRgb } from "../helpers/color";
import { downloadCsv, importRows, toCsv } from "../helpers/csv";
import { recolor } from "../helpers/layout";
import { CSV_DELIMITER, t } from "../helpers/locale";
import { csvCellToInput, csvNumber } from "../helpers/number";
import type { RowController } from "../helpers/rows";
import { Cargo } from "./Cargo";
import { ActionLabel, PanelHeader, PanelMenu, TableLabel } from "./primitives";

const CARGO_HEADER = [t.weightKg, t.dimensionM];

export function Cargoes({
	cargo,
	palette,
	menusVisible,
}: {
	cargo: RowController;
	palette: Rgb[];
	menusVisible: boolean;
}) {
	const { rows, setCell } = cargo;
	const fileInputRef = useRef<HTMLInputElement>(null);

	const rowKey = rows.map((row) => row.id).join(",");
	useLayoutEffect(() => {
		recolor();
	}, [rowKey]);

	const handleExport = () => {
		downloadCsv(
			t.cargoFile,
			toCsv(
				CARGO_HEADER,
				rows
					.map((r) => r.values)
					.filter((v) => v.some((x) => x.trim() !== ""))
					.map((v) => v.map(csvNumber)),
				CSV_DELIMITER,
			),
		);
	};

	const handleClear = () => {
		if (window.confirm(t.clearCargoConfirm)) cargo.clear();
	};

	const handleImport = async (file: File) => {
		const result = importRows(await file.text(), 2);
		if (result.ok) {
			cargo.replace(
				result.rows.map((row) => row.map((c) => csvCellToInput(c, result.decimal))),
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
		<div className="bg" style={{ flex: 3, flexDirection: "column" }}>
			<PanelHeader title={t.cargo}>
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
					<TableLabel>{t.order}</TableLabel>
					<TableLabel>{t.weightKg}</TableLabel>
					<TableLabel>{t.dimensionM}</TableLabel>
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
