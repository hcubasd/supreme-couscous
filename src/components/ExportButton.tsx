import type { ReactNode } from "react";
import { ANSI } from "../helpers/color";
import { t } from "../helpers/locale";
import { ClickH1 } from "./PanelMenu";

export function ExportButton({
	filename,
	build,
	disabled,
	onDone,
	children,
}: {
	filename: string;
	build: () => string;
	disabled?: boolean;
	onDone?: () => void;
	children?: ReactNode;
}) {
	return (
		<ClickH1
			color={ANSI.yellow}
			onClick={() => {
				if (disabled) return;
				const blob = new Blob([`﻿${build()}`], {
					type: "text/csv;charset=utf-8",
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = filename;
				a.click();
				URL.revokeObjectURL(url);
				onDone?.();
			}}
			style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : undefined }}
		>
			{children ?? t.exportBtn}
		</ClickH1>
	);
}
