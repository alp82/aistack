import { PostHogProvider as PHProvider } from "posthog-js/react";
import { type FC, type ReactNode, useEffect, useState } from "react";

interface PosthogProviderProps {
	children: ReactNode;
}

const PosthogProvider: FC<PosthogProviderProps> = ({ children }) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
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
