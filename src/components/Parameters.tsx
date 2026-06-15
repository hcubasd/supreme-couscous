import type { FleetController } from "../helpers/fleet";
import type { Rgb } from "../helpers/format";
import { t } from "../helpers/locale";
import type { RowController } from "../helpers/rows";
import { Cargoes } from "./Cargoes";
import { Label } from "./primitives";
import { Vehicles } from "./Vehicles";

// The whole input half of the app: the section title over the cargo and vehicle
// tables. State lives in App and is threaded in via the row/fleet controllers.
export function Parameters({
	cargo,
	fleet,
	palette,
}: {
	cargo: RowController;
	fleet: FleetController;
	palette: Rgb[];
}) {
	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h2>{t.parameters}</h2>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<Cargoes
					rows={cargo.rows}
					setCell={cargo.setCell}
					onImport={cargo.replace}
				/>
				<Vehicles fleet={fleet} palette={palette} />
			</div>
		</div>
	);
}
