import { useEffect, useState } from "react";
import { localizeDecimal } from "./number";

// The fleet is a nested structure: a list of vehicle classes, each with its own
// per-class fields and a variable list of trailers (carretas). The UI shows it
// collapsed (class fields once, trailers as rows); the CSV is its flat form.
//
// Class fields (order matches the table headers and toVehicles):
//   0 name · 1 quantidade · 2 pesoMáximo · 3 custoMínimo · 4 frete · 5 eixos · 6 pedágio
// Trailer fields:
//   0 capacidade · 1 comprimento · 2 espaço
export const CLASS_FIELDS = 7;
export const TRAILER_FIELDS = 3;

export type TrailerRow = { id: string; values: string[] };
export type ClassRow = { id: string; values: string[]; trailers: TrailerRow[] };

let nextId = 0;
const makeId = (): string => `fleet-${nextId++}`;

const emptyTrailer = (): TrailerRow => ({
	id: makeId(),
	values: Array(TRAILER_FIELDS).fill(""),
});
const emptyClass = (): ClassRow => ({
	id: makeId(),
	values: Array(CLASS_FIELDS).fill(""),
	trailers: [emptyTrailer()],
});

const trailerEmpty = (t: TrailerRow): boolean =>
	t.values.every((v) => v.trim() === "");
const classEmpty = (c: ClassRow): boolean =>
	c.values.every((v) => v.trim() === "") && c.trailers.every(trailerEmpty);

// Same growth rule as cargo rows, one level down: exactly one trailing empty
// trailer (the "new carreta" ghost), any other empty trailer dropped. The
// trailing ghost keeps its id so typing into it doesn't remount the input.
function normalizeTrailers(trailers: TrailerRow[]): TrailerRow[] {
	if (trailers.length === 0) return [emptyTrailer()];
	const last = trailers[trailers.length - 1];
	const head = trailers.slice(0, -1).filter((t) => !trailerEmpty(t));
	return trailerEmpty(last)
		? [...head, last]
		: [...head, last, emptyTrailer()];
}

// One trailing empty class (the "new class" ghost), any other fully-empty class
// dropped; every class's trailers are normalized too.
function normalizeClasses(classes: ClassRow[]): ClassRow[] {
	const normed = classes.map((c) => ({
		...c,
		trailers: normalizeTrailers(c.trailers),
	}));
	if (normed.length === 0) return [emptyClass()];
	const last = normed[normed.length - 1];
	const head = normed.slice(0, -1).filter((c) => !classEmpty(c));
	return classEmpty(last) ? [...head, last] : [...head, last, emptyClass()];
}

type StoredClass = { values: string[]; trailers: { values: string[] }[] };

// Seed fleet: class fields are [name, quantidade, pesoMáximo, custoMínimo, frete,
// eixos, pedágio]; trailer fields are [capacidade, comprimento, espaço]. Values
// use the pt-BR comma decimal (the canonical form the inputs and parseNumber use).
export const DUMMY_FLEET: StoredClass[] = [
	{
		values: ["Quarto eixo", "10", "40000", "11704", "0,3344", "9", "134,4"],
		trailers: [{ values: ["40000", "13,5", "0,6"] }],
	},
	{
		values: ["Rodotrem", "10", "49000", "14850", "0,33", "7", "134,4"],
		trailers: [
			{ values: ["49000", "7,1", "0,6"] },
			{ values: ["49000", "7,1", "0,6"] },
		],
	},
].map((c) => ({
	values: c.values.map(localizeDecimal),
	trailers: c.trailers.map((tr) => ({ values: tr.values.map(localizeDecimal) })),
}));

function loadStored(key: string): ClassRow[] | null {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		const ok =
			Array.isArray(parsed) &&
			parsed.every(
				(c: StoredClass) =>
					c &&
					Array.isArray(c.values) &&
					c.values.length === CLASS_FIELDS &&
					c.values.every((v) => typeof v === "string") &&
					Array.isArray(c.trailers) &&
					c.trailers.every(
						(t) =>
							Array.isArray(t.values) &&
							t.values.length === TRAILER_FIELDS &&
							t.values.every((v) => typeof v === "string"),
					),
			);
		if (!ok) return null;
		return (parsed as StoredClass[]).map((c) => ({
			id: makeId(),
			values: c.values,
			trailers: c.trailers.map((t) => ({ id: makeId(), values: t.values })),
		}));
	} catch {
		return null;
	}
}

