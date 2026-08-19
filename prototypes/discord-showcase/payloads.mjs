// PROTOTYPE (alp82/aistack#181). Throwaway. One payload per message type from
// docs/specs/discord-bot.md. Figures come from the live leaderboard on
// 2026-08-19. The demo page marks the few inferred figures.

export const SITE = "https://aistack.to";
export const LIME = 0xa3e635;

const STACK_SLUG = "alpers-agent-stack-unw0sl";
const STACK_URL = `${SITE}/stacks/${STACK_SLUG}`;

const linkButton = (label, url) => ({
	type: 1,
	components: [{ type: 2, style: 5, label, url }],
});

const EPHEMERAL = 64;

export const payloads = {
	// /stack <slug> - the stack card: OG image plus one link button.
	stack: {
		embeds: [
			{
				title: "Alper's Agent Stack",
				url: STACK_URL,
				color: LIME,
				image: { url: `${SITE}/api/og/stack/${STACK_SLUG}` },
			},
		],
		components: [linkButton("View stack", STACK_URL)],
	},

	// /tokens <slug> - the measured numbers as a text embed with fields.
	tokens: {
		embeds: [
			{
				title: "Alper's Agent Stack · measured, last 30 days",
				url: STACK_URL,
				color: LIME,
				fields: [
					{ name: "Tokens", value: "`4.52B` over `19` syncs", inline: true },
					{ name: "Synced", value: "today", inline: true },
					{
						name: "Models",
						value: "Claude Opus 5 `55%` of attributed tokens. 10 more models share the rest.",
					},
					{ name: "Harnesses", value: "Claude Code + Codex" },
					{
						name: "Spend",
						value: "`$5,380` · `100.0%` of tokens priced",
					},
				],
				footer: {
					text: "Counted on the builder's machine, published by them. Prices: anthropic-list-2026-07-25, openai-list-2026-08-02.",
				},
			},
		],
		components: [linkButton("View stack", STACK_URL)],
	},

	// /leaderboard - top builders by 30-day token volume.
	leaderboard: {
		embeds: [
			{
				title: "AI coding leaderboard · measured, last 30 days",
				url: `${SITE}/leaderboard`,
				color: LIME,
				description: [
					"**1** [OrcDev](https://aistack.to/stacks/orcdev-u9ckco) · `99.86B` · GPT-5.6 Sol 87% · `$66,964`",
					"**2** [Solomon](https://aistack.to/stacks/solomon-qmqzh8) · `52.11B` · GPT-5.6 Sol 60% · `≥ $31,621`",
					"**3** [Florian F.](https://aistack.to/stacks/florian-f-2p88bv) · `16.98B` · GPT-5.6 Sol 52% · `≥ $12,903`",
					`**4** [Alper's Agent Stack](${STACK_URL}) · \`4.52B\` · Claude Opus 5 55% · \`$5,380\``,
				].join("\n"),
				fields: [
					{
						name: "All measured stacks",
						value: "`194.2B` tokens · `6` stacks · `$126,939` at least, 6 of 6 publish cost",
					},
				],
				footer: {
					text: "Spend is a lower bound. Prices: anthropic-list-2026-07-25, openai-list-2026-08-02.",
				},
			},
		],
		components: [linkButton("View leaderboard", `${SITE}/leaderboard`)],
	},

	// /model <name> - adoption and token share for one model.
	model: {
		embeds: [
			{
				title: "GPT-5.6 Sol · measured, last 30 days",
				url: `${SITE}/leaderboard`,
				color: LIME,
				fields: [
					{ name: "Token share", value: "`72%` of attributed tokens", inline: true },
					{ name: "Measured on", value: "`4` stacks", inline: true },
					{ name: "Leads", value: "`3` stacks", inline: true },
				],
				footer: {
					text: "Share of tokens that carry a model name, across all measured stacks.",
				},
			},
		],
		components: [linkButton("View leaderboard", `${SITE}/leaderboard`)],
	},

	// /link - ephemeral reply with a signed short-lived URL. The URL is a
	// sample: the link page does not exist yet.
	link: {
		flags: EPHEMERAL,
		embeds: [
			{
				title: "Link your aistack account",
				color: LIME,
				description:
					"Open this URL and sign in. It is valid for 10 minutes and only works once.\n\n" +
					`${SITE}/link/discord?token=c2FtcGxlLXNpZ25lZC10b2tlbg`,
			},
		],
		components: [
			linkButton(
				"Open link page",
				`${SITE}/link/discord?token=c2FtcGxlLXNpZ25lZC10b2tlbg`
			),
		],
	},

	// /stack or /tokens with no argument, from a user with no linked account.
	unlinked: {
		flags: EPHEMERAL,
		content:
			"No aistack account is linked to your Discord user. Run `/link`, open the URL, and sign in. After that, this command with no argument shows your own stack.",
	},

	// Error states. Plain ephemeral text, no embed.
	errorUnknownStack: {
		flags: EPHEMERAL,
		content:
			'No stack matches "my-cool-stack". Use the slug from the stack page URL, like `alpers-agent-stack-unw0sl`.',
	},
	errorUnknownModel: {
		flags: EPHEMERAL,
		content:
			'No model matches "gpt-9". Use a model name from the leaderboard, like `GPT-5.6 Sol` or `Claude Opus 5`.',
	},
	errorNoData: {
		flags: EPHEMERAL,
		content:
			"This stack has no measured history. The owner can publish one with `aistack sync`.",
	},
};
