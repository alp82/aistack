# AI Stack

AI Stack is a webapp for sharing measured AI tool stacks. This glossary holds the canonical
names for the domain. Definitions say what a term is, not how the code does it.

## Language

### News pipeline

**News item**:
One collected link with its headline, date, source, topic, and a summary in our own words.
_Avoid_: bit, post, entry

**Source**:
A place the collector reads, such as a feed, a release page, or a search API.

**License class**:
What we may store and show for one piece of collected content. It sits on the source, and it
is frozen onto the item at collection time.
_Avoid_: license, rights

**Collector**:
The scheduled job that reads sources and writes new items to the inbox.

**Scraper**:
The lane of the collector that reads a vendor which publishes no feed. It finds news by
comparing the page against the baseline.
_Avoid_: crawler, spider

**Baseline**:
Everything one scraper has already seen on its page. An entry outside the baseline is news,
and the first read of a page seeds the baseline without collecting anything.

**Quick-add**:
The manual intake bar. The owner pastes a URL and nothing else, and the item lands in the
inbox.

**Inbox**:
The private list of collected items that wait for the owner to approve or discard them.

**Source group**:
One source's share of the inbox, shown as one closed box with a count. A group is a way to
browse related items. Every verdict is per item, never per group.

**Draft**:
The machine-written summary and topic on an inbox item, before the owner edits them.

**Item stream**:
All approved items. The stream itself is private. Only a projection makes items public.
_Avoid_: feed (the activity feed is a different thing)

**Projection**:
A public view over the item stream. The newsletter and the knowledge base are the two
projections.

**Newsletter**:
The push projection. A weekly email composed from stream items.
_Avoid_: digest, broadcast (a broadcast is a one-off announcement email)

**Issue**:
One week's composed newsletter, with its own public archive page. It is authored in code,
in `src/newsletter/issues.ts`, and a sent issue is never edited.

**Prepare**:
Resolving an authored issue's URLs against the item stream into its draft row. It reports
every URL that is missing, unapproved, or undrafted, and it refuses a sent issue.
_Avoid_: compose (there is no compose page)

**Knowledge base**:
The pull projection. Stream items grouped by topic on a public page.

**Topic**:
An owner-managed label. Each item carries one topic. The list evolves over time.
_Avoid_: tag, category

**Publish**:
The per-projection act that makes stream content public. Approval alone publishes nothing.

**Newsletter link target**:
The site page an issue's own links open. The default is the main page. Each issue also
carries one quieter read-in-browser link to its own archive page.

**Lane**:
One collector and the kind of source it reads. The feed lane reads RSS and Atom. The
Hacker News lane reads the search API. The scrapers read pages. Each lane has its own
schedule, and a lane only ever reads its own source rows.

**Points gate**:
The points a Hacker News story needs before the lane collects it. It sits on the source
row, and the owner moves it to change how much reaches the inbox.
_Avoid_: threshold, score

**Owner paste**:
The supported way an X post becomes an item. The owner pastes the post link, and the lane
stores the post ID with the official embed.

**Pick list**:
The recent posts of an X profile, offered after the owner pastes a profile link. Nothing
is stored until the owner picks a post.

### Discord bot

**Stack card**:
The shareable image for one stack, with the stack name, the creator, and the tool icons.

**Linked account**:
A Discord user tied to a creator through the /link flow.

### Email

**Transactional mail**:
Mail a user action triggers, such as sign-in or waitlist confirmation. It always sends and
has no preference toggle.

**Email category**:
A preference toggle a recipient can turn off. The two categories are the newsletter and
important updates. Every non-transactional send belongs to exactly one category.

**Important updates**:
The email category for product announcements outside the newsletter.

**Subscriber**:
An address that asked for the newsletter on the public subscribe page. Members and the
waitlist are already in the audience, so this is the newcomer who is neither.

**Preferences page**:
The page that shows both email categories for one address at once. It is reached by the
signed token every send already carries, and it needs no login.

### Workflow surface

**Project workspace**:
One local directory where a harness recorded activity. Clones in different directories or on
different machines are different project workspaces.
_Avoid_: project (the Projects section shows authored portfolio projects)

**Project workspace identifier**:
A persistent random value that represents one project workspace in measured payloads. The
identifier reveals neither the directory path nor the repository name.
_Avoid_: project key, workspace ID

