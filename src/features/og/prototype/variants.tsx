/**
 * PROTOTYPE - throwaway. Three design families for every OG image, over one
 * `OgCard`. Rendered by takumi at 1200x630, so flex only, no grid, no transforms.
 *
 *   A  Ledger  Type-led. The landing hero as a card: kicker, huge black headline
 *              with one accent word, a rule, and a ledger row of figures.
 *   B  Plate   Number-led. The Discord card language: a lime name plate with a
 *              hard shadow on the left, one hero figure on the right.
 *   C  Split   Color-block. A lime panel carries the brand, section and faces;
 *              the dark panel carries a mixed-case title and a stats table.
 *   D  Current What ships today: the stack page gets the production stack card
 *              (`StackOgImage`), every other page gets the one static banner
 *              (`public/banners/aistack.png`), shown as the file itself.
 *   E  Banner  That banner rebuilt per page: mono kicker, huge headline with the
 *              accent word on a lime block, barred description, two buttons
 *              carrying the page's figures.
 *   F  Terminal Mono throughout. The sync log as a card: a prompt line, OK rows
 *              for the figures, a comment for the description.
 *   G  Poster  One figure fills the card. Everything else is small.
 *   H  Frame   Accent frame around a dark panel, centered mixed-case title,
 *              three columns of figures along the bottom.
 *   I  Topbar  A strong accent bar across the top only, then a left-aligned
 *              mixed-case title, description, faces, and a ledger of figures.
 *
 * Round two composes what the review kept. Two directions: the big title in
 * focus (J, L) and a smaller title with elements, icons and figures in focus
 * (K, M).
 *
 *   J  Title    Top bar, A's header row, the E hero headline with the accent
 *              word on a block, E's metric boxes as the footer. No quote bar,
 *              no tool icons.
 *   K  Board    Top bar, D's stack-card header (avatar, mixed-case title,
 *              kicker), D's chip grid as the body, metric boxes as the footer.
 *   L  Frame 2  H's frame and centering with everything bigger: uppercase
 *              headline with the accent word, larger avatar, higher-contrast
 *              description, metric boxes centered along the bottom.
 *   M  Split 2  C's split with the headline on the lime panel and the chip
 *              grid plus metric boxes on the dark panel.
 */
import type { OgCard, OgIcon } from "./cards";

const BG = "#0a0a0a";
const INK = "#fafafa";
const BODY = "#d4d4d8";
const MUTED = "#71717a";
const RULE = "#27272a";
const CHIP = "#18181b";
const PLATE_SHADOW = "#8793a2";
const SANS = "Geist";
const MONO = "Geist Mono";

export const VARIANT_KEYS = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
	"M",
] as const;
export type VariantKey = (typeof VARIANT_KEYS)[number];
export const VARIANT_NAMES: Record<VariantKey, string> = {
	A: "Ledger",
	B: "Plate",
	C: "Split",
	D: "Current (as shipped)",
	E: "Banner, per page",
	F: "Terminal",
	G: "Poster",
	H: "Frame",
	I: "Topbar",
	J: "Title (round 2)",
	K: "Board (round 2)",
	L: "Frame 2 (round 2)",
	M: "Split 2 (round 2)",
};

const initials = (value: string) =>
	value
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p.charAt(0).toUpperCase())
		.join("") || "?";

/** "REAL *BUILDERS*" -> spans, the starred word in the accent color. */
function headline(line: string, accent: string, color = INK) {
	// Flex children drop edge spaces, so the parent row carries a gap instead.
	const parts = line
		.split(/(\*[^*]+\*)/)
		.filter(Boolean)
		.map((p) => p.trim());
	return parts.map((part) =>
		part.startsWith("*") ? (
			<span key={part} style={{ color: accent }}>
				{part.slice(1, -1)}
			</span>
		) : (
			<span key={part} style={{ color }}>
				{part}
			</span>
		),
	);
}

/** Font size that lets the longest line fit `width` at a black weight. */
const fitSize = (lines: string[], width: number, max: number, min = 40) => {
	const longest = Math.max(...lines.map((l) => l.replace(/\*/g, "").length), 1);
	return Math.max(min, Math.min(max, Math.floor(width / (longest * 0.66))));
};

function Icon({
	icon,
	size,
	bg = "#3f3f46",
	fg = "#d4d4d8",
	border,
}: {
	icon: OgIcon;
	size: number;
	bg?: string;
	fg?: string;
	border?: string;
}) {
	// An explicit `undefined` style value panics takumi: spread border in.
	return icon.iconUrl ? (
		<div
			style={{
				display: "flex",
				width: `${size}px`,
				height: `${size}px`,
				backgroundColor: bg,
				...(border ? { border } : {}),
			}}
		>
			<img
				src={icon.iconUrl}
				alt=""
				width={size}
				height={size}
				style={{ objectFit: "contain" }}
			/>
		</div>
	) : (
		<div
			style={{
				display: "flex",
				width: `${size}px`,
				height: `${size}px`,
				backgroundColor: bg,
				...(border ? { border } : {}),
				alignItems: "center",
				justifyContent: "center",
				color: fg,
				fontFamily: SANS,
				fontWeight: 700,
				fontSize: `${Math.round(size * 0.36)}px`,
			}}
		>
			{initials(icon.name)}
		</div>
	);
}

function Avatar({
	card,
	size,
	border = `3px solid ${RULE}`,
}: {
	card: OgCard;
	size: number;
	border?: string;
}) {
	if (!card.avatarUrl) return null;
	return (
		<div
			style={{
				display: "flex",
				width: `${size}px`,
				height: `${size}px`,
				border,
			}}
		>
			<img
				src={card.avatarUrl}
				alt=""
				width={size}
				height={size}
				style={{ objectFit: "cover" }}
			/>
		</div>
	);
}

const Brand = ({ color = INK, dot }: { color?: string; dot: string }) => (
	<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
		<div
			style={{
				display: "flex",
				width: "14px",
				height: "14px",
				backgroundColor: dot,
			}}
		/>
		<span
			style={{
				fontFamily: SANS,
				fontWeight: 800,
				fontSize: "24px",
				letterSpacing: "-0.04em",
				color,
			}}
		>
			AI STACK
		</span>
	</div>
);

