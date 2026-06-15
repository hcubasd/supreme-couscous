import type { ClassRow } from "../helpers/fleet";
import { Carreta } from "./Carreta";
import { NumberCell } from "./primitives";

// One vehicle class, laid out like an AssignedVehicle: the seven per-class fields
// stand as tall cells the full height of the class's trailers, while the trailer
// column (flex 4 = the Carreta number + three trailer fields) stacks one editable
// row per carreta. The class name is the unique identifier; carreta numbers are
// automatic. A "started" class/trailer marks its inputs required so the form flags
// a half-filled entry on Calcular.
export function Vehicle({
	klass,
	color,
	onClassCell,
	onTrailerCell,
}: {
	klass: ClassRow;
	color?: string;
	onClassCell: (field: number, value: string) => void;
	onTrailerCell: (trailerId: string, field: number, value: string) => void;
}) {
	const { values, trailers } = klass;
	const classStarted =
		values.some((v) => v.trim() !== "") ||
		trailers.some((t) => t.values.some((v) => v.trim() !== ""));

	return (
		<div className="bg">
			<div
				className="bg"
				style={{ flex: 1, minWidth: 0, justifyContent: "center", alignItems: "center" }}
			>
				<input
					type="text"
					required={classStarted}
					style={{ width: "100%", color }}
					value={values[0]}
					onChange={(e) => onClassCell(0, e.target.value)}
				/>
			</div>
			{[1, 2, 3, 4, 5, 6].map((field) => (
				<NumberCell
					key={field}
					value={values[field]}
					onChange={(v) => onClassCell(field, v)}
					required={classStarted}
				/>
			))}
			<div
				className="bg"
				style={{ flex: 4, flexDirection: "column", minWidth: 0 }}
			>
				{trailers.map((trailer, i) => {
					const trailerStarted = trailer.values.some((v) => v.trim() !== "");
					const ghost = i === trailers.length - 1 && !trailerStarted;
					return (
						<Carreta
							key={trailer.id}
							number={i + 1}
							values={trailer.values}
							muted={ghost}
							required={trailerStarted}
							onChange={(field, value) => onTrailerCell(trailer.id, field, value)}
						/>
					);
				})}
			</div>
		</div>
	);
}
