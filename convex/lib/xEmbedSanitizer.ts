const ALLOWED_TAGS = new Set(['blockquote', 'p', 'a', 'br'])
const BLOCKED_CONTENT_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'svg',
  'math',
  'template',
])

function tagEnd(html: string, start: number): number {
  let quote = ''
  for (let index = start + 1; index < html.length; index++) {
    const char = html[index]
    if (quote) {
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") quote = char
    else if (char === '>') return index
  }
  return -1
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function safeHref(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function attributesOf(raw: string): Map<string, string> {
  const attributes = new Map<string, string>()
  const body = raw.replace(/^\/?\s*[a-z0-9-]+/i, '')
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  for (const match of body.matchAll(pattern)) {
    attributes.set(
      match[1].toLowerCase(),
      match[2] ?? match[3] ?? match[4] ?? '',
    )
  }
  return attributes
}

function safeOpeningTag(name: string, raw: string): string {
  const attributes = attributesOf(raw)
  if (name === 'blockquote') {
    const className = attributes.get('class')
    const dataDnt = attributes.get('data-dnt')
    const kept = [
      className === 'twitter-tweet' ? 'class="twitter-tweet"' : '',
      dataDnt === 'true' ? 'data-dnt="true"' : '',
    ].filter(Boolean)
    return `<blockquote${kept.length ? ` ${kept.join(' ')}` : ''}>`
  }
  if (name === 'p') {
    const kept: string[] = []
    const lang = attributes.get('lang')
    const dir = attributes.get('dir')
    if (lang && /^[a-z0-9-]{1,35}$/i.test(lang)) {
      kept.push(`lang="${escapeAttribute(lang)}"`)
    }
    if (dir && ['ltr', 'rtl', 'auto'].includes(dir)) kept.push(`dir="${dir}"`)
    return `<p${kept.length ? ` ${kept.join(' ')}` : ''}>`
  }
  if (name === 'a') {
    const href = safeHref(attributes.get('href') ?? '')
    return href
      ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`
      : '<a>'
  }
  return '<br>'
}

/** Keep the static subset of X oEmbed markup and remove every active feature. */
export function sanitizeXEmbed(html: string): string {
  let output = ''
  let index = 0
  const openTags: string[] = []

  while (index < html.length) {
    const start = html.indexOf('<', index)
    if (start === -1) {
      output += html.slice(index).replace(/</g, '&lt;')
      break
    }
    output += html.slice(index, start).replace(/</g, '&lt;')

    if (html.startsWith('<!--', start)) {
      const commentEnd = html.indexOf('-->', start + 4)
      index = commentEnd === -1 ? html.length : commentEnd + 3
      continue
    }

    const end = tagEnd(html, start)
    if (end === -1) {
      output += '&lt;'
      index = start + 1
      continue
    }
    const raw = html.slice(start + 1, end)
    const match = raw.match(/^\s*(\/?)\s*([a-z0-9-]+)/i)
    if (!match) {
      index = end + 1
      continue
    }
    const closing = match[1] === '/'
    const name = match[2].toLowerCase()

    if (BLOCKED_CONTENT_TAGS.has(name) && !closing) {
      const closeStart = html.toLowerCase().indexOf(`</${name}`, end + 1)
      if (closeStart === -1) break
      const closeEnd = tagEnd(html, closeStart)
      index = closeEnd === -1 ? html.length : closeEnd + 1
      continue
    }
    if (!ALLOWED_TAGS.has(name)) {
      index = end + 1
      continue
    }
    if (closing) {
      const openIndex = openTags.lastIndexOf(name)
      if (openIndex !== -1) {
        for (let current = openTags.length - 1; current >= openIndex; current--) {
          output += `</${openTags[current]}>`
        }
        openTags.splice(openIndex)
      }
    } else {
      output += safeOpeningTag(name, raw)
      if (name !== 'br') openTags.push(name)
    }
    index = end + 1
  }

  for (let current = openTags.length - 1; current >= 0; current--) {
    output += `</${openTags[current]}>`
  }
  return output.trim()
}
