import type { Objective } from "../helpers/optimizer";
import { Assignments, type Solved } from "./Assignments";
import { Controls } from "./Controls";
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
				<h2>Resultados</h2>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<Controls
					objective={objective}
					setObjective={setObjective}
					onSolve={onSolve}
					onClear={onClear}
				/>
				<Assignments solved={solved} />
			</div>
		</div>
	);
}
