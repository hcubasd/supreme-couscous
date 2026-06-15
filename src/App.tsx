import { matchColors } from "miniature-waffle";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Solved } from "./components/Assignments";
import { DUMMY_CARGO } from "./components/Cargo";
import { Label } from "./components/primitives";
import { Parameters } from "./components/Parameters";
import { Results } from "./components/Results";
import { DUMMY_VEHICLES } from "./components/Vehicle";
import { toRgb } from "./helpers/format";
import { recolor, refit } from "./helpers/layout";
import { toItems, toVehicles } from "./helpers/mapping";
import { type Objective, solve } from "./helpers/optimizer";
import { useGrowingRows } from "./helpers/rows";

// App is the scaffolding: it holds the shared state (the two parameter tables, the
// objective, and the last solve), wires the solve/clear orchestration, and lays
// out the page skeleton. Everything visual lives in components/.
export default function App() {
	const rootRef = useRef<HTMLDivElement>(null);
	const cargo = useGrowingRows(2, DUMMY_CARGO, "supreme-couscous:cargo");
	const fleet = useGrowingRows(10, DUMMY_VEHICLES, "supreme-couscous:fleet");
	const vehiclePalette = useMemo(
		() => matchColors(fleet.rows.length, 75)[0],
		[fleet.rows.length],
	);
	const [objective, setObjective] = useState<Objective>("cost");
	const [solved, setSolved] = useState<Solved | null>(null);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) throw new Error("No root element found");
		recolor(root);
		const onResize = () => refit(root);
		onResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const handleClear = () => {
		if (!window.confirm("Deseja limpar todos os parâmetros?")) return;
		cargo.clear();
		fleet.clear();
		setSolved(null);
	};

	const handleSolve = () => {
		const vehicles = toVehicles(fleet.rows);
		const colors = vehicles.map((_, i) => toRgb(vehiclePalette[i]));
		setSolved({
			result: solve(toItems(cargo.rows), vehicles, objective),
			vehicles,
			colors,
		});
	};

	return (
		<div
			ref={rootRef}
			id="app-root"
			className="bg"
			style={{ flexDirection: "column", height: "100%" }}
		>
			<Label>
				<h1>
					Alocador exato de frota para operações de transporte de cargas pesadas
				</h1>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<Parameters cargo={cargo} fleet={fleet} palette={vehiclePalette} />
				<Results
					objective={objective}
					setObjective={setObjective}
					onSolve={handleSolve}
					onClear={handleClear}
					solved={solved}
				/>
			</div>
		</div>
	);
}