// ---------------------------------------------------------------------------
// A. Ledger
// ---------------------------------------------------------------------------

export function VariantLedger({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const size = fitSize(card.titleLines, 1100, 104);
	const hasFaces = card.avatarUrl || card.icons?.length;
	const showDescription = !card.titleLines.some((l) => l.includes("*"));
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				padding: "44px 50px 40px",
				fontFamily: SANS,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<span
					style={{
						fontFamily: MONO,
						fontSize: "22px",
						fontWeight: 700,
						letterSpacing: "0.18em",
						color: accent,
					}}
				>
					{card.kicker}
				</span>
				<Brand dot={accent} />
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					justifyContent: "center",
					gap: "0px",
				}}
			>
				{card.titleLines.map((line) => (
					<div
						key={line}
						style={{
							display: "flex",
							fontSize: `${size}px`,
							fontWeight: 900,
							lineHeight: 0.92,
							letterSpacing: "-0.05em",
							whiteSpace: "nowrap",
							gap: `${Math.round(size * 0.2)}px`,
						}}
					>
						{headline(line, accent)}
					</div>
				))}
				{showDescription ? (
					<p
						style={{
							fontSize: "28px",
							lineHeight: 1.3,
							color: BODY,
							margin: "26px 0 0",
							maxWidth: "900px",
						}}
					>
						{card.description}
					</p>
				) : null}
			</div>

			<div
				style={{
					display: "flex",
					height: "2px",
					width: "100%",
					backgroundColor: RULE,
					marginBottom: "22px",
				}}
			/>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-end",
				}}
			>
				<div style={{ display: "flex", gap: "44px" }}>
					{card.stats.map((s) => (
						<div
							key={s.label}
							style={{ display: "flex", flexDirection: "column" }}
						>
							<span
								style={{
									fontSize: "48px",
									fontWeight: 800,
									lineHeight: 1,
									letterSpacing: "-0.03em",
									color: INK,
								}}
							>
								{s.value}
							</span>
							<span
								style={{
									fontFamily: MONO,
									fontSize: "14px",
									letterSpacing: "0.12em",
									color: MUTED,
									marginTop: "10px",
									textTransform: "uppercase",
								}}
							>
								{s.label}
							</span>
						</div>
					))}
				</div>
				{hasFaces ? (
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<Avatar card={card} size={72} />
						{card.avatarUrl && card.icons?.length ? (
							<div
								style={{
									display: "flex",
									width: "2px",
									height: "44px",
									backgroundColor: RULE,
									margin: "0 10px",
								}}
							/>
						) : null}
						{(card.icons ?? []).map((icon) => (
							<Icon key={icon.name} icon={icon} size={44} bg={CHIP} />
						))}
					</div>
				) : (
					<span
						style={{
							fontFamily: MONO,
							fontSize: "16px",
							color: MUTED,
							letterSpacing: "0.08em",
						}}
					>
						aistack.to{card.path === "/" ? "" : card.path}
					</span>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// B. Plate
// ---------------------------------------------------------------------------

export function VariantPlate({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const contrast = card.accent.contrast;
	const [hero, ...rest] = card.stats;
	const size = fitSize(card.titleLines, 600, 64, 34);
	return (
		<div
			style={{
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				padding: "44px 48px 36px",
				fontFamily: SANS,
				gap: "40px",
			}}
		>
			{/* Left: plate + description + faces */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					minWidth: 0,
				}}
			>
				<span
					style={{
						fontFamily: MONO,
						fontSize: "16px",
						fontWeight: 700,
						letterSpacing: "0.2em",
						color: MUTED,
						marginBottom: "18px",
					}}
				>
					{card.kicker}
				</span>
				<div
					style={{
						display: "flex",
						alignSelf: "flex-start",
						backgroundColor: PLATE_SHADOW,
						paddingRight: "12px",
						paddingBottom: "12px",
						maxWidth: "100%",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							backgroundColor: accent,
							padding: "18px 26px 22px",
						}}
					>
						{card.titleLines.map((line) => (
							<div
								key={line}
								style={{
									display: "flex",
									fontSize: `${size}px`,
									fontWeight: 900,
									lineHeight: 0.95,
									letterSpacing: "-0.05em",
									color: contrast,
									whiteSpace: "nowrap",
									gap: `${Math.round(size * 0.2)}px`,
								}}
							>
								{headline(line, contrast, contrast)}
							</div>
						))}
					</div>
				</div>
				<p
					style={{
						fontSize: "27px",
						lineHeight: 1.3,
						color: BODY,
						margin: "30px 0 0",
						maxWidth: "640px",
					}}
				>
					{card.description}
				</p>
				<div style={{ display: "flex", flex: 1 }} />
				<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
					<Avatar card={card} size={64} />
					{(card.icons ?? []).map((icon) => (
						<Icon key={icon.name} icon={icon} size={52} bg={CHIP} />
					))}
					{!card.avatarUrl && !card.icons?.length ? (
						<Brand dot={accent} />
					) : null}
				</div>
			</div>

			{/* Right: hero figure */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					width: "380px",
					alignItems: "flex-end",
					justifyContent: "space-between",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
						width: "100%",
					}}
				>
					<span
						style={{
							fontSize: hero.value.length > 6 ? "88px" : "132px",
							fontWeight: 900,
							lineHeight: 0.9,
							letterSpacing: "-0.06em",
							color: INK,
						}}
					>
						{hero.value}
					</span>
					<span
						style={{
							fontFamily: MONO,
							fontSize: "16px",
							fontWeight: 700,
							letterSpacing: "0.16em",
							color: accent,
							marginTop: "16px",
							textTransform: "uppercase",
						}}
					>
						{hero.label}
					</span>
					{rest.map((s) => (
						<div
							key={s.label}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-end",
								marginTop: "30px",
								paddingTop: "22px",
								borderTop: `2px solid ${RULE}`,
								width: "100%",
							}}
						>
							<span
								style={{
									fontSize: "50px",
									fontWeight: 800,
									lineHeight: 1,
									letterSpacing: "-0.03em",
									color: INK,
								}}
							>
								{s.value}
							</span>
							<span
								style={{
									fontFamily: MONO,
									fontSize: "14px",
									letterSpacing: "0.14em",
									color: MUTED,
									marginTop: "8px",
									textTransform: "uppercase",
								}}
							>
								{s.label}
							</span>
						</div>
					))}
				</div>
				<span
					style={{
						fontFamily: MONO,
						fontSize: "15px",
						letterSpacing: "0.1em",
						color: MUTED,
					}}
				>
					aistack.to{card.range ? ` · ${card.range}` : ""}
				</span>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// C. Split
// ---------------------------------------------------------------------------

export function VariantSplit({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const contrast = card.accent.contrast;
	const kickerWords = card.kicker.split(/\s*·\s*/)[0].split(/\s+/);
	const kickerSize = fitSize(kickerWords, 320, 72, 36);
	const titleText = card.sentence;
	const titleSize = titleText.length > 40 ? 56 : 68;
	const icons = (card.icons ?? []).slice(0, 6);
	return (
		<div
			style={{
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				fontFamily: SANS,
			}}
		>
			{/* Lime panel */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					width: "420px",
					backgroundColor: accent,
					padding: "44px 44px 40px",
					justifyContent: "space-between",
				}}
			>
				<Brand color={contrast} dot={contrast} />
				<div style={{ display: "flex", flexDirection: "column" }}>
					{kickerWords.map((w) => (
						<span
							key={w}
							style={{
								fontSize: `${kickerSize}px`,
								fontWeight: 900,
								lineHeight: 0.9,
								letterSpacing: "-0.05em",
								color: contrast,
							}}
						>
							{w}
						</span>
					))}
					{card.kicker.includes("·") ? (
						<span
							style={{
								fontFamily: MONO,
								fontSize: "18px",
								fontWeight: 700,
								letterSpacing: "0.12em",
								color: contrast,
								marginTop: "14px",
							}}
						>
							{card.kicker.split(/\s*·\s*/)[1]}
						</span>
					) : null}
				</div>
				<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
					{card.avatarUrl ? (
						<Avatar card={card} size={104} border={`4px solid ${contrast}`} />
					) : null}
					{icons.map((icon) => (
						<Icon
							key={icon.name}
							icon={icon}
							size={card.avatarUrl ? 48 : 68}
							bg={contrast}
							fg={accent}
						/>
					))}
				</div>
			</div>

			{/* Dark panel */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "48px 52px 40px",
					minWidth: 0,
				}}
			>
				<span
					style={{
						fontSize: `${titleSize}px`,
						fontWeight: 800,
						lineHeight: 1.02,
						letterSpacing: "-0.04em",
						color: INK,
						textTransform: "none",
					}}
				>
					{titleText}
				</span>
				<p
					style={{
						fontSize: "26px",
						lineHeight: 1.35,
						color: BODY,
						margin: "22px 0 0",
					}}
				>
					{card.description}
				</p>
				<div style={{ display: "flex", flex: 1 }} />
				<div style={{ display: "flex", flexDirection: "column" }}>
					{card.stats.map((s) => (
						<div
							key={s.label}
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "baseline",
								borderTop: `1px solid ${RULE}`,
								padding: "12px 0",
							}}
						>
							<span
								style={{
									fontFamily: MONO,
									fontSize: "15px",
									letterSpacing: "0.14em",
									color: MUTED,
									textTransform: "uppercase",
								}}
							>
								{s.label}
							</span>
							<span
								style={{
									fontSize: "36px",
									fontWeight: 800,
									letterSpacing: "-0.03em",
									color: INK,
									lineHeight: 1,
								}}
							>
								{s.value}
							</span>
						</div>
					))}
					<div
						style={{
							display: "flex",
							justifyContent: "flex-end",
							borderTop: `1px solid ${RULE}`,
							paddingTop: "12px",
						}}
					>
						<span
							style={{
								fontFamily: MONO,
								fontSize: "15px",
								letterSpacing: "0.08em",
								color: accent,
							}}
						>
							aistack.to{card.path === "/" ? "" : card.path}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export function renderVariant(
	variant: VariantKey,
	card: OgCard,
	/** Absolute URL of the static banner, for the family that shows it. */
	bannerUrl: string,
) {
	if (variant === "B") return <VariantPlate card={card} />;
	if (variant === "C") return <VariantSplit card={card} />;
	if (variant === "D")
		return card.key === "stack" ? (
			<VariantCurrent card={card} />
		) : (
			<VariantShippedBanner src={bannerUrl} />
		);
	if (variant === "E") return <VariantBanner card={card} />;
	if (variant === "F") return <VariantTerminal card={card} />;
	if (variant === "G") return <VariantPoster card={card} />;
	if (variant === "H") return <VariantFrame card={card} />;
	if (variant === "I") return <VariantTopbar card={card} />;
	if (variant === "J") return <VariantTitle card={card} />;
	if (variant === "K") return <VariantBoard card={card} />;
	if (variant === "L") return <VariantFrame2 card={card} />;
	if (variant === "M") return <VariantSplit2 card={card} />;
	return <VariantLedger card={card} />;
}

