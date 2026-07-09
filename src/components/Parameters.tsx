import type { Rgb } from "../helpers/color";
import type { FleetController } from "../helpers/fleet";
import { t } from "../helpers/locale";
import type { RowController } from "../helpers/rows";
import { Cargoes } from "./Cargoes";
import { Label } from "./primitives";
import { Vehicles } from "./Vehicles";

// The whole input half of the app: the section title over the cargo and vehicle
// tables. State lives in App and is threaded in via the row/fleet controllers; the
// two palettes color the cargo ids and the vehicle classes independently.
export function Parameters({
	cargo,
	fleet,
	vehiclePalette,
	cargoPalette,
}: {
	cargo: RowController;
	fleet: FleetController;
	vehiclePalette: Rgb[];
	cargoPalette: Rgb[];
}) {
	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h2>{t.parameters}</h2>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "row" }}>
				<Cargoes
					rows={cargo.rows}
					setCell={cargo.setCell}
					palette={cargoPalette}
				/>
				<Vehicles fleet={fleet} palette={vehiclePalette} />
			</div>
		</div>
	);
}
