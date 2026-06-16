import type { ReactNode } from "react";
import { t } from "../helpers/locale";
import type { Objective } from "../helpers/optimizer";
import { ClearButton } from "./ClearButton";
import { ControlBar } from "./ControlBar";

// The Resultados control panel: the objective radios then the action buttons, in
// the same ControlBar nesting as the other panels. Order matches them too:
// Calcular (≙ Import), then `actions` (Exportar), then Limpar.
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
		<ControlBar>
			<label style={{ display: "flex", alignItems: "center" }}>
				<input
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
					type="radio"
					name="state"
					style={{ width: "auto" }}
					checked={objective === "vehicles"}
					onChange={() => setObjective("vehicles")}
				/>
				{t.minimizeVehicles}
			</label>
			<button type="button" onClick={onSolve}>
				{t.calculate}
			</button>
			{actions}
			<ClearButton onClear={onClear} />
		</ControlBar>
	);
}
