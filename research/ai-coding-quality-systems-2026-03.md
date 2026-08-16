# AI-Assisted Coding: Quality Systems Research
> Compiled March 2026. Sources from web research across industry blogs, documentation, and community patterns.

---

## 1. Instruction Budget & CLAUDE.md Best Practices

### The Instruction Budget Problem
- Frontier LLMs reliably follow ~150-200 instructions. Claude Code's system prompt consumes ~50 of those.
- Every line in CLAUDE.md competes for that budget. Adding instructions doesn't cause Claude to skip new ones - it causes **uniform degradation across ALL instructions**.
- A focused 50-line file typically outperforms a sprawling 1,000-line one.

### Proven Structure
- **WHY-WHAT-HOW framework**: Tech stack and project structure (WHAT), project purpose (WHY), build/test/verification processes (HOW).
- **Progressive disclosure**: Create separate markdown files in `agent_docs/` and instruct Claude to read them when relevant, rather than cramming everything into one file.
- **Three-tier placement**: Global `~/.claude/CLAUDE.md` for personal preferences, project root for team conventions, subdirectories for domain-specific guidance.
- **Import syntax**: Use `@path/to/file` references to pull in specific docs on demand.

### What NOT to Put in Rules Files
- Code style rules that a linter can enforce (use hooks instead - they are deterministic, 100% compliance).
- Anything the model already does correctly without the instruction.
- Detailed API documentation (link to docs instead).
- Auto-generated content from `/init` - CLAUDE.md is "the highest leverage point of the harness" and deserves hand-crafted attention.

### Anti-Pattern: "AI as a Linter"
Never use rule files for formatting/style. Instead: use deterministic formatters, implement PostToolUse hooks to run linters after every edit, create Stop hooks to present errors back to the model.

**Sources:**
- https://code.claude.com/docs/en/best-practices
- https://kirill-markin.com/articles/claude-code-rules-for-ai/
- https://www.humanlayer.dev/blog/writing-a-good-claude-md
- https://uxplanet.org/claude-md-best-practices-1ef4f861ce7c

---

## 2. Quality Gates & Verification Patterns

### Three-Level Defense (CodeScene Pattern)
1. **Generation time**: Code health review during snippet generation.
2. **Pre-commit**: Code health safeguard on staged files.
3. **PR level**: Full branch-vs-base validation.

### Deterministic vs. Advisory Split
The most important architectural decision for quality systems:
- **Rule files are advisory** - the model follows them ~80% of the time.
- **Hooks are deterministic** - 100% compliance.
- Rule of thumb: If something MUST happen every time without exception, make it a hook. If it's guidance the model should consider, rule files are fine.

### Stop Hook Verification Loop ("Ralph Wiggum Technique")
A powerful community-discovered pattern:
- A Stop hook fires every time the model finishes a response.
- The hook runs tests.
- If tests fail, it returns `{"decision": "block", "reason": "Tests failing: ..."}` and the model keeps working.
- A "completion promise" word/phrase signals genuine completion.
- Critical: check a `stop_hook_active` flag to prevent infinite loops - when true, the model is already in a forced continuation state.

### Agent-Based Hooks
For verification requiring judgment (not just pass/fail), use agent-type hooks that spawn a subagent with tool access to inspect files, run commands, and verify conditions. Up to 50 tool-use turns per hook invocation.

### Code Coverage as Behavioral Guardrail
Agentic workflows benefit from strict coverage gates because iteration velocity makes test erosion a measurable risk. Hard coverage thresholds prevent agents from deleting tests as a shortcut.

**Sources:**
- https://codescene.com/blog/agentic-ai-coding-best-practice-patterns-for-speed-with-quality
- https://code.claude.com/docs/en/hooks-guide
- https://claudefa.st/blog/tools/hooks/stop-hook-task-enforcement
- https://claudefa.st/blog/guide/mechanics/ralph-wiggum-technique

---

## 3. Subagent & Multi-Agent Patterns

### Core Architectural Patterns

**Parallel dispatch**: 3+ unrelated tasks across independent domains, no shared state, clear file boundaries. Example: frontend/backend/database agents working simultaneously.

**Sequential chaining**: spec-writer → architect-reviewer → implementer-tester. Each agent's output feeds the next.

**Background dispatch**: Research/analysis tasks that don't block current work.

### Cost Optimization
Run the main session on the most capable model for complex reasoning. Subagents handle focused tasks on cheaper models. This significantly reduces token costs without sacrificing quality on the main thread.

### Persistent Memory for Subagents
Subagents can maintain memory across sessions via MEMORY.md files that accumulate institutional knowledge. Pattern: "Review this PR, and check your memory for patterns you've seen before."

### Worktree Isolation
Give a subagent an isolated copy of the repository via git worktrees. The worktree is automatically cleaned up if the subagent makes no changes. Essential for parallel code modifications that might conflict.

### Writer/Reviewer Pattern
Use separate sessions: Session A writes implementation, Session B reviews with fresh context (no bias toward code it just wrote), Session A addresses feedback. A fresh context genuinely improves review quality.

