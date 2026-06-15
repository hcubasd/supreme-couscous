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

// The locale's decimal character (for the input/seed display) and the CSV export
// delimiter (the comma-decimal locale must delimit with a semicolon).
export const DECIMAL = LOCALE === "pt-BR" ? "," : ".";
export const CSV_DELIMITER = LOCALE === "pt-BR" ? ";" : ",";

// Show a numeric string with the locale's decimal char (≤ one separator already,
// guaranteed by the input filter). Non-numeric strings (names, blanks) pass through.
export function localizeDecimal(value: string): string {
	if (value === "" || !/^\d*[.,]?\d*$/.test(value)) return value;
	return value.replace(/[.,]/, DECIMAL);
}

// A numeric cell, canonicalized for CSV export: parse it (locale-agnostic) and
// re-emit with the locale's decimal char, no thousands grouping. Guarantees the
// file matches its delimiter regardless of which separator the user typed.
export function csvNumber(value: string): string {
	if (value.trim() === "" || !/^\d*[.,]?\d*$/.test(value)) return value;
	return String(parseFloat(value.replace(/,/g, "."))).replace(".", DECIMAL);
}

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
	cargoCount: string;
	selectedCargo: string;
	weightUsedKg: string;
	lengthUsedM: string;
	chargedWeightKg: string;
	cost: string;
	noComposition: string;
	showingOptima: (shown: string, total: string) => string;
	clearConfirm: string;
	cargoFile: string;
	vehiclesFile: string;
	resultsFile: string;
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
		cargoCount: "Quantidade de cargas",
		selectedCargo: "Cargas selecionadas",
		weightUsedKg: "Peso utilizado (kg)",
		lengthUsedM: "Comprimento utilizado (m)",
		chargedWeightKg: "Peso cobrado (kg)",
		cost: "Custo",
		noComposition: "Nenhuma composição encontrada",
		showingOptima: (shown, total) =>
			`Mostrando ${shown} de ${total} composições ótimas`,
		clearConfirm: "Deseja limpar todos os parâmetros?",
		cargoFile: "cargas.csv",
		vehiclesFile: "veiculos.csv",
		resultsFile: "resultado.csv",
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
		cargo: "Cargo",
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
		cargoCount: "Cargo count",
		selectedCargo: "Selected cargo",
		weightUsedKg: "Weight used (kg)",
		lengthUsedM: "Length used (m)",
		chargedWeightKg: "Charged weight (kg)",
		cost: "Cost",
		noComposition: "No composition found",
		showingOptima: (shown, total) =>
			`Showing ${shown} of ${total} optimal compositions`,
		clearConfirm: "Clear all parameters?",
		cargoFile: "cargo.csv",
		vehiclesFile: "vehicles.csv",
		resultsFile: "results.csv",
		errors: {
			needCargoAndVehicle: "Enter at least one cargo and one vehicle class.",
			needCarreta: "Each vehicle class needs at least one trailer.",
			nonNegative: "Use only values greater than or equal to zero.",
		},
	},
};

export const t = STRINGS[LOCALE];
