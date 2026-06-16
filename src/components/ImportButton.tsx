import { useRef } from "react";
import { ANSI } from "../helpers/color";
import { importRows } from "../helpers/csv";
import { t } from "../helpers/locale";

// A file picker dressed as a plain button: the visible button proxies a click to
// a hidden file input, reads the chosen CSV, validates it against the expected
// column count, and either hands the rows (with the file's decimal char) up or
// alerts on a malformed file. The error wording is localized here, where t lives.
export function ImportButton({
	columns,
	onRows,
}: {
	columns: number;
	onRows: (rows: string[][], decimal: string) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<>
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				title={t.importBtn}
				aria-label={t.importBtn}
				style={{ background: ANSI.green }}
			/>
			<input
				ref={inputRef}
				type="file"
				accept=".csv,text/csv"
				style={{ display: "none" }}
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (file) {
						const result = importRows(await file.text(), columns);
						if (result.ok) {
							onRows(result.rows, result.decimal);
						} else {
							window.alert(
								result.error.kind === "empty"
									? t.importEmpty
									: t.importColumns(
											result.error.line,
											result.error.expected,
											result.error.got,
										),
							);
						}
					}
					// Reset so picking the same file again still fires onChange.
					e.target.value = "";
				}}
			/>
		</>
	);
}
