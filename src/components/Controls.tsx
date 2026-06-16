import type { ReactNode } from "react";
import { ANSI } from "../helpers/color";
import { t } from "../helpers/locale";
import type { Objective } from "../helpers/optimizer";
import { ClearButton } from "./ClearButton";
import { ControlBar } from "./ControlBar";

// The Resultados controls: three color dots (Calcular / Exportar / Limpar), like
// the other panels. Calcular prompts for the objective — the answer's first letter
// decides (c → cost / custo, v → vehicles / veículos), so it reads in both locales;
// an unrecognized or cancelled answer does nothing.
export function Controls({
	onSolve,
	onClear,
	actions,
}: {
	onSolve: (objective: Objective) => void;
	onClear: () => void;
	actions?: ReactNode;
}) {
	const onCalculate = () => {
		const answer = window.prompt(t.minimizePrompt)?.trim().toLowerCase();
		if (!answer) return;
		if (answer.startsWith("c")) onSolve("cost");
		else if (answer.startsWith("v")) onSolve("vehicles");
	};

	return (
		<ControlBar>
			<button
				type="button"
				onClick={onCalculate}
				title={t.calculate}
				aria-label={t.calculate}
				style={{ background: ANSI.green }}
			/>
			{actions}
			<ClearButton onClear={onClear} />
		</ControlBar>
	);
}
