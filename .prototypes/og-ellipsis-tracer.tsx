// Tracer: does takumi (@takumi-rs/image-response) actually truncate a long tool
// name with text-overflow:ellipsis using the exact chip style combo we shipped?
// Run: pnpm tsx .prototypes/og-ellipsis-tracer.tsx
import { writeFileSync } from "node:fs";
import { ImageResponse } from "@takumi-rs/image-response";
import React from "react";
void React;

const chip = (name: string, iconSize: number, nameSize: number) => (
	<div
		style={{
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			gap: `${Math.round(iconSize * 0.14)}px`,
			backgroundColor: "#18181b",
			border: "1px solid #27272a",
			flex: 1,
			minWidth: 0,
			padding: "0 16px",
		}}
	>
		<div
			style={{
				display: "flex",
				width: `${iconSize}px`,
				height: `${iconSize}px`,
				backgroundColor: "#3f3f46",
				alignItems: "center",
				justifyContent: "center",
				color: "#d4d4d8",
				fontWeight: 700,
				fontSize: `${Math.round(iconSize * 0.34)}px`,
				flexShrink: 0,
			}}
		>
			{name.slice(0, 1).toUpperCase()}
		</div>
		<span
			style={{
				fontSize: `${nameSize}px`,
				color: "#e4e4e7",
				fontWeight: 700,
				lineHeight: 1.1,
				textAlign: "center",
				whiteSpace: "nowrap",
				overflow: "hidden",
				textOverflow: "ellipsis",
				maxWidth: "100%",
			}}
		>
			{name}
		</span>
	</div>
);

const row = (kids: unknown[]) => (
	<div style={{ display: "flex", flex: 1, gap: "10px" }}>{kids}</div>
);

const card = (
	<div
		style={{
			display: "flex",
			flexDirection: "column",
			width: "1112px",
			height: "460px",
			backgroundColor: "#0a0a0a",
			padding: "20px",
			gap: "10px",
		}}
	>
		{/* n=3 sizes: one very long name (must ellipsize), two normal */}
		{row([
			chip("Retrieval Augmented Generation Pipeline", 88, 34),
			chip("Claude", 88, 34),
			chip("ChatGPT", 88, 34),
		])}
		{/* n=1 size: single wide chip, extremely long name (must ellipsize) */}
		{row([
			chip(
				"A Tool With An Absurdly Long Name That Cannot Possibly Fit",
				120,
				44,
			),
		])}
	</div>
);

const res = new ImageResponse(card, { width: 1152, height: 500 });
const buf = Buffer.from(await res.arrayBuffer());
const out = ".prototypes/og-ellipsis-tracer.png";
writeFileSync(out, buf);
console.log(`wrote ${out} (${buf.length} bytes)`);
