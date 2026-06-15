import { useRef } from "react";
import { importRows } from "../helpers/csv";
import { t } from "../helpers/locale";

// A file picker dressed as a plain button: the visible button proxies a click to
// a hidden file input, reads the chosen CSV, validates it against the expected
// column count, and either hands the rows up or alerts on a malformed file.
export function ImportButton({
	columns,
	onRows,
}: {
	columns: number;
	onRows: (rows: string[][]) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<>
			<button type="button" onClick={() => inputRef.current?.click()}>
				{t.importBtn}
			</button>
			<input
				ref={inputRef}
				type="file"
				accept=".csv,text/csv"
				style={{ display: "none" }}
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (file) {
						const result = importRows(await file.text(), columns);
						if (result.ok) onRows(result.rows);
						else window.alert(result.error);
					}
					// Reset so picking the same file again still fires onChange.
					e.target.value = "";
				}}
			/>
		</>
	);
}