// Coerce a raw nested shape (e.g. CSV import) into class rows, padding/truncating
// every value list to the right width so a malformed file can't corrupt the schema.
function shape(incoming: StoredClass[]): ClassRow[] {
	const fit = (values: string[], n: number) => {
		const cells = values.slice(0, n);
		while (cells.length < n) cells.push("");
		return cells;
	};
	return incoming.map((c) => ({
		id: makeId(),
		values: fit(c.values, CLASS_FIELDS),
		trailers: (c.trailers.length ? c.trailers : [{ values: [] }]).map((t) => ({
			id: makeId(),
			values: fit(t.values, TRAILER_FIELDS),
		})),
	}));
}

export type FleetController = ReturnType<typeof useGrowingFleet>;

export function useGrowingFleet(initial: StoredClass[] = [], storageKey?: string) {
	const [classes, setClasses] = useState<ClassRow[]>(() => {
		const stored = storageKey ? loadStored(storageKey) : null;
		return normalizeClasses(stored ?? shape(initial));
	});

	useEffect(() => {
		if (!storageKey) return;
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify(
					classes.map((c) => ({
						values: c.values,
						trailers: c.trailers.map((t) => ({ values: t.values })),
					})),
				),
			);
		} catch {
			// Best-effort persistence; never blocks the UI.
		}
	}, [storageKey, classes]);

	const setClassCell = (classId: string, field: number, value: string) => {
		setClasses((prev) =>
			normalizeClasses(
				prev.map((c) =>
					c.id === classId
						? { ...c, values: c.values.map((v, i) => (i === field ? value : v)) }
						: c,
				),
			),
		);
	};

	const setTrailerCell = (
		classId: string,
		trailerId: string,
		field: number,
		value: string,
	) => {
		setClasses((prev) =>
			normalizeClasses(
				prev.map((c) =>
					c.id === classId
						? {
								...c,
								trailers: c.trailers.map((t) =>
									t.id === trailerId
										? {
												...t,
												values: t.values.map((v, i) => (i === field ? value : v)),
											}
										: t,
								),
							}
						: c,
				),
			),
		);
	};

	const clear = () => setClasses(normalizeClasses([]));

	const replace = (incoming: StoredClass[]) =>
		setClasses(normalizeClasses(shape(incoming)));

	return { classes, setClassCell, setTrailerCell, clear, replace };
}

// CSV (flat, one row per trailer) ↔ nested classes, the Option-A convention: each
// trailer row repeats its class fields. Grouping: a new class name starts a class;
// the same name again, or a blank name, continues the current one (so both the
// repeat and the collapsed styles parse). Column layout per row:
//   0 name · 1..6 class fields · 7 carreta (informational) · 8..10 trailer fields
export function rowsToClasses(rows: string[][]): StoredClass[] {
	const groups: StoredClass[] = [];
	let current: StoredClass | null = null;
	for (const row of rows) {
		const name = (row[0] ?? "").trim();
		if (name !== "" && (!current || current.values[0] !== name)) {
			current = { values: row.slice(0, CLASS_FIELDS), trailers: [] };
			groups.push(current);
		}
		if (!current) continue; // leading blank-name rows have no class to join
		current.trailers.push({ values: row.slice(8, 8 + TRAILER_FIELDS) });
	}
	return groups;
}

// Flatten the live classes to CSV rows: one row per non-empty trailer, the class
// fields repeated, with an automatic carreta number in column 7. Empty classes and
// trailers (the ghost rows) are skipped.
export function classesToRows(classes: ClassRow[]): string[][] {
	const rows: string[][] = [];
	for (const c of classes) {
		if (classEmpty(c)) continue;
		c.trailers
			.filter((t) => !trailerEmpty(t))
			.forEach((t, i) => {
				rows.push([...c.values, String(i + 1), ...t.values]);
			});
	}
	return rows;
}