// ---------------------------------------------------------------------------
// D. Current: what ships today
// ---------------------------------------------------------------------------

/** The static banner file, as every non-stack page serves it right now. */
export function VariantShippedBanner({ src }: { src: string }) {
	return (
		<div
			style={{
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: "#111214",
			}}
		>
			<img
				src={src}
				alt=""
				width={1200}
				height={630}
				style={{ objectFit: "cover" }}
			/>
		</div>
	);
}

const CHIP_BORDER = "#27272a";

function Chip({
	children,
	label,
	labelSize,
}: {
	children: React.ReactNode;
	label: string;
	labelSize: number;
}) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "10px",
				backgroundColor: CHIP,
				border: `1px solid ${CHIP_BORDER}`,
				flex: 1,
				minWidth: 0,
				padding: "0 16px",
			}}
		>
			{children}
			<span
				style={{
					fontSize: `${labelSize}px`,
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
				{label}
			</span>
		</div>
	);
}

export function VariantCurrent({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const contrast = card.accent.contrast;
	const [hero, ...rest] = card.stats;
	const icons = (card.icons ?? []).slice(0, 6);
	const name = card.sentence;
	const nameSize = name.length > 38 ? 44 : name.length > 26 ? 52 : 64;
	const heroSize = hero.value.length > 6 ? 52 : 82;

	// Icons in the production grid shape: one row up to 3, two rows above that.
	const iconRow = (slice: OgIcon[], size: number, labelSize: number) => (
		<div style={{ display: "flex", flex: 1, gap: "10px" }}>
			{slice.map((icon) => (
				<Chip key={icon.name} label={icon.name} labelSize={labelSize}>
					<Icon icon={icon} size={size} bg="#3f3f46" />
				</Chip>
			))}
		</div>
	);
	const grid =
		icons.length === 0 ? (
			<div style={{ display: "flex", flex: 1, gap: "10px" }}>
				{rest.map((s) => (
					<Chip key={s.label} label={s.label} labelSize={22}>
						<span
							style={{
								fontSize: "64px",
								fontWeight: 900,
								color: INK,
								lineHeight: 1,
								letterSpacing: "-0.04em",
							}}
						>
							{s.value}
						</span>
					</Chip>
				))}
			</div>
		) : icons.length <= 3 ? (
			iconRow(
				icons,
				icons.length === 1 ? 120 : icons.length === 2 ? 100 : 88,
				34,
			)
		) : (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					gap: "10px",
				}}
			>
				{iconRow(icons.slice(0, Math.ceil(icons.length / 2)), 66, 26)}
				{iconRow(icons.slice(Math.ceil(icons.length / 2)), 66, 26)}
			</div>
		);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				fontFamily: SANS,
			}}
		>
			<div
				style={{
					display: "flex",
					height: "14px",
					width: "100%",
					backgroundColor: accent,
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
						gap: "28px",
						marginBottom: "20px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "flex-start",
							gap: "20px",
							flex: 1,
							minWidth: 0,
						}}
					>
						{card.avatarUrl ? (
							<Avatar card={card} size={88} border="3px solid #3f3f46" />
						) : (
							<div
								style={{
									display: "flex",
									width: "88px",
									height: "88px",
									backgroundColor: accent,
									alignItems: "center",
									justifyContent: "center",
									fontSize: "34px",
									fontWeight: 900,
									letterSpacing: "-0.05em",
									color: contrast,
								}}
							>
								AI
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
									fontSize: `${nameSize}px`,
									fontWeight: 800,
									color: INK,
									lineHeight: 1,
									letterSpacing: "-0.04em",
								}}
							>
								{name}
							</span>
							<span
								style={{
									fontSize: "20px",
									color: MUTED,
									marginTop: "8px",
									fontFamily: MONO,
								}}
							>
								{card.kicker.toLowerCase()}
							</span>
						</div>
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-end",
							minWidth: "280px",
						}}
					>
						<span
							style={{
								fontSize: `${heroSize}px`,
								fontWeight: 900,
								color: INK,
								lineHeight: 1,
								whiteSpace: "nowrap",
							}}
						>
							{hero.value}
						</span>
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
							{hero.label}
						</span>
					</div>
				</div>
				<div style={{ display: "flex", marginBottom: "26px" }}>
					<div
						style={{
							display: "flex",
							width: "6px",
							backgroundColor: accent,
							marginRight: "18px",
						}}
					/>
					<p
						style={{
							fontSize: "30px",
							color: BODY,
							lineHeight: 1.28,
							margin: 0,
						}}
					>
						{card.description.length > 120
							? `${card.description.slice(0, 120)}...`
							: card.description}
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
							color: MUTED,
							textTransform: "uppercase",
							letterSpacing: "0.15em",
							marginBottom: "14px",
						}}
					>
						{icons.length ? "AI Tools" : "In numbers"}
					</span>
					{grid}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// E. Banner: the production default banner, for every page
