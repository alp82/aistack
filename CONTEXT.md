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

**Collector**:
The scheduled job that reads sources and writes new items to the inbox.

**Quick-add**:
The manual intake form. The owner pastes a URL, and the item lands in the inbox.

**Inbox**:
The private list of collected items that wait for the owner to approve or discard them.

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
