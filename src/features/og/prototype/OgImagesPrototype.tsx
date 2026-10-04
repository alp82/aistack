/**
 * PROTOTYPE - throwaway. The gallery and its floating switcher.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { DYNAMIC_CARDS, STATIC_CARDS } from "./cards";
import { VARIANT_KEYS, VARIANT_NAMES, type VariantKey } from "./variants";

const PATHS: Record<string, string> = {
	home: "/",
	stacks: "/stacks",
	tools: "/tools",
	leaderboard: "/leaderboard",
	activity: "/activity",
	news: "/news",
	about: "/about",
	discord: "/discord",
	sync: "/sync",
	subscribe: "/subscribe",
	stack: "/stacks/$slug",
	creator: "/@handle",
	issue: "/news/$slug",
	topic: "/news/topics/$slug",
};

/**
 * In dev, Vite routes a request with `Sec-Fetch-Dest: image` around the app
 * server, so a plain <img src> gets "Cannot GET". A fetch() has an empty
 * destination and reaches the route, so the gallery loads bytes into a blob URL.
 */
function OgImage({ src, alt }: { src: string; alt: string }) {
	const [url, setUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		let objectUrl: string | null = null;
		let cancelled = false;
		setUrl(null);
		setError(null);
		fetch(src)
			.then(async (r) => {
				if (!r.ok)
					throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
				return r.blob();
			})
			.then((blob) => {
				if (cancelled) return;
				objectUrl = URL.createObjectURL(blob);
				setUrl(objectUrl);
			})
			.catch((e) => !cancelled && setError(String(e)));
		return () => {
			cancelled = true;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [src]);
	if (error)
		return (
			<div className="flex aspect-[1200/630] w-full items-center border border-destructive p-4 font-mono text-xs text-destructive">
				{error}
			</div>
		);
	if (!url)
		return (
			<div className="flex aspect-[1200/630] w-full items-center justify-center border border-border-primary bg-bg-secondary font-mono text-xs text-fg-muted">
				rendering…
			</div>
		);
	return (
		<img
			src={url}
			alt={alt}
			width={1200}
			height={630}
			className="w-full border border-border-primary bg-bg-secondary"
		/>
	);
}

export function OgImagesPrototype({
	variant,
	onVariant,
}: {
	variant: VariantKey;
	onVariant: (v: VariantKey) => void;
}) {
	const [nonce, setNonce] = useState(0);
	const cycle = (step: number) => {
		const i = VARIANT_KEYS.indexOf(variant);
		onVariant(
			VARIANT_KEYS[(i + step + VARIANT_KEYS.length) % VARIANT_KEYS.length],
		);
	};
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (
				t &&
				(t.tagName === "INPUT" ||
					t.tagName === "TEXTAREA" ||
					t.isContentEditable)
			)
				return;
			if (e.key === "ArrowLeft") cycle(-1);
			if (e.key === "ArrowRight") cycle(1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	const src = (card: string) =>
		`/api/og/prototype/${card}?variant=${variant}&n=${nonce}`;

	const section = (title: string, cards: readonly string[]) => (
		<section className="mb-16">
			<h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">
				{title}
			</h2>
			<div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
				{cards.map((card) => (
					<figure key={card} className="flex flex-col gap-2">
						<a href={src(card)} target="_blank" rel="noreferrer">
							<OgImage
								src={src(card)}
								alt={`${card} OG image, variant ${variant}`}
							/>
						</a>
						<figcaption className="flex justify-between font-mono text-xs text-fg-muted">
							<span>{card}</span>
							<span>{PATHS[card]}</span>
						</figcaption>
					</figure>
				))}
			</div>
		</section>
	);

	return (
		<main className="mx-auto max-w-7xl px-6 py-12 pb-32">
			<div className="mb-10 flex items-end justify-between">
				<div>
					<h1 className="text-3xl font-black tracking-tighter text-fg-primary">
						OG images prototype
					</h1>
					<p className="mt-2 max-w-2xl text-sm text-fg-secondary">
						Every card rendered by takumi at 1200x630, from the local database.
						D is what production serves today: the stack card, and the one
						static banner for every other page. Click an image to open it at
						full size. Dynamic cards take
						<code className="mx-1">?id=</code>on the image URL to pick a row.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setNonce((n) => n + 1)}
					className="border border-border-primary px-3 py-2 font-mono text-xs uppercase tracking-widest text-fg-secondary hover:text-fg-primary"
				>
					re-render
				</button>
			</div>
			{section("One per subpage", STATIC_CARDS)}
			{section("Dynamic content", DYNAMIC_CARDS)}

			{import.meta.env.PROD ? null : (
				<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
					<div className="flex items-stretch border-2 border-white bg-black font-mono text-xs text-white shadow-[4px_4px_0_rgba(255,255,255,0.35)]">
						<button
							type="button"
							onClick={() => cycle(-1)}
							aria-label="previous variant"
							className="px-3 hover:bg-white hover:text-black"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<span className="flex min-w-[14rem] items-center gap-2 border-x-2 border-white/40 px-4 py-3">
							<strong className="text-[#c6ff3d]">{variant}</strong>
							<span className="truncate">{VARIANT_NAMES[variant]}</span>
						</span>
						<button
							type="button"
							onClick={() => cycle(1)}
							aria-label="next variant"
							className="px-3 hover:bg-white hover:text-black"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
					<p className="mt-2 text-center font-mono text-[10px] text-white/50">
						← → to switch · og-images prototype
					</p>
				</div>
			)}
		</main>
	);
}
