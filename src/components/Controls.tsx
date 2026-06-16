import type { ReactNode } from "react";
import { t } from "../helpers/locale";
import type { Objective } from "../helpers/optimizer";
import { ClearButton } from "./ClearButton";

// The objective radios and the action buttons, all in one fg so squeezeFg fits the
// whole panel together and the 1em gaps scale with the font; --controls-margin
// (set by refit) vertically centers it against the results h3. Buttons sit to the
// right of the radios in the same order as the other panels: Calcular (≙ Import),
// then `actions` (Exportar), then Limpar.
export function Controls({
	objective,
	setObjective,
	onSolve,
	onClear,
	actions,
}: {
	objective: Objective;
	setObjective: (objective: Objective) => void;
	onSolve: () => void;
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
					<span> {t.minimizeCost} </span>
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
					{t.minimizeVehicles}
				</label>
				<button id="solve-button" type="button" onClick={onSolve}>
					{t.calculate}
				</button>
				{actions}
				<ClearButton onClear={onClear} />
			</div>
		</div>
	);
}
