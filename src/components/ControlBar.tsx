import type { ReactNode } from "react";

// A panel's controls, identical for Cargas, Veículos and Resultados: the buttons
// (and, for Resultados, the objective radios) in a 1em-gap row with 1em block
// margins, centered both ways, inside one fg so squeezeFg fits them together and
// the 1em spacing scales with the font. flex:1 so it takes half of the header row,
// beside the title.
export function ControlBar({ children }: { children: ReactNode }) {
	return (
		<div
			className="bg"
			style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
		>
			<div className="fg">
				<div
					style={{
						display: "flex",
						alignItems: "center",
						whiteSpace: "nowrap",
						gap: "1em",
						marginBlock: "1em",
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
