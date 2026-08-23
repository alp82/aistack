/**
 * The X owner-paste lane (#208, map #198). Spec: docs/specs/news-pipeline.md.
 *
 * Ported from the proved prototype in `prototypes/x-oembed-paste/` (#179),
 * whose `pasteLane` block was written to lift into this file. The research
 * behind it is `docs/research/x-profile-posts-2026-08.md`, and #209 ruled that
 * owner paste is the supported X lane.
 *
 * What the prototype proved, and what this file therefore does:
 *
 *   - `publish.twitter.com` answers 301. We call `publish.x.com`.
 *   - A dead post answers 404 with an HTML body, so the caller branches on the
 *     status code before it parses.
 *   - A profile link answers 200 with a TIMELINE widget, not a post. It must
 *     never pass as a post, so `pickEmbed` refuses that markup.
 *
 * Pure functions only. Everything here is called from `convex/news.ts` and is
 * tested directly, so an X regression fails a unit test instead of a paste.
 */

import { stripTags } from './feed'

/** Every host X still serves a post link on. Anything else is not an X link. */
const HOSTS = new Set([
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.x.com',
  'mobile.twitter.com',
])

/**
 * First path segments that look like a screen name and are not one. Without
 * this list `x.com/home` would store as a profile.
 */
const RESERVED = new Set([
  'home',
  'explore',
  'search',
  'notifications',
  'messages',
  'settings',
  'i',
  'hashtag',
  'intent',
  'compose',
  'login',
  'signup',
])

export interface XPost {
  kind: 'post'
  statusId: string
  screenName: string
  /** One post has ONE canonical URL, whatever host or query it arrived on. */
  canonicalUrl: string
}

export interface XProfile {
  kind: 'profile'
  screenName: string
  canonicalUrl: string
}

/**
 * Read a pasted link. Null means it is not an X link the lane handles, which
 * is a normal outcome: quick-add falls back to its ordinary article path.
 */
export function parseXPaste(raw: string): XPost | XProfile | null {
  const input = raw.trim()
  if (!input) return null
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }
  if (!HOSTS.has(url.hostname.toLowerCase())) return null

  const post = url.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/(\d+)/)
  if (post) {
    return {
      kind: 'post',
      statusId: post[2],
      screenName: post[1],
      canonicalUrl: `https://x.com/${post[1]}/status/${post[2]}`,
    }
  }

  const profile = url.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/?$/)
  if (profile && !RESERVED.has(profile[1].toLowerCase())) {
    return {
      kind: 'profile',
      screenName: profile[1],
      canonicalUrl: `https://x.com/${profile[1]}`,
    }
  }
  return null
}

/**
 * The free oEmbed call for one post. `omit_script` keeps the widget loader out
 * of what we store, because a projection decides for itself whether to load it.
 * `dnt` is the do-not-track flag X documents for embeds.
 */
export function oembedRequestUrl(canonicalUrl: string): string {
  const url = new URL('https://publish.x.com/oembed')
  url.searchParams.set('url', canonicalUrl)
  url.searchParams.set('omit_script', '1')
  url.searchParams.set('dnt', 'true')
  return url.toString()
}

/**
 * The post text, read out of the official embed markup.
 *
 * The inbox needs a headline, and oEmbed carries no plain-text field. The
 * paragraphs of the blockquote are the post. The trailing attribution line
 * (the author and the date link) is not, so it stops at the last `</p>`.
 *
 * This text is PRIVATE. It feeds the inbox for curation, per #179. A
 * projection re-serves the official embed and nothing else.
 */
export function embedText(html: string): string | null {
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(
    (m) => stripTags(m[1]),
  )
  const text = paragraphs.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  return text.length > 0 ? text : null
}

/** The stored embed. License class `x` allows the ID and the official embed. */
export interface XEmbed {
  html: string
  url: string
  authorName: string | null
  authorUrl: string | null
}

/**
 * Cut an oEmbed payload down to what we may keep. Null means the payload
 * carries no post embed, which is what a profile link answers with.
 */
export function pickEmbed(payload: Record<string, unknown>): XEmbed | null {
  const html = typeof payload.html === 'string' ? payload.html : ''
  const url = typeof payload.url === 'string' ? payload.url : ''
  if (!html || !url) return null
  // A profile answers with a timeline anchor. That is a widget, not a post.
  if (/class=["'][^"']*twitter-timeline/i.test(html)) return null
  return {
    html,
    url,
    authorName:
      typeof payload.author_name === 'string' ? payload.author_name : null,
    authorUrl:
      typeof payload.author_url === 'string' ? payload.author_url : null,
  }
}

// ---------------------------------------------------------------------------
// Profile paste
// ---------------------------------------------------------------------------

/**
 * The recent posts of one profile, through the FxTwitter profile-status
 * endpoint. It is the one free path that answers a Node runtime, so a Convex
 * action can call it. X fingerprint-blocks Node on the syndication endpoints.
 *
 * #209 ruled this lane OPTIONAL. It has no service agreement and it rests on
 * private X calls, so it may stop answering at any time. Two rules follow, and
 * `convex/news.ts` holds both:
 *
 *   1. Nothing automatic calls it. The owner asks for a profile listing, reads
 *      the answer, and picks. A failure costs one paste, never a collection run.
 *   2. A pick goes through the ordinary post lane, so what we store and show is
 *      the official oEmbed embed either way.
 */
export function profilePostsRequestUrl(screenName: string): string {
  return `https://api.fxtwitter.com/2/profile/${encodeURIComponent(screenName)}/statuses`
}

export interface XProfilePost {
  statusId: string
  screenName: string
  url: string
  /** The post text, for the pick list. Private, like every fetched X text. */
  text: string
  publishedAt: number | null
  /** A reply reads as half a conversation. The owner judges it before picking. */
  isReply: boolean
}

/**
 * Read one FxTwitter answer, newest first. Throws when the body carries no
 * `results` array, which is how an error answer announces itself. An EMPTY
 * array is a normal outcome: the profile posted nothing.
 */
export function parseProfilePosts(
  body: unknown,
  screenName: string,
): XProfilePost[] {
  const results = (body as { results?: unknown })?.results
  if (!Array.isArray(results)) throw new Error('no results array in the answer')
  const posts: XProfilePost[] = []
  for (const raw of results) {
    const post = raw as Record<string, any>
    const statusId = typeof post.id === 'string' ? post.id : null
    const text = typeof post.text === 'string' ? post.text.trim() : ''
    if (!statusId || !text) continue
    const name =
      typeof post.author?.screen_name === 'string'
        ? post.author.screen_name
        : screenName
    const parsedDate =
      typeof post.created_at === 'string' ? Date.parse(post.created_at) : NaN
    posts.push({
      statusId,
      screenName: name,
      url: `https://x.com/${name}/status/${statusId}`,
      text: text.slice(0, 300),
      publishedAt: Number.isNaN(parsedDate) ? null : parsedDate,
      isReply: Boolean(post.replying_to),
    })
  }
  posts.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
  return posts
}