// ---------------------------------------------------------------------------

/** Like `headline`, but the starred word sits on an accent block. */
function headlineBlock(
	line: string,
	accent: string,
	contrast: string,
	size: number,
) {
	const parts = line
		.split(/(\*[^*]+\*)/)
		.filter(Boolean)
		.map((p) => p.trim());
	return parts.map((part) =>
		part.startsWith("*") ? (
			<span
				key={part}
				style={{
					display: "flex",
					backgroundColor: accent,
					color: contrast,
					padding: `0 ${Math.round(size * 0.14)}px`,
					lineHeight: 1,
				}}
			>
				{part.slice(1, -1)}
			</span>
		) : (
			<span key={part} style={{ color: "#e4e4e7" }}>
				{part}
			</span>
		),
	);
}

export function VariantBanner({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const contrast = card.accent.contrast;
	const size = fitSize(card.titleLines, 1080, 108, 44);
	const [primary, ...others] = card.stats;
	const tags = card.range
		? [card.kicker, card.range.toUpperCase()]
		: [card.kicker];
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: "#111214",
				padding: "30px 40px 30px",
				fontFamily: SANS,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "24px",
					fontFamily: MONO,
					fontSize: "16px",
					fontWeight: 700,
					letterSpacing: "0.08em",
					color: accent,
				}}
			>
				<span>{"// FOR:"}</span>
				{tags.map((t, i) => (
					<div
						key={t}
						style={{ display: "flex", alignItems: "center", gap: "24px" }}
					>
						{i > 0 ? (
							<div
								style={{
									display: "flex",
									width: "18px",
									height: "2px",
									backgroundColor: "#3f3f46",
								}}
							/>
						) : null}
						<span>{t}</span>
					</div>
				))}
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					justifyContent: "center",
					paddingTop: "10px",
				}}
			>
				{card.titleLines.map((line) => (
					<div
						key={line}
						style={{
							display: "flex",
							alignItems: "center",
							fontSize: `${size}px`,
							fontWeight: 900,
							lineHeight: 1.02,
							letterSpacing: "-0.04em",
							whiteSpace: "nowrap",
							gap: `${Math.round(size * 0.22)}px`,
						}}
					>
						{headlineBlock(line, accent, contrast, size)}
					</div>
				))}
				{card.avatarUrl || card.icons?.length ? (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "10px",
							marginTop: "26px",
						}}
					>
						<Avatar card={card} size={72} border={`3px solid ${accent}`} />
						{(card.icons ?? []).slice(0, 6).map((icon) => (
							<Icon key={icon.name} icon={icon} size={56} bg={CHIP} />
						))}
					</div>
				) : null}
			</div>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-end",
					gap: "40px",
				}}
			>
				<div style={{ display: "flex", flex: 1, minWidth: 0 }}>
					<div
						style={{
							display: "flex",
							width: "4px",
							backgroundColor: accent,
							marginRight: "30px",
						}}
					/>
					<p
						style={{
							fontSize: "25px",
							color: BODY,
							lineHeight: 1.5,
							margin: 0,
							maxWidth: "640px",
						}}
					>
						{card.description}
					</p>
				</div>
				<div style={{ display: "flex", gap: "14px", alignItems: "stretch" }}>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							backgroundColor: accent,
							padding: "12px 26px",
							minWidth: "160px",
						}}
					>
						<span
							style={{
								fontSize: "38px",
								fontWeight: 900,
								letterSpacing: "-0.04em",
								color: contrast,
								lineHeight: 1,
								whiteSpace: "nowrap",
							}}
						>
							{primary.value}
						</span>
						<span
							style={{
								fontFamily: MONO,
								fontSize: "12px",
								fontWeight: 700,
								letterSpacing: "0.12em",
								color: contrast,
								marginTop: "6px",
								textTransform: "uppercase",
							}}
						>
							{primary.label}
						</span>
					</div>
					{others.slice(0, 1).map((s) => (
						<div
							key={s.label}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								border: "2px solid #52525b",
								padding: "12px 26px",
								minWidth: "160px",
							}}
						>
							<span
								style={{
									fontSize: "38px",
									fontWeight: 900,
									letterSpacing: "-0.04em",
									color: INK,
									lineHeight: 1,
									whiteSpace: "nowrap",
								}}
							>
								{s.value}
							</span>
							<span
								style={{
									fontFamily: MONO,
									fontSize: "12px",
									fontWeight: 700,
									letterSpacing: "0.12em",
									color: "#a1a1aa",
									marginTop: "6px",
									textTransform: "uppercase",
								}}
							>
								{s.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// F. Terminal
// ---------------------------------------------------------------------------

const wrap = (text: string, maxChars: number, maxLines: number) => {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = "";
	for (const w of words) {
		const next = line ? `${line} ${w}` : w;
		if (next.length > maxChars && line) {
			lines.push(line);
			line = w;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines.slice(0, maxLines);
};

export function VariantTerminal({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const command = `aistack open ${card.path === "/" ? "/" : card.path}`;
	const comment = wrap(card.description, 78, 2);
	const faces = [...(card.avatarUrl ? [1] : []), ...(card.icons ?? [])];
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				padding: "34px 48px 36px",
				fontFamily: MONO,
				color: BODY,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					paddingBottom: "22px",
					borderBottom: `2px solid ${RULE}`,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
					{[
						{ id: "close", color: RULE },
						{ id: "min", color: RULE },
						{ id: "zoom", color: accent },
					].map((dot) => (
						<div
							key={dot.id}
							style={{
								display: "flex",
								width: "14px",
								height: "14px",
								backgroundColor: dot.color,
							}}
						/>
					))}
					<span
						style={{
							fontSize: "16px",
							color: MUTED,
							letterSpacing: "0.08em",
							marginLeft: "12px",
						}}
					>
						aistack.to{card.path === "/" ? "" : card.path}
					</span>
				</div>
				<Brand dot={accent} />
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "14px",
					marginTop: "28px",
					fontSize: "24px",
					fontWeight: 700,
				}}
			>
				<span style={{ color: accent }}>$</span>
				<span style={{ color: INK }}>{command}</span>
			</div>

			<div
				style={{
					display: "flex",
					fontFamily: SANS,
					fontSize: card.sentence.length > 34 ? "50px" : "64px",
					fontWeight: 900,
					letterSpacing: "-0.04em",
					lineHeight: 1,
					color: INK,
					marginTop: "22px",
					whiteSpace: "nowrap",
					overflow: "hidden",
				}}
			>
				{card.sentence}
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					marginTop: "16px",
					gap: "4px",
				}}
			>
				{comment.map((l) => (
					<span key={l} style={{ fontSize: "20px", color: MUTED }}>
						# {l}
					</span>
				))}
			</div>

			<div style={{ display: "flex", flex: 1 }} />

			<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				{card.stats.map((s) => (
					<div
						key={s.label}
						style={{
							display: "flex",
							alignItems: "baseline",
							gap: "18px",
							fontSize: "22px",
						}}
					>
						<span
							style={{
								color: accent,
								fontWeight: 700,
								width: "48px",
							}}
						>
							OK
						</span>
						<span style={{ color: BODY, width: "360px", whiteSpace: "nowrap" }}>
							{s.label}
						</span>
						<span
							style={{
								color: INK,
								fontWeight: 700,
								fontSize: "34px",
								letterSpacing: "-0.02em",
							}}
						>
							{s.value}
						</span>
					</div>
				))}
			</div>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginTop: "26px",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
					<span style={{ color: accent, fontSize: "24px", fontWeight: 700 }}>
						$
					</span>
					<div
						style={{
							display: "flex",
							width: "16px",
							height: "28px",
							backgroundColor: accent,
						}}
					/>
				</div>
				{faces.length ? (
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<Avatar card={card} size={48} />
						{(card.icons ?? []).slice(0, 6).map((icon) => (
							<Icon key={icon.name} icon={icon} size={40} bg={CHIP} />
						))}
					</div>
				) : (
					<span style={{ fontSize: "16px", color: MUTED }}>
						{card.range ?? card.kicker.toLowerCase()}
					</span>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// G. Poster
// ---------------------------------------------------------------------------

export function VariantPoster({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const [hero, ...rest] = card.stats;
	const heroSize = Math.max(
		120,
		Math.min(300, Math.floor(1080 / (hero.value.length * 0.6))),
	);
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				padding: "40px 50px 36px",
				fontFamily: SANS,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Brand dot={accent} />
				<span
					style={{
						fontFamily: MONO,
						fontSize: "20px",
						fontWeight: 700,
						letterSpacing: "0.18em",
						color: MUTED,
					}}
				>
					{card.kicker}
				</span>
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					justifyContent: "center",
				}}
			>
				<span
					style={{
						fontSize: `${heroSize}px`,
						fontWeight: 900,
						lineHeight: 0.9,
						letterSpacing: "-0.07em",
						color: INK,
						whiteSpace: "nowrap",
					}}
				>
					{hero.value}
				</span>
				<span
					style={{
						fontFamily: MONO,
						fontSize: "24px",
						fontWeight: 700,
						letterSpacing: "0.16em",
						color: accent,
						marginTop: "18px",
						textTransform: "uppercase",
					}}
				>
					{hero.label}
				</span>
			</div>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-end",
					gap: "40px",
					borderTop: `2px solid ${RULE}`,
					paddingTop: "24px",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						minWidth: 0,
					}}
				>
					<span
						style={{
							fontSize: card.sentence.length > 36 ? "30px" : "38px",
							fontWeight: 800,
							letterSpacing: "-0.03em",
							lineHeight: 1.05,
							color: INK,
							whiteSpace: "nowrap",
							overflow: "hidden",
						}}
					>
						{card.sentence}
					</span>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							marginTop: "14px",
						}}
					>
						<Avatar card={card} size={40} />
						{(card.icons ?? []).slice(0, 6).map((icon) => (
							<Icon key={icon.name} icon={icon} size={36} bg={CHIP} />
						))}
						{!card.avatarUrl && !card.icons?.length ? (
							<span
								style={{
									fontFamily: MONO,
									fontSize: "16px",
									color: MUTED,
									letterSpacing: "0.08em",
								}}
							>
								aistack.to{card.path === "/" ? "" : card.path}
							</span>
						) : null}
					</div>
				</div>
				<div style={{ display: "flex", gap: "40px" }}>
					{rest.map((s) => (
						<div
							key={s.label}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-end",
							}}
						>
							<span
								style={{
									fontSize: "40px",
									fontWeight: 800,
									letterSpacing: "-0.03em",
									lineHeight: 1,
									color: INK,
									whiteSpace: "nowrap",
								}}
							>
								{s.value}
							</span>
							<span
								style={{
									fontFamily: MONO,
									fontSize: "13px",
									letterSpacing: "0.12em",
									color: MUTED,
									marginTop: "8px",
									textTransform: "uppercase",
									whiteSpace: "nowrap",
								}}
							>
								{s.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// H. Frame
// ---------------------------------------------------------------------------

export function VariantFrame({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const contrast = card.accent.contrast;
	const titleSize = card.sentence.length > 44 ? 52 : 66;
	const icons = (card.icons ?? []).slice(0, 6);
	return (
		<div
			style={{
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: accent,
				padding: "16px",
				fontFamily: SANS,
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					backgroundColor: BG,
					padding: "36px 44px 34px",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<span
						style={{
							display: "flex",
							fontFamily: MONO,
							fontSize: "16px",
							fontWeight: 700,
							letterSpacing: "0.18em",
							color: contrast,
							backgroundColor: accent,
							padding: "6px 12px",
						}}
					>
						{card.kicker}
					</span>
					<Brand dot={accent} />
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						textAlign: "center",
						padding: "0 40px",
					}}
				>
					{card.avatarUrl ? (
						<div style={{ display: "flex", marginBottom: "22px" }}>
							<Avatar card={card} size={96} border={`4px solid ${accent}`} />
						</div>
					) : null}
					<span
						style={{
							fontSize: `${titleSize}px`,
							fontWeight: 900,
							lineHeight: 1,
							letterSpacing: "-0.045em",
							color: INK,
							textAlign: "center",
						}}
					>
						{card.sentence}
					</span>
					<p
						style={{
							fontSize: "24px",
							lineHeight: 1.4,
							color: BODY,
							margin: "18px 0 0",
							maxWidth: "820px",
							textAlign: "center",
						}}
					>
						{card.description}
					</p>
					{icons.length ? (
						<div
							style={{
								display: "flex",
								gap: "8px",
								marginTop: "22px",
							}}
						>
							{icons.map((icon) => (
								<Icon key={icon.name} icon={icon} size={44} bg={CHIP} />
							))}
						</div>
					) : null}
				</div>

				<div style={{ display: "flex", gap: "0px" }}>
					{card.stats.map((s) => (
						<div
							key={s.label}
							style={{
								display: "flex",
								flexDirection: "column",
								flex: 1,
								borderLeft: `2px solid ${accent}`,
								paddingLeft: "18px",
							}}
						>
							<span
								style={{
									fontSize: "42px",
									fontWeight: 800,
									letterSpacing: "-0.03em",
									lineHeight: 1,
									color: INK,
									whiteSpace: "nowrap",
								}}
							>
								{s.value}
							</span>
							<span
								style={{
									fontFamily: MONO,
									fontSize: "15px",
									letterSpacing: "0.12em",
									color: MUTED,
									marginTop: "8px",
									textTransform: "uppercase",
									whiteSpace: "nowrap",
								}}
							>
								{s.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// I. Topbar
// ---------------------------------------------------------------------------

export function VariantTopbar({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const titleSize = card.sentence.length > 40 ? 60 : 78;
	const icons = (card.icons ?? []).slice(0, 6);
	const hasFaces = card.avatarUrl || icons.length;
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				fontFamily: SANS,
			}}
		>
			<div
				style={{
					display: "flex",
					height: "28px",
					width: "100%",
					backgroundColor: accent,
				}}
			/>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "34px 50px 40px",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<span
						style={{
							fontFamily: MONO,
							fontSize: "20px",
							fontWeight: 700,
							letterSpacing: "0.18em",
							color: accent,
						}}
					>
						{card.kicker}
					</span>
					<Brand dot={accent} />
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						justifyContent: "center",
					}}
				>
					<span
						style={{
							fontSize: `${titleSize}px`,
							fontWeight: 900,
							lineHeight: 1,
							letterSpacing: "-0.045em",
							color: INK,
							maxWidth: "1000px",
						}}
					>
						{card.sentence}
					</span>
					<p
						style={{
							fontSize: "27px",
							lineHeight: 1.35,
							color: BODY,
							margin: "20px 0 0",
							maxWidth: "860px",
						}}
					>
						{card.description}
					</p>
					{hasFaces ? (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
								marginTop: "24px",
							}}
						>
							<Avatar card={card} size={56} border={`3px solid ${accent}`} />
							{icons.map((icon) => (
								<Icon key={icon.name} icon={icon} size={48} bg={CHIP} />
							))}
						</div>
					) : null}
				</div>

				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-end",
						borderTop: `2px solid ${RULE}`,
						paddingTop: "22px",
					}}
				>
					<div style={{ display: "flex", gap: "48px" }}>
						{card.stats.map((s) => (
							<div
								key={s.label}
								style={{ display: "flex", flexDirection: "column" }}
							>
								<span
									style={{
										fontSize: "44px",
										fontWeight: 800,
										lineHeight: 1,
										letterSpacing: "-0.03em",
										color: INK,
										whiteSpace: "nowrap",
									}}
								>
									{s.value}
								</span>
								<span
									style={{
										fontFamily: MONO,
										fontSize: "14px",
										letterSpacing: "0.12em",
										color: MUTED,
										marginTop: "10px",
										textTransform: "uppercase",
										whiteSpace: "nowrap",
									}}
								>
									{s.label}
								</span>
							</div>
						))}
					</div>
					<span
						style={{
							fontFamily: MONO,
							fontSize: "16px",
							color: MUTED,
							letterSpacing: "0.08em",
						}}
					>
						aistack.to{card.path === "/" ? "" : card.path}
					</span>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Round two: shared pieces
// ---------------------------------------------------------------------------

const TOPBAR = 24;

const TopBar = ({ accent }: { accent: string }) => (
	<div
		style={{
			display: "flex",
			height: `${TOPBAR}px`,
			width: "100%",
			backgroundColor: accent,
		}}
	/>
);

/** E's buttons as figures: the first filled with the accent, the rest outlined. */
function MetricBoxes({
	stats,
	accent,
	contrast,
	valueSize = 40,
}: {
	stats: OgCard["stats"];
	accent: string;
	contrast: string;
	valueSize?: number;
}) {
	return (
		<div style={{ display: "flex", gap: "12px" }}>
			{stats.map((s, i) => (
				<div
					key={s.label}
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: "14px 26px",
						minWidth: "170px",
						...(i === 0
							? { backgroundColor: accent }
							: { border: "2px solid #52525b" }),
					}}
				>
					<span
						style={{
							fontSize: `${valueSize}px`,
							fontWeight: 900,
							letterSpacing: "-0.04em",
							lineHeight: 1,
							whiteSpace: "nowrap",
							color: i === 0 ? contrast : INK,
						}}
					>
						{s.value}
					</span>
					<span
						style={{
							fontFamily: MONO,
							fontSize: "13px",
							fontWeight: 700,
							letterSpacing: "0.12em",
							textTransform: "uppercase",
							marginTop: "8px",
							whiteSpace: "nowrap",
							color: i === 0 ? contrast : "#a1a1aa",
						}}
					>
						{s.label}
					</span>
				</div>
			))}
		</div>
	);
}

/** D's chip grid: one row up to three icons, two rows above that. */
function ChipGrid({ icons }: { icons: OgIcon[] }) {
	const row = (slice: OgIcon[], size: number, labelSize: number) => (
		<div style={{ display: "flex", flex: 1, gap: "10px" }}>
			{slice.map((icon) => (
				<Chip key={icon.name} label={icon.name} labelSize={labelSize}>
					<Icon icon={icon} size={size} bg="#3f3f46" />
				</Chip>
			))}
		</div>
	);
	if (icons.length <= 3)
		return row(
			icons,
			icons.length === 1 ? 110 : icons.length === 2 ? 92 : 80,
			30,
		);
	const half = Math.ceil(icons.length / 2);
	return (
		<div
			style={{ display: "flex", flexDirection: "column", flex: 1, gap: "10px" }}
		>
			{row(icons.slice(0, half), 58, 24)}
			{row(icons.slice(half), 58, 24)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// J. Title: big title in focus
// ---------------------------------------------------------------------------

export function VariantTitle({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const contrast = card.accent.contrast;
	const size = fitSize(card.titleLines, 1080, 108, 44);
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				fontFamily: SANS,
			}}
		>
			<TopBar accent={accent} />
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "30px 50px 40px",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
						<Avatar card={card} size={48} border={`3px solid ${accent}`} />
						<span
							style={{
								fontFamily: MONO,
								fontSize: "22px",
								fontWeight: 700,
								letterSpacing: "0.18em",
								color: accent,
							}}
						>
							{card.kicker}
						</span>
					</div>
					<Brand dot={accent} />
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						justifyContent: "center",
						gap: `${Math.round(size * 0.06)}px`,
					}}
				>
					{card.titleLines.map((line) => (
						<div
							key={line}
							style={{
								display: "flex",
								alignItems: "center",
								fontSize: `${size}px`,
								fontWeight: 900,
								lineHeight: 0.98,
								letterSpacing: "-0.045em",
								whiteSpace: "nowrap",
								gap: `${Math.round(size * 0.22)}px`,
							}}
						>
							{headlineBlock(line, accent, contrast, size)}
						</div>
					))}
				</div>

				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-end",
						gap: "40px",
					}}
				>
					<MetricBoxes stats={card.stats} accent={accent} contrast={contrast} />
					<span
						style={{
							fontFamily: MONO,
							fontSize: "16px",
							color: MUTED,
							letterSpacing: "0.08em",
							paddingBottom: "4px",
						}}
					>
						aistack.to{card.path === "/" ? "" : card.path}
					</span>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// K. Board: smaller title, elements in focus
