import { fmt, fmtLen, fmtMoney } from "../helpers/number";
import type { Trip } from "../helpers/optimizer";
import { TableCell } from "./primitives";

// One cargo in a trailer's cargo set: a bg cell holding a color-filled div (the
// cargo's palette color) that overtakes the cell, with the id in plain black. The
// 1px flex gaps between cells keep adjacent fills apart.
function CargoCell({ id, color }: { id: number; color: string }) {
	return (
		<div className="bg" style={{ flex: 1, minWidth: 0 }}>
			<div
				className="cell"
				style={{
					flex: 1,
					minWidth: 0,
					background: color,
					color: "black",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					overflow: "hidden",
				}}
			>
				{id}
			</div>
		</div>
	);
}

// One trip rendered as a rig "line": a bg row whose identity and cost cells
// (Ordem, Classe, Peso cobrado, Custo) stand as single cells the full height of
// the rig's carretas, while the middle column stacks one row per carreta (its
// number, how many cargos ride it, which ones, weight, occupied length).
//
// The "rowspan" is pure flexbox: the row's children stretch to its tallest child
// (the carreta column), and each flanking TableLabel centers its single line
// vertically across that height. The middle column takes flex 5 so its five inner
// columns line up with the five flat columns in the header and Total rows.
export function AssignedVehicle({
	order,
	name,
	color,
	trip,
	cargoColors,
}: {
	order: number;
	name: string;
	color: string;
	trip: Trip;
	cargoColors: string[];
}) {
	const beds = trip.beds ?? [];
	return (
		<div className="bg">
			<TableCell>{order}</TableCell>
			<TableCell style={{ color }}>{name}</TableCell>
			<div
				className="bg"
				style={{ flex: 5, flexDirection: "column", minWidth: 0 }}
			>
				{beds.map((trailer, bi) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: trailers are positional and stable for a given solve
						key={bi}
						className="bg"
					>
						<TableCell>{bi + 1}</TableCell>
						<TableCell>{trailer.cargos.length}</TableCell>
						{/* The cargo set: one color-filled cell per cargo (its palette
						    color as the fill, id in black) rather than a comma-joined
						    string. */}
						<div
							className="bg"
							style={{ flex: 1, minWidth: 0, overflow: "hidden" }}
						>
							{trailer.cargos.map((i) => (
								<CargoCell key={i} id={i + 1} color={cargoColors[i]} />
							))}
						</div>
						<TableCell>{fmt(trailer.w)}</TableCell>
						<TableCell>{fmtLen(trailer.l)}</TableCell>
					</div>
				))}
			</div>
			<TableCell>{fmtMoney(trip.freight)}</TableCell>
			<TableCell>{fmtMoney(trip.toll)}</TableCell>
			<TableCell>{fmtMoney(trip.r)}</TableCell>
		</div>
	);
}
