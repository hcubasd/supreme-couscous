import type { ReactNode } from "react";
import type { Objective } from "../helpers/optimizer";

// The objective radios and the action buttons. Everything sits in one fg so
// squeezeFg fits the whole panel together and the 1em gaps scale with the font;
// --controls-margin (set by refit) vertically centers it against the results h3.
// `actions` holds result-dependent buttons (e.g. Exportar) shown after Limpar.
export function Controls({
	objective,
	setObjective,
	onClear,
	actions,
}: {
	objective: Objective;
	setObjective: (objective: Objective) => void;
	onClear: () => void;
	actions?: ReactNode;
}) {
	return (
		<div className="bg" style={{ justifyContent: "center" }}>
			<div
				id="controls"
				className="fg"
				style={{
					display: "flex",
					alignItems: "center",
					whiteSpace: "nowrap",
					margin: "var(--controls-margin) 0",
					// em (not the px centering var) so the gap scales with the fg's
					// font-size live during squeezeFg's search — the horizontal axis it
					// may shrink. The var stays for the vertical centering margin only.
					gap: "1em",
				}}
			>
				<label style={{ display: "flex", alignItems: "center" }}>
					<input
						id="cost-radio"
						type="radio"
						name="state"
						style={{ width: "auto" }}
						checked={objective === "cost"}
						onChange={() => setObjective("cost")}
					/>
					<span> Minimizar custo </span>
				</label>
				<label style={{ display: "flex", alignItems: "center" }}>
					<input
						id="vehicle-radio"
						type="radio"
						name="state"
						style={{ width: "auto" }}
						checked={objective === "vehicles"}
						onChange={() => setObjective("vehicles")}
					/>
					Minimizar veículos
				</label>
				<button id="solve-button" type="submit">
					Calcular
				</button>
				<button id="clear-button" type="button" onClick={onClear}>
					Limpar
				</button>
				{actions}
			</div>
		</div>
	);
}