// ---------------------------------------------------------------------------

export function VariantBoard({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const contrast = card.accent.contrast;
	const icons = (card.icons ?? []).slice(0, 6);
	const titleSize = card.sentence.length > 38 ? 40 : 56;
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				fontFamily: SANS,
			}}
		>
			<TopBar accent={accent} />
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "30px 44px 34px",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: "28px",
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
						{card.avatarUrl ? (
							<Avatar card={card} size={84} border="3px solid #3f3f46" />
						) : (
							<div
								style={{
									display: "flex",
									width: "84px",
									height: "84px",
									backgroundColor: accent,
									alignItems: "center",
									justifyContent: "center",
									fontSize: "32px",
									fontWeight: 900,
									letterSpacing: "-0.05em",
									color: contrast,
								}}
							>
								AI
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
									fontSize: `${titleSize}px`,
									fontWeight: 800,
									color: INK,
									lineHeight: 1,
									letterSpacing: "-0.04em",
								}}
							>
								{card.sentence}
							</span>
							<span
								style={{
									fontFamily: MONO,
									fontSize: "18px",
									fontWeight: 700,
									letterSpacing: "0.14em",
									color: accent,
									marginTop: "10px",
								}}
							>
								{card.kicker}
							</span>
						</div>
					</div>
					<Brand dot={accent} />
				</div>

				<div
					style={{
						display: "flex",
						flex: 1,
						minHeight: 0,
						marginTop: "24px",
						marginBottom: "22px",
					}}
				>
					{icons.length ? (
						<ChipGrid icons={icons} />
					) : (
						<div
							style={{
								display: "flex",
								flex: 1,
								alignItems: "center",
								fontSize: "36px",
								lineHeight: 1.3,
								fontWeight: 600,
								color: "#e4e4e7",
								maxWidth: "980px",
							}}
						>
							{card.description}
						</div>
					)}
				</div>

				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-end",
						gap: "40px",
					}}
				>
					<MetricBoxes
						stats={card.stats}
						accent={accent}
						contrast={contrast}
						valueSize={34}
					/>
					<span
						style={{
							fontFamily: MONO,
							fontSize: "16px",
							color: MUTED,
							letterSpacing: "0.08em",
							paddingBottom: "4px",
						}}
					>
						aistack.to{card.path === "/" ? "" : card.path}
					</span>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// L. Frame 2: the frame, bigger
