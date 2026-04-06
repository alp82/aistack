import { List } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TocItem {
	id: string;
	text: string;
	level: number;
}

const MIN_HEADINGS = 3;
const MIN_CONTENT_LENGTH = 800;
const HEADER_OFFSET = 80;

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 60);
}

function highlightHeading(el: HTMLElement) {
	el.classList.remove("heading-highlight");
	// Force reflow to restart animation
	void el.offsetWidth;
	el.classList.add("heading-highlight");
}

export function TableOfContents({
	containerSelector,
	contentLength,
}: {
	containerSelector: string;
	contentLength: number;
}) {
	const [items, setItems] = useState<TocItem[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const isScrollingRef = useRef(false);

	// Extract headings, assign slug IDs, inject anchor links
	useEffect(() => {
		const extract = () => {
			const container = document.querySelector(containerSelector);
			if (!container) return;

			const headings = container.querySelectorAll("h1, h2, h3");
			const tocItems: TocItem[] = [];
			const usedSlugs = new Set<string>();

			headings.forEach((heading) => {
				const el = heading as HTMLElement;
				const text = el.textContent?.trim() ?? "";
				if (!text) return;

				let slug = slugify(text);
				if (usedSlugs.has(slug)) {
					let counter = 2;
					while (usedSlugs.has(`${slug}-${counter}`)) counter++;
					slug = `${slug}-${counter}`;
				}
				usedSlugs.add(slug);

				el.id = slug;

				// Inject anchor link if not already present
				if (!el.querySelector(".heading-anchor")) {
					const anchor = document.createElement("a");
					anchor.className = "heading-anchor";
					anchor.textContent = "#";
					anchor.addEventListener("click", (e) => {
						e.preventDefault();
						history.replaceState(null, "", `#${slug}`);
						const top =
							el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
						window.scrollTo({ top, behavior: "smooth" });
						highlightHeading(el);
					});
					el.appendChild(anchor);
				}

				tocItems.push({
					id: slug,
					text,
					level: Number.parseInt(el.tagName[1]),
				});
			});

			setItems(tocItems);
		};

		const timer = setTimeout(extract, 300);
		return () => clearTimeout(timer);
	}, [containerSelector]);

	// Handle initial URL hash
	useEffect(() => {
		if (items.length === 0) return;
		const hash = window.location.hash.slice(1);
		if (!hash) return;

		const el = document.getElementById(hash);
		if (el) {
			setTimeout(() => {
				const top =
					el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
				window.scrollTo({ top, behavior: "smooth" });
				highlightHeading(el);
				setActiveId(hash);
			}, 400);
		}
	}, [items]);

	// Track active heading via IntersectionObserver
	useEffect(() => {
		if (items.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (isScrollingRef.current) return;
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId(entry.target.id);
						break;
					}
				}
			},
			{ rootMargin: `-${HEADER_OFFSET}px 0px -60% 0px`, threshold: 0 },
		);

		for (const item of items) {
			const el = document.getElementById(item.id);
			if (el) observer.observe(el);
		}

		return () => observer.disconnect();
	}, [items]);

	const scrollToHeading = useCallback((id: string) => {
		const el = document.getElementById(id);
		if (!el) return;

		const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

		history.replaceState(null, "", `#${id}`);
		setActiveId(id);
		highlightHeading(el);

		isScrollingRef.current = true;
		window.scrollTo({ top, behavior: "smooth" });

		setTimeout(() => {
			isScrollingRef.current = false;
		}, 600);
	}, []);

	if (contentLength < MIN_CONTENT_LENGTH || items.length < MIN_HEADINGS) {
		return null;
	}

	const minLevel = Math.min(...items.map((i) => i.level));

	return (
		<nav className="mb-8 border border-stroke-subtle/30 px-5 py-4">
			<div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
				<List className="size-3.5" />
				Contents
			</div>
			<ul className="space-y-1">
				{items.map((item) => (
					<li key={item.id}>
						<button
							type="button"
							onClick={() => scrollToHeading(item.id)}
							className={`w-full cursor-pointer text-left font-mono text-xs transition-colors ${
								activeId === item.id
									? "text-accent-lime"
									: "text-fg-muted hover:text-fg-primary"
							}`}
							style={{
								paddingLeft: `${(item.level - minLevel) * 16}px`,
							}}
						>
							{item.text}
						</button>
					</li>
				))}
			</ul>
		</nav>
	);
}
