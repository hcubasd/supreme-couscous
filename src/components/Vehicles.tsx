import { useLayoutEffect } from "react";
import { type Rgb, toRgb } from "../helpers/format";
import { recolor } from "../helpers/layout";
import type { Row } from "../helpers/rows";
import { TableHeading } from "./TableHeading";
import { TableLabel } from "./primitives";
import { Vehicle } from "./Vehicle";

// The vehicle (fleet) parameter table: heading + column labels + the editable
// rows, each tinted with its palette color.
export function Vehicles({
	rows,
	setCell,
	palette,
	onImport,
}: {
	rows: Row[];
	setCell: (id: string, field: number, value: string) => void;
	palette: Rgb[];
	onImport: (rows: string[][]) => void;
}) {
	// See Cargoes: key on row identity so imports (which mint fresh ids, often at
	// an unchanged count) recolor the new nodes, without firing on cell edits. No
	// squeeze here — that runs only on mount and resize.
	const rowKey = rows.map((row) => row.id).join(",");
	useLayoutEffect(() => {
		recolor();
	}, [rowKey]);

	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<TableHeading title="Veículos" columns={10} onImport={onImport} />
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<div className="bg">
					<TableLabel>
						<h4>Classe</h4>
					</TableLabel>
					<TableLabel>
						<h4>Quantidade disponível</h4>
					</TableLabel>
					<TableLabel>
						<h4>Capacidade de peso (kg)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Quantidade de carretas</h4>
					</TableLabel>
					<TableLabel>
						<h4>Comprimento da carreta (m)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Espaçamento (m)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Peso mínimo (kg)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Frete (R$/kg)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Eixos</h4>
					</TableLabel>
					<TableLabel>
						<h4>Pedágio (R$/eixo)</h4>
					</TableLabel>
				</div>
				<div
					className="bg"
					style={{ flex: 1, flexDirection: "column", overflowY: "auto" }}
				>
					{rows.map((row, i) => (
						<Vehicle
							key={row.id}
							values={row.values}
							onChange={(field, value) => setCell(row.id, field, value)}
							color={toRgb(palette[i])}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
