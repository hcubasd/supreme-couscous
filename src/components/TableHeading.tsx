import { ImportButton } from "./ImportButton";

// A table heading: the title and its import button share one fg, so squeezeFg
// fits them together and the 1em gap scales with the font — same contract as the
// controls panel.
export function TableHeading({
	title,
	columns,
	onImport,
}: {
	title: string;
	columns: number;
	onImport: (rows: string[][]) => void;
}) {
	return (
		<div
			className="bg"
			style={{ justifyContent: "center", alignItems: "center" }}
		>
			<div
				className="fg"
				style={{
					display: "flex",
					alignItems: "center",
					whiteSpace: "nowrap",
					gap: "1em",
				}}
			>
				<h3>{title}</h3>
				<ImportButton columns={columns} onRows={onImport} />
			</div>
		</div>
	);
}
