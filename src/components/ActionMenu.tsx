import { colorBg, squeezeFg } from "psychic-potato";
import { useEffect, useLayoutEffect, useRef } from "react";
import { importRows, toCsv } from "../helpers/csv";
import { classesToRows, type FleetController, rowsToClasses } from "../helpers/fleet";
import { CSV_DELIMITER, t } from "../helpers/locale";
import { csvCellToInput, csvNumber } from "../helpers/number";
import { buildResultsCsv } from "../helpers/results";
import type { RowController } from "../helpers/rows";
import type { Solved } from "./Assignments";

const CARGO_HEADER = [t.weightKg, t.lengthM];
const CLASS_HEADERS = [
	t.klass, t.availableQty, t.maxWeightKg,
	t.minCharge, t.freightPerKg, t.axles, t.tollPerAxle,
];
const TRAILER_HEADERS = [t.trailer, t.trailerCapacityKg, t.trailerLengthM, t.spacingM];
const VEHICLE_COLS = CLASS_HEADERS.length + TRAILER_HEADERS.length;

function download(filename: string, csv: string) {
	const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function Item({
	label,
	onClick,
	disabled,
}: {
	label: string;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<div
			className="bg"
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				cursor: disabled ? "default" : "pointer",
			}}
			onClick={disabled ? undefined : onClick}
		>
			<div
				className="fg"
				style={{
					textAlign: "center",
					userSelect: "none",
					whiteSpace: "nowrap",
					opacity: disabled ? 0.4 : 1,
				}}
			>
				{label}
			</div>
		</div>
	);
}

export function ActionMenu({
	cargo,
	fleet,
	solved,
	onSolve,
	onClearSolved,
	onClose,
}: {
	cargo: RowController;
	fleet: FleetController;
	solved: Solved | null;
	onSolve: () => void;
	onClearSolved: () => void;
	onClose: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const cargoInputRef = useRef<HTMLInputElement>(null);
	const vehicleInputRef = useRef<HTMLInputElement>(null);

	useLayoutEffect(() => {
		if (!ref.current) return;
		colorBg(ref.current, { from: 0.75, to: 1 });
		squeezeFg(ref.current, 0.8);
	}, []);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onResize = () => squeezeFg(el, 0.8);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const canExport = solved?.result.status === "success";

	return (
		<>
			<div
				ref={ref}
				className="bg oriented"
				style={{ position: "fixed", inset: 0, zIndex: 100 }}
			>
				{/* Cargoes column */}
				<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
					<Item
						label={`${t.importBtn} ${t.cargo}`}
						onClick={() => cargoInputRef.current?.click()}
					/>
					<Item
						label={`${t.exportBtn} ${t.cargo}`}
						onClick={() => {
							download(
								t.cargoFile,
								toCsv(
									CARGO_HEADER,
									cargo.rows
										.map((r) => r.values)
										.filter((v) => v.some((x) => x.trim() !== ""))
										.map((v) => v.map(csvNumber)),
									CSV_DELIMITER,
								),
							);
							onClose();
						}}
					/>
					<Item
						label={`${t.clear} ${t.cargo}`}
						onClick={() => {
							if (window.confirm(t.clearCargoConfirm)) {
								cargo.clear();
								onClose();
							}
						}}
					/>
				</div>

				{/* Vehicles column */}
				<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
					<Item
						label={`${t.importBtn} ${t.vehicles}`}
						onClick={() => vehicleInputRef.current?.click()}
					/>
					<Item
						label={`${t.exportBtn} ${t.vehicles}`}
						onClick={() => {
							download(
								t.vehiclesFile,
								toCsv(
									[...CLASS_HEADERS, ...TRAILER_HEADERS],
									classesToRows(fleet.classes).map((r) => r.map(csvNumber)),
									CSV_DELIMITER,
								),
							);
							onClose();
						}}
					/>
					<Item
						label={`${t.clear} ${t.vehicles}`}
						onClick={() => {
							if (window.confirm(t.clearVehiclesConfirm)) {
								fleet.clear();
								onClose();
							}
						}}
					/>
				</div>

				{/* Compositions column */}
				<div className="bg" style={{ flex: 1, flexDirection: "column" }}>
					<Item
						label={`${t.calculate} ${t.compositions}`}
						onClick={() => {
							if (window.confirm(t.calculateConfirm)) {
								onSolve();
								onClose();
							}
						}}
					/>
					<Item
						label={`${t.exportBtn} ${t.compositions}`}
						disabled={!canExport}
						onClick={() => {
							if (!solved || solved.result.status !== "success") return;
							download(t.resultsFile, buildResultsCsv(solved.result, solved.vehicles));
							onClose();
						}}
					/>
					<Item
						label={`${t.clear} ${t.compositions}`}
						onClick={() => {
							if (window.confirm(t.clearResultsConfirm)) {
								onClearSolved();
								onClose();
							}
						}}
					/>
				</div>
			</div>

			<input
				ref={cargoInputRef}
				type="file"
				accept=".csv,text/csv"
				style={{ display: "none" }}
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (file) {
						const result = importRows(await file.text(), 2);
						if (result.ok) {
							cargo.replace(
								result.rows.map((row) =>
									row.map((c) => csvCellToInput(c, result.decimal)),
								),
							);
							onClose();
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
			<input
				ref={vehicleInputRef}
				type="file"
				accept=".csv,text/csv"
				style={{ display: "none" }}
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (file) {
						const result = importRows(await file.text(), VEHICLE_COLS);
						if (result.ok) {
							fleet.replace(
								rowsToClasses(
									result.rows.map((row) =>
										row.map((c) => csvCellToInput(c, result.decimal)),
									),
								),
							);
							onClose();
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
