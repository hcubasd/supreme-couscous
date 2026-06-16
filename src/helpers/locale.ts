// Localization. Two locales we can vouch for: pt-BR and en-US. We detect exactly
// pt-BR (so pt-PT and everything else fall to en-US) once at load.
//
// The split with numbers:
//   - parsing is locale-agnostic (see parseNumber) — the solver never cares;
//   - display, the input/seed decimal char, and CSV export all follow the locale;
//   - CSV import stays content-detected (the file's delimiter reveals its decimal).

import type { InvalidKey } from "./optimizer";

export type Locale = "pt-BR" | "en-US";

const detected =
	typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
export const LOCALE: Locale = detected.startsWith("pt-br") ? "pt-BR" : "en-US";

// The locale's decimal character (number.ts formats with it) and the CSV export
// delimiter (the comma-decimal locale must delimit with a semicolon).
export const DECIMAL = LOCALE === "pt-BR" ? "," : ".";
export const CSV_DELIMITER = LOCALE === "pt-BR" ? ";" : ",";

type Strings = {
	appTitle: string;
	parameters: string;
	results: string;
	cargo: string;
	vehicles: string;
	importBtn: string;
	exportBtn: string;
	calculate: string;
	clear: string;
	minimizeCost: string;
	minimizeVehicles: string;
	order: string;
	weightKg: string;
	lengthM: string;
	klass: string;
	availableQty: string;
	maxWeightKg: string;
	minCharge: string;
	freightPerKg: string;
	axles: string;
	tollPerAxle: string;
	trailer: string;
	trailerCapacityKg: string;
	trailerLengthM: string;
	spacingM: string;
	composition: string;
	quantity: string;
	cargos: string;
	freightCost: string;
	tollCost: string;
	cost: string;
	noComposition: string;
	showingOptima: (shown: string, total: string) => string;
	clearConfirm: string;
	cargoFile: string;
	vehiclesFile: string;
	resultsFile: string;
	importEmpty: string;
	importColumns: (line: number, expected: number, got: number) => string;
	errors: Record<InvalidKey, string>;
};

const STRINGS: Record<Locale, Strings> = {
	"pt-BR": {
		appTitle:
			"Alocador exato de frota para operações de transporte de cargas pesadas",
		parameters: "Parâmetros",
		results: "Resultados",
		cargo: "Cargas",
		vehicles: "Veículos",
		importBtn: "Importar",
		exportBtn: "Exportar",
		calculate: "Calcular",
		clear: "Limpar",
		minimizeCost: "Minimizar custo",
		minimizeVehicles: "Minimizar veículos",
		order: "Ordem",
		weightKg: "Peso (kg)",
		lengthM: "Comprimento (m)",
		klass: "Classe",
		availableQty: "Quantidade disponível",
		maxWeightKg: "Peso máximo (kg)",
		minCharge: "Custo mínimo",
		freightPerKg: "Frete (por kg)",
		axles: "Eixos",
		tollPerAxle: "Pedágio (por eixo)",
		trailer: "Carreta",
		trailerCapacityKg: "Capacidade da carreta (kg)",
		trailerLengthM: "Comprimento da carreta (m)",
		spacingM: "Espaço entre cargas (m)",
		composition: "Composição",
		quantity: "Quantidade",
		cargos: "Cargas",
		freightCost: "Frete",
		tollCost: "Pedágio",
		cost: "Custo",
		noComposition: "Nenhuma composição encontrada",
		showingOptima: (shown, total) =>
			`Mostrando ${shown} de ${total} composições ótimas`,
		clearConfirm: "Deseja limpar?",
		cargoFile: "cargas.csv",
		vehiclesFile: "veiculos.csv",
		resultsFile: "resultado.csv",
		importEmpty: "O arquivo está vazio.",
		importColumns: (line, expected, got) =>
			`Esperadas ${expected} colunas por linha, mas a linha ${line} tem ${got}.`,
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
		cargo: "Cargoes",
		vehicles: "Vehicles",
		importBtn: "Import",
		exportBtn: "Export",
		calculate: "Calculate",
		clear: "Clear",
		minimizeCost: "Minimize cost",
		minimizeVehicles: "Minimize vehicles",
		order: "Order",
		weightKg: "Weight (kg)",
		lengthM: "Length (m)",
		klass: "Class",
		availableQty: "Available quantity",
		maxWeightKg: "Max weight (kg)",
		minCharge: "Minimum charge",
		freightPerKg: "Freight (per kg)",
		axles: "Axles",
		tollPerAxle: "Toll (per axle)",
		trailer: "Trailer",
		trailerCapacityKg: "Trailer capacity (kg)",
		trailerLengthM: "Trailer length (m)",
		spacingM: "Spacing between cargo (m)",
		composition: "Composition",
		quantity: "Quantity",
		cargos: "Cargoes",
		freightCost: "Freight",
		tollCost: "Toll",
		cost: "Cost",
		noComposition: "No composition found",
		showingOptima: (shown, total) =>
			`Showing ${shown} of ${total} optimal compositions`,
		clearConfirm: "Clear?",
		cargoFile: "cargo.csv",
		vehiclesFile: "vehicles.csv",
		resultsFile: "results.csv",
		importEmpty: "The file is empty.",
		importColumns: (line, expected, got) =>
			`Expected ${expected} columns per row, but line ${line} has ${got}.`,
		errors: {
			needCargoAndVehicle: "Enter at least one cargo and one vehicle class.",
			needCarreta: "Each vehicle class needs at least one trailer.",
			nonNegative: "Use only values greater than or equal to zero.",
		},
	},
};

export const t = STRINGS[LOCALE];
