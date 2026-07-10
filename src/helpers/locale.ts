// Localization. Two locales we can vouch for: pt-BR and en-US. We detect exactly
// pt-BR (so pt-PT and everything else fall to en-US) once at load.
//
// The split with numbers:
//   - parsing is locale-agnostic (see parseNumber) — the solver never cares;
//   - display, the input/seed decimal char, and CSV export all follow the locale;
//   - CSV import stays content-detected (the file's delimiter reveals its decimal).

import type { InvalidKey } from "./optimizer";

export type Locale = "pt-BR" | "en-US";

const OVERRIDE_KEY = "supreme-couscous:locale-override";

function readOverride(): Locale | null {
	if (typeof localStorage === "undefined") return null;
	const stored = localStorage.getItem(OVERRIDE_KEY);
	return stored === "pt-BR" || stored === "en-US" ? stored : null;
}

const detected =
	typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
const autoDetected: Locale = detected.startsWith("pt-br") ? "pt-BR" : "en-US";

export const LOCALE: Locale = readOverride() ?? autoDetected;

// The label for the toggle always names the *other* locale — a language code
// is deliberately not translated, so it reads regardless of which language
// the operator currently can't understand.
export const OTHER_LOCALE_LABEL: Record<Locale, string> = {
	"pt-BR": "EN",
	"en-US": "PT",
};

// Persist the other locale and reload. A full reload is deliberate: LOCALE,
// t, DECIMAL, and CSV_DELIMITER are all derived once at module load, so
// re-running that derivation from scratch is simpler and safer than
// threading locale as reactive state through every component that imports
// `t`.
export function switchLocale(): void {
	if (typeof localStorage === "undefined") return;
	const other: Locale = LOCALE === "pt-BR" ? "en-US" : "pt-BR";
	localStorage.setItem(OVERRIDE_KEY, other);
	window.location.reload();
}

// The locale's decimal character (number.ts formats with it) and the CSV export
// delimiter (the comma-decimal locale must delimit with a semicolon).
export const DECIMAL = LOCALE === "pt-BR" ? "," : ".";
export const CSV_DELIMITER = LOCALE === "pt-BR" ? ";" : ",";

type Strings = {
	appTitle: string;
	parameters: string;
	results: string;
	compositions: string;
	cargo: string;
	vehicles: string;
	importBtn: string;
	exportBtn: string;
	calculate: string;
	clear: string;
	order: string;
	weightKg: string;
	dimensionM: string;
	klass: string;
	availableQty: string;
	maxWeightKg: string;
	minCharge: string;
	freightPerKg: string;
	axles: string;
	tollPerAxle: string;
	trailer: string;
	trailerCapacityKg: string;
	trailerDimensionM: string;
	spacingM: string;
	composition: string;
	quantity: string;
	cargos: string;
	freightCost: string;
	tollCost: string;
	cost: string;
	noComposition: string;
	showingOptima: (shown: string, total: string) => string;
	calculateConfirm: string;
	clearCargoConfirm: string;
	clearVehiclesConfirm: string;
	clearResultsConfirm: string;
	cargoFile: string;
	vehiclesFile: string;
	resultsFile: string;
	importEmpty: string;
	importColumns: (line: number, expected: number, got: number) => string;
	back: string;
	errors: Record<InvalidKey, string>;
};

const STRINGS: Record<Locale, Strings> = {
	"pt-BR": {
		appTitle:
			"Alocador exato de frota para operações de transporte de cargas pesadas",
		parameters: "Parâmetros",
		results: "Resultados",
		compositions: "Composições",
		cargo: "Cargas",
		vehicles: "Veículos",
		importBtn: "Importar",
		exportBtn: "Exportar",
		calculate: "Calcular",
		clear: "Limpar",
		order: "Ordem",
		weightKg: "Peso (kg)",
		dimensionM: "Dimensão (m)",
		klass: "Classe",
		availableQty: "Quantidade disponível",
		maxWeightKg: "Peso máximo (kg)",
		minCharge: "Custo mínimo",
		freightPerKg: "Frete (por kg)",
		axles: "Eixos",
		tollPerAxle: "Pedágio (por eixo)",
		trailer: "Carreta",
		trailerCapacityKg: "Capacidade da carreta (kg)",
		trailerDimensionM: "Dimensão da carreta (m)",
		spacingM: "Espaço das cargas (m)",
		composition: "Composição",
		quantity: "Quantidade",
		cargos: "Cargas",
		freightCost: "Frete",
		tollCost: "Pedágio",
		cost: "Custo",
		noComposition: "Nenhuma composição encontrada",
		showingOptima: (shown, total) =>
			`Mostrando ${shown} de ${total} composições ótimas`,
		calculateConfirm: "Executar a otimização?",
		clearCargoConfirm: "Limpar todas as cargas?",
		clearVehiclesConfirm: "Limpar todos os veículos?",
		clearResultsConfirm: "Limpar os resultados?",
		cargoFile: "cargas.csv",
		vehiclesFile: "veiculos.csv",
		resultsFile: "resultado.csv",
		importEmpty: "O arquivo está vazio.",
		importColumns: (line, expected, got) =>
			`Esperadas ${expected} colunas por linha, mas a linha ${line} tem ${got}.`,
		back: "Voltar",
		errors: {
			needCargoAndVehicle:
				"Informe ao menos uma carga e uma classe de veículo.",
			needCarreta: "Cada classe de veículo precisa de ao menos uma carreta.",
			nonNegative: "Use apenas valores maiores ou iguais a zero.",
		},
	},
	"en-US": {
		appTitle: "Exact fleet allocator for heavy-cargo transport operations",
		parameters: "Parameters",
		results: "Results",
		compositions: "Compositions",
		cargo: "Cargoes",
		vehicles: "Vehicles",
		importBtn: "Import",
		exportBtn: "Export",
		calculate: "Calculate",
		clear: "Clear",
		order: "Order",
		weightKg: "Weight (kg)",
		dimensionM: "Dimension (m)",
		klass: "Class",
		availableQty: "Available quantity",
		maxWeightKg: "Max weight (kg)",
		minCharge: "Minimum charge",
		freightPerKg: "Freight (per kg)",
		axles: "Axles",
		tollPerAxle: "Toll (per axle)",
		trailer: "Trailer",
		trailerCapacityKg: "Trailer capacity (kg)",
		trailerDimensionM: "Trailer dimension (m)",
		spacingM: "Cargo spacing (m)",
		composition: "Composition",
		quantity: "Quantity",
		cargos: "Cargoes",
		freightCost: "Freight",
		tollCost: "Toll",
		cost: "Cost",
		noComposition: "No composition found",
		showingOptima: (shown, total) =>
			`Showing ${shown} of ${total} optimal compositions`,
		calculateConfirm: "Run the optimization?",
		clearCargoConfirm: "Clear all cargo?",
		clearVehiclesConfirm: "Clear all vehicles?",
		clearResultsConfirm: "Clear the results?",
		cargoFile: "cargo.csv",
		vehiclesFile: "vehicles.csv",
		resultsFile: "results.csv",
		importEmpty: "The file is empty.",
		importColumns: (line, expected, got) =>
			`Expected ${expected} columns per row, but line ${line} has ${got}.`,
		back: "Back",
		errors: {
			needCargoAndVehicle: "Enter at least one cargo and one vehicle class.",
			needCarreta: "Each vehicle class needs at least one trailer.",
			nonNegative: "Use only values greater than or equal to zero.",
		},
	},
};

export const t = STRINGS[LOCALE];
