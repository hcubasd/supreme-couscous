import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Solved } from "./components/Assignments";
import { DUMMY_CARGO } from "./components/Cargo";
import { Cargoes } from "./components/Cargoes";
import { LocaleToggle } from "./components/LocaleToggle";
import { MenuToggle } from "./components/MenuToggle";
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
	// Off by default: the action buttons in each header only exist in the DOM
	// once this flips true, well after the mount-time squeezeFg pass — see
	// ActionLabel and MenuToggle for why their text reads --font-size live
	// instead of being measured as a .fg.
	const [menusVisible, setMenusVisible] = useState(false);

	useEffect(() => {
		document.documentElement.lang = LOCALE;
		const root = rootRef.current;
		if (!root) throw new Error("No app-root element found");
		recolor(root);
		refit(root);
	}, []);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		const onResize = () => refit(root);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	// Toggling the menu mounts/unmounts every header's ActionGroup, which changes
	// the bg tree's nesting depth — colorBg needs to run again against the new
	// tree, same as Cargoes/Vehicles do when their own structure changes.
	useLayoutEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		recolor(root);
	}, [menusVisible]);

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
				<Cargoes cargo={cargo} palette={cargoPalette} menusVisible={menusVisible} />
				<Vehicles fleet={fleet} palette={vehiclePalette} menusVisible={menusVisible} />
			</div>
			<Results
				solved={solved}
				onSolve={handleSolve}
				onClearSolved={() => setSolved(null)}
				menusVisible={menusVisible}
			/>
			<LocaleToggle />
			<MenuToggle
				visible={menusVisible}
				onToggle={() => setMenusVisible((v) => !v)}
			/>
		</div>
	);
}
