export const stacksData = [
  {
    slug: "alper-builder-stack",
    creatorSlug: "alper-ortac",
    oneLiner:
      "Daily driver stack: Windsurf, Claude, ChatGPT, Gemini. Using skills to make my agents smarter. Plus Lenny's Bundle for extra tools.",
    description: `## How I Use This Stack

My daily workflow revolves around **Windsurf** as my primary IDE. I've set up custom skills and rules that make the AI agent significantly smarter at understanding my codebase and coding patterns.

### Core AI Tools

I keep subscriptions to **Claude**, **ChatGPT**, and **Gemini** because each model has different strengths:

- **Claude Pro** is my go-to for complex reasoning, refactoring, and architecture decisions
- **ChatGPT Plus** handles quick questions, brainstorming, and general-purpose tasks
- **Google AI Pro** gives me access to Gemini for multimodal tasks and when I need a different perspective

### The Lenny's Bundle Advantage

The bundle is incredible value — for $15/mo I get access to Replit, Bolt, Lovable, Notion AI, Perplexity, PostHog, and more. I mainly use:

- **Perplexity** for research and staying up to date
- **Notion AI** for documentation and project management
- **PostHog** for product analytics
- **Replit/Bolt/Lovable** for quick prototyping when I need to test an idea fast

### Skills & Automation

The real power of this stack comes from the **4 custom skills** I've built for Windsurf. They handle everything from automated code review to deployment pipelines. Combined with **3 system prompts** and **2 MCP servers**, my AI agents understand context that would normally require extensive manual explanation.`,
    stackUrl: "https://github.com/alp82/aistack",
    prompts: [
      { name: "Code Review", description: "Automated code review with best practices and security checks" },
      { name: "Architecture Planning", description: "System design and architecture decision prompts" },
      { name: "Documentation", description: "Generate comprehensive documentation from code" },
    ],
    rules: [
      { name: "TypeScript Strict", description: "Enforce strict TypeScript patterns and type safety" },
      { name: "Clean Code", description: "Follow clean code principles and naming conventions" },
    ],
    skills: [
      { name: "Deploy Pipeline", description: "Automated deployment to production", trigger: "/deploy" },
      { name: "Test Generator", description: "Generate unit and integration tests", trigger: "/test" },
      { name: "Refactor", description: "Intelligent code refactoring suggestions", trigger: "/refactor" },
      { name: "Debug Helper", description: "Systematic debugging assistance", trigger: "/debug" },
    ],
    mcps: [
      { name: "GitHub", purpose: "Repository management and PR automation", url: "https://github.com" },
      { name: "Supabase", purpose: "Database queries and schema management", url: "https://supabase.com" },
    ],
    models: [
      { name: "Claude 3.5 Sonnet", role: "Primary coding and architecture" },
      { name: "GPT-4o", role: "Quick questions and brainstorming" },
      { name: "Gemini Pro", role: "Multimodal tasks and research" },
    ],
    resources: [
      { label: "How I use AI Skills", url: "https://x.com/alperortac/status/example" },
    ],
    toolSubscriptions: [
      {
        toolSlug: "chatgpt",
        tierId: "plus",
        kind: "main" as const,
        primaryUsageLabel: "Quick questions, brainstorming, and general-purpose tasks",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "claude",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Complex reasoning, refactoring, and architecture decisions",
        priceKind: "discounted" as const,
        notes: "Discounted plan",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 17, period: "month" as const },
        },
      },
      {
        toolSlug: "google-ai",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Multimodal tasks and getting a different perspective on problems",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 18, period: "month" as const },
        },
      },
      {
        toolSlug: "windsurf",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Primary coding environment with custom skills and rules",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 15, period: "month" as const },
        },
      },
      {
        toolSlug: "replit",
        tierId: "core",
        kind: "main" as const,
        primaryUsageLabel: "Quick prototyping and testing ideas in the browser",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "bolt",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Rapid full-stack app scaffolding from prompts",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "lovable",
        tierId: "starter",
        kind: "main" as const,
        primaryUsageLabel: "AI-powered frontend generation for landing pages",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "notion",
        tierId: "plus",
        kind: "main" as const,
        primaryUsageLabel: "Documentation, project management, and knowledge base",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "perplexity",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Research, staying up to date, and fact-checking",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "posthog",
        tierId: "free",
        kind: "main" as const,
        primaryUsageLabel: "Product analytics and user behavior tracking",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
    ],
    bundleSubscriptions: [
      { bundleSlug: "lennys-bundle", tierId: "monthly" },
    ],
    fixedTotal: { currency: "USD", amount: 85, period: "month" as const },
    hasUsageComponent: false,
  },

  {
    slug: "anthony-claude-stack",
    creatorSlug: "anthony",
    oneLiner:
      "I'm on the $200 a month Claude plan and personally I haven't felt like I needed anything else. I use regular VS code so cursor isn't necessary and then just have the Claude CLI tool directly in my terminal.",
    description: `## The All-In Claude Approach

I went all-in on Claude Max at $200/month and it's been worth every penny. Here's why this minimal stack works for me:

### Why Claude Max?

The **Claude Max** plan gives me unlimited access to Claude's most powerful models. I don't have to think about rate limits or switching between tools — it's just one subscription that handles everything.

### Terminal-First Workflow

I use **VS Code** (not Cursor) because I prefer having Claude Code directly in my terminal. The CLI-based workflow feels more natural to me:

- Run \`claude\` in any directory to start a coding session
- The agent understands my full project context
- No need for IDE-specific integrations

### Video Content with Higgsfield

For marketing and social media, I use **Higgsfield AI** to generate video content. It's surprisingly good at creating engaging clips from simple prompts.

### The Philosophy

My approach is simple: find one tool that does most things well, rather than juggling multiple subscriptions. Claude Max is that tool for me.`,
    toolSubscriptions: [
      {
        toolSlug: "claude",
        tierId: "max-200",
        kind: "main" as const,
        primaryUsageLabel: "All-in-one AI for coding, writing, and analysis",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 200, period: "month" as const },
        },
      },
      {
        toolSlug: "claude",
        tierId: "included",
        kind: "main" as const,
        primaryUsageLabel: "CLI-based coding agent directly in the terminal",
        priceKind: "bundle" as const,
        bundleSlug: "claude-max-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "higgsfield-ai",
        tierId: "ultimate",
        kind: "main" as const,
        primaryUsageLabel: "Generating marketing and social media video content",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 37.5, period: "month" as const },
        },
      },
    ],
    bundleSubscriptions: [
      { bundleSlug: "claude-max-bundle", tierId: "max-200" },
    ],
    fixedTotal: { currency: "USD", amount: 237.5, period: "month" as const },
    hasUsageComponent: false,
  },

  {
    slug: "chase-cursor-stack",
    creatorSlug: "chase-myers",
    oneLiner:
      "Cursor Pro $20 subscription. I usually use Auto Mode to stay within budget. Sometimes I decide to use OPUS 4.5. I have the Codex extension installed as well.",
    description: `## Budget-Conscious Cursor Setup

I keep my AI coding costs under control with a simple two-tool setup.

### Cursor Pro with Auto Mode

**Cursor Pro** at $20/month is my main IDE. The key to staying within budget is using **Auto Mode** — it automatically picks the best model for each task, balancing quality and cost.

When I need maximum power for complex refactoring or architecture decisions, I manually switch to **Claude Opus 4.5**. This adds to my usage costs but it's worth it for the hard problems.

### The Codex Extension

I also run the **Codex extension** powered by ChatGPT Plus. It provides inline code suggestions as I type, which speeds up my workflow significantly.

### Cost Breakdown

- Base: $40/month (Cursor Pro + ChatGPT Plus)
- Variable: Up to $30 extra when I use premium models heavily

This setup gives me flexibility — I can keep costs low during routine work and scale up when I need more power.`,
    toolSubscriptions: [
      {
        toolSlug: "cursor",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Primary coding IDE with Auto Mode for budget control",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "chatgpt",
        tierId: "plus",
        kind: "main" as const,
        primaryUsageLabel: "Powers the Codex extension for inline code suggestions",
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
    oneLiner:
      "Claude Max + Claude Code + Wispr Flow + Perplexity. See my article for the full setup.",
    description: `## Voice-First AI Development

My stack is optimized for hands-free coding and deep research. Here's how it all fits together:

### Claude Max + Claude Code

The **Claude Max** $100/month plan is my foundation. It includes **Claude Code** which I run directly in my terminal. The combination is incredibly powerful for:

- Complex refactoring across large codebases
- Architecture decisions with full context
- Writing documentation and tests

### Voice Input with Wispr Flow

**Wispr Flow** is a game-changer. I dictate code, comments, and even commit messages. It's trained on technical vocabulary so it handles programming terms accurately.

My typical workflow:
1. Think through the problem out loud
2. Wispr transcribes my thoughts
3. Claude Code implements the solution

### Research with Perplexity

For staying current with new libraries, APIs, and best practices, **Perplexity Pro** is essential. It searches the web and synthesizes answers with citations.

### The Result

This stack lets me code faster while reducing RSI strain. The voice-first approach also helps me think more clearly about problems.`,
    resources: [
      { label: "Full setup article", url: "https://x.com/N3sOnline/status/example" },
    ],
    toolSubscriptions: [
      {
        toolSlug: "claude",
        tierId: "max-100",
        kind: "main" as const,
        primaryUsageLabel: "Heavy-duty AI for complex tasks with Opus 4 access",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 100, period: "month" as const },
        },
      },
      {
        toolSlug: "claude",
        tierId: "included",
        kind: "main" as const,
        primaryUsageLabel: "Terminal-based coding agent included with Max plan",
        priceKind: "bundle" as const,
        bundleSlug: "claude-max-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "wispr-flow",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Dictate code and notes hands-free with voice",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 12, period: "month" as const },
        },
      },
      {
        toolSlug: "perplexity",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Deep research and real-time web search for answers",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
    ],
    bundleSubscriptions: [
      { bundleSlug: "claude-max-bundle", tierId: "max-100" },
    ],
    fixedTotal: { currency: "USD", amount: 132, period: "month" as const },
    hasUsageComponent: false,
  },

  {
    slug: "mark-google-stack",
    creatorSlug: "mark-perera",
    oneLiner:
      "I'm using Google AI Pro. My main IDE now is Google Antigravity instead of Cursor for personal projects.",
    toolSubscriptions: [
      {
        toolSlug: "google-ai",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Primary AI with Gemini for coding and multimodal tasks",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "chatgpt",
        tierId: "plus",
        kind: "main" as const,
        primaryUsageLabel: "Backup AI for second opinions and different reasoning",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "antigravity",
        tierId: "free",
        kind: "main" as const,
        primaryUsageLabel: "Free AI-powered IDE replacing Cursor for personal projects",
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
    oneLiner:
      "I use Google AI Studio to get a basic MVP for any idea. Then I ask Claude Code to EXACTLY copy every feature into my own directory. That's how I ship features to clients now.",
    toolSubscriptions: [
      {
        toolSlug: "claude",
        tierId: "included",
        kind: "main" as const,
        primaryUsageLabel: "Copies features from AI Studio prototypes into production code",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "windsurf",
        tierId: "early-adopter",
        kind: "main" as const,
        primaryUsageLabel: "Secondary IDE for when Claude Code needs a visual editor",
        priceKind: "discounted" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 10, period: "month" as const },
        },
      },
      {
        toolSlug: "google-ai",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Rapid MVP prototyping with AI Studio before transferring",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "voice-ink",
        tierId: "local",
        kind: "main" as const,
        primaryUsageLabel: "Local speech-to-text for hands-free coding sessions",
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
    oneLiner:
      "Windsurf for coding with early adopter pricing. Superwhisper for speech to text - stable, half the price of Wispr, and has text post processing.",
    toolSubscriptions: [
      {
        toolSlug: "windsurf",
        tierId: "early-adopter",
        kind: "main" as const,
        primaryUsageLabel: "Primary coding IDE locked in at early adopter pricing",
        priceKind: "discounted" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 10, period: "month" as const },
        },
      },
      {
        toolSlug: "superwhisper",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Stable speech-to-text with post-processing at half the price of Wispr",
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
    oneLiner:
      "Perplexity for research (became my main search engine), Cursor for coding, Claude Max for heavy lifting with Opus 4.",
    toolSubscriptions: [
      {
        toolSlug: "perplexity",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Replaced Google as my main search engine for research",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "cursor",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Daily coding IDE with tab completions and inline edits",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "claude",
        tierId: "max-100",
        kind: "main" as const,
        primaryUsageLabel: "Heavy lifting with Opus 4 via Claude Code in the terminal",
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
    oneLiner:
      "Comprehensive stack for creative development including AI tools, design software, and collaboration platforms. Perfect for building beautiful, functional products.",
    teamSize: 9,
    toolSubscriptions: [
      {
        toolSlug: "chatgpt",
        tierId: "team",
        kind: "main" as const,
        primaryUsageLabel: "Team-wide AI assistant for writing, analysis, and brainstorming",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 60, period: "month" as const },
        },
      },
      {
        toolSlug: "midjourney",
        tierId: "standard",
        kind: "main" as const,
        primaryUsageLabel: "Creating product mockups, social assets, and brand imagery",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 24, period: "month" as const },
        },
      },
      {
        toolSlug: "kling-ai",
        tierId: "standard",
        kind: "main" as const,
        primaryUsageLabel: "Short-form video generation for social media content",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 9, period: "month" as const },
        },
      },
      {
        toolSlug: "grok",
        tierId: "premium",
        kind: "main" as const,
        primaryUsageLabel: "Real-time AI chat with access to X/Twitter data",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 8, period: "month" as const },
        },
      },
      {
        toolSlug: "figma",
        tierId: "professional",
        kind: "main" as const,
        primaryUsageLabel: "Collaborative UI/UX design for the entire team",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 145, period: "month" as const },
        },
      },
      {
        toolSlug: "slack",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Team communication hub with AI-powered search and summaries",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 80, period: "month" as const },
        },
      },
      {
        toolSlug: "envato",
        tierId: "elements",
        kind: "main" as const,
        primaryUsageLabel: "Unlimited downloads of templates, fonts, and stock assets",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 16.5, period: "month" as const },
        },
      },
      {
        toolSlug: "adobe-creative-cloud",
        tierId: "all-apps",
        kind: "main" as const,
        primaryUsageLabel: "Full creative suite for photo, video, and motion graphics",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 70, period: "month" as const },
        },
      },
      {
        toolSlug: "unicorn-studio",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Interactive 3D web experiences without writing WebGL code",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 18, period: "month" as const },
        },
      },
      {
        toolSlug: "framer",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "High-fidelity website design with built-in animations",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 45, period: "month" as const },
        },
      },
      {
        toolSlug: "webflow",
        tierId: "cms",
        kind: "main" as const,
        primaryUsageLabel: "CMS-driven marketing sites and client landing pages",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 23, period: "month" as const },
        },
      },
      {
        toolSlug: "spline",
        tierId: "super",
        kind: "main" as const,
        primaryUsageLabel: "3D modeling and interactive scenes for product pages",
        priceKind: "regular" as const,
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 20, period: "month" as const },
        },
      },
      {
        toolSlug: "replit",
        tierId: "core",
        kind: "main" as const,
        primaryUsageLabel: "Quick prototyping and testing client ideas in the browser",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "bolt",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Rapid full-stack scaffolding for client project kickoffs",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "lovable",
        tierId: "starter",
        kind: "main" as const,
        primaryUsageLabel: "AI-generated landing pages and marketing sites",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "notion",
        tierId: "plus",
        kind: "main" as const,
        primaryUsageLabel: "Team wiki, project docs, and AI-powered writing",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "perplexity",
        tierId: "pro",
        kind: "main" as const,
        primaryUsageLabel: "Competitive research and trend analysis for clients",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
      {
        toolSlug: "posthog",
        tierId: "free",
        kind: "main" as const,
        primaryUsageLabel: "Analytics and A/B testing across client projects",
        priceKind: "bundle" as const,
        bundleSlug: "lennys-bundle",
        price: {
          pricingType: "fixed" as const,
          fixed: { currency: "USD", amount: 0, period: "month" as const },
        },
      },
    ],
    bundleSubscriptions: [
      { bundleSlug: "lennys-bundle", tierId: "annual" },
    ],
    fixedTotal: { currency: "USD", amount: 531, period: "month" as const },
    hasUsageComponent: false,
  },
]
