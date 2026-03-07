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
	categories: string[];
};

const CATEGORY_COLORS: Record<string, { border: string; text: string }> = {
	ide: { border: "#22c55e", text: "#4ade80" },
	"coding-agent": { border: "#10b981", text: "#34d399" },
	"app-builder": { border: "#84cc16", text: "#a3e635" },
	reasoning: { border: "#3b82f6", text: "#60a5fa" },
	research: { border: "#eab308", text: "#facc15" },
	"image-gen": { border: "#06b6d4", text: "#22d3ee" },
	"video-gen": { border: "#14b8a6", text: "#2dd4bf" },
	design: { border: "#d946ef", text: "#e879f9" },
	automation: { border: "#ef4444", text: "#f87171" },
	analytics: { border: "#64748b", text: "#94a3b8" },
	notes: { border: "#ec4899", text: "#f472b6" },
	default: { border: "#71717a", text: "#a1a1aa" },
};

function getCategoryStyle(category: string) {
	return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default;
}

function toCategoryLabel(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

function isInlineImageSource(value?: string | null) {
	return Boolean(value?.startsWith("data:"));
}

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
	categories,
}: StackOgImageProps) {
	const displayTools = tools.slice(0, 6);
	const displayCategories = categories.slice(0, 2);
	const displayPrice = formatPriceDisplay(
		fixedTotal?.amount ?? 0,
		fixedTotal?.period ?? "month",
		"floor",
	);
	const displayName = name.length > 38 ? `${name.slice(0, 36)}...` : name;
	const displayDescription =
		oneLiner.length > 120 ? `${oneLiner.slice(0, 120)}...` : oneLiner;

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
					backgroundColor: "#a3e635",
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
							alignItems: "center",
							gap: "20px",
							flex: 1,
							minWidth: 0,
						}}
					>
						{isInlineImageSource(creator.avatarUrl) ? (
							<img
								src={creator.avatarUrl ?? undefined}
								alt=""
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
							justifyContent: "space-between",
							alignItems: "flex-end",
							minWidth: "280px",
							padding: "18px 20px",
							border: "2px solid #3f3f46",
							backgroundColor: "#111113",
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
										color: "#a3e635",
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
							backgroundColor: "#a3e635",
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
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gridAutoRows: "1fr",
							gap: "16px",
							flex: 1,
						}}
					>
						{displayTools.map((tool) => (
							<div
								key={tool.name}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "14px",
									backgroundColor: "#18181b",
									padding: "18px 20px",
									border: "1px solid #27272a",
									height: "100%",
								}}
							>
								{isInlineImageSource(tool.iconUrl) ? (
									<img
										src={tool.iconUrl ?? undefined}
										alt=""
										width={34}
										height={34}
										style={{ objectFit: "contain" }}
									/>
								) : (
									<div
										style={{
											width: "34px",
											height: "34px",
											backgroundColor: "#3f3f46",
											borderRadius: "8px",
											alignItems: "center",
											justifyContent: "center",
											display: "flex",
											color: "#d4d4d8",
											fontSize: "14px",
											fontWeight: 700,
										}}
									>
										{getInitials(tool.name)}
									</div>
								)}
								<span
									style={{
										fontSize: "24px",
										color: "#e4e4e7",
										fontWeight: 600,
										lineHeight: 1.15,
									}}
								>
									{tool.name}
								</span>
							</div>
						))}
					</div>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						paddingTop: "20px",
						borderTop: "1px solid #27272a",
					}}
				>
					<div style={{ display: "flex", gap: "10px" }}>
						{displayCategories.map((cat) => {
							const style = getCategoryStyle(cat);
							return (
								<span
									key={cat}
									style={{
										fontSize: "12px",
										fontWeight: 700,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
										padding: "9px 14px",
										border: `2px solid ${style.border}`,
										color: style.text,
										backgroundColor: "rgba(0,0,0,0.5)",
									}}
								>
									{toCategoryLabel(cat)}
								</span>
							);
						})}
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "12px",
							backgroundColor: "#a3e635",
							padding: "12px 22px",
						}}
					>
						<span
							style={{
								fontSize: "20px",
								fontWeight: 700,
								color: "#0a0a0a",
								fontFamily: "Geist Mono",
								letterSpacing: "0.02em",
							}}
						>
							Open stack →
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export type { StackOgImageProps };
