import { fmt, fmtLen, fmtMoney } from "../helpers/number";
import type { Trip } from "../helpers/optimizer";
import { TableCell } from "./primitives";

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
}: {
	order: number;
	name: string;
	color: string;
	trip: Trip;
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
						style={{ minHeight: "var(--row-height, 0px)" }}
					>
						<TableCell>{bi + 1}</TableCell>
						<TableCell>{trailer.cargos.length}</TableCell>
						<TableCell>
							{trailer.cargos.map((i) => i + 1).join(", ")}
						</TableCell>
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
