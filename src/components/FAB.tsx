import { useRef } from "react";
import { palette, randomVariation, toRgb } from "../helpers/color";

export function FAB({ onClick }: { onClick: () => void }) {
	const color = useRef(toRgb(palette(1, 75, randomVariation())[0])).current;

	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				position: "fixed",
				bottom: 11,
				right: 11,
				width: 44,
				height: 44,
				minWidth: 44,
				minHeight: 44,
				borderRadius: 22,
				border: "none",
				padding: 0,
				background: color,
				cursor: "pointer",
				zIndex: 200,
			}}
		/>
	);
}
