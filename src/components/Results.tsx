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
	onClear,
	solved,
}: {
	objective: Objective;
	setObjective: (objective: Objective) => void;
	onClear: () => void;
	solved: Solved | null;
}) {
	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h2>Resultados</h2>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<Controls
					objective={objective}
					setObjective={setObjective}
					onClear={onClear}
					actions={
						solved?.result.status === "success" ? (
							<ExportButton
								filename="resultado.csv"
								build={() =>
									buildResultsCsv(solved.result, solved.vehicles)
								}
							/>
						) : null
					}
				/>
				<Assignments solved={solved} />
			</div>
		</div>
	);
}
