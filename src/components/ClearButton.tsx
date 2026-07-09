import type { ReactNode } from "react";
import { ANSI } from "../helpers/color";
import { t } from "../helpers/locale";
import { ClickH1 } from "./PanelMenu";

export function ClearButton({
	onClear,
	confirm,
	onDone,
	children,
}: {
	onClear: () => void;
	confirm: string;
	onDone?: () => void;
	children?: ReactNode;
}) {
	return (
		<ClickH1
			color={ANSI.red}
			onClick={() => {
				if (window.confirm(confirm)) {
					onClear();
					onDone?.();
				}
			}}
		>
			{children ?? t.clear}
		</ClickH1>
	);
}
