import type * as React from "react";

export const EMAIL_CONFIG = {
	productName: "AI Stack",
	websiteUrl: "https://aistack.to",
};

export const colors = {
	// Background - high contrast
	bgBody: "#f5f5f5",
	bgContainer: "#ffffff",
	bgFooter: "#111111",
	bgAccentBlock: "#111111",

	// Accent (lime)
	accentLime: "rgba(162, 230, 53, 0.73)",
	accentLimeContrast: "#0a1f02",

	// Text
	textPrimary: "#0a0a0a",
	textSecondary: "#3d3d3d",
	textMuted: "#737373",
	textInverse: "#fafafa",

	// Border - stark
	borderStrong: "#0a0a0a",
	borderSubtle: "#e5e5e5",
};

export const fonts = {
	body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
	mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
};

// CSS keyframes for button glow animation
// Works in Gmail, Apple Mail, iOS Mail - graceful fallback in Outlook
export const glowKeyframes = `
@keyframes buttonGlow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(163, 230, 53, 0);
  }
  50% {
    box-shadow: 0 0 24px 6px rgba(163, 230, 53, 0.5);
  }
}
`;

export const styles: Record<string, React.CSSProperties> = {
	// ═══════════════════════════════════════
	// LAYOUT
	// ═══════════════════════════════════════
	body: {
		backgroundColor: colors.bgBody,
		fontFamily: fonts.body,
		padding: "48px 16px",
		margin: 0,
	},
	container: {
		backgroundColor: colors.bgContainer,
		padding: 0,
		margin: "0 auto",
		width: "100%",
		maxWidth: 560,
		overflow: "hidden",
	},

	// ═══════════════════════════════════════
	// HEADER - Bold dark stripe
	// ═══════════════════════════════════════
	header: {
		backgroundColor: colors.bgAccentBlock,
		padding: "28px 40px",
	},
	logoSquare: {
		width: 16,
		height: 16,
		backgroundColor: colors.accentLime,
	},
	logoText: {
		fontFamily: fonts.body,
		fontSize: 18,
		fontWeight: 800,
		letterSpacing: "-0.02em",
		color: colors.textInverse,
		textTransform: "uppercase" as const,
		margin: 0,
		padding: 0,
		lineHeight: "1",
	},

	// ═══════════════════════════════════════
	// CONTENT - Generous whitespace
	// ═══════════════════════════════════════
	content: {
		padding: "48px 40px 56px",
	},
	sectionLabel: {
		fontFamily: fonts.mono,
		fontSize: 10,
		fontWeight: 600,
		letterSpacing: "0.15em",
		color: colors.textMuted,
		textTransform: "uppercase" as const,
		margin: "0 0 12px",
	},
	h1: {
		fontSize: 32,
		fontWeight: 800,
		color: colors.textPrimary,
		margin: "0 0 24px",
		lineHeight: "1.1",
		letterSpacing: "-0.02em",
		textTransform: "uppercase" as const,
	},
	p: {
		fontSize: 16,
		lineHeight: "28px",
		color: colors.textSecondary,
		margin: "0 0 32px",
	},

	// ═══════════════════════════════════════
	// CTA - Big, bold, brutalist
	// ═══════════════════════════════════════
	ctaWrap: {
		marginTop: 16,
		marginBottom: 16,
	},
	cta: {
		display: "inline-block",
		padding: "16px 32px",
		backgroundColor: colors.accentLime,
		color: colors.accentLimeContrast,
		textDecoration: "none",
		fontFamily: fonts.mono,
		fontSize: 15,
		fontWeight: 700,
		letterSpacing: "0.06em",
		textTransform: "uppercase" as const,
	},
	ctaAnimated: {
		display: "inline-block",
		padding: "16px 32px",
		backgroundColor: colors.accentLime,
		color: colors.accentLimeContrast,
		textDecoration: "none",
		fontFamily: fonts.mono,
		fontSize: 15,
		fontWeight: 700,
		letterSpacing: "0.06em",
		textTransform: "uppercase" as const,
		animation: "buttonGlow 2s ease-in-out infinite",
	},

	// ═══════════════════════════════════════
	// DIVIDERS & DETAILS
	// ═══════════════════════════════════════
	hr: {
		border: "none",
		borderTop: `2px solid ${colors.borderSubtle}`,
		margin: "32px 0",
	},
	small: {
		fontFamily: fonts.mono,
		fontSize: 12,
		color: colors.textMuted,
		lineHeight: "20px",
		margin: "32px 0 0",
		letterSpacing: "0.01em",
	},
	codeBlock: {
		fontFamily: fonts.mono,
		fontSize: 11,
		backgroundColor: colors.bgBody,
		color: colors.textSecondary,
		padding: "12px 16px",
		border: `1px solid ${colors.borderSubtle}`,
		margin: "24px 0 0",
		wordBreak: "break-all" as const,
		lineHeight: "18px",
	},

	// ═══════════════════════════════════════
	// FOOTER - Dark, minimal
	// ═══════════════════════════════════════
	footer: {
		backgroundColor: colors.bgFooter,
		padding: "24px 40px",
	},
	footerText: {
		fontFamily: fonts.mono,
		fontSize: 13,
		color: colors.textMuted,
		lineHeight: "20px",
		margin: 0,
		letterSpacing: "0.01em",
	},
	footerLink: {
		color: colors.accentLime,
		textDecoration: "none",
	},
};
