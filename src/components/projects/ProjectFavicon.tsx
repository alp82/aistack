import { useState } from "react";

export function ProjectFavicon({
	href,
	fallback,
}: {
	href: string;
	fallback?: React.ReactNode;
}) {
	const [failed, setFailed] = useState(false);
	if (failed) return fallback ?? null;
	return (
		<img
			src={`https://www.google.com/s2/favicons?domain=${new URL(href).hostname}&sz=64`}
			alt=""
			aria-hidden="true"
			data-testid="project-favicon"
			width={20}
			height={20}
			loading="lazy"
			referrerPolicy="no-referrer"
			className="size-5 shrink-0"
			onError={() => setFailed(true)}
		/>
	);
}
