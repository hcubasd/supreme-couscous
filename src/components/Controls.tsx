import type { ReactNode } from "react";
import { ANSI } from "../helpers/color";
import { t } from "../helpers/locale";
import { ClearButton } from "./ClearButton";
import { ControlBar } from "./ControlBar";

// The Resultados controls: three color dots (Calcular / Exportar / Limpar), like
// the other panels. Calcular is a single action — there's one objective (cheapest
// operation, fewest vehicles to break ties), so there's nothing to choose.
export function Controls({
	onSolve,
	onClear,
	actions,
}: {
	onSolve: () => void;
	onClear: () => void;
	actions?: ReactNode;
}) {
	return (
		<ControlBar>
			<button
				type="button"
				onClick={onSolve}
				title={t.calculate}
				aria-label={t.calculate}
				style={{ background: ANSI.green }}
			/>
			{actions}
			<ClearButton onClear={onClear} />
		</ControlBar>
	);
}
