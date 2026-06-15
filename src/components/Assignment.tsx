import { fmt, fmtBRL, fmtLen } from "../helpers/format";
import type { Trip, Vehicle } from "../helpers/optimizer";
import { AssignedVehicle } from "./AssignedVehicle";
import { BOLD, TableCell } from "./primitives";

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
	vehicles,
	colors,
}: {
	composition: Trip[];
	index: number; // 0-based position in the sample
	vehicles: Vehicle[];
	colors: string[];
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
		<div className="bg" style={{ flexShrink: 0 }}>
			{/* Third layer: the composition number spans the whole block via flex
			    stretch — no separate header row. The body (flex 9) holds the trips and
			    the Total and mirrors the column header's nesting so columns line up. */}
			<TableCell style={BOLD}>{index + 1}</TableCell>
			<div
				className="bg"
				style={{ flex: 9, flexDirection: "column", minWidth: 0 }}
			>
				{composition.map((trip, ti) => (
					<AssignedVehicle
						// biome-ignore lint/suspicious/noArrayIndexKey: trips are positional and stable for a given solve
						key={ti}
						order={ti + 1}
						name={vehicles[trip.vIdx].name}
						color={colors[trip.vIdx]}
						trip={trip}
					/>
				))}
				{/* Mirror AssignedVehicle's nesting (identity · flex:5 carreta group ·
				    costs) so the Total's columns line up with the rows above. */}
				{/* No "Total" label — just bold aggregators in the columns that sum. */}
				<div className="bg" style={{ minHeight: "var(--row-height, 0px)" }}>
					<TableCell> </TableCell>
					<TableCell> </TableCell>
					<div className="bg" style={{ flex: 5, minWidth: 0 }}>
						<TableCell> </TableCell>
						<TableCell style={BOLD}>{totalUnits}</TableCell>
						<TableCell> </TableCell>
						<TableCell style={BOLD}>{fmt(totalW)}</TableCell>
						<TableCell style={BOLD}>{fmtLen(totalL)}</TableCell>
					</div>
					<TableCell style={BOLD}>{fmt(totalC)}</TableCell>
					<TableCell style={BOLD}>{fmtBRL(totalR)}</TableCell>
				</div>
			</div>
		</div>
	);
}
