import { internalMutation } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

async function clearTable(
  ctx: any,
  table: "stacks" | "creators" | "products",
) {
  const docs = await ctx.db.query(table).collect();
  for (const doc of docs) {
    await ctx.db.delete(doc._id);
  }
}

export const seedAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now()

    // wipe tables first
    await clearTable(ctx, "stacks");
    await clearTable(ctx, "creators");
    await clearTable(ctx, "products");

    // ============ PRODUCTS ============
    const productsData = [
      {
        name: 'Claude Pro',
        slug: 'claude-pro',
        category: 'thinking',
        iconUrl: 'https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/68c33859cc6cd903686c66a2_apple-touch-icon.png',
        websiteUrl: 'https://claude.ai',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 20, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Claude Max',
        slug: 'claude-max',
        category: 'thinking',
        iconUrl: 'https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/68c33859cc6cd903686c66a2_apple-touch-icon.png',
        websiteUrl: 'https://claude.ai',
        tiers: [
          { tierId: 'max-100', name: 'Max $100', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 100, period: 'month' as const } }, isDefault: true },
          { tierId: 'max-200', name: 'Max $200', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 200, period: 'month' as const } } },
        ],
      },
      {
        name: 'Claude Code',
        slug: 'claude-code',
        category: 'coding',
        iconUrl: 'https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/68c33859cc6cd903686c66a2_apple-touch-icon.png',
        websiteUrl: 'https://claude.ai',
        tiers: [
          { tierId: 'included', name: 'Included with Max', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 0, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'ChatGPT Plus',
        slug: 'chatgpt-plus',
        category: 'text',
        iconUrl: 'https://chatgpt.com/cdn/assets/favicon-180x180-od45eci6.webp',
        websiteUrl: 'https://chatgpt.com',
        tiers: [
          { tierId: 'plus', name: 'Plus', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 20, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Cursor',
        slug: 'cursor',
        category: 'coding',
        iconUrl: 'https://cursor.com/marketing-static/apple-touch-icon.png',
        websiteUrl: 'https://cursor.com',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 20, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Windsurf',
        slug: 'windsurf',
        category: 'coding',
        iconUrl: 'https://windsurf.com/favicon.png',
        websiteUrl: 'https://windsurf.com',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 15, period: 'month' as const } }, isDefault: true },
          { tierId: 'early-adopter', name: 'Early Adopter', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 10, period: 'month' as const } } },
        ],
      },
      {
        name: 'Perplexity',
        slug: 'perplexity',
        category: 'research',
        iconUrl: 'https://framerusercontent.com/images/PFCYmoDJHc11RiF0s6aYcSNaqns.png',
        websiteUrl: 'https://perplexity.ai',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 20, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: "Replit",
        slug: "replit",
        category: "coding",
        iconUrl: "https://replit.com/favicon.ico",
        websiteUrl: "https://replit.com",
        tiers: [{ tierId: "default", name: "Default", pricing: { pricingType: "fixed" as const, fixed: { currency: "USD", amount: 0, period: "month" as const } }, isDefault: true }],
      },
      {
        name: "Bolt",
        slug: "bolt",
        category: "coding",
        iconUrl: "https://bolt.new/favicon.ico",
        websiteUrl: "https://bolt.new",
        tiers: [{ tierId: "default", name: "Default", pricing: { pricingType: "fixed" as const, fixed: { currency: "USD", amount: 0, period: "month" as const } }, isDefault: true }],
      },
      {
        name: "PostHog",
        slug: "posthog",
        category: "analytics",
        iconUrl: "https://posthog.com/favicon.ico",
        websiteUrl: "https://posthog.com",
        tiers: [{ tierId: "default", name: "Default", pricing: { pricingType: "fixed" as const, fixed: { currency: "USD", amount: 0, period: "month" as const } }, isDefault: true }],
      },
      {
        name: 'Wispr Flow',
        slug: 'wispr-flow',
        category: 'voice',
        iconUrl: 'https://cdn.prod.website-files.com/682f84b3838c89f8ff7667db/68d27d1a8a10f417b5644527_flow-wc-v2.png',
        websiteUrl: 'https://wispr.ai',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 12, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Superwhisper',
        slug: 'superwhisper',
        category: 'voice',
        iconUrl: 'https://superwhisper.com/favicon.ico',
        websiteUrl: 'https://superwhisper.com',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 6, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'ChatGPT Workspace',
        slug: 'chatgpt-workspace',
        category: 'ai',
        iconUrl: 'https://cdn.openai.com/favicon.ico',
        websiteUrl: 'https://openai.com/chatgpt/team',
        tiers: [
          { tierId: 'team', name: 'Team', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 60, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Midjourney',
        slug: 'midjourney',
        category: 'image',
        iconUrl: 'https://cdn.midjourney.com/favicon.ico',
        websiteUrl: 'https://midjourney.com',
        tiers: [
          { tierId: 'standard', name: 'Standard', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 24, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Kling.ai',
        slug: 'kling-ai',
        category: 'video',
        iconUrl: 'https://klingai.com/favicon.ico',
        websiteUrl: 'https://klingai.com',
        tiers: [
          { tierId: 'standard', name: 'Standard', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 9, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'X / Grok',
        slug: 'x-grok',
        category: 'ai',
        iconUrl: 'https://x.com/favicon.ico',
        websiteUrl: 'https://x.com',
        tiers: [
          { tierId: 'premium', name: 'Premium', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 8, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Figma',
        slug: 'figma',
        category: 'design',
        iconUrl: 'https://www.figma.com/favicon.ico',
        websiteUrl: 'https://figma.com',
        tiers: [
          { tierId: 'professional', name: 'Professional', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 9 * 65, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Slack',
        slug: 'slack',
        category: 'communication',
        iconUrl: 'https://slack.com/favicon.ico',
        websiteUrl: 'https://slack.com',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 9 * 35, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Envato',
        slug: 'envato',
        category: 'assets',
        iconUrl: 'https://envato.com/favicon.ico',
        websiteUrl: 'https://envato.com',
        tiers: [
          { tierId: 'elements', name: 'Elements', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 16.5, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Adobe Creative Cloud',
        slug: 'adobe-creative-cloud',
        category: 'creative',
        iconUrl: 'https://www.adobe.com/favicon.ico',
        websiteUrl: 'https://adobe.com/creativecloud',
        tiers: [
          { tierId: 'all-apps', name: 'All Apps', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 70, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Unicorn Studio',
        slug: 'unicorn-studio',
        category: '3d',
        iconUrl: 'https://unicorn.studio/favicon.ico',
        websiteUrl: 'https://unicorn.studio',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 18, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Framer',
        slug: 'framer',
        category: 'design',
        iconUrl: 'https://framer.com/favicon.ico',
        websiteUrl: 'https://framer.com',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 45, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Webflow',
        slug: 'webflow',
        category: 'web',
        iconUrl: 'https://webflow.com/favicon.ico',
        websiteUrl: 'https://webflow.com',
        tiers: [
          { tierId: 'cms', name: 'CMS', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 23, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Spline',
        slug: 'spline',
        category: '3d',
        iconUrl: 'https://spline.design/favicon.ico',
        websiteUrl: 'https://spline.design',
        tiers: [
          { tierId: 'super', name: 'Super', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 20, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Google AI Pro',
        slug: 'google-ai-pro',
        category: 'thinking',
        iconUrl: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png',
        websiteUrl: 'https://gemini.google.com',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 20, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Google AI Studio',
        slug: 'google-ai-studio',
        category: 'coding',
        iconUrl: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png',
        websiteUrl: 'https://aistudio.google.com',
        tiers: [
          { tierId: 'free', name: 'Free', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 0, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Google Antigravity',
        slug: 'google-antigravity',
        category: 'coding',
        iconUrl: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png',
        websiteUrl: 'https://idx.google.com',
        tiers: [
          { tierId: 'free', name: 'Free', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 0, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Voice Ink',
        slug: 'voice-ink',
        category: 'voice',
        iconUrl: 'https://tryvoiceink.com/favicon.ico',
        websiteUrl: 'https://tryvoiceink.com',
        tiers: [
          { tierId: 'local', name: 'Local (One-time)', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 0, period: 'one_time' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Codex Extension',
        slug: 'codex-extension',
        category: 'coding',
        iconUrl: 'https://chatgpt.com/cdn/assets/favicon-180x180-od45eci6.webp',
        websiteUrl: 'https://openai.com',
        tiers: [
          { tierId: 'included', name: 'Included with ChatGPT', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 0, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Midjourney',
        slug: 'midjourney',
        category: 'image',
        iconUrl: 'https://www.midjourney.com/favicon.ico',
        websiteUrl: 'https://midjourney.com',
        tiers: [
          { tierId: 'basic', name: 'Basic', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 10, period: 'month' as const } } },
          { tierId: 'standard', name: 'Standard', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 30, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'ElevenLabs',
        slug: 'elevenlabs',
        category: 'voice',
        iconUrl: 'https://elevenlabs.io/apple-icon.png?6592732ab34b1d42',
        websiteUrl: 'https://elevenlabs.io',
        tiers: [
          { tierId: 'starter', name: 'Starter', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 5, period: 'month' as const } } },
          { tierId: 'creator', name: 'Creator', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 22, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Notion AI',
        slug: 'notion-ai',
        category: 'notes',
        iconUrl: 'https://www.notion.com/front-static/logo-ios.png',
        websiteUrl: 'https://notion.so',
        tiers: [
          { tierId: 'ai', name: 'AI Add-on', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 10, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Canva Pro',
        slug: 'canva-pro',
        category: 'creation',
        iconUrl: 'https://static.canva.com/domain-assets/canva/static/images/apple-touch-120x120-1.png',
        websiteUrl: 'https://canva.com',
        tiers: [
          { tierId: 'pro', name: 'Pro', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 15, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Descript',
        slug: 'descript',
        category: 'video',
        iconUrl: 'https://assets-global.website-files.com/5d761d627a6dfa6a5b28ab12/5d761d627a6dfa22d328aba1_Webclip.png',
        websiteUrl: 'https://descript.com',
        tiers: [
          { tierId: 'creator', name: 'Creator', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 12, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Lovable',
        slug: 'lovable',
        category: 'coding',
        iconUrl: 'https://lovable.dev/apple-touch-icon.png',
        websiteUrl: 'https://lovable.dev',
        tiers: [
          { tierId: 'starter', name: 'Starter', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 20, period: 'month' as const } }, isDefault: true },
          { tierId: 'launch', name: 'Launch', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 50, period: 'month' as const } } },
        ],
      },
      {
        name: 'n8n',
        slug: 'n8n',
        category: 'automation',
        iconUrl: 'https://n8n.io/favicon.ico',
        websiteUrl: 'https://n8n.io',
        tiers: [
          { tierId: 'starter', name: 'Starter', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 20, period: 'month' as const } }, isDefault: true },
        ],
      },
      {
        name: 'Zapier',
        slug: 'zapier',
        category: 'automation',
        iconUrl: 'https://zapier.com/favicon.ico',
        websiteUrl: 'https://zapier.com',
        tiers: [
          { tierId: 'starter', name: 'Starter', pricing: { pricingType: 'fixed' as const, fixed: { currency: 'USD', amount: 20, period: 'month' as const } }, isDefault: true },
        ],
      },
    ]

    const productIds: Record<string, Id<'products'>> = {}
    for (const product of productsData) {
      const id = await ctx.db.insert('products', {
        ...product,
        createdAt: now,
        updatedAt: now,
      })
      productIds[product.slug] = id
    }

    // ============ CREATORS ============
    const creatorsData = [
      {
        name: 'Alper Ortac',
        slug: 'alper-ortac',
        xHandle: 'alperortac',
        avatarUrl: 'https://pbs.twimg.com/profile_images/1568620530281992197/q4uX7XTK_400x400.jpg',
        verified: true,
        personalPages: [{ name: 'X', url: 'https://x.com/alperortac' }],
        projectPages: [{ name: 'GoodWatch', url: 'https://goodwatch.app' }],
        bio: 'Windsurf is my main driver. Accompanied by many sidekick tools.',
      },
      {
        name: 'Anthony',
        slug: 'anthony',
        xHandle: undefined,
        discordUserId: '105048063873126400',
        avatarUrl: 'https://levelingo.com/head.png',
        verified: true,
        personalPages: [{ name: 'Discord', url: 'https://discord.com/users/105048063873126400' }],
        projectPages: [{ name: 'Levelingo', url: 'https://levelingo.com' }],
        bio: 'Building Levelingo. Claude Max power user.',
      },
      {
        name: 'Chase Myers',
        slug: 'chase-myers',
        xHandle: 'chasem-dev',
        avatarUrl: 'https://chasem.dev/me.jpg',
        verified: true,
        personalPages: [{ name: 'GitHub', url: 'https://github.com/chasem-dev' }],
        projectPages: [{ name: 'Software Aura', url: 'https://softwareaura.com/' }],
        bio: 'Cursor Pro user with Codex extension.',
      },
      {
        name: 'Will Ness',
        slug: 'will-ness',
        xHandle: 'N3sOnline',
        avatarUrl: 'https://pbs.twimg.com/profile_images/1874518618743910400/FD_XvVH9_400x400.jpg',
        verified: true,
        personalPages: [{ name: 'X', url: 'https://x.com/N3sOnline' }],
        projectPages: [{ name: 'DoThisTask', url: 'https://www.dothistask.ai' }],
        bio: 'Claude Max + Claude Code + Wispr Flow + Perplexity stack.',
      },
      {
        name: 'Mark Perera',
        slug: 'mark-perera',
        xHandle: 'nipun056',
        avatarUrl: 'https://pbs.twimg.com/profile_images/1864347572053164032/PlDvx1Zz_400x400.jpg',
        verified: true,
        personalPages: [{ name: 'GitHub', url: 'https://github.com/nipun056' }],
        projectPages: [{ name: 'Google AI Studio', url: 'https://aistudio.google.com' }],
        bio: 'Google AI Pro user with Antigravity IDE.',
      },
      {
        name: 'Ivan Boroja',
        slug: 'ivan-boroja',
        xHandle: 'ivanboroja',
        avatarUrl: 'https://pbs.twimg.com/profile_images/2001689148944687104/xzaZoaLc_400x400.jpg',
        verified: true,
        personalPages: [{ name: 'X', url: 'https://x.com/ivanboroja' }],
        projectPages: [{ name: 'Artasaka', url: 'https://www.artasaka.com' }],
        bio: 'Full-stack creative developer with a comprehensive tool stack for design and development.',
      },
      {
        name: 'AL',
        slug: 'iambrutefyal',
        xHandle: 'iambrutefyAL',
        avatarUrl: 'https://pbs.twimg.com/profile_images/1979072577759739904/MSw2JQhb_400x400.jpg',
        verified: true,
        personalPages: [{ name: 'X', url: 'https://x.com/iambrutefyAL' }],
        projectPages: [{ name: 'Voice Ink', url: 'https://tryvoiceink.com/' }],
        bio: 'Claude Code + Google AI Studio workflow for rapid feature shipping.',
      },
      {
        name: 'Sabih Sarowar',
        slug: 'sabih-sarowar',
        xHandle: 'da_green_hermit',
        avatarUrl: 'https://pbs.twimg.com/profile_images/1915237824372105217/UzarVezl_400x400.jpg',
        verified: true,
        personalPages: [{ name: 'X', url: 'https://x.com/da_green_hermit' }],
        projectPages: [],
        bio: 'Windsurf early adopter + Superwhisper for voice-to-text.',
      },
      {
        name: 'Schuyler',
        slug: 'schuyler',
        xHandle: 'schuyler_dev',
        avatarUrl: 'https://pbs.twimg.com/profile_images/1948085790300364800/tnb8Zu_h_400x400.jpg',
        verified: true,
        personalPages: [{ name: 'X', url: 'https://x.com/schuyler_dev' }],
        projectPages: [],
        bio: 'Perplexity for research, Cursor for coding, Claude Max for heavy lifting.',
      },
    ]

    const creatorIds: Record<string, Id<'creators'>> = {}
    for (const creator of creatorsData) {
      const id = await ctx.db.insert('creators', {
        ...creator,
        createdAt: now,
      })
      creatorIds[creator.slug] = id
    }

    // ============ STACKS ============
    const stacksData = [
    {
        slug: "alper-builder-stack",
        creatorSlug: "alper-ortac",
        title: "Alper's Builder Stack",
        summary:
        "Daily driver stack: Windsurf, Claude, ChatGPT, Gemini. Using skills to make my agents smarter. Plus Lenny’s Bundle for extra tools.",
        productSubscriptions: [
          // Main paid tools
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

          // Lenny’s Bundle included tools (each tool listed, but $0 individually)
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

        // Total = 20 + 17 + 18 + 15 + 15 = 85
        fixedTotal: { currency: "USD", amount: 85, period: "month" as const },
        hasUsageComponent: false,
    },

    {
        slug: "anthony-claude-stack",
        creatorSlug: "anthony",
        title: "Anthony's Claude Stack",
        summary:
        "I'm on the $200 a month Claude plan and personally I haven't felt like I needed anything else. I use regular VS code so cursor isn't necessary and then just have the Claude CLI tool directly in my terminal.",
        productSubscriptions: [
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
        ],
        fixedTotal: { currency: "USD", amount: 200, period: "month" as const },
        hasUsageComponent: false,
    },

    {
        slug: "chase-cursor-stack",
        creatorSlug: "chase-myers",
        title: "Chase's Cursor Stack",
        summary:
        "Cursor Pro $20 subscription. I usually use Auto Mode to stay within budget. Sometimes I decide to use OPUS 4.5. I have the Codex extension installed as well.",
        productSubscriptions: [
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
        productSubscriptions: [
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
        productSubscriptions: [
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
        fixedTotal: { currency: "USD", amount: 20, period: "month" as const },
        hasUsageComponent: false,
    },

    {
        slug: "brutefy-shipping-stack",
        creatorSlug: "iambrutefyal",
        title: "Brutefy's Feature Shipping Stack",
        summary:
        "I use Google AI Studio to get a basic MVP for any idea. Then I ask Claude Code to EXACTLY copy every feature into my own directory. That's how I ship features to clients now.",
        productSubscriptions: [
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
        productSubscriptions: [
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
        productSubscriptions: [
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
        productSubscriptions: [
          // AI Tools
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

          // Design & Creative Tools
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
          // Lenny's Bundle
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

        // Total calculation:
        // AI Tools: 60 + 24 + 9 + 8 = 101
        // Lenny's Bundle: 12.5
        // Design Tools: 145 + 80 + 16.5 + 70 + 18 + 45 + 23 + 20 = 417.5
        // Grand Total: 101 + 12.5 + 417.5 = 531
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
    ];


    const stackIds: Record<string, Id<'stacks'>> = {}
    for (const stack of stacksData) {
      const creatorId = creatorIds[stack.creatorSlug]
      if (!creatorId) continue

      const productSubscriptions = stack.productSubscriptions.map((sub: any) => {
        const productId = productIds[sub.toolSlug];
        if (!productId) throw new Error(`Product not found: ${sub.toolSlug}`);

        const result: {
            productId: Id<"products">;
            tierId?: string;
            primaryUsageLabel: string;
            price: {
            pricingType: "fixed" | "usage" | "mixed";
            fixed?: { currency: string; amount: number; period: "month" | "year" | "one_time" };
            usage?: { unit: string; pricePerUnit: number; currency: string; notes?: string };
            };
            priceKind: "regular" | "discounted" | "bundle" | "usage_based";
            bundleName?: string;
            notes?: string;
        } = {
            productId,
            tierId: sub.tierId,
            primaryUsageLabel: sub.primaryUsageLabel,
            price: sub.price,
            priceKind: sub.priceKind,
        };
        if (sub.bundleName) result.bundleName = sub.bundleName;
        if (sub.notes) result.notes = sub.notes;
        return result;
      });

      const id = await ctx.db.insert('stacks', {
        slug: stack.slug,
        creatorId,
        title: stack.title,
        summary: stack.summary,
        teamSize: stack.teamSize,
        productSubscriptions,
        fixedTotal: stack.fixedTotal,
        usageTotalNotes: stack.usageTotalNotes,
        hasUsageComponent: stack.hasUsageComponent,
        published: true,
        createdAt: now,
        updatedAt: now,
      })
      stackIds[stack.slug] = id
    }

    console.log('Seed completed successfully!')
    console.log(`Created ${Object.keys(productIds).length} products`)
    console.log(`Created ${Object.keys(creatorIds).length} creators`)
    console.log(`Created ${Object.keys(stackIds).length} stacks`)

    return null
  },
})
