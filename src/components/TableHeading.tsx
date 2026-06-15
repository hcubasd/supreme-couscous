import type { ReactNode } from "react";

// A table heading: the title and any action buttons (Importar/Exportar) share one
// fg, so squeezeFg fits them together and the 1em gap scales with the font — same
// contract as the controls panel.
export function TableHeading({
	title,
	actions,
}: {
	title: string;
	actions?: ReactNode;
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
				{actions}
			</div>
		</div>
	);
}
