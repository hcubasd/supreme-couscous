import { useLayoutEffect } from "react";
import type { FleetController } from "../helpers/fleet";
import { type Rgb, toRgb } from "../helpers/format";
import { recolor } from "../helpers/layout";
import { TableHeading } from "./TableHeading";
import { TableLabel } from "./primitives";
import { Vehicle } from "./Vehicle";

const CLASS_HEADERS = [
	"Classe",
	"Quantidade disponível",
	"Peso máximo (kg)",
	"Custo mínimo (R$)",
	"Frete (R$/kg)",
	"Eixos",
	"Pedágio (R$/eixo)",
];
const TRAILER_HEADERS = [
	"Carreta",
	"Capacidade da carreta (kg)",
	"Comprimento da carreta (m)",
	"Espaço entre cargas (m)",
];

// The vehicle (fleet) parameter table: heading + the 11 column labels + one
// editable class block per vehicle class. The trailer columns (Carreta + three
// physical fields) are grouped under each class's tall per-class cells.
export function Vehicles({
	fleet,
	palette,
}: {
	fleet: FleetController;
	palette: Rgb[];
}) {
	const { classes, setClassCell, setTrailerCell } = fleet;

	// Recolor when the structure changes (a class or trailer added/removed) so
	// freshly mounted bg divs get their color. Key on the class/trailer identities,
	// not cell values, so this doesn't fire on every keystroke. No squeeze here —
	// that runs only on mount and resize.
	const structureKey = classes
		.map((c) => `${c.id}:${c.trailers.map((t) => t.id).join("-")}`)
		.join(",");
	useLayoutEffect(() => {
		recolor();
	}, [structureKey]);

	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<TableHeading title="Veículos" />
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				{/* Mirror each Vehicle block's nesting (7 class cells + a flex:4 trailer
				    group) so the 1px gaps line up at the same nesting depth. */}
				<div className="bg">
					{CLASS_HEADERS.map((header) => (
						<TableLabel key={header}>
							<h4>{header}</h4>
						</TableLabel>
					))}
					<div className="bg" style={{ flex: 4, minWidth: 0 }}>
						{TRAILER_HEADERS.map((header) => (
							<TableLabel key={header}>
								<h4>{header}</h4>
							</TableLabel>
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
