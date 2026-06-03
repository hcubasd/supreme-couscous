import { matchColors, matchGrays } from "miniature-waffle";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { recolor, refit } from "./helpers/layout";
import {
	type Item,
	type Objective,
	type SolveResult,
	solve,
	type Trip,
	type Vehicle,
} from "./helpers/optimizer";
import { type Row, useGrowingRows } from "./helpers/rows";

const [mutedGray] = matchGrays(1, 75);
const MUTED = `rgb(${mutedGray.r}, ${mutedGray.g}, ${mutedGray.b})`;

const fmt = (n: number) => n.toLocaleString("pt-BR");
const fmtLen = (n: number) =>
	n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

// Accept the Brazilian decimal comma as well as a dot. The NumberCell filter
// guarantees at most one separator, so a plain comma→dot swap is enough.
const parseNumber = (value: string) =>
	parseFloat(value.replace(/,/g, ".")) || 0;

type Rgb = { r: number; g: number; b: number };
const toRgb = ({ r, g, b }: Rgb) => `rgb(${r}, ${g}, ${b})`;

function Label({
	children,
	style,
}: {
	children: React.ReactNode;
	style?: React.CSSProperties;
}) {
	return (
		<div
			className="bg"
			style={{ justifyContent: "center", alignItems: "center", ...style }}
		>
			<div className="fg" style={{ whiteSpace: "nowrap" }}>
				{children}
			</div>
		</div>
	);
}

function TableLabel({
	children,
	style,
}: {
	children: React.ReactNode;
	style?: React.CSSProperties;
}) {
	return <Label style={{ flex: 1, minWidth: 0, ...style }}>{children}</Label>;
}

function Parameter({ children }: { children: React.ReactNode }) {
	// Rows hold their content height and overflow into the scroll container —
	// they must not shrink vertically when space gets tight. Tagged so refit can
	// measure one and propagate its height to the output rows.
	return (
		<div
			className="bg"
			data-param-row="true"
			style={{ alignItems: "center", flexShrink: 0 }}
		>
			{children}
		</div>
	);
}

// A numeric field. We use a text input (not type="number") so a decimal comma is
// always accepted regardless of device locale; the filter keeps the value to a
// single number with at most one separator, and parseNumber resolves it at read
// time.
function NumberCell({
	value,
	onChange,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="bg" style={{ flex: 1, minWidth: 0 }}>
			<input
				type="text"
				inputMode="decimal"
				style={{ width: "100%" }}
				value={value}
				onChange={(e) => {
					const next = e.target.value;
					if (next === "" || /^\d*[.,]?\d*$/.test(next)) onChange(next);
				}}
			/>
		</div>
	);
}

function Cargo({
	order,
	values,
	onChange,
	muted,
}: {
	order: number;
	values: string[];
	onChange: (field: number, value: string) => void;
	muted?: boolean;
}) {
	return (
		<Parameter>
			<TableLabel
				style={{
					height: "100%",
					alignItems: "center",
					color: muted ? MUTED : undefined,
				}}
			>
				{order}
			</TableLabel>
			<NumberCell value={values[0]} onChange={(v) => onChange(0, v)} />
			<NumberCell value={values[1]} onChange={(v) => onChange(1, v)} />
		</Parameter>
	);
}

const DUMMY_CARGO: string[][] = [
	["10000", "1,5"],
	["12000", "1,8"],
	["8000", "1,4"],
	["15000", "2,2"],
	["9000", "1,6"],
];