**Lower-bound reading**:
A merged measurement whose stored evidence proves at least the displayed value but cannot
recover the exact union. A lower-bound reading becomes exact when every visible source carries a set.
_Avoid_: max (that names the old calculation, not what the value means)

**Pool**:
The full set of workflow metrics a stack can show. The composed section surfaces a few of
them and the pool view lists all of them.
_Avoid_: candidates, extractables

**Metric box**:
One workflow metric rendered as a number with a label and its source rule.

**Exact metric**:
A metric the harness records or local Git history proves directly.

**Proxy metric**:
A metric a versioned matching rule derives from transcript events. Its label names the rule.

**Coverage tag**:
The label on a metric that names the harnesses it counts, when not all synced harnesses
record it.

**Template lead**:
The opening prose of the workflow section. Fixed sentence forms over measured numbers,
versioned with the metric rules. No LLM writes it.
_Avoid_: workflow draft (the LLM draft was ruled out, see ADR-0002)

**Workflow day**:
One machine's workflow atoms for one UTC date: harness counts, sums, maxes and bucket
histograms, plus the Git counts. Only combinable atoms, never a share or a median. A
re-synced day replaces that day, and days append across syncs.
_Avoid_: workflow section (that named the one 30-day section the wire carried before #285)

**Measured day**:
One machine's combinable atoms for one UTC date, both halves in one row: the workflow
atoms and the usage atoms (tokens by kind, cost, sessions). One shape, one version. The
`publishWorkflow` and `publishCost` bits each gate their own half, at both ends.
_Avoid_: workflow day, usage day (the row holds both halves; a half is a block, not a row)

**Day manifest**:
The list of dates the server holds for one (stack, machine), each with its day
fingerprint, plus the retention in days. The CLI reads it before it sends and ships only
the dates that are missing or whose fingerprint differs. An empty manifest is a fresh
machine and means send everything inside retention.

**Day fingerprint**:
A content hash of a measured day's atoms, computed by the CLI and stored on the row.
Equal fingerprints mean the server already holds that day as the machine sees it. A
rule change that bumps the aggregate version changes every fingerprint on purpose.

**Workflow reading**:
The fold of one machine's workflow days over a window. Every figure the section prints is
computed over the fold. A reading is never merged with another machine's (ADR-0009).
_Avoid_: workflow snapshot (that names the measured payload's table, not this one)

**Window**:
The span of whole UTC days a reading folds: 30 days, 7 days, or the days that touch the
last 24 hours. The reader selects it on the page.

**Fit**:
Coverage times surprise, carried on every workflow row as a number nothing ranks by.
Coverage is the share of synced harnesses the metric counts. Surprise is the distance
from the typical band its rule declares, as `distance / (distance + band width)`, so a
value inside its band scores zero and one band width outside scores a half. The page
order is fixed (#277).

**Component rule**:
The versioned rule that gives one of the eight components a headline value and a typical
band. It derives that value from atoms the machine already shipped and measures nothing
new.

**Row override**:
The owner's pin or hide on one workflow row. A pin puts the row ahead of the fixed order
and on the podium, and a hide takes it off the public page.

**Podium**:
The workflow section layout. The first three rows in the fixed order, or the pinned rows,
render as one horizontal band, and thin rows follow in the fixed order.

**Phase**:
One class of session time: scout, build, verify, or handoff, plus a visible unknown.
Versioned rules assign every recorded event to one phase.
_Avoid_: orient (now scout), gate as a phase name (now handoff)

**Playbook**:
The public phase surface: two measured shipping tracks with median figures, plus
receipt cards. `playbook-rules/v2` computes it from one reading's session length buckets.

**Shipping track**:
One half of the playbook's session set. The split is the median measured session, so the
two tracks are the shorter sessions and the longer ones. Nothing recorded what a session
was for, so a track never names an intent.
_Avoid_: quick fixes, feature work (both name an intent no rule computed)

**Receipt card**:
One card that pairs a habit with its measured payoff. Its head names both sides and claims
no direction: which side is larger is the reading's answer, and the card says the two were
measured together with no cause claimed.

**Owner mirror**:
A private local view that names the owner's biggest measured time sink and its lever.
It never publishes.
