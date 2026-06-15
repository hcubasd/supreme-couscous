import { fmt, fmtBRL, fmtLen } from "../helpers/format";
import type { Trip, Vehicle } from "../helpers/optimizer";
import { AssignedVehicle } from "./AssignedVehicle";
import { BOLD, Cell, TableCell } from "./primitives";

// One composition (one full partition of the cargo sequence into trips): a bg
// column of AssignedVehicle lines, headed by its label and footed by a Total row.
//
// The two kinds of quantity stay separate so the Total never double-counts:
// rig-level values (billable weight, cost) accrue once per trip; the additive
// physical values (cargo counts, weight, occupied length) accrue from each rig's
// trailers — matching how AssignedVehicle splits them across the carretas.
export function Assignment({
	composition,
	index,
	total,
	vehicles,
	colors,
	useFreight,
	useLength,
}: {
	composition: Trip[];
	index: number; // 0-based position in the sample
	total: number; // compositionCount (how many optima exist)
	vehicles: Vehicle[];
	colors: string[];
	useFreight: boolean;
	useLength: boolean;
}) {
	let totalUnits = 0;
	let totalW = 0;
	let totalC = 0;
	let totalR = 0;
	let totalL = 0;
	for (const trip of composition) {
		totalC += trip.c;
		totalR += trip.r;
		for (const trailer of trip.beds ?? []) {
			totalUnits += trailer.cargos.length;
			totalW += trailer.w;
			totalL += trailer.l;
		}
	}

	return (
		<div className="bg" style={{ flexDirection: "column", flexShrink: 0 }}>
			<Cell style={{ ...BOLD, minHeight: "var(--row-height, 0px)" }}>
				Composição {index + 1} de {fmt(total)}
			</Cell>
			{composition.map((trip, ti) => (
				<AssignedVehicle
					// biome-ignore lint/suspicious/noArrayIndexKey: trips are positional and stable for a given solve
					key={ti}
					order={ti + 1}
					name={vehicles[trip.vIdx].name}
					color={colors[trip.vIdx]}
					trip={trip}
					useFreight={useFreight}
					useLength={useLength}
				/>
			))}
			<div className="bg" style={{ minHeight: "var(--row-height, 0px)" }}>
				<TableCell style={BOLD}>Total</TableCell>
				<TableCell> </TableCell>
				<TableCell> </TableCell>
				<TableCell style={BOLD}>{totalUnits}</TableCell>
				<TableCell> </TableCell>
				<TableCell style={BOLD}>{fmt(totalW)}</TableCell>
				<TableCell style={BOLD}>{useLength ? fmtLen(totalL) : "—"}</TableCell>
				<TableCell style={BOLD}>{fmt(totalC)}</TableCell>
				<TableCell style={BOLD}>{useFreight ? fmtBRL(totalR) : "—"}</TableCell>
			</div>
		</div>
	);
}
