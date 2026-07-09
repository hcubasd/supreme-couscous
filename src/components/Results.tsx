import { t } from "../helpers/locale";
import { Assignments, type Solved } from "./Assignments";
import { Label } from "./primitives";

export function Results({ solved }: { solved: Solved | null }) {
	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h1>{t.compositions}</h1>
			</Label>
			<Assignments solved={solved} />
		</div>
	);
}
