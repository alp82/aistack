export const stacksData = [
  {
    slug: "alper-builder-stack",
    creatorSlug: "alper-ortac",
    title: "Alper's Builder Stack",
    summary:
      "Daily driver stack: Windsurf, Claude, ChatGPT, Gemini. Using skills to make my agents smarter. Plus Lenny's Bundle for extra tools.",
    toolSubscriptions: [
      {
        toolSlug: "chatgpt-plus",
        tierId: "plus",
        primaryUsageLabel: "General AI",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "claude-pro",
        tierId: "pro",
        primaryUsageLabel: "Main AI assistant",
        priceKind: "discounted" as const,
        notes: "Discounted plan",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 17, period: "month" as const },
        },
      },
      {
        toolSlug: "google-ai-pro",
        tierId: "pro",
        primaryUsageLabel: "Gemini",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 18, period: "month" as const },
        },
      },
      {
        toolSlug: "windsurf",
        tierId: "pro",
        primaryUsageLabel: "IDE",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 15, period: "month" as const },
        },
      },
      {
        toolSlug: "replit",
        tierId: "default",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "bolt",
        tierId: "default",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "lovable",
        tierId: "starter",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "notion-ai",
        tierId: "ai",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "perplexity",
        tierId: "pro",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "posthog",
        tierId: "default",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
    ],
    bundleCosts: [
      {
        bundleName: "Lenny's Bundle",
        pricing: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 15, period: "month" as const },
        },
        notes:
          "Includes Replit, Bolt, Lovable, Notion, Perplexity, PostHog, and more.",
      },
    ],
    fixedTotal: { currency: "USD", amount: 85, period: "month" as const },
    hasUsageComponent: false,
  },

  {
    slug: "anthony-claude-stack",
    creatorSlug: "anthony",
    title: "Anthony's Claude Stack",
    summary:
      "I'm on the $200 a month Claude plan and personally I haven't felt like I needed anything else. I use regular VS code so cursor isn't necessary and then just have the Claude CLI tool directly in my terminal.",
    toolSubscriptions: [
      {
        toolSlug: "claude-max",
        tierId: "max-200",
        primaryUsageLabel: "Main AI assistant",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 200, period: "month" as const },
        },
      },
      {
        toolSlug: "claude-code",
        tierId: "included",
        primaryUsageLabel: "Terminal coding",
        priceKind: "bundle" as const,
        bundleName: "Claude Max",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "higgsfield-ai",
        tierId: "ultimate",
        primaryUsageLabel: "Video Generation",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 37.5, period: "month" as const },
        },
      },
    ],
    fixedTotal: { currency: "USD", amount: 237.5, period: "month" as const },
    hasUsageComponent: false,
  },

  {
    slug: "chase-cursor-stack",
    creatorSlug: "chase-myers",
    title: "Chase's Cursor Stack",
    summary:
      "Cursor Pro $20 subscription. I usually use Auto Mode to stay within budget. Sometimes I decide to use OPUS 4.5. I have the Codex extension installed as well.",
    toolSubscriptions: [
      {
        toolSlug: "cursor",
        tierId: "pro",
        primaryUsageLabel: "Main IDE",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "chatgpt-plus",
        tierId: "plus",
        primaryUsageLabel: "Codex extension",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
    ],
    fixedTotal: { currency: "USD", amount: 40, period: "month" as const },
    hasUsageComponent: true,
    usageTotalNotes: "Up to $30 extra for premium model usage",
  },

  {
    slug: "will-full-stack",
    creatorSlug: "will-ness",
    title: "Will's Full AI Stack",
    summary:
      "Claude Max + Claude Code + Wispr Flow + Perplexity. See my article for the full setup.",
    toolSubscriptions: [
      {
        toolSlug: "claude-max",
        tierId: "max-100",
        primaryUsageLabel: "Main AI",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 100, period: "month" as const },
        },
      },
      {
        toolSlug: "claude-code",
        tierId: "included",
        primaryUsageLabel: "Coding",
        priceKind: "bundle" as const,
        bundleName: "Claude Max",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "wispr-flow",
        tierId: "pro",
        primaryUsageLabel: "Voice input",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 12, period: "month" as const },
        },
      },
      {
        toolSlug: "perplexity",
        tierId: "pro",
        primaryUsageLabel: "Research",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
    ],
    fixedTotal: { currency: "USD", amount: 132, period: "month" as const },
    hasUsageComponent: false,
  },

  {
    slug: "mark-google-stack",
    creatorSlug: "mark-perera",
    title: "Mark's Google AI Stack",
    summary:
      "I'm using Google AI Pro. My main IDE now is Google Antigravity instead of Cursor for personal projects.",
    toolSubscriptions: [
      {
        toolSlug: "google-ai-pro",
        tierId: "pro",
        primaryUsageLabel: "Main AI",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "chatgpt-plus",
        tierId: "plus",
        primaryUsageLabel: "Secondary AI",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "google-antigravity",
        tierId: "free",
        primaryUsageLabel: "IDE",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
    ],
    fixedTotal: { currency: "USD", amount: 40, period: "month" as const },
    hasUsageComponent: false,
  },

  {
    slug: "brutefy-shipping-stack",
    creatorSlug: "iambrutefyal",
    title: "Brutefy's Feature Shipping Stack",
    summary:
      "I use Google AI Studio to get a basic MVP for any idea. Then I ask Claude Code to EXACTLY copy every feature into my own directory. That's how I ship features to clients now.",
    toolSubscriptions: [
      {
        toolSlug: "claude-code",
        tierId: "included",
        primaryUsageLabel: "Feature transfer",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "windsurf",
        tierId: "early-adopter",
        primaryUsageLabel: "Backup IDE",
        priceKind: "discounted" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 10, period: "month" as const },
        },
      },
      {
        toolSlug: "google-ai-pro",
        tierId: "pro",
        primaryUsageLabel: "MVP prototyping",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "voice-ink",
        tierId: "local",
        primaryUsageLabel: "Voice input",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "one_time" as const },
        },
      },
    ],
    fixedTotal: { currency: "USD", amount: 50, period: "month" as const },
    hasUsageComponent: false,
  },

  {
    slug: "sabih-minimal-stack",
    creatorSlug: "sabih-sarowar",
    title: "Sabih's Minimal Stack",
    summary:
      "Windsurf for coding with early adopter pricing. Superwhisper for speech to text - stable, half the price of Wispr, and has text post processing.",
    toolSubscriptions: [
      {
        toolSlug: "windsurf",
        tierId: "early-adopter",
        primaryUsageLabel: "Main IDE",
        priceKind: "discounted" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 10, period: "month" as const },
        },
      },
      {
        toolSlug: "superwhisper",
        tierId: "pro",
        primaryUsageLabel: "Voice input",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 6, period: "month" as const },
        },
      },
    ],
    fixedTotal: { currency: "USD", amount: 16, period: "month" as const },
    hasUsageComponent: false,
  },

  {
    slug: "schuyler-power-stack",
    creatorSlug: "schuyler",
    title: "Schuyler's Power User Stack",
    summary:
      "Perplexity for research (became my main search engine), Cursor for coding, Claude Max for heavy lifting with Opus 4.",
    toolSubscriptions: [
      {
        toolSlug: "perplexity",
        tierId: "pro",
        primaryUsageLabel: "Research & search",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "cursor",
        tierId: "pro",
        primaryUsageLabel: "Coding & tab complete",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "claude-max",
        tierId: "max-100",
        primaryUsageLabel: "Claude Code",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 100, period: "month" as const },
        },
      },
    ],
    fixedTotal: { currency: "USD", amount: 140, period: "month" as const },
    hasUsageComponent: true,
    usageTotalNotes: "Up to $30 extra Cursor usage",
  },

  {
    slug: "ivan-creative-stack",
    creatorSlug: "ivan-boroja",
    title: "Ivan's Creative Development Stack",
    summary:
      "Comprehensive stack for creative development including AI tools, design software, and collaboration platforms. Perfect for building beautiful, functional products.",
    teamSize: 9,
    toolSubscriptions: [
      {
        toolSlug: "chatgpt-workspace",
        tierId: "team",
        primaryUsageLabel: "AI Assistant",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 60, period: "month" as const },
        },
      },
      {
        toolSlug: "midjourney",
        tierId: "standard",
        primaryUsageLabel: "Image Generation",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 24, period: "month" as const },
        },
      },
      {
        toolSlug: "kling-ai",
        tierId: "standard",
        primaryUsageLabel: "Video Generation",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 9, period: "month" as const },
        },
      },
      {
        toolSlug: "x-grok",
        tierId: "premium",
        primaryUsageLabel: "AI Chat",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 8, period: "month" as const },
        },
      },
      {
        toolSlug: "figma",
        tierId: "professional",
        primaryUsageLabel: "Design Tool",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 145, period: "month" as const },
        },
      },
      {
        toolSlug: "slack",
        tierId: "pro",
        primaryUsageLabel: "Team Communication",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 80, period: "month" as const },
        },
      },
      {
        toolSlug: "envato",
        tierId: "elements",
        primaryUsageLabel: "Digital Assets",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 16.5, period: "month" as const },
        },
      },
      {
        toolSlug: "adobe-creative-cloud",
        tierId: "all-apps",
        primaryUsageLabel: "Creative Suite",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 70, period: "month" as const },
        },
      },
      {
        toolSlug: "unicorn-studio",
        tierId: "pro",
        primaryUsageLabel: "3D Web",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 18, period: "month" as const },
        },
      },
      {
        toolSlug: "framer",
        tierId: "pro",
        primaryUsageLabel: "Web Design",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 45, period: "month" as const },
        },
      },
      {
        toolSlug: "webflow",
        tierId: "cms",
        primaryUsageLabel: "Web Development",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 23, period: "month" as const },
        },
      },
      {
        toolSlug: "spline",
        tierId: "super",
        primaryUsageLabel: "3D Design",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "replit",
        tierId: "default",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "bolt",
        tierId: "default",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "lovable",
        tierId: "starter",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "notion-ai",
        tierId: "ai",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "perplexity",
        tierId: "pro",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "posthog",
        tierId: "default",
        primaryUsageLabel: "Bundled tool",
        priceKind: "bundle" as const,
        bundleName: "Lenny's Bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
    ],
    fixedTotal: { currency: "USD", amount: 531, period: "month" as const },
    hasUsageComponent: false,
    bundleCosts: [
      {
        bundleName: "Lenny's Bundle",
        pricing: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 12.5, period: "month" as const },
        },
        notes:
          "Includes Replit, Bolt, Lovable, Notion, Perplexity, PostHog, and more.",
      },
    ],
  },
]
