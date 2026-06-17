import type { ReactNode } from "react";

// A panel's controls, identical for Cargas, Veículos and Resultados: the buttons
// in a 1em-gap row with 1em block margins, centered both ways, inside one fg so
// squeezeFg fits them together and the 1em spacing scales with the font.
export function ControlBar({ children }: { children: ReactNode }) {
	return (
		<div
			className="bg"
			style={{ justifyContent: "center", alignItems: "center" }}
		>
			<div className="fg">
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "nowrap",
						gap: "1em",
						marginInline: "1em",
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
