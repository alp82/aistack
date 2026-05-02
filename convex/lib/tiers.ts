/**
 * Shared helper for building tier objects with normalized pricing shape.
 * Used by tool/bundle full-update mutations and the edit-suggestion approval
 * path to avoid duplicating the same map across call sites.
 */

export type TierInput = {
  name: string
  pricingType: 'fixed' | 'usage' | 'mixed'
  fixedAmount?: number
  fixedPeriod?: 'month' | 'year' | 'one_time'
}

export function buildTiers(inputs: TierInput[], now: number) {
  return inputs.map((t, i) => ({
    tierId: `tier-${i + 1}`,
    name: t.name,
    pricing: {
      pricingType: t.pricingType,
      ...(t.pricingType === 'fixed' || t.pricingType === 'mixed'
        ? {
            fixed: {
              currency: 'USD',
              amount: t.fixedAmount ?? 0,
              period: t.fixedPeriod ?? ('month' as const),
            },
          }
        : {}),
    },
    isDefault: i === 0,
    updatedAt: now,
  }))
}
