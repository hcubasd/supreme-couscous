import { useLayoutEffect } from "react";
import { type Rgb, toRgb } from "../helpers/color";
import { recolor } from "../helpers/layout";
import { t } from "../helpers/locale";
import type { Row } from "../helpers/rows";
import { Cargo } from "./Cargo";
import { Label, TableLabel } from "./primitives";

export function Cargoes({
	rows,
	setCell,
	palette,
}: {
	rows: Row[];
	setCell: (id: string, field: number, value: string) => void;
	palette: Rgb[];
}) {
	const rowKey = rows.map((row) => row.id).join(",");
	useLayoutEffect(() => {
		recolor();
	}, [rowKey]);

	return (
		<div className="bg" style={{ flex: 3, flexDirection: "column" }}>
			<Label>
				<h1>{t.cargo}</h1>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<div className="bg">
					<TableLabel><b>{t.order}</b></TableLabel>
					<TableLabel><b>{t.weightKg}</b></TableLabel>
					<TableLabel><b>{t.lengthM}</b></TableLabel>
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
	);
}
