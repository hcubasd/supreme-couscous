import { MUTED, NumberCell, TableCell } from "./primitives";

// One editable trailer row within a vehicle class: its automatic number (like the
// cargo order) followed by the three physical fields — capacidade, comprimento,
// espaço. `required` (set when the trailer has been started) makes the form flag a
// half-filled trailer on Calcular; the trailing ghost row stays empty and exempt.
export function Carreta({
	number,
	values,
	onChange,
	muted,
	required,
}: {
	number: number;
	values: string[];
	onChange: (field: number, value: string) => void;
	muted?: boolean;
	required?: boolean;
}) {
	return (
		<div className="bg">
			<TableCell style={{ color: muted ? MUTED : undefined }}>{number}</TableCell>
			<NumberCell
				value={values[0]}
				onChange={(v) => onChange(0, v)}
				required={required}
			/>
			<NumberCell
				value={values[1]}
				onChange={(v) => onChange(1, v)}
				required={required}
			/>
			<NumberCell
				value={values[2]}
				onChange={(v) => onChange(2, v)}
				required={required}
			/>
		</div>
	);
}
