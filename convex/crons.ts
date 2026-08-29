import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Nightly orphan icon-storage GC. Deletes blobs not referenced by any
// tools/models/bundles row that are at least 24h old.
crons.daily(
  'icon-orphan-gc',
  { hourUTC: 4, minuteUTC: 0 },
  internal.iconStorage.gcOrphans,
)

// Hourly rate-limit table cleanup. Deletes expired apiRateLimits rows to
// prevent unbounded table growth.
crons.interval(
  'rate-limit-cleanup',
  { hours: 1 },
  internal.rateLimit.cleanupExpiredRateLimits,
)

// Hourly device-code session cleanup (#52). `authStart` is unauthenticated and
// inserts one 15-minute row per call, and nothing collected them - so this is
// the unbounded-growth half of the login path, which a rate limit alone does
// not close. It also GCs the machine name an abandoned login left behind.
crons.interval(
  'cli-session-cleanup',
  { hours: 1 },
  internal.cliSessions.cleanupExpiredSessions,
)

// Hourly Discord link cleanup. A user may request `/link` and never open the
// 10-minute URL, so expired one-time rows need their own bounded cleanup.
crons.interval(
  'discord-link-cleanup',
  { hours: 1 },
  internal.discordLink.cleanupExpiredTokens,
)

// Nightly kept-private aging. The snapshot half of this cron went with the
// snapshot table (ADR-0011): days are never pruned server-side, and the
// inventory is one row per source. What stays is consent hygiene, not data
// retention: staged names the owner never published age out after 30 days.
crons.daily(
  'kept-private-gc',
  { hourUTC: 4, minuteUTC: 30 },
  internal.measured.gcMeasured,
)

// Hourly view-dedupe cleanup (#77, map #76). The markers exist only to make a
// visitor count once per target per UTC day, so they are dead the moment the
// day closes. Keeping today and yesterday means a delayed retry crossing
// midnight cannot double-count. `viewCounters` is permanent and is NOT touched.
crons.interval('view-dedupe-cleanup', { hours: 1 }, internal.views.gcDedupe)

// The news collector, tier 1: the generic feed and GitHub releases lane (#204,
// map #198). Six-hourly, because the newsletter is weekly and a source that
// posts twice a day is still caught four times before anyone reads the inbox.
// The scrapers (#210) get their own cron.
crons.interval('news-collect', { hours: 6 }, internal.news.collect)

// The news collector, tier 2: the Hacker News lane (#208). DAILY, not
// six-hourly, and every run re-reads the last 48 hours.
//
// Points settle over about two days: only 6% of stories under six hours old
// sit at 20 points, against 10% of settled ones (#178). A faster cron would
// not find more stories, it would only ask the same question before Hacker
// News has answered it. The re-read is what catches the overnight climber.
//
// 06:00 UTC, so the night's stories are settled and in the inbox before the
// owner opens it. One run costs 2 or 3 of the 10,000 requests an hour Algolia
// allows.
crons.daily(
  'news-collect-hn',
  { hourUTC: 6, minuteUTC: 0 },
  internal.news.collectHackerNews,
)

// The news collector, tier 3: the vendor scrapers (#210, map #198). Same six
// hours as the feed lane, offset by 30 minutes so the two runs do not open
// their connections together. A cycle is about eight requests. The first run
// after a deploy seeds the baselines and adds nothing, which is the point.
crons.cron('news-scrape', '30 */6 * * *', internal.newsScrapers.scrape)

// The price and model import (#337). Daily: models.dev has no dated history,
// so the run is what dates a rate change, and a day is the grain the catalog
// cites. 05:00 UTC, after the icon GC and before the owner's morning. A run
// that finds nothing changed writes one log line and nothing else.
crons.daily(
  'model-price-import',
  { hourUTC: 5, minuteUTC: 0 },
  internal.modelImport.run,
)

export default crons
