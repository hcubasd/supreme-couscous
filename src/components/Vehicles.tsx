import { useLayoutEffect } from "react";
import { type Rgb, toRgb } from "../helpers/color";
import { type FleetController } from "../helpers/fleet";
import { recolor } from "../helpers/layout";
import { t } from "../helpers/locale";
import { Label, TableLabel } from "./primitives";
import { Vehicle } from "./Vehicle";

const CLASS_HEADERS = [
	t.klass, t.availableQty, t.maxWeightKg,
	t.minCharge, t.freightPerKg, t.axles, t.tollPerAxle,
];
const TRAILER_HEADERS = [t.trailer, t.trailerCapacityKg, t.trailerDimensionM, t.spacingM];

export function Vehicles({
	fleet,
	palette,
}: {
	fleet: FleetController;
	palette: Rgb[];
}) {
	const { classes, setClassCell, setTrailerCell } = fleet;

	const structureKey = classes
		.map((c) => `${c.id}:${c.trailers.map((t) => t.id).join("-")}`)
		.join(",");
	useLayoutEffect(() => {
		recolor();
	}, [structureKey]);

	return (
		<div className="bg" style={{ flex: 11, flexDirection: "column" }}>
			<Label fgStyle={{ paddingBlock: "1em" }}>{t.vehicles}</Label>
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
		</div>
	);
}
