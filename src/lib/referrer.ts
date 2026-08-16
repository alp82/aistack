// First-touch session attribution (#77, map #76).
//
// The session's FIRST page classifies `document.referrer`. Every later page in
// the session is `internal`. This is deliberately not a per-page referrer: a
// same-origin SPA navigation sends no `Referer` header at all, so per-page
// classification would report almost everything as `direct`.
//
// The value is client-supplied and therefore spoofable. That is accepted: it
// selects one of six buckets on the spoofer's own view, and the raw referrer is
// never stored - only the bucket travels.

export type ReferrerBucket =
	| "direct"
	| "search"
	| "ai"
	| "social"
	| "internal"
	| "other";

const STORAGE_KEY = "aistack:referrer-bucket";

/**
 * Assistants get their own bucket, split out of `search`.
 *
 * "Did an assistant send someone here" is the question the aggregate page
 * exists to answer, and the split cannot be applied retroactively - a view
 * filed under `search` today can never be recovered as `ai`.
 */
const AI_HOSTS = [
	"chatgpt.com",
	"chat.openai.com",
	"claude.ai",
	"perplexity.ai",
	"gemini.google.com",
	"copilot.microsoft.com",
	"you.com",
	"phind.com",
	"poe.com",
];

const SEARCH_HOSTS = [
	"google.",
	"bing.com",
	"duckduckgo.com",
	"search.brave.com",
	"ecosia.org",
	"yandex.",
	"baidu.com",
	"startpage.com",
	"kagi.com",
	"qwant.com",
];

const SOCIAL_HOSTS = [
	"x.com",
	"twitter.com",
	"t.co",
	"reddit.com",
	"news.ycombinator.com",
	"linkedin.com",
	"lnkd.in",
	"facebook.com",
	"instagram.com",
	"bsky.app",
	"mastodon.",
	"youtube.com",
	"discord.com",
	"github.com",
	"lobste.rs",
	"dev.to",
	"medium.com",
	"substack.com",
];

function matches(host: string, needles: readonly string[]): boolean {
	return needles.some((n) => host === n || host.includes(n));
}

/**
 * Classify one raw referrer against one current origin.
 *
 * Exported separately from the stateful reader below so the rule is testable
 * without a DOM or a storage stub.
 */
export function classifyReferrer(
	rawReferrer: string,
	currentOrigin: string,
): ReferrerBucket {
	if (!rawReferrer) return "direct";

	let host: string;
	let origin: string;
	try {
		const url = new URL(rawReferrer);
		host = url.hostname.toLowerCase().replace(/^www\./, "");
		origin = url.origin;
	} catch {
		return "other";
	}

	if (origin === currentOrigin) return "internal";
	if (matches(host, AI_HOSTS)) return "ai";
	if (matches(host, SEARCH_HOSTS)) return "search";
	if (matches(host, SOCIAL_HOSTS)) return "social";
	return "other";
}

/**
 * The bucket for this session, deciding it on the first call and remembering it
 * for every later page.
 *
 * `sessionStorage` and not `localStorage`: the attribution belongs to one visit,
 * and a returning visitor next week arrived from somewhere new.
 *
 * A session whose first page was same-origin resolves to `internal`, which is
 * correct - the visitor was already here.
 */
export function sessionReferrerBucket(): ReferrerBucket {
	if (typeof window === "undefined") return "direct";

	try {
		const held = window.sessionStorage.getItem(STORAGE_KEY);
		if (held) return held as ReferrerBucket;
	} catch {
		// Storage denied (private mode, blocked cookies). Classify every page,
		// which reads as `internal` after the first - undercounting the source
		// rather than inventing one.
	}

	const bucket = classifyReferrer(document.referrer, window.location.origin);
	try {
		window.sessionStorage.setItem(STORAGE_KEY, bucket);
	} catch {
		// Same as above. The bucket for THIS page is still correct.
	}
	return bucket;
}
