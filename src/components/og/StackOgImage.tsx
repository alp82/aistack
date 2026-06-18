import { formatPriceDisplay } from "@/lib/pricing";

type StackOgImageProps = {
	name: string;
	oneLiner: string;
	creator: {
		name: string;
		xHandle?: string | null;
		avatarUrl?: string | null;
	};
	fixedTotal?: {
		amount: number;
		period?: "month" | "year" | "one_time";
	} | null;
	hasUsageComponent: boolean;
	teamSize?: number | null;
	tools: Array<{
		name: string;
		iconUrl?: string | null;
	}>;
	accent?: { base: string; contrast: string };
};

function getInitials(value: string) {
	const parts = value.split(/\s+/).filter(Boolean).slice(0, 2);

	if (parts.length === 0) {
		return "?";
	}

	return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function StackOgImage({
	name,
	oneLiner,
	creator,
	fixedTotal,
	hasUsageComponent,
	teamSize,
	tools,
	accent = { base: "#a3e635", contrast: "#0a0a0a" },
}: StackOgImageProps) {
	const displayTools = tools.slice(0, 6);
	const displayPrice = formatPriceDisplay(
		fixedTotal?.amount ?? 0,
		"month",
		"floor",
	);
	const displayName = name.length > 38 ? `${name.slice(0, 36)}...` : name;
	const displayDescription =
		oneLiner.length > 120 ? `${oneLiner.slice(0, 120)}...` : oneLiner;

	const GAP = 10;

	const chip = (
		tool: { name: string; iconUrl?: string | null },
		iconSize: number,
		nameSize: number,
	) => (
		<div
			key={tool.name}
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
			{tool.iconUrl ? (
				<img
					src={tool.iconUrl}
					alt=""
					width={iconSize}
					height={iconSize}
					style={{ objectFit: "contain", flexShrink: 0 }}
				/>
			) : (
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
					{getInitials(tool.name)}
				</div>
			)}
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
				{tool.name}
			</span>
		</div>
	);

	const rowOf = (
		slice: Array<{ name: string; iconUrl?: string | null }>,
		iconSize: number,
		nameSize: number,
	) => (
		<div style={{ display: "flex", flex: 1, gap: `${GAP}px` }}>
			{slice.map((tool) => chip(tool, iconSize, nameSize))}
		</div>
	);

	const colOf = (top: React.JSX.Element, bottom: React.JSX.Element) => (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				gap: `${GAP}px`,
			}}
		>
			{top}
			{bottom}
		</div>
	);

	const renderTools = () => {
		const n = displayTools.length;

		if (n === 1) {
			return rowOf(displayTools, 120, 44);
		}

		if (n === 2) {
			return rowOf(displayTools, 100, 38);
		}

		if (n === 3) {
			return rowOf(displayTools, 88, 34);
		}

		if (n === 4) {
			return colOf(
				rowOf(displayTools.slice(0, 2), 80, 30),
				rowOf(displayTools.slice(2, 4), 80, 30),
			);
		}

		if (n === 5) {
			return colOf(
				rowOf(displayTools.slice(0, 2), 88, 34),
				rowOf(displayTools.slice(2, 5), 66, 26),
			);
		}

		return colOf(
			rowOf(displayTools.slice(0, 3), 66, 26),
			rowOf(displayTools.slice(3, 6), 66, 26),
		);
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: "#0a0a0a",
				fontFamily: "Geist",
			}}
		>
			<div
				style={{
					display: "flex",
					height: "14px",
					width: "100%",
					backgroundColor: accent.base,
				}}
			/>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "36px 44px 32px",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "stretch",
						gap: "28px",
						marginBottom: "20px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "start",
							gap: "20px",
							flex: 1,
							minWidth: 0,
						}}
					>
						{creator.avatarUrl ? (
							<img
								src={creator.avatarUrl}
								alt={creator.name}
								width={88}
								height={88}
								style={{
									border: "3px solid #3f3f46",
									objectFit: "cover",
									flexShrink: 0,
								}}
							/>
						) : (
							<div
								style={{
									display: "flex",
									width: "88px",
									height: "88px",
									backgroundColor: "#27272a",
									border: "3px solid #3f3f46",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "34px",
									fontWeight: 700,
									color: "#a1a1aa",
									flexShrink: 0,
								}}
							>
								{getInitials(creator.name)}
							</div>
						)}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								minWidth: 0,
								flex: 1,
							}}
						>
							<span
								style={{
									fontSize: "64px",
									fontWeight: 800,
									color: "#fafafa",
									lineHeight: 1,
									letterSpacing: "-0.04em",
								}}
							>
								{displayName}
							</span>
							{creator.xHandle && (
								<span
									style={{
										fontSize: "20px",
										color: "#71717a",
										marginTop: "8px",
									}}
								>
									@{creator.xHandle}
								</span>
							)}
						</div>
					</div>

					{/* Right: Price */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-end",
							minWidth: "280px",
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "baseline",
								justifyContent: "flex-end",
								width: "100%",
							}}
						>
							<span
								style={{
									fontSize: "82px",
									fontWeight: 900,
									color: "#fafafa",
									lineHeight: 1,
								}}
							>
								${displayPrice.amountText}
							</span>
							{hasUsageComponent && (
								<span
									style={{
										fontSize: "82px",
										fontWeight: 900,
										color: accent.base,
										lineHeight: 1,
									}}
								>
									+
								</span>
							)}
							<span
								style={{
									fontSize: "34px",
									color: "#71717a",
									marginLeft: "6px",
									fontWeight: 500,
									lineHeight: 1,
									alignSelf: "flex-end",
									paddingBottom: "10px",
								}}
							>
								{displayPrice.suffix}
							</span>
						</div>
						<span
							style={{
								fontSize: "16px",
								fontWeight: 600,
								color: "#a1a1aa",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
								marginTop: "12px",
							}}
						>
							{teamSize ? `Team ${teamSize}` : "Solo"}
						</span>
					</div>
				</div>
				<div
					style={{
						display: "flex",
						marginBottom: "26px",
					}}
				>
					<div
						style={{
							width: "6px",
							backgroundColor: accent.base,
							flexShrink: 0,
							marginRight: "18px",
						}}
					/>
					<p
						style={{
							fontSize: "30px",
							color: "#d4d4d8",
							lineHeight: 1.28,
							margin: 0,
						}}
					>
						{displayDescription}
					</p>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						minHeight: 0,
					}}
				>
					<span
						style={{
							fontSize: "16px",
							fontWeight: 600,
							color: "#71717a",
							textTransform: "uppercase",
							letterSpacing: "0.15em",
							marginBottom: "14px",
						}}
					>
						AI Tools
					</span>
					{renderTools()}
				</div>
			</div>
		</div>
	);
}

export type { StackOgImageProps };
