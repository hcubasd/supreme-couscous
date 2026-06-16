import type { ReactNode } from "react";
import { ANSI } from "../helpers/color";
import { t } from "../helpers/locale";
import type { Objective } from "../helpers/optimizer";
import { ClearButton } from "./ClearButton";
import { ControlBar } from "./ControlBar";

// The Resultados controls: two solve buttons (minimize cost / minimize vehicles),
// then Exportar (via `actions`) and Limpar — all colored circles, so the tooltips
// carry the meaning. Each solve button runs the optimizer with its objective; the
// objective is chosen by which button you press (no radios).
export function Controls({
	onSolve,
	onClear,
	actions,
}: {
	onSolve: (objective: Objective) => void;
	onClear: () => void;
	actions?: ReactNode;
}) {
	return (
		<ControlBar>
			<button
				type="button"
				onClick={() => onSolve("cost")}
				title={t.minimizeCost}
				aria-label={t.minimizeCost}
				style={{ background: ANSI.cyan }}
			/>
			<button
				type="button"
				onClick={() => onSolve("vehicles")}
				title={t.minimizeVehicles}
				aria-label={t.minimizeVehicles}
				style={{ background: ANSI.magenta }}
			/>
			{actions}
			<ClearButton onClear={onClear} />
		</ControlBar>
	);
}
