import { useEffect, useMemo, useRef, useState } from "react";
import { ActionMenu } from "./components/ActionMenu";
import type { Solved } from "./components/Assignments";
import { DUMMY_CARGO } from "./components/Cargo";
import { Cargoes } from "./components/Cargoes";
import { FAB } from "./components/FAB";
import { Results } from "./components/Results";
import { Vehicles } from "./components/Vehicles";
import { palette, randomVariation, toRgb } from "./helpers/color";
import { DUMMY_FLEET, useGrowingFleet } from "./helpers/fleet";
import { recolor, refit } from "./helpers/layout";
import { LOCALE } from "./helpers/locale";
import { toItems, toVehicles } from "./helpers/mapping";
import { solve } from "./helpers/optimizer";
import { useGrowingRows } from "./helpers/rows";

export default function App() {
	const rootRef = useRef<HTMLDivElement>(null);
	const cargo = useGrowingRows(2, DUMMY_CARGO, "supreme-couscous:cargo");
	const fleet = useGrowingFleet(DUMMY_FLEET, "supreme-couscous:fleet");
	const vehicleVariation = useRef(randomVariation()).current;
	const cargoVariation = useRef(randomVariation()).current;
	const vehiclePalette = useMemo(
		() => palette(fleet.classes.length, 75, vehicleVariation),
		[fleet.classes.length, vehicleVariation],
	);
	const cargoPalette = useMemo(
		() => palette(cargo.rows.length, 75, cargoVariation),
		[cargo.rows.length, cargoVariation],
	);
	const [solved, setSolved] = useState<Solved | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		document.documentElement.lang = LOCALE;
		const root = rootRef.current;
		if (!root) throw new Error("No app-root element found");
		recolor(root);
		refit(root);
	}, []);

	useEffect(() => {
		if (menuOpen) return;
		const root = rootRef.current;
		if (!root) return;
		const onResize = () => refit(root);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [menuOpen]);

	const handleSolve = () => {
		const invalid =
			rootRef.current?.querySelector<HTMLInputElement>("input:invalid");
		if (invalid) {
			invalid.reportValidity();
			return;
		}
		const items = toItems(cargo.rows);
		const vehicles = toVehicles(fleet.classes);
		const colors = vehicles.map((_, i) => toRgb(vehiclePalette[i]));
		const cargoColors = items.map((_, i) => toRgb(cargoPalette[i]));
		setSolved({ result: solve(items, vehicles), vehicles, colors, cargoColors });
	};

	return (
		<div
			ref={rootRef}
			id="app-root"
			className="bg"
			style={{ height: "100%", flexDirection: "column" }}
		>
			<div className="bg inputs-wrapper">
				<Cargoes
					rows={cargo.rows}
					setCell={cargo.setCell}
					palette={cargoPalette}
				/>
				<Vehicles fleet={fleet} palette={vehiclePalette} />
			</div>
			<Results solved={solved} />
			<FAB onClick={() => setMenuOpen((prev) => !prev)} />
			{menuOpen && (
				<ActionMenu
					cargo={cargo}
					fleet={fleet}
					solved={solved}
					onSolve={handleSolve}
					onClearSolved={() => setSolved(null)}
					onClose={() => setMenuOpen(false)}
				/>
			)}
		</div>
	);
}
