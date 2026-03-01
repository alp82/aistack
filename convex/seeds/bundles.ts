export const bundlesData = [
  {
    slug: "lennys-bundle",
    name: "Lenny's Bundle",
    description: "All-in-one subscription for indie hackers. Includes Replit, Bolt, Lovable, Notion AI, Perplexity, PostHog, and more.",
    iconUrl: undefined,
    websiteUrl: "https://www.lennysbundle.com/",
    toolSlugs: ["replit", "bolt", "lovable", "notion-ai", "perplexity", "posthog"],
    reviewStatus: "approved" as const,
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
]
