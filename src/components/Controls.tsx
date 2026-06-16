import { type ReactNode, useRef } from "react";
import { ANSI } from "../helpers/color";
import { t } from "../helpers/locale";
import type { Objective } from "../helpers/optimizer";
import { ClearButton } from "./ClearButton";
import { ControlBar } from "./ControlBar";

// The Resultados controls: three color dots (Calcular / Exportar / Limpar), like
// the other panels. Calcular opens a modal asking which objective to minimize;
// picking one runs the optimizer with it. Tooltips carry the meaning.
export function Controls({
	onSolve,
	onClear,
	actions,
}: {
	onSolve: (objective: Objective) => void;
	onClear: () => void;
	actions?: ReactNode;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	// Close first so a validation bubble (if the inputs are half-filled) isn't
	// hidden behind the modal, then solve.
	const choose = (objective: Objective) => {
		dialogRef.current?.close();
		onSolve(objective);
	};

	return (
		<ControlBar>
			<button
				type="button"
				onClick={() => dialogRef.current?.showModal()}
				title={t.calculate}
				aria-label={t.calculate}
				style={{ background: ANSI.green }}
			/>
			{actions}
			<ClearButton onClear={onClear} />
			<dialog ref={dialogRef}>
				<p>{t.minimizePrompt}</p>
				<button type="button" onClick={() => choose("cost")}>
					{t.minimizeCost}
				</button>
				<button type="button" onClick={() => choose("vehicles")}>
					{t.minimizeVehicles}
				</button>
				<button type="button" onClick={() => dialogRef.current?.close()}>
					{t.cancel}
				</button>
			</dialog>
		</ControlBar>
	);
}
