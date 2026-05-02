import { PostHogProvider as PHProvider } from "posthog-js/react";
import { type FC, type ReactNode, useEffect, useState } from "react";

interface PosthogProviderProps {
	children: ReactNode;
}

// Defer PostHog mount until the browser is idle so the analytics SDK + flag
// fetch don't compete with first-paint resources. Falls back to a 2s timeout
// in browsers without `requestIdleCallback` (Safari < 18).
const PosthogProvider: FC<PosthogProviderProps> = ({ children }) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const w = window as Window & {
			requestIdleCallback?: (
				cb: () => void,
				opts?: { timeout: number },
			) => number;
		};
		if (typeof w.requestIdleCallback === "function") {
			const handle = w.requestIdleCallback(() => setMounted(true), {
				timeout: 2000,
			});
			return () => {
				const cancel = (
					window as Window & { cancelIdleCallback?: (h: number) => void }
				).cancelIdleCallback;
				if (typeof cancel === "function") cancel(handle);
			};
		}
		const timer = setTimeout(() => setMounted(true), 2000);
		return () => clearTimeout(timer);
	}, []);

	if (!mounted) {
		return <>{children}</>;
	}

	return (
		<PHProvider
			apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
			options={{
				api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
				ui_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST_UI,
				defaults: "2025-05-24",
				capture_exceptions: true, // Enables capturing exceptions via Error Tracking
				debug: import.meta.env.MODE === "development",
			}}
		>
			{children}
		</PHProvider>
	);
};

export default PosthogProvider;
