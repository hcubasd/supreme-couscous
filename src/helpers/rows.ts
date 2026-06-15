import { useEffect, useState } from "react";

// A row is just its editable field values, keyed by a stable id so React keeps
// input identity (and focus) as rows are added and removed around it.
export type Row = { id: string; values: string[] };

let nextId = 0;
function makeId(): string {
	return `row-${nextId++}`;
}

function emptyRow(fieldCount: number): Row {
	return { id: makeId(), values: Array(fieldCount).fill("") };
}

function isEmpty(row: Row): boolean {
	return row.values.every((value) => value.trim() === "");
}

// The collection rules, in one place:
//   - exactly one empty row always sits at the bottom (the "new row")
//   - any other fully-empty row is dropped
// The trailing empty row keeps its identity so typing into it doesn't remount
// the input mid-keystroke (which would drop focus).
function normalize(rows: Row[], fieldCount: number): Row[] {
	if (rows.length === 0) return [emptyRow(fieldCount)];

	const last = rows[rows.length - 1];
	const head = rows.slice(0, -1).filter((row) => !isEmpty(row));

	return isEmpty(last)
		? [...head, last]
		: [...head, last, emptyRow(fieldCount)];
}

// Restore previously persisted row values, but only if they still match the
// current schema (right shape and field count). Anything malformed or stale is
// ignored so the caller falls back to its seed data.
function loadStored(key: string, fieldCount: number): string[][] | null {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		const valid =
			Array.isArray(parsed) &&
			parsed.every(
				(row) =>
					Array.isArray(row) &&
					row.length === fieldCount &&
					row.every((value) => typeof value === "string"),
			);
		return valid ? (parsed as string[][]) : null;
	} catch {
		return null;
	}
}

// `storageKey`, when given, persists the row values to localStorage and restores
// them on the next load — params survive a refresh. Results are never stored.
export function useGrowingRows(
	fieldCount: number,
	initial: string[][] = [],
	storageKey?: string,
) {
	const [rows, setRows] = useState<Row[]>(() => {
		const stored = storageKey ? loadStored(storageKey, fieldCount) : null;
		return normalize(
			(stored ?? initial).map((values) => ({ id: makeId(), values })),
			fieldCount,
		);
	});

	useEffect(() => {
		if (!storageKey) return;
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify(rows.map((row) => row.values)),
			);
		} catch {
			// Storage may be unavailable (private mode, quota); persistence is
			// best-effort and never blocks the UI.
		}
	}, [storageKey, rows]);

	const setCell = (id: string, field: number, value: string) => {
		setRows((prev) =>
			normalize(
				prev.map((row) =>
					row.id === id
						? {
								...row,
								values: row.values.map((v, i) => (i === field ? value : v)),
							}
						: row,
				),
				fieldCount,
			),
		);
	};

	// Drop every row back to a single empty one. The persist effect then writes
	// the cleared state, so it survives a reload too.
	const clear = () => setRows(normalize([], fieldCount));

	// Replace every row with the given values (e.g. a CSV import). Each incoming
	// row is coerced to exactly fieldCount cells — short rows padded, long rows
	// truncated — so a file with the wrong width can't corrupt the schema.
	const replace = (incoming: string[][]) => {
		const shaped = incoming.map((values) => {
			const cells = values.slice(0, fieldCount);
			while (cells.length < fieldCount) cells.push("");
			return { id: makeId(), values: cells };
		});
		setRows(normalize(shaped, fieldCount));
	};

	return { rows, setCell, clear, replace };
}

// The handle returned by useGrowingRows — passed down so components can read the
// rows and mutate them (edit a cell, clear, or replace via import).
export type RowController = ReturnType<typeof useGrowingRows>;
