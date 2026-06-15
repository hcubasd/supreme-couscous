// CSV import/export for the parameter tables.
//
// Files carry a header row (so they read cleanly in Excel) and use the field
// delimiter as the locale signal, because the two are causally linked — a
// convention that writes decimals with a comma can't also separate fields with
// one, so it uses a semicolon:
//
//   ;  → comma is the decimal, dot is the thousands group   (pt-BR / European)
//   ,  → dot is the decimal,  comma is the thousands group   (US / English)
//
// Import drops the header row and normalizes every numeric cell to the app's
// canonical comma-decimal form. Export writes the header and uses ';' (pt-BR),
// matching the comma-decimal values the inputs already store.

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
// delimiter to decide which separator is the decimal. Non-numeric cells (names,
// blanks) are left untouched.
function normalizeNumber(cell: string, delimiter: Delimiter): string {
	if (!/^[\d.,]+$/.test(cell)) return cell;

	return delimiter === ";"
		? cell.replace(/\./g, "") // pt-BR: dot is thousands, comma already decimal
		: cell.replace(/,/g, "").replace(".", ","); // US: strip thousands, dot → comma
}

export type ImportResult =
	| { ok: true; rows: string[][] }
	| { ok: false; error: string };

// Parse CSV text (with a header row) into normalized data rows, each required to
// have exactly `columns` fields. All-or-nothing: a single wrong-width row rejects
// the whole import. Line numbers in errors count the header, so they match the file.
export function importRows(text: string, columns: number): ImportResult {
	const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length === 0) return { ok: false, error: "O arquivo está vazio." };

	const delimiter = detectDelimiter(lines[0]);
	const data = lines.slice(1).map((line) => splitLine(line, delimiter));

	const wrong = data.findIndex((row) => row.length !== columns);
	if (wrong !== -1) {
		return {
			ok: false,
			error: `Esperadas ${columns} colunas por linha, mas a linha ${
				wrong + 2
			} tem ${data[wrong].length}.`,
		};
	}

	return {
		ok: true,
		rows: data.map((row) => row.map((cell) => normalizeNumber(cell, delimiter))),
	};
}

// Build CSV text from a header and rows: ';'-delimited (pt-BR), CRLF line endings,
// RFC-4180 quoting for any field carrying a delimiter, quote, or newline.
export function toCsv(header: string[], rows: string[][]): string {
	const esc = (field: string) =>
		/[;"\n\r]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
	const line = (fields: string[]) => fields.map(esc).join(";");
	return [header, ...rows].map(line).join("\r\n");
}