// ---------------------------------------------------------------------------

export function VariantFrame2({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const contrast = card.accent.contrast;
	const icons = (card.icons ?? []).slice(0, 6);
	const size = fitSize(card.titleLines, 980, 92, 44);
	return (
		<div
			style={{
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: accent,
				padding: "18px",
				fontFamily: SANS,
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					backgroundColor: BG,
					padding: "30px 44px 30px",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<span
						style={{
							display: "flex",
							fontFamily: MONO,
							fontSize: "18px",
							fontWeight: 700,
							letterSpacing: "0.18em",
							color: contrast,
							backgroundColor: accent,
							padding: "8px 14px",
						}}
					>
						{card.kicker}
					</span>
					<Brand dot={accent} />
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					{card.avatarUrl ? (
						<div style={{ display: "flex", marginBottom: "20px" }}>
							<Avatar card={card} size={112} border={`5px solid ${accent}`} />
						</div>
					) : null}
					{card.titleLines.map((line) => (
						<div
							key={line}
							style={{
								display: "flex",
								justifyContent: "center",
								fontSize: `${size}px`,
								fontWeight: 900,
								lineHeight: 0.98,
								letterSpacing: "-0.045em",
								whiteSpace: "nowrap",
								gap: `${Math.round(size * 0.2)}px`,
							}}
						>
							{headline(line, accent)}
						</div>
					))}
					{icons.length ? (
						<div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
							{icons.map((icon) => (
								<Icon
									key={icon.name}
									icon={icon}
									size={60}
									bg={CHIP}
									border={`1px solid ${RULE}`}
								/>
							))}
						</div>
					) : (
						<p
							style={{
								fontSize: "27px",
								lineHeight: 1.35,
								color: "#e4e4e7",
								margin: "20px 0 0",
								maxWidth: "900px",
								textAlign: "center",
							}}
						>
							{card.description}
						</p>
					)}
				</div>

				<div style={{ display: "flex", justifyContent: "center" }}>
					<MetricBoxes
						stats={card.stats}
						accent={accent}
						contrast={contrast}
						valueSize={36}
					/>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// M. Split 2: headline on the lime panel, elements on the dark panel
// ---------------------------------------------------------------------------

export function VariantSplit2({ card }: { card: OgCard }) {
	const accent = card.accent.base;
	const contrast = card.accent.contrast;
	const icons = (card.icons ?? []).slice(0, 6);
	// Re-wrap for the narrow panel so its width, not the line count, sets the size.
	const lines = wrap(
		card.titleLines.map((l) => l.replace(/\*/g, "")).join(" "),
		11,
		4,
	);
	const size = fitSize(lines, 400, 84, 40);
	return (
		<div
			style={{
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				fontFamily: SANS,
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					width: "480px",
					backgroundColor: accent,
					padding: "40px 40px 36px",
					justifyContent: "space-between",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Brand color={contrast} dot={contrast} />
					<Avatar card={card} size={56} border={`3px solid ${contrast}`} />
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
					{lines.map((line) => (
						<span
							key={line}
							style={{
								fontSize: `${size}px`,
								fontWeight: 900,
								lineHeight: 0.95,
								letterSpacing: "-0.05em",
								color: contrast,
								whiteSpace: "nowrap",
							}}
						>
							{line}
						</span>
					))}
				</div>
				<span
					style={{
						fontFamily: MONO,
						fontSize: "16px",
						fontWeight: 700,
						letterSpacing: "0.16em",
						color: contrast,
					}}
				>
					{card.kicker}
				</span>
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					flex: 1,
					padding: "40px 44px 36px",
					minWidth: 0,
				}}
			>
				<div style={{ display: "flex", flex: 1, minHeight: 0 }}>
					{icons.length ? (
						<ChipGrid icons={icons} />
					) : (
						<div
							style={{
								display: "flex",
								flex: 1,
								alignItems: "center",
								fontSize: "32px",
								lineHeight: 1.3,
								fontWeight: 600,
								color: "#e4e4e7",
							}}
						>
							{card.description}
						</div>
					)}
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-end",
						marginTop: "24px",
						gap: "24px",
					}}
				>
					<MetricBoxes
						stats={card.stats}
						accent={accent}
						contrast={contrast}
						valueSize={32}
					/>
				</div>
			</div>
		</div>
	);
}
