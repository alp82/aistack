import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { ProjectFormValues } from "@/components/projects/ProjectDialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { parseRepo } from "@/lib/github-repo";
import { safeExternalUrl } from "@/lib/utils";

const repositorySchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable(),
	homepage: z.string().nullable(),
	html_url: z.url(),
	topics: z.array(z.string()).optional(),
});

export function GithubProjectImport({
	onImport,
}: {
	onImport: (values: ProjectFormValues) => void;
}) {
	const [link, setLink] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);
	const request = useRef<AbortController | null>(null);

	useEffect(
		() => () => {
			request.current?.abort();
			request.current = null;
		},
		[],
	);

	const importRepository = async () => {
		const repo = parseRepo(link);
		if (!repo) {
			setError(
				"Enter a GitHub repository link, such as github.com/owner/repo.",
			);
			return;
		}
		request.current?.abort();
		const controller = new AbortController();
		request.current = controller;
		setLoading(true);
		setError(null);
		setDone(false);
		const timeout = setTimeout(() => controller.abort(), 10_000);
		try {
			const response = await fetch(
				`https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`,
				{
					headers: { Accept: "application/vnd.github+json" },
					signal: controller.signal,
					credentials: "omit",
				},
			);
			if (response.status === 404) {
				throw new Error(
					"Repository not found. Use a public GitHub repository or enter the details below.",
				);
			}
			if (response.status === 403 || response.status === 429) {
				throw new Error(
					"GitHub is limiting requests. Try again later or enter the details below.",
				);
			}
			if (!response.ok)
				throw new Error(
					"Could not load the repository. Try again or enter the details below.",
				);
			const data = repositorySchema.parse(await response.json());
			if (controller.signal.aborted || request.current !== controller) return;
			onImport({
				name: data.name,
				description: data.description ?? "",
				url:
					safeExternalUrl(data.homepage) ??
					safeExternalUrl(data.html_url) ??
					"",
				tags: [
					...new Set(
						(data.topics ?? [])
							.map((tag) => tag.trim().toLowerCase())
							.filter(Boolean),
					),
				],
			});
			setDone(true);
		} catch (err) {
			if (request.current !== controller) return;
			setError(
				controller.signal.aborted
					? "GitHub took too long to respond. Try again or enter the details below."
					: err instanceof Error &&
							!(err instanceof z.ZodError) &&
							!(err instanceof TypeError)
						? err.message
						: "Could not load the repository. Try again or enter the details below.",
			);
		} finally {
			clearTimeout(timeout);
			if (request.current === controller) {
				request.current = null;
				setLoading(false);
			}
		}
	};

	return (
		<div className="space-y-3 border-b border-stroke-subtle pb-4">
			<FormInput
				label="GitHub repository"
				value={link}
				onChange={(event) => {
					request.current?.abort();
					request.current = null;
					setLoading(false);
					setError(null);
					setDone(false);
					setLink(event.target.value);
				}}
				placeholder="https://github.com/owner/repo"
				description="Fill fields from a public repository. Filling again updates imported values and keeps your manual edits."
			/>
			<Button
				type="button"
				variant="outline"
				disabled={!link.trim() || loading}
				onClick={importRepository}
				className="font-mono text-xs font-bold uppercase tracking-wider"
			>
				{loading ? "Loading..." : "Fill from GitHub"}
			</Button>
			{error && (
				<p role="alert" className="font-mono text-xs text-destructive">
					{error}
				</p>
			)}
			{done && (
				<output className="block font-mono text-xs text-fg-muted">
					Repository loaded. Review the fields below.
				</output>
			)}
		</div>
	);
}