### Anti-Patterns
- **Over-parallelization**: Launching too many agents for simple features wastes tokens and creates coordination overhead.
- **Vague invocations**: "Implement the feature" fails. Specify exact scope, file references, and success criteria.
- **Sub-agent failures are invocation failures**: Comprehensive context is what makes subagents succeed, not more retries.

**Sources:**
- https://code.claude.com/docs/en/sub-agents
- https://claudefa.st/blog/guide/agents/sub-agent-best-practices
- https://winbuzzer.com/2026/03/24/anthropic-claude-code-subagent-mcp-advanced-patterns-xcxwbn/

---

## 4. One-Shot Quality Strategies

### Spec-First Approach ("Waterfall in 15 Minutes")
The single highest-leverage technique:
1. Brainstorm detailed specs WITH the AI through iterative questioning.
2. Compile comprehensive spec.md with requirements, architecture, data models, testing strategy.
3. Generate project plan from spec, breaking into logical milestones.
4. Execute against the plan with verification at each milestone.

### Human Review Leverage Points
Where human attention has maximum impact (HumanLayer framework):
- **Research review** prevents thousands of bad lines.
- **Plan review** prevents hundreds of bad lines.
- **Code review** prevents individual bad lines.
Focus human attention upstream on specifications and architecture, not line-by-line code.

### The Interview Pattern
Start with a minimal prompt and ask the model to interview you. It asks about technical implementation, UI/UX, edge cases, and tradeoffs you might not have considered. Then write the spec and start a fresh session to implement.

### Context Budget Discipline
Maintain context utilization in the **40-60% range** for complex problems. Structure: Research phase → Plan phase → Implementation phase, with intentional compaction after each verification step.

### Compaction Output Structure
After each phase, compact to:
- Concise problem statement
- Current approach being taken
- Steps completed so far
- Current blocker/failure being addressed

### Verification as Highest-Leverage Practice
From Anthropic's own guidance: "Include tests, screenshots, or expected outputs so the model can check itself." Without clear success criteria, models produce plausible-looking but broken code.

**Sources:**
- https://addyosmani.com/blog/ai-coding-workflow/
- https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md
- https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html

---

## 5. AGENTS.md & Cross-Tool Portability

### The Emerging Standard
AGENTS.md originated from collaboration between Sourcegraph, OpenAI, Google, Cursor, and others. Now maintained by the Agentic AI Foundation under the Linux Foundation. Adopted across 60,000+ open-source projects.

### Supported Tools
Claude Code, Cursor, GitHub Copilot, Gemini CLI, Windsurf, Aider, Zed, Warp, RooCode.

### Cross-Tool Strategy
1. **Primary**: Maintain AGENTS.md as the universal instruction set.
2. **Tool-specific**: Add CLAUDE.md or .cursor/rules/ only for tool-exclusive features.
3. **Reference pattern**: CLAUDE.md can simply say "Strictly follow the rules in ./AGENTS.md."

### Format Comparison

| Aspect | AGENTS.md | CLAUDE.md | .cursor/rules/ |
|--------|-----------|-----------|-----------------|
| Hierarchy | Walk from root to working dir | Global + project + subdirectory | Directory-based with globs |
| Activation | Always applied | Three-level merge | Manual, auto, or model-decided |
| Cross-tool | 7+ tools | Claude Code only | Cursor + some fallbacks |
| Format | Plain markdown | Plain markdown | .mdc files with YAML frontmatter |

### Cursor-Specific Innovations
The .cursorrules format is deprecated in favor of .cursor/rules/ directory with .mdc files. Each file has: description, glob patterns for scoping, alwaysApply flag. Glob-based scoping (different rules for different file types) is more granular than AGENTS.md currently supports.

### Constraint Awareness
Windsurf and Cursor impose character limits: individual files capped at 6,000 characters, combined not exceeding 12,000.

**Sources:**
- https://www.deployhq.com/blog/ai-coding-config-files-guide
- https://cursor.com/docs/context/rules
- https://www.agentrulegen.com/guides/cursor-rules-guide

---

## 6. AI Code Review Patterns

### Beyond Diff-Only Review (Augment Code)
Most AI review tools operate on the PR diff alone and use grep for context - this breaks down in large codebases. Better approach: semantic code search that understands cross-repository relationships, historical patterns, and architectural context.

### Four Components of Review Quality
1. **Tools**: Semantic retrieval, file browsing, symbol search with minimal overlap. Deterministic injection of large inputs (diffs, existing comments) rather than tool-based retrieval.
2. **Prompts**: System prompts that tune precision-recall tradeoff, specifying which comment categories to avoid.
3. **Model selection**: Models differ in how they interpret instructions and trade off precision vs recall - continuous benchmarking required.
4. **Guardrails**: Narrow tool operations, restricted shell access, deterministic components.

### Attribution-Based Review
Track every AI suggestion through its lifecycle. Repeatedly accepted patterns become emerging best practices. Repeatedly rejected ones get deprioritized. Creates a learning loop.

### AI-on-AI Review
Spawn a second session to critique code from the first. Surprisingly effective at catching subtle issues. Maps to the Writer/Reviewer pattern with separate sessions.

