import { useAction } from "convex/react";
import { Check, MessageSquare, Plus, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

/**
 * The pick list a pasted X profile link opens (#208).
 *
 * A profile is not a news item, so nothing is stored when the owner pastes
 * one. The lane lists the recent posts and the owner picks. Each pick runs the
 * ordinary post lane, which stores the ID and the official oEmbed embed.
 *
 * This list is the ONE surface that reads the optional profile lane (#209). It
 * fails in place: a post that will not add says so on its own row, and the rest
 * of the list still works.
 */
export interface XProfilePost {
	statusId: string;
	screenName: string;
	url: string;
	text: string;
	publishedAt: number | null;
	isReply: boolean;
}

type PickState = "idle" | "adding" | "added" | "duplicate" | "failed";

function day(ms: number | null): string {
	if (!ms) return "no date";
	return new Date(ms).toISOString().slice(0, 10);
}

export function NewsXProfilePicks({
	screenName,
	posts,
	onClose,
}: {
	screenName: string;
	posts: XProfilePost[];
	onClose: () => void;
}) {
	const quickAdd = useAction(api.news.quickAdd);
	const [state, setState] = useState<Record<string, PickState>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});

	async function pick(post: XProfilePost) {
		setState((s) => ({ ...s, [post.statusId]: "adding" }));
		try {
			const result = await quickAdd({
				url: post.url,
				publishedAt: post.publishedAt ?? undefined,
			});
			setState((s) => ({
				...s,
				[post.statusId]: result.item?.duplicate ? "duplicate" : "added",
			}));
		} catch (error) {
			setErrors((e) => ({
				...e,
				[post.statusId]:
					error instanceof Error ? error.message : "Could not add that",
			}));
			setState((s) => ({ ...s, [post.statusId]: "failed" }));
		}
	}

	return (
		<div className="mt-4 border-2 border-stroke-strong bg-bg-canvas p-4">
			<div className="mb-3 flex items-center justify-between gap-3">
				<h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-primary">
					Recent posts from @{screenName}
				</h3>
				<button
					type="button"
					onClick={onClose}
					className="inline-flex cursor-pointer items-center gap-1 border-2 border-stroke-subtle px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-fg-muted transition-colors hover:border-stroke-strong hover:text-fg-primary"
				>
					<X className="size-3" />
					Close
				</button>
			</div>

			{posts.length === 0 ? (
				<p className="font-mono text-xs text-fg-muted">
					That profile has no posts to offer. Paste a post link instead.
				</p>
			) : null}

			<ul className="flex flex-col gap-2">
				{posts.map((post) => {
					const pickState = state[post.statusId] ?? "idle";
					return (
						<li
							key={post.statusId}
							className="flex flex-col gap-2 border-2 border-stroke-subtle p-3 sm:flex-row sm:items-start sm:justify-between"
						>
							<div className="min-w-0 flex-1">
								<div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-fg-muted">
									<span>{day(post.publishedAt)}</span>
									{post.isReply ? (
										<span className="inline-flex items-center gap-1">
											<MessageSquare className="size-3" />
											Reply
										</span>
									) : null}
								</div>
								<p className="text-sm text-fg-primary">{post.text}</p>
								{pickState === "failed" ? (
									<p className="mt-1 font-mono text-[10px] text-red-500">
										{errors[post.statusId]}
									</p>
								) : null}
							</div>
							<button
								type="button"
								disabled={pickState === "adding" || pickState === "added"}
								onClick={() => pick(post)}
								className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border-2 border-stroke-strong px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-fg-primary transition-colors hover:border-accent-lime disabled:cursor-not-allowed disabled:opacity-40"
							>
								{pickState === "added" || pickState === "duplicate" ? (
									<Check className="size-3" />
								) : (
									<Plus className="size-3" />
								)}
								{pickState === "adding"
									? "Adding"
									: pickState === "added"
										? "Added"
										: pickState === "duplicate"
											? "Already in"
											: pickState === "failed"
												? "Retry"
												: "Add"}
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
