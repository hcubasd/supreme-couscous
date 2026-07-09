import { useState, type CSSProperties, type ReactNode } from "react";

// A clickable div with 1em block padding. No hover effect.
export function ClickH1({
	onClick,
	color,
	style,
	children,
}: {
	onClick: () => void;
	color?: string;
	style?: CSSProperties;
	children: ReactNode;
}) {
	return (
		<div
			onClick={onClick}
			style={{
				paddingBlock: "1em",
				cursor: "pointer",
				userSelect: "none",
				color,
				textAlign: "center",
				...style,
			}}
		>
			{children}
		</div>
	);
}

// A section header that doubles as a menu trigger. Clicking it opens a centered
// black overlay with the panel's actions stacked. Clicking away closes it.
export function PanelMenu({
	label,
	children,
}: {
	label: string;
	children: (close: () => void) => ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const close = () => setOpen(false);

	return (
		<>
			<ClickH1 onClick={() => setOpen(true)}>{label}</ClickH1>
			{open && (
				<>
					<div
						style={{ position: "fixed", inset: 0, zIndex: 99 }}
						onClick={close}
					/>
					<div
						style={{
							position: "absolute",
							top: "calc(100% + 1px)",
							left: "50%",
							transform: "translateX(-50%)",
							zIndex: 100,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "0.75em",
							paddingBlock: "1em",
							paddingInline: "2em",
							background: "white",
						}}
					>
						{children(close)}
					</div>
				</>
			)}
		</>
	);
}
