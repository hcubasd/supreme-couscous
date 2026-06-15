import { t } from "../helpers/locale";
import type { Objective } from "../helpers/optimizer";
import { buildResultsCsv } from "../helpers/results";
import { Assignments, type Solved } from "./Assignments";
import { Controls } from "./Controls";
import { ExportButton } from "./ExportButton";
import { Label } from "./primitives";

// The whole output half of the app: the section title over the controls panel and
// the results table. Solve/clear orchestration lives in App; this just wires the
// callbacks and the last solve through.
export function Results({
	objective,
	setObjective,
	onSolve,
	onClear,
	solved,
}: {
	objective: Objective;
	setObjective: (objective: Objective) => void;
	onSolve: () => void;
	onClear: () => void;
	solved: Solved | null;
}) {
	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h2>{t.results}</h2>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<Controls
					objective={objective}
					setObjective={setObjective}
					onSolve={onSolve}
					onClear={onClear}
					// Always render Exportar (so it's in the mount-time squeeze set),
					// disabled until there's a result to export.
					actions={
						<ExportButton
							filename={t.resultsFile}
							disabled={solved?.result.status !== "success"}
							build={() =>
								solved ? buildResultsCsv(solved.result, solved.vehicles) : ""
							}
						/>
					}
				/>
				<Assignments solved={solved} />
			</div>
		</div>
	);
}
