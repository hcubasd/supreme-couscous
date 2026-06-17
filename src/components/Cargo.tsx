import { localizeDecimal } from "../helpers/number";
import { MUTED, NumberCell, Parameter, TableCell } from "./primitives";

export const DUMMY_CARGO: string[][] = [
	["6910", "1,2"],
	["6862", "1,2"],
	["6874", "1,2"],
	["6796", "1,2"],
	["6858", "1,2"],
	["6666", "1,2"],
	["6950", "1,2"],
	["6912", "1,2"],
	["6928", "1,2"],
	["6902", "1,2"],
	["6824", "1,2"],
	["6910", "1,2"],
	["6886", "1,2"],
	["6662", "1,2"],
	["6856", "1,2"],
	["6852", "1,2"],
	["6930", "1,2"],
	["6882", "1,2"],
	["6934", "1,2"],
	["6876", "1,2"],
	["6934", "1,2"],
	["6992", "1,2"],
	["6914", "1,2"],
	["6914", "1,2"],
	["6896", "1,2"],
	["6890", "1,2"],
	["6892", "1,2"],
	["6920", "1,2"],
	["6624", "1,2"],
	["6698", "1,2"],
	["6888", "1,2"],
	["6888", "1,2"],
	["6828", "1,2"],
	["7112", "1,2"],
	["7212", "1,2"],
	["7108", "1,2"],
	["7030", "1,2"],
	["7134", "1,2"],
	["7226", "1,2"],
	["7278", "1,2"],
	["7304", "1,2"],
	["7256", "1,2"],
	["7158", "1,2"],
	["7246", "1,2"],
	["7214", "1,2"],
	["7156", "1,2"],
	["7116", "1,2"],
	["7220", "1,2"],
	["7086", "1,2"],
	["7106", "1,2"],
	["7244", "1,2"],
	["7146", "1,2"],
	["7128", "1,2"],
	["7288", "1,2"],
	["7088", "1,2"],
	["7098", "1,2"],
	["7100", "1,2"],
	["7120", "1,2"],
	["7108", "1,2"],
	["7142", "1,2"],
	["7060", "1,2"],
	["7098", "1,2"],
	["7128", "1,2"],
	["7114", "1,2"],
	["7110", "1,2"],
	["7124", "1,2"],
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