### Specialist Agent Pattern
Dedicated security/performance/accessibility agents catch issues that generalist tools miss. Define as subagents with restricted tool access and focused system prompts.

**Sources:**
- https://www.augmentcode.com/blog/how-we-built-high-quality-ai-code-review-agent
- https://www.qodo.ai/blog/5-ai-code-review-pattern-predictions-in-2026/

---

## 7. Hook Patterns for Automated Quality

### Essential Patterns

**PostToolUse auto-formatting**: Run formatter after every Edit or Write. Eliminates style back-and-forth.
```json
{"PostToolUse": [{"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "npx prettier --write <file>"}]}]}
```

**PreToolUse file protection**: Block edits to .env, lock files, .git/. Exit code 2 blocks the action and feeds reason back.

**SessionStart context re-injection**: After compaction, re-inject critical context using `"matcher": "compact"`. Stdout from the hook is added to context.

**Notification hooks**: Desktop notifications when the model needs input.

**PermissionRequest auto-approval**: Auto-approve specific safe operations to reduce interruptions.

### Novel Hook Ideas
- **CwdChanged + direnv**: Reload environment variables when changing directories.
- **FileChanged**: Watch specific files for changes and react.
- **ConfigChange audit logging**: Track settings changes for compliance.
- **PreToolUse with `if` field**: Filter by tool name AND arguments.
- **HTTP hooks**: POST event data to external services for team-wide audit/logging.

**Sources:**
- https://code.claude.com/docs/en/hooks-guide
- https://dev.to/myougattheaxo/git-hooks-with-claude-code-build-quality-gates-with-husky-and-pre-commit-27l0

---

## 8. Context Engineering

### Five Core Strategies
1. **Selection**: Choose which information enters context (progressive disclosure, lazy-loading).
2. **Compression**: Reduce token footprint (intentional compaction, commit messages as progress summaries).
3. **Ordering**: Exploit peripheral bias - LLMs prioritize instructions at prompt extremities.
4. **Isolation**: Use subagents to keep noisy discovery work out of the main context.
5. **Format optimization**: Markdown with clear headers, bullet points, and file:line references.

### Hierarchy of Context Problems (worst to least damaging)
1. **Incorrect information** - actively misleading.
2. **Missing information** - model guesses wrong.
3. **Excessive noise** - dilutes important instructions.

### The "Illusion of Control" Insight
Despite the term "engineering," outcomes remain probabilistic. Context engineering increases success probability, not guarantee. Avoid promises like "ensure it does X." Instead, optimize for highest probability through layered defenses (rules + hooks + verification + review).

**Sources:**
- https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html
- https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md
- https://www.promptingguide.ai/guides/context-engineering-guide

---

## 9. Industry-Scale Patterns

### Two-Layer Model (CodeScene)
1. **Deterministic layer**: Automated tooling (linters, type checkers, coverage gates) provides hard boundaries.
2. **Judgment layer**: A dedicated critic agent validates output against a definition of done, returning pass/fail with explanation.
If either layer rejects, the producing agent iterates.

### Code Health as AI-Readiness Signal
Nonlinear performance improvement above Code Health score 9.5, optimal at 10.0. Unhealthy code confuses agents similarly to humans, inflating token spend and error rates. Recommendation: assess and improve code health BEFORE assigning agents to a module.

### Enterprise Five-Phase Approach
1. Context foundation (CLAUDE.md, AGENTS.md, codebase mapping).
2. Spec-driven planning (interviews, specs, plan review).
3. Multi-agent orchestration (parallel specialists).
4. Quality gates with CI/CD integration.
5. Structured team adoption.

### Real-World Numbers
- Rakuten: 12.5M-line codebase task completed in 7 hours with 99.9% accuracy.
- TELUS: 30% faster code delivery, 500,000+ hours saved.
- Zapier: 89% AI adoption, 800+ internal agents.
- Developers use AI in ~60% of work but can fully delegate only 0-20% of tasks.

**Sources:**
- https://claude.com/blog/eight-trends-defining-how-software-gets-built-in-2026
- https://resources.anthropic.com/2026-agentic-coding-trends-report
- https://thenewstack.io/5-key-trends-shaping-agentic-development-in-2026/

---

## 10. Key Takeaways for System Design

1. **Instruction budget is real** (~150 usable). Every unnecessary line causes uniform degradation.
2. **Deterministic > advisory**: If it must happen every time, make it a hook.
3. **Stop hook verification loops** are the most reliable autonomous quality pattern.
4. **Human review leverage is upstream**: Research review > Plan review > Code review.
5. **Code health is a prerequisite**: Agents perform nonlinearly worse on unhealthy code.
6. **AGENTS.md is the lingua franca**: Use it as primary, tool-specific files only for exclusive features.
7. **Context utilization 40-60%**: Intentional compaction after each phase.
8. **Specialist agents catch what generalists miss**: Security, performance, accessibility need dedicated focus.
9. **Fresh context improves review quality**: The reviewer should not have implementation bias.
10. **PostToolUse auto-formatting eliminates an entire class of back-and-forth**.
