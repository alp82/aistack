/**
 * The price citation for a Discord stats embed. The card prints bare dollar
 * figures; this footer is where each figure cites its price-table ids, its
 * priced share and its lower-bound status, as the pricing rules require.
 * Returns undefined when the message prints no measured dollars.
 */
type Side = {
  identity: { handle: string }
  publishCost: boolean
  current: {
    usage: {
      cost: {
        usd: number
        estimated: boolean
        pricedShare: number
        pricingTables: string[]
      } | null
    } | null
  }
}
const DISCORD_FOOTER_LIMIT = 2048

function cite(side: Side) {
  const cost = side.publishCost ? side.current.usage?.cost : null
  if (!cost) return null
  const share = `${(100 * cost.pricedShare).toFixed(1)}% of tokens priced`
  const status = cost.estimated ? 'estimate / lower bound' : 'measured'
  const sources = cost.pricingTables.length
    ? cost.pricingTables.join(', ')
    : 'n/a'
  return `$${cost.usd.toFixed(2)} ${status} · ${share} · ${sources}`
}

export function priceFooter(
  command: string,
  subject: Side,
  comparison: Side | null,
): string | undefined {
  // Only the cost card and the comparison card print measured dollars.
  if (command !== 'cost' && command !== 'compare') return undefined
  const sides = comparison ? [subject, comparison] : [subject]
  const lines = sides.flatMap((side) => {
    const line = cite(side)
    return line
      ? [comparison ? `@${side.identity.handle}: ${line}` : line]
      : []
  })
  if (!lines.length) return undefined
  const text = lines.join('\n')
  return text.length > DISCORD_FOOTER_LIMIT
    ? `${text.slice(0, DISCORD_FOOTER_LIMIT - 1)}…`
    : text
}
