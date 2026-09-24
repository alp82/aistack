import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertCircle, RotateCw } from "lucide-react";
import { useEffect } from "react";
import { claimChunkReload, isChunkLoadError } from "@/lib/chunkReload";

function sessionStorageOrUndefined(): Storage | undefined {
	try {
		return window.sessionStorage;
	} catch {
		return undefined;
	}
}

/**
 * The error screen for every route. A chunk that failed to load after a
 * deploy reloads the page once; anything else shows a reload button.
 */
export function RouteError({ error }: ErrorComponentProps) {
	const chunkError = isChunkLoadError(error);

	useEffect(() => {
		if (!chunkError) return;
		if (claimChunkReload(sessionStorageOrUndefined(), Date.now())) {
			window.location.reload();
		}
	}, [chunkError]);

	return (
		<div className="flex items-center justify-center px-4 py-32">
			<div className="max-w-2xl border-[3px] border-stroke-strong bg-bg-panel p-8 text-center shadow-[6px_6px_0_var(--stroke-strong)]">
				<AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
				<h1 className="mb-2 text-2xl font-bold text-fg-primary">
					This page didn't load
				</h1>
				<p className="mb-8 text-sm text-fg-secondary">
					{chunkError
						? "AI Stack was updated while this page was open. Reload to get the new version."
						: "Something failed while loading this page. Reload to try again."}
				</p>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="inline-flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-5 py-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
				>
					<RotateCw className="size-4" />
					Reload
				</button>
			</div>
		</div>
	);
}
