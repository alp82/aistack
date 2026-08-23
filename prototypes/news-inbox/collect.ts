// PROTOTYPE #235 provenance: how index.html got its embedded data.
// Run: node collect.ts week.json (Node 24, network required)
/**
 * Collect one week of real items from the 14 phase-1 sources, through the
 * real parser in convex/lib/feed.ts. Output: JSON for the inbox prototype.
 */
import { writeFileSync } from 'node:fs'
import { parseFeed } from '../../convex/lib/feed.ts'

const SOURCES: Array<{
  name: string
  url: string
  licenseClass: string
}> = [
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml', licenseClass: 'article' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', licenseClass: 'article' },
  { name: 'Latent Space', url: 'https://www.latent.space/feed', licenseClass: 'article' },
  { name: '404 Media', url: 'https://www.404media.co/rss/', licenseClass: 'article' },
  { name: 'AI News', url: 'https://buttondown.com/ainews/rss', licenseClass: 'article' },
  { name: 'Computer Things', url: 'https://buttondown.com/hillelwayne/rss', licenseClass: 'article' },
  { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/', licenseClass: 'article' },
  { name: 'AI News and Strategy Daily', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC0C-17n9iuUQPylguM1d-lQ', licenseClass: 'article' },
  { name: 'aicrier', url: 'https://aicrier.com/feed.xml', licenseClass: 'article' },
  { name: 'claude-code releases', url: 'https://github.com/anthropics/claude-code/releases.atom', licenseClass: 'unlicensed-release-notes' },
  { name: 'codex releases', url: 'https://github.com/openai/codex/releases.atom', licenseClass: 'permissive-release-notes' },
  { name: 'gemini-cli releases', url: 'https://github.com/google-gemini/gemini-cli/releases.atom', licenseClass: 'permissive-release-notes' },
  { name: 'opencode releases', url: 'https://github.com/sst/opencode/releases.atom', licenseClass: 'permissive-release-notes' },
  { name: 'pi releases', url: 'https://github.com/earendil-works/pi/releases.atom', licenseClass: 'permissive-release-notes' },
]

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const cutoff = Date.now() - WEEK_MS

async function main() {
  const items: unknown[] = []
  const sources: unknown[] = []
  for (const source of SOURCES) {
    let error: string | null = null
    let count = 0
    let lastPolled = Date.now()
    try {
      const res = await fetch(source.url, {
        redirect: 'follow',
        headers: { 'user-agent': 'aistack-prototype/235' },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const xml = await res.text()
      const feed = parseFeed(xml)
      for (const entry of feed.items) {
        if (entry.publishedAt === null || entry.publishedAt < cutoff) continue
        count++
        items.push({
          headline: entry.title,
          url: entry.link,
          publishedAt: entry.publishedAt,
          collectedAt: entry.publishedAt + 3 * 60 * 60 * 1000,
          sourceName: source.name,
          intake: 'feed',
          licenseClass: source.licenseClass,
          bodyText: entry.bodyText ? entry.bodyText.slice(0, 400) : null,
        })
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
    sources.push({ name: source.name, url: source.url, licenseClass: source.licenseClass, lastPolled, error, weekCount: count })
    console.log(`${source.name}: ${error ? `ERROR ${error}` : `${count} items in last 7 days`}`)
  }
  items.sort((a: any, b: any) => b.publishedAt - a.publishedAt)
  writeFileSync(process.argv[2], JSON.stringify({ collectedOn: Date.now(), items, sources }, null, 1))
  console.log(`total: ${items.length} items`)
}

main()
