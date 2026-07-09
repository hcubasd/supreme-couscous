import { useRef, type ReactNode } from "react";
import { ANSI } from "../helpers/color";
import { importRows } from "../helpers/csv";
import { t } from "../helpers/locale";
import { ClickH1 } from "./PanelMenu";

export function ImportButton({
	columns,
	onRows,
	onDone,
	children,
}: {
	columns: number;
	onRows: (rows: string[][], decimal: string) => void;
	onDone?: () => void;
	children?: ReactNode;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<>
			<ClickH1 color={ANSI.green} onClick={() => inputRef.current?.click()}>
				{children ?? t.importBtn}
			</ClickH1>
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
							onDone?.();
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
					e.target.value = "";
				}}
			/>
		</>
	);
}
