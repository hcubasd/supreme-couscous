// Sits on its own layer above every panel, fixed to the bottom-left corner —
// not a .bg>.fg pair, so it never enters squeezeFg's measurement, same as
// LocaleToggle. It also doesn't track the squeeze result the way panel
// actions do (see ActionLabel): like LocaleToggle, it's fixed at Apple's HIG
// legibility floor (11pt) regardless of how small squeezeFg has pushed
// everything else. The 1em edge padding is relative to that same 11pt.
export function MenuToggle({
	visible,
	onToggle,
}: {
	visible: boolean;
	onToggle: () => void;
}) {
	return (
		<div
			onClick={onToggle}
			style={{
				position: "fixed",
				bottom: "1em",
				left: "1em",
				fontSize: "11pt",
				fontFamily: "system-ui sans-serif",
				color: "black",
				cursor: "pointer",
				userSelect: "none",
				zIndex: 200,
			}}
		>
			{visible ? "×" : "≡"}
		</div>
	);
}
