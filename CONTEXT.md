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
One week's composed newsletter, with its own public archive page.

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

### Workflow surface

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

**Fit**:
The rank of a workflow row: coverage times surprise. Coverage is the share of synced
harnesses the metric counts. Surprise is the distance from the typical band its rule
declares.

**Podium**:
The workflow section layout. The top three rows by fit render as one horizontal band,
thin rows follow in fit order, and low-fit rows wait behind one expander.

**Phase**:
One class of session time: scout, build, verify, or handoff, plus a visible unknown.
Versioned rules assign every recorded event to one phase.
_Avoid_: orient (now scout), gate as a phase name (now handoff)

**Playbook**:
The public phase surface: two measured shipping tracks with median figures, plus
receipt cards.

**Receipt card**:
One card that pairs a habit with its measured payoff.

**Owner mirror**:
A private local view that names the owner's biggest measured time sink and its lever.
It never publishes.
