// CSV structure only — no number formatting, no locale. The field delimiter is
// the locale signal: a convention that writes decimals with a comma can't also
// separate fields with one, so it uses a semicolon. Import reports which decimal
// the file uses (';' → comma decimal, ',' → dot decimal); number.ts does the
// actual number conversion. Export is handed its delimiter by the caller.

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

// Structured so the UI can localize the wording.
export type ImportError =
	| { kind: "empty" }
	| { kind: "columns"; line: number; expected: number; got: number };

export type ImportResult =
	| { ok: true; rows: string[][]; decimal: "," | "." }
	| { ok: false; error: ImportError };

// Parse CSV text (with a header row) into raw data rows, each required to have
// exactly `columns` fields. Returns the file's decimal char so number.ts can
// interpret the cells. All-or-nothing: a single wrong-width row rejects the import.
export function importRows(text: string, columns: number): ImportResult {
	const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length === 0) return { ok: false, error: { kind: "empty" } };

	const delimiter = detectDelimiter(lines[0]);
	const data = lines.slice(1).map((line) => splitLine(line, delimiter));

	const wrong = data.findIndex((row) => row.length !== columns);
	if (wrong !== -1) {
		return {
			ok: false,
			// +2: the header is line 1, data rows start at line 2.
			error: { kind: "columns", line: wrong + 2, expected: columns, got: data[wrong].length },
		};
	}

	return { ok: true, rows: data, decimal: delimiter === ";" ? "," : "." };
}

// Build CSV text from a header and rows with the given delimiter, CRLF line
// endings, and RFC-4180 quoting for any field carrying the delimiter, a quote, or
// a newline.
export function toCsv(
	header: string[],
	rows: string[][],
	delimiter: string,
): string {
	const esc = (field: string) =>
		field.includes(delimiter) || /["\n\r]/.test(field)
			? `"${field.replace(/"/g, '""')}"`
			: field;
	const line = (fields: string[]) => fields.map(esc).join(delimiter);
	return [header, ...rows].map(line).join("\r\n");
}
