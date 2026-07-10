import { ANSI } from "../helpers/color";
import { downloadCsv } from "../helpers/csv";
import { t } from "../helpers/locale";
import { buildResultsCsv } from "../helpers/results";
import { Assignments, type Solved } from "./Assignments";
import { ActionGroup, ActionLabel, PanelHeader } from "./primitives";

export function Results({
	solved,
	onSolve,
	onClearSolved,
	menusVisible,
}: {
	solved: Solved | null;
	onSolve: () => void;
	onClearSolved: () => void;
	menusVisible: boolean;
}) {
	const handleCalculate = () => {
		if (window.confirm(t.calculateConfirm)) onSolve();
	};

	// No special-casing for "nothing solved yet": buildResultsCsv already emits a
	// headers-only CSV for any non-success result, so an infeasible stand-in gets
	// the same file a real infeasible solve would.
	const handleExport = () => {
		const result = solved?.result ?? {
			status: "infeasible" as const,
			compositions: null,
			objectiveValue: null,
			statesExplored: 0,
		};
		downloadCsv(t.resultsFile, buildResultsCsv(result, solved?.vehicles ?? []));
	};

	const handleClear = () => {
		if (window.confirm(t.clearResultsConfirm)) onClearSolved();
	};

	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<PanelHeader
				title={t.compositions}
				showActions={menusVisible}
				actions={
					<ActionGroup>
						<ActionLabel color={ANSI.green} onClick={handleCalculate}>
							{t.calculate}
						</ActionLabel>
						<ActionLabel color={ANSI.yellow} onClick={handleExport}>
							{t.exportBtn}
						</ActionLabel>
						<ActionLabel color={ANSI.red} onClick={handleClear}>
							{t.clear}
						</ActionLabel>
					</ActionGroup>
				}
			/>
			<Assignments solved={solved} />
		</div>
	);
}
