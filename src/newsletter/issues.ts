/**
 * The newsletter issues, in code (#201, map #198).
 *
 * The compose prototype (#202) ruled that issues stay code-based, like the sync
 * broadcast: no compose page ships, because a page would make every issue feel
 * generic. The [Bytes newsletter](https://bytes.dev) is the editorial north
 * star. So an issue is authored here, in a pull request, and reviewed the way
 * code is reviewed.
 *
 * What lives here is the EDITORIAL part: the number, the subject line, the
 * preview text, the intro, and the items in send order.
 *
 * What does not live here is the summaries. A summary lives on the item row,
 * written by the drafting skill (#233) and edited by the owner in the inbox,
 * and both projections read it from there. That is safe because a sent issue is
 * never edited (#202), so an item's summary and the copy in 177 inboxes can
 * only diverge if someone edits after a send, which nothing offers to do.
 *
 * Items are named by URL. `newsletter:prepareIssue` resolves each one against
 * the item stream through the same `newsUrlKey` the collector dedupes with, and
 * reports anything missing or still unapproved rather than quietly dropping it.
 */

/** One authored issue. The registry below is the whole newsletter. */
export interface NewsletterIssueDefinition {
	/** 1, 2, 3. Shown as "Issue #N" and used to order the archive. */
	number: number;
	/** The archive page address: /news/<slug>. Stable once sent. */
	slug: string;
	/** The subject line, as it lands in an inbox. */
	subject: string;
	/** The preheader: the grey line a mail client shows after the subject. */
	preview: string;
	/** One short paragraph at the top of the issue, in the owner's voice. */
	intro: string;
	/**
	 * The items, IN SEND ORDER, by URL. The order is the composition.
	 *
	 * The URL is the one the collector stored, and matching is by `newsUrlKey`,
	 * so a tracking parameter or a trailing slash does not break the join.
	 */
	itemUrls: string[];
}

export const NEWSLETTER_ISSUES: NewsletterIssueDefinition[] = [
	{
		number: 1,
		slug: "issue-1",
		subject: "AI Stack News #1: Fable 5, Gemini 3.7 Flash, and a $7B router",
		preview:
			"The first issue. Two frontier releases, and the routing layer got a price tag.",
		intro:
			"This is the first issue of AI Stack News. Every week it collects what actually moved for people who build with AI tools: the model releases, the harness changes, and the money that decides which of them survive. It is short on purpose. If a week is thin, it skips.",
		itemUrls: [
			// Models: the two releases that set the week.
			"https://aicrier.com/post/d05m7v7vjz04z5cscavi",
			"https://www.latent.space/p/ainews-gemini-37-flash-brings-gdm",
			// Industry: where the money went.
			"https://www.latent.space/p/ainews-stripe-buys-openrouter-for",
			"https://www.latent.space/p/ainews-poolside-gets-12b-reverse",
			"https://www.latent.space/p/ainews-memory-prices-up-500-in-12",
			// Agents: how the harness keeps eating the model's job.
			"https://www.latent.space/p/attention-interface",
			"https://simonwillison.net/2026/Aug/22/more-than-just-code-review/",
			"https://www.latent.space/p/wayfinder-skill",
			// Tools.
			"https://simonwillison.net/2026/Aug/22/llm/",
			"https://simonwillison.net/2026/Aug/21/stop-making-tuis/",
			"https://simonwillison.net/2026/Aug/19/smolmachines-untrusted-sandbox/",
			// Policy and platform.
			"https://openai.com/index/offering-zero-data-retention-for-frontier-models",
			"https://openai.com/index/introducing-ai-futures",
			// Releases: one roll-up per tool, newest tag as the link.
			"https://github.com/anthropics/claude-code/releases/tag/v2.1.241",
			"https://github.com/openai/codex/releases/tag/rust-v0.150.0-alpha.7",
			"https://github.com/google-gemini/gemini-cli/releases/tag/v0.56.0",
			"https://github.com/anomalyco/opencode/releases/tag/v1.18.21",
			"https://github.com/earendil-works/pi/releases/tag/v0.84.2",
		],
	},
];

/** The authored issue with this slug, or null. */
export function getIssueDefinition(
	slug: string,
): NewsletterIssueDefinition | null {
	return NEWSLETTER_ISSUES.find((issue) => issue.slug === slug) ?? null;
}
