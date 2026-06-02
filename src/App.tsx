import { colorBg, squeezeFg } from "psychic-potato";
import { useEffect, useRef } from "react";
import { solve } from "./helpers/solver";

function Label({
	children,
	style,
}: {
	children: React.ReactNode;
	style?: React.CSSProperties;
}) {
	return (
		<div className="bg" style={{ justifyContent: "center", ...style }}>
			<div className="fg" style={{ whiteSpace: "nowrap" }}>
				{children}
			</div>
		</div>
	);
}

function TableLabel({ children }: { children: React.ReactNode }) {
	return <Label style={{ flex: 1, minWidth: 0 }}>{children}</Label>;
}

function Cargo() {
	return (
		<div className="bg" style={{ alignItems: 'center' }}>
			<TableLabel>
				1
			</TableLabel>
			<div className="bg" style={{ flex: 1, minWidth: 0 }}>
				<input type="number" style={{ width: "100%" }} />
			</div>
			<div className="bg" style={{ flex: 1, minWidth: 0 }}>
				<input type="number" style={{ width: "100%" }} />
			</div>
		</div>
	);
}

function CargoTable() {
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
				<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
					<Cargo />
				</div>
			</div>
		</div>
	);
}

function Vehicle() {
	return (
		<div className="bg">
			<div className="bg" style={{ flex: 1, minWidth: 0 }}>
				<input type="text" style={{ width: "100%" }} />
			</div>
			<div className="bg" style={{ flex: 1, minWidth: 0 }}>
				<input type="number" style={{ width: "100%" }} />
			</div>
			<div className="bg" style={{ flex: 1, minWidth: 0 }}>
				<input type="number" style={{ width: "100%" }} />
			</div>
			<div className="bg" style={{ flex: 1, minWidth: 0 }}>
				<input type="number" style={{ width: "100%" }} />
			</div>
			<div className="bg" style={{ flex: 1, minWidth: 0 }}>
				<input type="number" style={{ width: "100%" }} />
			</div>
			<div className="bg" style={{ flex: 1, minWidth: 0 }}>
				<input type="number" style={{ width: "100%" }} />
			</div>
		</div>
	);
}

function VehiclesTable() {
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
				<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
					<Vehicle />
				</div>
			</div>
		</div>
	);
}

function Controls() {
	useEffect(() => {
		function onResize() {
		}
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);

	}, []);
	return (
		<div className="bg" style={{ justifyContent: "center" }}>
			<div id='controls' style={{
				display: "flex",
				whiteSpace: "nowrap",
				margin: 'var(--controls-margin) 0',
				gap: 'var(--controls-margin)'
			}}>
				<label style={{ display: "flex", alignItems: "center" }}>
					<input type="radio" name="state" style={{ width: "auto" }} />
					Minimizar custo
				</label>
				<label style={{ display: "flex", alignItems: "center" }}>
					<input type="radio" name="state" style={{ width: "auto" }} />
					Minimizar veículos
				</label>
				<button type="button" onClick={solve}>
					Calcular
				</button>
			</div>
		</div>
	);
}

function Assignment() {
	return (
		<div className="bg">
			<TableLabel> </TableLabel>
			<TableLabel> </TableLabel>
			<TableLabel> </TableLabel>
			<TableLabel> </TableLabel>
			<TableLabel> </TableLabel>
			<TableLabel> </TableLabel>
		</div>
	);
}

function AssignmentsTable() {
	return (
		<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
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
			<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
				<Assignment />
			</div>
		</div>
	);
}

export default function App() {
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) throw new Error("No root element found");
		colorBg(root, { startL: 75, endL: 100 });
		const onResize = () => {
			document.documentElement.style.setProperty(
				"--font-size",
				`${squeezeFg(root)}px`,
			);
			
			const h3 = document.querySelector('h3');
			if (!h3) throw new Error('No h3 element found')
			const controls = document.getElementById('controls');
			if (!controls) throw new Error('No controls element found')

			const h3Margin = parseFloat(getComputedStyle(h3).marginBlockStart);
			const h3Height = parseFloat(getComputedStyle(h3).height);

			const controlsHeight = parseFloat(getComputedStyle(controls).height);
			const controlsMargin = h3Margin + h3Height / 2 - controlsHeight / 2;
			
			document.documentElement.style.setProperty('--controls-margin', `${controlsMargin}px`);
		};

		onResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	return (
		<div
			ref={rootRef}
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
						<CargoTable />
						<VehiclesTable />
					</div>
				</div>
				<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
					<Label>
						<h2>Resultados</h2>
					</Label>
					<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
						<Controls />
						<AssignmentsTable />
					</div>
				</div>
			</div>
		</div>
	);
}
