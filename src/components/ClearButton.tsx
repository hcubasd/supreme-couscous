import { ANSI } from "../helpers/color";
import { t } from "../helpers/locale";

// Clears one panel's data (cargo, fleet, or results) after confirming with the
// panel-specific message.
export function ClearButton({
	onClear,
	confirm,
}: {
	onClear: () => void;
	confirm: string;
}) {
	return (
		<button
			type="button"
			onClick={() => {
				if (window.confirm(confirm)) onClear();
			}}
			title={t.clear}
			aria-label={t.clear}
			style={{ background: ANSI.red }}
		/>
	);
}
