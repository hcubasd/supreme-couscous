import { localizeDecimal } from "../helpers/number";
import { MUTED, NumberCell, Parameter, TableCell } from "./primitives";

export const DUMMY_CARGO: string[][] = [
	["10000", "1,5"],
	["12000", "1,8"],
	["8000", "1,4"],
	["15000", "2,2"],
	["9000", "1,6"],
].map((row) => row.map(localizeDecimal));

// One cargo row: its order number — the cargo id, tinted with its palette color
// (muted on the trailing empty "new row") — and the weight/length fields.
export function Cargo({
	order,
	values,
	onChange,
	muted,
	color,
}: {
	order: number;
	values: string[];
	onChange: (field: number, value: string) => void;
	muted?: boolean;
	color?: string;
}) {
	// A "started" row (any cell typed in) requires all its cells, so the form's
	// native validity check flags a half-filled row on Calcular. The trailing
	// ghost row stays empty and exempt.
	const started = values.some((v) => v.trim() !== "");
	return (
		<Parameter>
			<TableCell
				style={{
					height: "100%",
					alignItems: "center",
					color: muted ? MUTED : color,
				}}
			>
				{order}
			</TableCell>
			<NumberCell
				value={values[0]}
				onChange={(v) => onChange(0, v)}
				required={started}
			/>
			<NumberCell
				value={values[1]}
				onChange={(v) => onChange(1, v)}
				required={started}
			/>
		</Parameter>
	);
}