function CargoTable({
	rows,
	setCell,
}: {
	rows: Row[];
	setCell: (id: string, field: number, value: string) => void;
}) {
	// Rows added/removed change the bg tree and the available space, so recolor
	// the new layers and refit the font once the new DOM is committed.
	useLayoutEffect(() => {
		recolor();
		refit();
	}, [rows.length]);

	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h3>Cargas</h3>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<div className="bg">
					<TableLabel>
						<h4>Ordem</h4>
					</TableLabel>
					<TableLabel>
						<h4>Peso (kg)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Comprimento (m)</h4>
					</TableLabel>
				</div>
				<div
					className="bg"
					style={{ flex: 1, flexDirection: "column", overflowY: "auto" }}
				>
					{rows.map((row, i) => (
						<Cargo
							key={row.id}
							order={i + 1}
							values={row.values}
							onChange={(field, value) => setCell(row.id, field, value)}
							muted={i === rows.length - 1}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function Vehicle({
	values,
	onChange,
	color,
}: {
	values: string[];
	onChange: (field: number, value: string) => void;
	color?: string;
}) {
	return (
		<Parameter>
			<div className="bg" style={{ flex: 1, minWidth: 0 }}>
				<input
					type="text"
					style={{ width: "100%", color }}
					value={values[0]}
					onChange={(e) => onChange(0, e.target.value)}
				/>
			</div>
			{[1, 2, 3, 4, 5].map((field) => (
				<NumberCell
					key={field}
					value={values[field]}
					onChange={(v) => onChange(field, v)}
				/>
			))}
		</Parameter>
	);
}

// Columns: Classe, Quantidade (frota), Capacidade de peso, Peso mínimo,
// Comprimento útil, Espaçamento.
const DUMMY_VEHICLES: string[][] = [
	["Classe A", "10", "15000", "10000", "5", "0,2"],
	["Classe B", "2", "35000", "25000", "14", "0,5"],
];

function VehiclesTable({
	rows,
	setCell,
	palette,
}: {
	rows: Row[];
	setCell: (id: string, field: number, value: string) => void;
	palette: Rgb[];
}) {
	useLayoutEffect(() => {
		recolor();
		refit();
	}, [rows.length]);

	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			<Label>
				<h3>Veículos</h3>
			</Label>
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<div className="bg">
					<TableLabel>
						<h4>Classe</h4>
					</TableLabel>
					<TableLabel>
						<h4>Quantidade</h4>
					</TableLabel>
					<TableLabel>
						<h4>Capacidade de peso (kg)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Peso mínimo (kg)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Comprimento útil (m)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Espaçamento (m)</h4>
					</TableLabel>
				</div>
				<div
					className="bg"
					style={{ flex: 1, flexDirection: "column", overflowY: "auto" }}
				>
					{rows.map((row, i) => (
						<Vehicle
							key={row.id}
							values={row.values}
							onChange={(field, value) => setCell(row.id, field, value)}
							color={toRgb(palette[i])}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function Controls({
	objective,
	setObjective,
	onSolve,
	onClear,
}: {
	objective: Objective;
	setObjective: (objective: Objective) => void;
	onSolve: () => void;
	onClear: () => void;
}) {
	return (
		<div className="bg" style={{ justifyContent: "center" }}>
			<div
				id="controls"
				style={{
					display: "flex",
					alignItems: "center",
					whiteSpace: "nowrap",
					margin: "var(--controls-margin) 0",
					gap: "var(--controls-margin)",
				}}
			>
				<label style={{ display: "flex", alignItems: "center" }}>
					<input
						id="cost-radio"
						type="radio"
						name="state"
						style={{ width: "auto" }}
						checked={objective === "cost"}
						onChange={() => setObjective("cost")}
					/>
					<span> Minimizar custo </span>
				</label>
				<label style={{ display: "flex", alignItems: "center" }}>
					<input
						id="vehicle-radio"
						type="radio"
						name="state"
						style={{ width: "auto" }}
						checked={objective === "vehicles"}
						onChange={() => setObjective("vehicles")}
					/>
					Minimizar veículos
				</label>
				<button id="solve-button" type="button" onClick={onSolve}>
					Calcular
				</button>
				<button id="clear-button" type="button" onClick={onClear}>
					Limpar
				</button>
			</div>
		</div>
	);
}

function AssignmentRow({
	order,
	name,
	color,
	trip,
	useLength,
}: {
	order: number;
	name: string;
	color: string;
	trip: Trip;
	useLength: boolean;
}) {
	return (
		<div className="bg" style={{ minHeight: "var(--row-height, 0px)" }}>
			<TableLabel>{order}</TableLabel>
			<TableLabel style={{ color }}>{name}</TableLabel>
			<TableLabel>{trip.units}</TableLabel>
			<TableLabel>{fmt(trip.w)}</TableLabel>
			<TableLabel>{fmt(trip.c)}</TableLabel>
			<TableLabel>{useLength ? fmtLen(trip.l) : "—"}</TableLabel>
		</div>
	);
}

const BOLD: React.CSSProperties = { fontWeight: "bold" };

function TotalRow({
	totalUnits,
	totalW,
	totalC,
}: {
	totalUnits: number;
	totalW: number;
	totalC: number;
}) {
	return (
		<div className="bg" style={{ minHeight: "var(--row-height, 0px)" }}>
			<TableLabel style={BOLD}>Total</TableLabel>
			<TableLabel> </TableLabel>
			<TableLabel style={BOLD}>{totalUnits}</TableLabel>
			<TableLabel style={BOLD}>{fmt(totalW)}</TableLabel>
			<TableLabel style={BOLD}>{fmt(totalC)}</TableLabel>
			<TableLabel> </TableLabel>
		</div>
	);
}

type Solved = { result: SolveResult; vehicles: Vehicle[]; colors: string[] };

function AssignmentsBody({ solved }: { solved: Solved | null }) {
	if (!solved) return null;

	const { result, vehicles, colors } = solved;

	if (result.status !== "success") {
		// Invalid input gets the specific guidance message (it's actionable); a
		// valid-but-unsolvable problem just reports that nothing was found.
		const message =
			result.status === "invalid"
				? result.message
				: "Nenhuma composição encontrada";
		return (
			<div
				className="bg"
				style={{ flexShrink: 0, minHeight: "var(--row-height, 0px)" }}
			>
				<TableLabel>{message}</TableLabel>
			</div>
		);
	}

	return (
		<>
			{result.compositions.map((composition, ci) => {
				let totalUnits = 0;
				let totalW = 0;
				let totalC = 0;
				const tripRows = composition.map((trip, ti) => {
					totalUnits += trip.units;
					totalW += trip.w;
					totalC += trip.c;
					return (
						<AssignmentRow
							// biome-ignore lint/suspicious/noArrayIndexKey: trips are positional and stable for a given solve
							key={ti}
							order={ti + 1}
							name={vehicles[trip.vIdx].name}
							color={colors[trip.vIdx]}
							trip={trip}
							useLength={result.config.useLength}
						/>
					);
				});
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: compositions are positional and stable for a given solve
					<div
						key={ci}
						className="bg"
						style={{ flexDirection: "column", flexShrink: 0 }}
					>
						<Label style={{ ...BOLD, minHeight: "var(--row-height, 0px)" }}>
							Composição {ci + 1} de {result.compositions.length}
						</Label>
						{tripRows}
						<TotalRow totalUnits={totalUnits} totalW={totalW} totalC={totalC} />
					</div>
				);
			})}
		</>
	);
}

function AssignmentsTable({ solved }: { solved: Solved | null }) {
	useLayoutEffect(() => {
		recolor();
		refit();
	}, [solved]);

	// The column header only makes sense over real composition rows; hide it
	// before the first solve and for message results (no solution / invalid input).
	const showHeader = solved?.result.status === "success";

	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
			{showHeader && (
				<div className="bg">
					<TableLabel>
						<h4>Ordem</h4>
					</TableLabel>
					<TableLabel>
						<h4>Classe</h4>
					</TableLabel>
					<TableLabel>
						<h4>Cargas carregadas</h4>
					</TableLabel>
					<TableLabel>
						<h4>Peso carregado (kg)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Peso cobrado (kg)</h4>
					</TableLabel>
					<TableLabel>
						<h4>Comprimento utilizado</h4>
					</TableLabel>
				</div>
			)}
			<div
				className="bg"
				style={{ flex: 1, flexDirection: "column", overflowY: "auto" }}
			>
				<AssignmentsBody solved={solved} />
			</div>
		</div>
	);
}

function isFilled(row: Row): boolean {
	return row.values.some((value) => value.trim() !== "");
}

function toItems(rows: Row[]): Item[] {
	return rows.filter(isFilled).map((row) => ({
		w: parseNumber(row.values[0]),
		l: parseNumber(row.values[1]),
	}));
}

function toVehicles(rows: Row[]): Vehicle[] {
	return rows.filter(isFilled).map((row, i) => ({
		name: row.values[0] || `Classe ${i + 1}`,
		fleet: Math.trunc(parseNumber(row.values[1])),
		W: parseNumber(row.values[2]),
		wmin: parseNumber(row.values[3]),
		L: parseNumber(row.values[4]),
		gap: parseNumber(row.values[5]),
	}));
}

export default function App() {
	const rootRef = useRef<HTMLDivElement>(null);
	const cargo = useGrowingRows(2, DUMMY_CARGO, "supreme-couscous:cargo");
	const fleet = useGrowingRows(6, DUMMY_VEHICLES, "supreme-couscous:fleet");
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
			<div className="bg oriented" style={{ flex: 1 }}>
				<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
					<Label>
						<h2>Parâmetros</h2>
					</Label>
					<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
						<CargoTable rows={cargo.rows} setCell={cargo.setCell} />
						<VehiclesTable
							rows={fleet.rows}
							setCell={fleet.setCell}
							palette={vehiclePalette}
						/>
					</div>
				</div>
				<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
					<Label>
						<h2>Resultados</h2>
					</Label>
					<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
						<Controls
							objective={objective}
							setObjective={setObjective}
							onSolve={handleSolve}
							onClear={handleClear}
						/>
						<AssignmentsTable solved={solved} />
					</div>
				</div>
			</div>
		</div>
	);
}
