// CSV import for the parameter tables.
//
// The field delimiter doubles as the locale signal, because the two are causally
// linked: a convention that writes decimals with a comma can't also use the comma
// as a field separator, so it uses a semicolon. We exploit that to disambiguate
// numbers with zero guessing:
//
//   ;  → comma is the decimal, dot is the thousands group   (pt-BR / European)
//   ,  → dot is the decimal,  comma is the thousands group   (US / English)
//
// Tab is the only genuinely ambiguous separator; we don't claim TSV support, so
// it's ignored (a tab-separated file falls through to the comma path and will
// just fail the column-count check).

type Delimiter = ";" | ",";

// Scan outside quotes: a semicolon anywhere means the file is semicolon-delimited.
function detectDelimiter(line: string): Delimiter {
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (c === '"') inQuotes = !inQuotes;
		else if (!inQuotes && c === ";") return ";";
	}
	return ",";
}

// RFC-4180 line split: quoted fields may contain the delimiter, "" is a literal
// quote. Each field is trimmed of surrounding whitespace.
function splitLine(line: string, delimiter: Delimiter): string[] {
	const fields: string[] = [];
	let cur = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (inQuotes) {
			if (c === '"') {
				if (line[i + 1] === '"') {
					cur += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				cur += c;
			}
		} else if (c === '"') {
			inQuotes = true;
		} else if (c === delimiter) {
			fields.push(cur);
			cur = "";
		} else {
			cur += c;
		}
	}
	fields.push(cur);

	return fields.map((f) => f.trim());
}

// Rewrite a numeric cell into the app's canonical comma-decimal form, using the
// delimiter to decide which separator is the decimal. Non-numeric cells (vehicle
// names, blanks) are left untouched.
function normalizeNumber(cell: string, delimiter: Delimiter): string {
	if (!/^[\d.,]+$/.test(cell)) return cell;

	return delimiter === ";"
		? cell.replace(/\./g, "") // pt-BR: dot is thousands, comma already decimal
		: cell.replace(/,/g, "").replace(".", ","); // US: strip thousands, dot → comma
}

export type ImportResult =
	| { ok: true; rows: string[][] }
	| { ok: false; error: string };

// Parse CSV text into normalized rows, requiring every row to have exactly
// `columns` fields. It's all-or-nothing: a single wrong-width row rejects the
// whole import, so we never have to guess which columns a short row meant.
export function importCsv(text: string, columns: number): ImportResult {
	const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length === 0) return { ok: false, error: "O arquivo está vazio." };

	const delimiter = detectDelimiter(lines[0]);
	const rows = lines.map((line) => splitLine(line, delimiter));

	const wrong = rows.findIndex((row) => row.length !== columns);
	if (wrong !== -1) {
		return {
			ok: false,
			error: `Esperadas ${columns} colunas por linha, mas a linha ${
				wrong + 1
			} tem ${rows[wrong].length}.`,
		};
	}

	return {
		ok: true,
		rows: rows.map((row) => row.map((cell) => normalizeNumber(cell, delimiter))),
	};
}
