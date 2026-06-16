import { t } from "../helpers/locale";

// A plain button that downloads a CSV. `build` is called on click to produce the
// text (so it always reflects the current table), then handed to the browser as a
// file download. A UTF-8 BOM is prepended so Excel reads the accented headers.
export function ExportButton({
	filename,
	build,
	disabled,
}: {
	filename: string;
	build: () => string;
	disabled?: boolean;
}) {
	const onClick = () => {
		const blob = new Blob([`﻿${build()}`], {
			type: "text/csv;charset=utf-8",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={t.exportBtn}
			aria-label={t.exportBtn}
		>
			▲
		</button>
	);
}
