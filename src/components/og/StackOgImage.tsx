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
	const price = Math.floor(fixedTotal?.amount ?? 0);
	const displayName = name.length > 35 ? `${name.slice(0, 35)}...` : name;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: "#0a0a0a",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			{/* Top accent bar */}
			<div
				style={{
					display: "flex",
					height: "10px",
					width: "100%",
					backgroundColor: "#a3e635",
				}}
			/>

			{/* Main content */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "40px 50px",
				}}
			>
				{/* Header section */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						marginBottom: "20px",
					}}
				>
					{/* Left: Avatar + Name */}
					<div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1, minWidth: 0 }}>
						{creator.avatarUrl ? (
							<img
								src={creator.avatarUrl}
								alt=""
								width={80}
								height={80}
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
									width: "80px",
									height: "80px",
									backgroundColor: "#27272a",
									border: "3px solid #3f3f46",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "32px",
									fontWeight: 700,
									color: "#a1a1aa",
									flexShrink: 0,
								}}
							>
								{creator.name.charAt(0).toUpperCase()}
							</div>
						)}
						<div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
							<span
								style={{
									fontSize: "42px",
									fontWeight: 700,
									color: "#fafafa",
									lineHeight: 1.1,
								}}
							>
								{displayName}
							</span>
							{creator.xHandle && (
								<span
									style={{
										fontSize: "18px",
										color: "#71717a",
										marginTop: "6px",
										fontFamily: "monospace",
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
						}}
					>
						<div style={{ display: "flex", alignItems: "baseline" }}>
							<span
								style={{
									fontSize: "56px",
									fontWeight: 900,
									color: "#fafafa",
									fontFamily: "monospace",
									lineHeight: 1,
								}}
							>
								${price}
							</span>
							{hasUsageComponent && (
								<span
									style={{
										fontSize: "56px",
										fontWeight: 900,
										color: "#a3e635",
										fontFamily: "monospace",
										lineHeight: 1,
									}}
								>
									+
								</span>
							)}
							<span
								style={{
									fontSize: "28px",
									color: "#71717a",
									marginLeft: "4px",
									fontWeight: 500,
									lineHeight: 1,
									alignSelf: "flex-end",
									paddingBottom: "6px",
								}}
							>
								/mo
							</span>
						</div>
						<span
							style={{
								fontSize: "14px",
								fontWeight: 600,
								color: "#a1a1aa",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								marginTop: "8px",
							}}
						>
							{teamSize ? `Team ${teamSize}` : "Solo"}
						</span>
					</div>
				</div>

				{/* Description with lime border */}
				<div
					style={{
						display: "flex",
						marginBottom: "28px",
					}}
				>
					<div
						style={{
							width: "4px",
							backgroundColor: "#a3e635",
							flexShrink: 0,
							marginRight: "16px",
						}}
					/>
					<p
						style={{
							fontSize: "24px",
							color: "#d4d4d8",
							lineHeight: 1.4,
							margin: 0,
						}}
					>
						{oneLiner.length > 100 ? `${oneLiner.slice(0, 100)}...` : oneLiner}
					</p>
				</div>

				{/* Tools grid */}
				<div
					style={{
						marginTop: "32px",
						display: "flex",
						flexDirection: "column",
						flex: 1,
					}}
				>
					<span
						style={{
							fontSize: "14px",
							fontWeight: 600,
							color: "#71717a",
							textTransform: "uppercase",
							letterSpacing: "0.15em",
							marginBottom: "14px",
							fontFamily: "monospace",
						}}
					>
						AI Tools
					</span>
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: "16px",
						}}
					>
						{displayTools.map((tool, i) => (
							<div
								key={i}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									backgroundColor: "#18181b",
									padding: "14px 20px",
									border: "1px solid #27272a",
								}}
							>
								{tool.iconUrl ? (
									<img
										src={tool.iconUrl}
										alt=""
										width={28}
										height={28}
										style={{ objectFit: "contain" }}
									/>
								) : (
									<div
										style={{
											width: "28px",
											height: "28px",
											backgroundColor: "#3f3f46",
										}}
									/>
								)}
								<span
									style={{
										fontSize: "18px",
										color: "#e4e4e7",
										fontFamily: "monospace",
										fontWeight: 500,
									}}
								>
									{tool.name}
								</span>
							</div>
						))}
						{tools.length > 6 && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									padding: "12px 16px",
									fontSize: "16px",
									color: "#71717a",
								}}
							>
								+{tools.length - 6} more
							</div>
						)}
					</div>
				</div>

				{/* Footer with categories and link */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						paddingTop: "24px",
						borderTop: "1px solid #27272a",
					}}
				>
					<div style={{ display: "flex", gap: "10px" }}>
						{displayCategories.map((cat, i) => {
							const style = getCategoryStyle(cat);
							return (
								<span
									key={i}
									style={{
										fontSize: "12px",
										fontWeight: 700,
										textTransform: "uppercase",
										letterSpacing: "0.05em",
										padding: "8px 14px",
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
							padding: "10px 20px",
						}}
					>
						<span
							style={{
								fontSize: "18px",
								fontWeight: 700,
								color: "#0a0a0a",
								fontFamily: "monospace",
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
