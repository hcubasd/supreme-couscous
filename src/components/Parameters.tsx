import type { Rgb } from "../helpers/format";
import type { RowController } from "../helpers/rows";
import { Cargoes } from "./Cargoes";
import { Label } from "./primitives";
import { Vehicles } from "./Vehicles";

// The whole input half of the app: the section title over the cargo and vehicle
// tables. State lives in App and is threaded in via the two row controllers.
export function Parameters({
	cargo,
	fleet,
	palette,
}: {
	cargo: RowController;
	fleet: RowController;
	palette: Rgb[];
}) {
	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h2>Parâmetros</h2>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<Cargoes
					rows={cargo.rows}
					setCell={cargo.setCell}
					onImport={cargo.replace}
				/>
				<Vehicles
					rows={fleet.rows}
					setCell={fleet.setCell}
					palette={palette}
					onImport={fleet.replace}
				/>
			</div>
		</div>
	);
}
