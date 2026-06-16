import type { ReactNode } from "react";

// A table heading: the title flanked by action buttons (Importar before, Exportar
// after) all share one fg, so squeezeFg fits them together and the 1em gaps scale
// with the font — same contract as the controls panel.
export function TableHeading({
	title,
	before,
	after,
}: {
	title: string;
	before?: ReactNode;
	after?: ReactNode;
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
				{before}
				<h3>{title}</h3>
				{after}
			</div>
		</div>
	);
}
