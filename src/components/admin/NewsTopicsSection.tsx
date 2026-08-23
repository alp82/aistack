import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * The topic list. Flat, owner-managed, and it starts empty on purpose: topics
 * are added one at a time as real items need them, rather than seeded from a
 * capture file (#204).
 */
export function NewsTopicsSection() {
	const topics = useQuery(api.news.listTopicsWithCounts);
	const createTopic = useMutation(api.news.createTopic);
	const renameTopic = useMutation(api.news.renameTopic);
	const deleteTopic = useMutation(api.news.deleteTopic);
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);

	async function add(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		setError(null);
		await createTopic({ name: name.trim() });
		setName("");
	}

	async function rename(topicId: Id<"newsTopics">, current: string) {
		const next = window.prompt("Topic name", current);
		if (!next?.trim() || next.trim() === current) return;
		await renameTopic({ topicId, name: next.trim() });
	}

	async function remove(topicId: Id<"newsTopics">) {
		setError(null);
		try {
			await deleteTopic({ topicId });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not delete that");
		}
	}

	return (
		<>
			<form
				onSubmit={add}
				className="mb-8 flex flex-col gap-3 border-2 border-stroke-strong bg-bg-panel p-6 sm:flex-row"
			>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="New topic"
					className="flex-1 border-2 border-stroke-subtle bg-bg-canvas px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
				/>
				<button
					type="submit"
					disabled={!name.trim()}
					className="inline-flex cursor-pointer items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-bg-canvas transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Plus className="size-3.5" />
					Add
				</button>
			</form>

			{error ? (
				<p className="mb-4 font-mono text-xs text-red-400">{error}</p>
			) : null}

			{topics === undefined ? (
				<p className="font-mono text-sm text-fg-muted">Loading...</p>
			) : !topics || topics.length === 0 ? (
				<div className="border-2 border-dashed border-stroke-subtle px-4 py-12 text-center">
					<p className="font-mono text-sm text-fg-muted">
						No topics yet. Add one when an item needs it.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{topics.map((topic) => (
						<div
							key={topic._id}
							className="flex flex-wrap items-center gap-3 border-2 border-stroke-strong bg-bg-panel p-4"
						>
							<span className="font-mono text-sm font-semibold text-fg-primary">
								{topic.name}
							</span>
							<span className="border border-stroke-subtle px-2 py-0.5 font-mono text-xs text-fg-muted">
								{topic.itemCount} {topic.itemCount === 1 ? "item" : "items"}
							</span>
							<div className="ml-auto flex gap-2">
								<button
									type="button"
									onClick={() => rename(topic._id, topic.name)}
									className="inline-flex cursor-pointer items-center gap-2 border border-stroke-subtle px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
								>
									<Pencil className="size-3.5" />
									Rename
								</button>
								<button
									type="button"
									onClick={() => remove(topic._id)}
									className="inline-flex cursor-pointer items-center gap-2 border border-stroke-subtle px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-red-400 hover:text-red-400"
								>
									<Trash2 className="size-3.5" />
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</>
	);
}
