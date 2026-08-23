import { describe, expect, test } from 'vitest'
import {
  embedText,
  oembedRequestUrl,
  parseProfilePosts,
  parseXPaste,
  pickEmbed,
  profilePostsRequestUrl,
} from './xPaste'

describe('parseXPaste', () => {
  test('reads a plain post link', () => {
    expect(parseXPaste('https://x.com/jack/status/20')).toEqual({
      kind: 'post',
      statusId: '20',
      screenName: 'jack',
      canonicalUrl: 'https://x.com/jack/status/20',
    })
  })

  test('normalizes the old host, a tracking query and a trailing path', () => {
    const messy =
      'https://twitter.com/elonmusk/status/1519480761749016577?s=46&t=abc123'
    expect(parseXPaste(messy)?.canonicalUrl).toBe(
      'https://x.com/elonmusk/status/1519480761749016577',
    )
    expect(parseXPaste('https://mobile.x.com/jack/statuses/20/photo/1')).toEqual(
      {
        kind: 'post',
        statusId: '20',
        screenName: 'jack',
        canonicalUrl: 'https://x.com/jack/status/20',
      },
    )
  })

  test('two links to one post give one canonical URL', () => {
    const a = parseXPaste(
      'https://twitter.com/elonmusk/status/1519480761749016577?s=46',
    )
    const b = parseXPaste('https://x.com/elonmusk/status/1519480761749016577')
    expect(a?.canonicalUrl).toBe(b?.canonicalUrl)
  })

  test('reads a profile link as its own kind', () => {
    expect(parseXPaste('https://x.com/AnthropicAI')).toEqual({
      kind: 'profile',
      screenName: 'AnthropicAI',
      canonicalUrl: 'https://x.com/AnthropicAI',
    })
  })

  test('a reserved path is not a profile', () => {
    expect(parseXPaste('https://x.com/home')).toBeNull()
    expect(parseXPaste('https://x.com/i/flow/login')).toBeNull()
  })

  test('rejects what is not an X link', () => {
    expect(parseXPaste('just some text')).toBeNull()
    expect(parseXPaste('')).toBeNull()
    expect(parseXPaste('https://openai.com/index/gpt-5')).toBeNull()
    expect(parseXPaste('https://x.com.evil.test/jack/status/20')).toBeNull()
  })
})

describe('oembedRequestUrl', () => {
  test('calls publish.x.com, the host the old one redirects to', () => {
    const url = new URL(oembedRequestUrl('https://x.com/jack/status/20'))
    expect(url.origin).toBe('https://publish.x.com')
    expect(url.pathname).toBe('/oembed')
    expect(url.searchParams.get('url')).toBe('https://x.com/jack/status/20')
    expect(url.searchParams.get('omit_script')).toBe('1')
    expect(url.searchParams.get('dnt')).toBe('true')
  })
})

describe('pickEmbed', () => {
  const payload = {
    url: 'https://x.com/jack/status/20',
    author_name: 'jack',
    author_url: 'https://x.com/jack',
    html: '<blockquote class="twitter-tweet">just setting up my twttr</blockquote>',
    width: 550,
    height: null,
    provider_name: 'X',
  }

  test('keeps the four fields the re-serving policy allows', () => {
    expect(pickEmbed(payload)).toEqual({
      html: payload.html,
      url: payload.url,
      authorName: 'jack',
      authorUrl: 'https://x.com/jack',
    })
  })

  test('refuses a payload with no embed markup', () => {
    expect(pickEmbed({ url: 'https://x.com/jack', html: '' })).toBeNull()
    expect(pickEmbed({})).toBeNull()
  })

  test('refuses the timeline widget a profile link answers with', () => {
    const profile = {
      url: 'https://x.com/jack',
      html: '<a class="twitter-timeline" href="https://x.com/jack">Posts by jack</a>',
    }
    expect(pickEmbed(profile)).toBeNull()
  })
})

describe('embedText', () => {
  test('reads the post text out of the official embed markup', () => {
    const html =
      '<blockquote class="twitter-tweet" data-dnt="true"><p lang="en" dir="ltr">just setting up my twttr</p>&mdash; jack (@jack) <a href="https://x.com/jack/status/20">March 21, 2006</a></blockquote>'
    expect(embedText(html)).toBe('just setting up my twttr')
  })

  test('joins several paragraphs and drops the attribution line', () => {
    const html =
      '<blockquote class="twitter-tweet"><p>First line</p><p>Second line</p>&mdash; jack (@jack) <a href="https://x.com/jack/status/20">date</a></blockquote>'
    expect(embedText(html)).toBe('First line Second line')
  })

  test('null when the markup carries no paragraph', () => {
    expect(embedText('<blockquote class="twitter-tweet"></blockquote>')).toBeNull()
  })
})

describe('profilePostsRequestUrl', () => {
  test('calls the FxTwitter profile-status endpoint', () => {
    expect(profilePostsRequestUrl('AnthropicAI')).toBe(
      'https://api.fxtwitter.com/2/profile/AnthropicAI/statuses',
    )
  })

  test('escapes a name so a crafted one cannot change the path', () => {
    expect(profilePostsRequestUrl('a/b')).toBe(
      'https://api.fxtwitter.com/2/profile/a%2Fb/statuses',
    )
  })
})

describe('parseProfilePosts', () => {
  const body = {
    results: [
      {
        id: '2089842395722678689',
        created_at: 'Tue Aug 18 2026 10:00:00 +0000',
        text: 'We are also publishing a technical report',
        author: { screen_name: 'AnthropicAI' },
      },
      {
        id: '2088343978873966687',
        created_at: 'Fri Aug 14 2026 10:00:00 +0000',
        text: 'An FAQ about watermarking',
        author: { screen_name: 'AnthropicAI' },
        replying_to: 'someone',
      },
    ],
  }

  test('reads id, date, text and the canonical link', () => {
    const posts = parseProfilePosts(body, 'AnthropicAI')
    expect(posts[0]).toEqual({
      statusId: '2089842395722678689',
      screenName: 'AnthropicAI',
      url: 'https://x.com/AnthropicAI/status/2089842395722678689',
      text: 'We are also publishing a technical report',
      publishedAt: Date.parse('Tue Aug 18 2026 10:00:00 +0000'),
      isReply: false,
    })
  })

  test('marks a reply, which the owner judges before picking it', () => {
    expect(parseProfilePosts(body, 'AnthropicAI')[1].isReply).toBe(true)
  })

  test('newest first, so the owner reads the week at the top', () => {
    const posts = parseProfilePosts(body, 'AnthropicAI')
    expect(posts.map((p) => p.statusId)).toEqual([
      '2089842395722678689',
      '2088343978873966687',
    ])
  })

  test('drops a result with no id, and one with no text', () => {
    const posts = parseProfilePosts(
      { results: [{ text: 'no id' }, { id: '1' }, { id: '2', text: 'good' }] },
      'jack',
    )
    expect(posts.map((p) => p.statusId)).toEqual(['2'])
  })

  test('throws when the body carries no results array', () => {
    expect(() => parseProfilePosts({ code: 401 }, 'jack')).toThrow()
  })

  test('an empty results array is no posts, not a fault', () => {
    expect(parseProfilePosts({ results: [] }, 'jack')).toEqual([])
  })
})
