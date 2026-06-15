import { matchGrays } from "miniature-waffle";
import { NumberCell, Parameter, TableCell } from "./primitives";

const [mutedGray] = matchGrays(1, 75);
const MUTED = `rgb(${mutedGray.r}, ${mutedGray.g}, ${mutedGray.b})`;

export const DUMMY_CARGO: string[][] = [
	["10000", "1,5"],
	["12000", "1,8"],
	["8000", "1,4"],
	["15000", "2,2"],
	["9000", "1,6"],
];

// One cargo row: its order number (muted on the trailing empty "new row") and the
// weight/length fields.
export function Cargo({
	order,
	values,
	onChange,
	muted,
}: {
	order: number;
	values: string[];
	onChange: (field: number, value: string) => void;
	muted?: boolean;
}) {
	return (
		<Parameter>
			<TableCell
				style={{
					height: "100%",
					alignItems: "center",
					color: muted ? MUTED : undefined,
				}}
			>
				{order}
			</TableCell>
			<NumberCell value={values[0]} onChange={(v) => onChange(0, v)} />
			<NumberCell value={values[1]} onChange={(v) => onChange(1, v)} />
		</Parameter>
	);
}
