import { useState } from "react";

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

export function useGrowingRows(fieldCount: number, initial: string[][] = []) {
	const [rows, setRows] = useState<Row[]>(() =>
		normalize(
			initial.map((values) => ({ id: makeId(), values })),
			fieldCount,
		),
	);

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

	return { rows, setCell };
}
