# Prototype: news scrapers (alp82/aistack#180)

Throwaway code. It answers one question from the news pipeline spec
(`docs/specs/news-pipeline.md`, phase 3): do the scrapers work against the
live pages?

Four mechanisms, nine sources. The first review round covered the three spec
sources, and the operator asked for six more (OpenAI, Grok/xAI, pi, Hermes,
DeepSeek, Kimi).

- `anthropic-news`: sitemap-diff on `www.anthropic.com/sitemap.xml`, filter `/news/`.
- `claude-blog`: sitemap-diff on `claude.com/sitemap.xml`, filter default-locale `/blog/`.
- `openai-news`: sitemap-diff over the 35-child sitemap index, items enriched
  from `news/rss.xml` because Cloudflare blocks the article pages.
- `nous-hermes`: sitemap-diff on `nousresearch.com/sitemap.xml`, posts are top-level slugs.
- `deepseek-news`: sitemap-diff on `api-docs.deepseek.com/sitemap.xml`, filter `/news/`.
- `kimi-blog`: link-diff on the server-rendered `www.kimi.com/blog` index.
- `gemini-changelog`: page-diff on the Gemini API changelog, one section per date heading.
- `xai-release-notes`: page-diff on `docs.x.ai/developers/release-notes`, one
  section per month. x.ai itself blocks every non-browser client.
- `pi-releases`: feed-diff on `github.com/earendil-works/pi/releases.atom`.

Reddit stays out. It needs a commercial agreement first.

## Run it

```sh
node scrape.mjs run       # diff all three sources against ./state
node scrape.mjs simulate  # drop one known entry per source, then run: shows detection
node scrape.mjs reset     # clear state, the next run is a cold run
node showcase.mjs         # extract sample items live into showcase.json
node build-demo.mjs       # bake run1-3.json + showcase.json into index.html
```

`index.html` is the demo. It is self-contained and holds the captured live
data from 2026-08-19. The verdict and the findings are on the page.
