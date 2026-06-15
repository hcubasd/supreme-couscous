import { NumberCell, Parameter } from "./primitives";

// Columns: Classe, Quantidade disponível (frota), Capacidade de peso, Quantidade
// de carretas, Comprimento da carreta, Espaçamento, Peso mínimo, Frete (R$/kg),
// Eixos, Pedágio (R$/eixo).
export const DUMMY_VEHICLES: string[][] = [
	["Classe A", "10", "15000", "1", "5", "0,2", "10000", "0,45", "9", "134,4"],
	["Classe B", "2", "35000", "2", "14", "0,5", "25000", "0,38", "7", "134,4"],
];

// One vehicle row: the free-text class name (tinted with its palette color) plus
// the nine numeric parameter fields.
export function Vehicle({
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
			{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((field) => (
				<NumberCell
					key={field}
					value={values[field]}
					onChange={(v) => onChange(field, v)}
				/>
			))}
		</Parameter>
	);
}
