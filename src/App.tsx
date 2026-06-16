import { matchColors } from "miniature-waffle";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Solved } from "./components/Assignments";
import { DUMMY_CARGO } from "./components/Cargo";
import { Label } from "./components/primitives";
import { Parameters } from "./components/Parameters";
import { Results } from "./components/Results";
import { DUMMY_FLEET, useGrowingFleet } from "./helpers/fleet";
import { toRgb } from "./helpers/color";
import { recolor, refit } from "./helpers/layout";
import { LOCALE, t } from "./helpers/locale";
import { toItems, toVehicles } from "./helpers/mapping";
import { type Objective, solve } from "./helpers/optimizer";
import { useGrowingRows } from "./helpers/rows";

// App is the scaffolding: it holds the shared state (the cargo and fleet tables,
// the objective, and the last solve), wires solve/clear, and lays out the page.
export default function App() {
	const rootRef = useRef<HTMLDivElement>(null);
	const cargo = useGrowingRows(2, DUMMY_CARGO, "supreme-couscous:cargo");
	const fleet = useGrowingFleet(DUMMY_FLEET, "supreme-couscous:fleet");
	const vehiclePalette = useMemo(
		() => matchColors(fleet.classes.length, 75)[0],
		[fleet.classes.length],
	);
	const [objective, setObjective] = useState<Objective>("cost");
	const [solved, setSolved] = useState<Solved | null>(null);

	useEffect(() => {
		document.documentElement.lang = LOCALE;
		const root = rootRef.current;
		if (!root) throw new Error("No root element found");
		recolor(root);
		const onResize = () => refit(root);
		onResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const handleClear = () => {
		if (!window.confirm(t.clearConfirm)) return;
		cargo.clear();
		fleet.clear();
		setSolved(null);
	};

	const handleSolve = () => {
		// Native validation without a <form> (this is a SPA — nothing is submitted):
		// a "started but half-filled" row leaves a required input empty, so the first
		// :invalid input gets the browser's own warning bubble and we stop.
		const invalid =
			rootRef.current?.querySelector<HTMLInputElement>("input:invalid");
		if (invalid) {
			invalid.reportValidity();
			return;
		}

		const vehicles = toVehicles(fleet.classes);
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
				<h1>{t.appTitle}</h1>
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
