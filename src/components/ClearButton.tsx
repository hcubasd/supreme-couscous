import { t } from "../helpers/locale";

// Clears one panel's data (cargo, fleet, or results), after a confirm.
export function ClearButton({ onClear }: { onClear: () => void }) {
	return (
		<button
			type="button"
			onClick={() => {
				if (window.confirm(t.clearConfirm)) onClear();
			}}
		>
			{t.clear}
		</button>
	);
}
