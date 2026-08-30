import { fmtShare, fmtTokens } from "@/features/measured/copy";
import { cn } from "@/lib/utils";

export const SOURCE_PAINTS = [
	"var(--source-1)",
	"var(--source-2)",
	"var(--source-3)",
] as const;

const HARNESS_LABELS: Record<string, string> = {
	"claude-code": "Claude Code",
	codex: "Codex",
	opencode: "opencode",
	"pi-mono": "Pi",
};

export type HarnessTokens = { readonly name: string; readonly tokens: number };

/**
 * The tokens by harness, one bar per harness, highest usage first.
 *
 * A harness that produced tokens but is not a stack tool is EXTRA (#293): its
 * label and bar fill sit at half opacity, its figures stay at full contrast,
 * and the only word is for screen readers. The treatment marks extra, never
 * unused. The catalog's tool slugs are the harness names.
 */
export function HarnessShareRows({
	harnesses,
	stackToolSlugs,
}: {
	harnesses: readonly HarnessTokens[];
	stackToolSlugs: string[];
}) {
	const byHarness = new Map<string, number>();
	for (const h of harnesses) {
		byHarness.set(h.name, (byHarness.get(h.name) ?? 0) + h.tokens);
	}
	const total = [...byHarness.values()].reduce((a, b) => a + b, 0);
	const rows = [...byHarness.entries()]
		.map(([name, tokens]) => ({
			name,
			label: HARNESS_LABELS[name] ?? name,
			tokens,
			share: total > 0 ? tokens / total : 0,
			extra: !stackToolSlugs.includes(name),
		}))
		.sort((a, b) => b.tokens - a.tokens || a.name.localeCompare(b.name));
	if (rows.length === 0) return null;

	return (
		<ul
			aria-label="Harness token shares"
			className="divide-y divide-stroke-subtle border-y border-stroke-subtle"
		>
			{rows.map((row, index) => (
				<li
					key={row.name}
					data-extra={row.extra || undefined}
					className="flex items-center gap-3 py-2"
				>
					<span
						className={cn(
							"w-40 shrink-0 truncate text-sm text-fg-secondary",
							row.extra && "opacity-50",
						)}
					>
						{row.label}
						{row.extra && <span className="sr-only"> (extra)</span>}
					</span>
					<span className="h-3 flex-1 bg-bg-panel">
						<span
							data-testid="source-paint"
							className={cn("block h-full", row.extra && "opacity-50")}
							style={{
								width: `${Math.max(1, row.share * 100)}%`,
								background: SOURCE_PAINTS[index % SOURCE_PAINTS.length],
							}}
						/>
					</span>
					<span className="w-14 shrink-0 text-right font-mono text-xs font-bold text-fg-secondary">
						{fmtShare(row.share)}
					</span>
					<span className="w-14 shrink-0 text-right font-mono text-[11px] text-fg-muted">
						{fmtTokens(row.tokens)}
					</span>
				</li>
			))}
		</ul>
	);
}
