import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { type FC, type ReactNode, useEffect, useState } from "react";
import { IdentifyUser } from "./IdentifyUser";

interface PosthogProviderProps {
	children: ReactNode;
}

// Defer PostHog INITIALIZATION until the browser is idle so the analytics SDK
// + flag fetch don't compete with first-paint resources. Falls back to a 2s
// timeout in browsers without `requestIdleCallback` (Safari < 18).
//
// Only the init is deferred — the React tree is IDENTICAL before and after.
// This used to render `<>{children}</>` until idle and then swap in the
// provider element, which reparented every route under a new element type and
// made React unmount and remount the whole page ~450ms after load (visible as
// the landing counter racing twice, and it silently wiped every route's local
// state on every reload). The provider now always wraps `children` around the
// module singleton, which is safe to hand out un-initialized: pre-init
// captures are dropped, a contract `src/lib/analytics.ts` already documents.
const PosthogProvider: FC<PosthogProviderProps> = ({ children }) => {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const start = () => {
			posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
				api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
				ui_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST_UI,
				defaults: "2025-05-24",
				capture_exceptions: true, // Enables capturing exceptions via Error Tracking
				debug: import.meta.env.MODE === "development",
			});
			setReady(true);
		};
		const w = window as Window & {
			requestIdleCallback?: (
				cb: () => void,
				opts?: { timeout: number },
			) => number;
		};
		if (typeof w.requestIdleCallback === "function") {
			const handle = w.requestIdleCallback(start, { timeout: 2000 });
			return () => {
				const cancel = (
					window as Window & { cancelIdleCallback?: (h: number) => void }
				).cancelIdleCallback;
				if (typeof cancel === "function") cancel(handle);
			};
		}
		const timer = setTimeout(start, 2000);
		return () => clearTimeout(timer);
	}, []);

	return (
		<PHProvider client={posthog}>
			{/* Held until init so identify() cannot fire into a dead SDK. The
			    conditional keeps its slot (null), so `children` never move. */}
			{ready ? <IdentifyUser /> : null}
			{children}
		</PHProvider>
	);
};

export default PosthogProvider;
