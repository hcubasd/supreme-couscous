import { LOCALE, OTHER_LOCALE_LABEL, switchLocale } from "../helpers/locale";

// Sits on its own layer above every panel, fixed to the bottom-right corner —
// not a .bg>.fg pair, so it never enters squeezeFg's measurement, and unlike
// the panel chrome it doesn't track the squeeze result either: Apple's HIG
// legibility floor (11pt) is fixed regardless of how small squeezeFg has
// pushed everything else, so this is set directly rather than reading
// --font-size. The 1em edge padding is relative to that same 11pt, since it's
// set on this element.
export function LocaleToggle() {
	return (
		<div
			onClick={switchLocale}
			style={{
				position: "fixed",
				bottom: "1em",
				right: "1em",
				fontSize: "11pt",
				fontFamily: "system-ui sans-serif",
				color: "black",
				cursor: "pointer",
				userSelect: "none",
				zIndex: 200,
			}}
		>
			{OTHER_LOCALE_LABEL[LOCALE]}
		</div>
	);
}
