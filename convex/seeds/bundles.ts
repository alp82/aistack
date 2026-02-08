export const bundlesData = [
  {
    slug: "lennys-bundle",
    name: "Lenny's Bundle",
    description: "All-in-one subscription for indie hackers. Includes Replit, Bolt, Lovable, Notion AI, Perplexity, PostHog, and more.",
    iconUrl: undefined,
    websiteUrl: "https://www.lennysbundle.com/",
    toolSlugs: ["replit", "bolt", "lovable", "notion-ai", "perplexity", "posthog"],
    tiers: [
      {
        tierId: "monthly",
        name: "Monthly",
        pricing: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 15, period: "month" as const },
        },
        isDefault: true,
      },
      {
        tierId: "annual",
        name: "Annual",
        pricing: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 12.5, period: "month" as const },
        },
      },
    ],
  },
  {
    slug: "claude-max-bundle",
    name: "Claude Max",
    description: "Anthropic's premium plan. Includes unlimited Claude Code CLI access alongside the full Claude Max experience.",
    iconUrl: "https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/68c33859cc6cd903686c66a2_apple-touch-icon.png",
    websiteUrl: "https://claude.ai/",
    toolSlugs: ["claude-code"],
    tiers: [
      {
        tierId: "max-100",
        name: "Max $100",
        pricing: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 100, period: "month" as const },
        },
      },
      {
        tierId: "max-200",
        name: "Max $200",
        pricing: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 200, period: "month" as const },
        },
        isDefault: true,
      },
    ],
  },
]
