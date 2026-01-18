import { gsap } from "gsap";
import type React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ProductCategory } from "@/config/categoryConfig";
import { Product } from "./Product";

const useMedia = (
	queries: string[],
	values: number[],
	defaultValue: number,
): number => {
	const get = () =>
		values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue;

	const [value, setValue] = useState<number>(get);

	useEffect(() => {
		const handler = () => setValue(get);
		queries.forEach((q) => matchMedia(q).addEventListener("change", handler));
		return () =>
			queries.forEach((q) =>
				matchMedia(q).removeEventListener("change", handler),
			);
	}, [queries]);

	return value;
};

const useMeasure = <T extends HTMLElement>() => {
	const ref = useRef<T | null>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	useLayoutEffect(() => {
		if (!ref.current) return;
		const ro = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setSize({ width, height });
		});
		ro.observe(ref.current);
		return () => ro.disconnect();
	}, []);

	return [ref, size] as const;
};

interface ProductItem {
	id: string;
	logo: string;
	name: string;
	category: ProductCategory;
	avgCost: number;
	pros: string[];
	cons: string[];
	height: number;
}

interface GridItem extends ProductItem {
	x: number;
	y: number;
	w: number;
	h: number;
}

interface MasonryProps {
	items: ProductItem[];
	ease?: string;
	duration?: number;
	stagger?: number;
	animateFrom?: "bottom" | "top" | "left" | "right" | "center" | "random";
	scaleOnHover?: boolean;
	hoverScale?: number;
	maxItemsPerColumn?: number;
}

const Masonry: React.FC<MasonryProps> = ({
	items,
	ease = "power3.out",
	duration = 0.6,
	stagger = 0.05,
	animateFrom = "bottom",
	scaleOnHover = true,
	hoverScale = 0.95,
	maxItemsPerColumn = 3,
}) => {
	const columns = useMedia(
		[
			"(min-width:1500px)",
			"(min-width:1000px)",
			"(min-width:800px)",
			"(min-width:550px)",
		],
		[5, 4, 3, 2],
		1,
	);

	const [containerRef, { width }] = useMeasure<HTMLDivElement>();
	const [imagesReady, setImagesReady] = useState(false);

	const getInitialPosition = (item: GridItem) => {
		const containerRect = containerRef.current?.getBoundingClientRect();
		if (!containerRect) return { x: item.x, y: item.y };

		let direction = animateFrom;
		if (animateFrom === "random") {
			const dirs = ["top", "bottom", "left", "right"];
			direction = dirs[
				Math.floor(Math.random() * dirs.length)
			] as typeof animateFrom;
		}

		switch (direction) {
			case "top":
				return { x: item.x, y: -200 };
			case "bottom":
				return { x: item.x, y: window.innerHeight + 200 };
			case "left":
				return { x: -200, y: item.y };
			case "right":
				return { x: window.innerWidth + 200, y: item.y };
			case "center":
				return {
					x: containerRect.width / 2 - item.w / 2,
					y: containerRect.height / 2 - item.h / 2,
				};
			default:
				return { x: item.x, y: item.y + 100 };
		}
	};

	useEffect(() => {
		const imageUrls = items.map((item) => item.logo);
		Promise.all(
			imageUrls.map(
				(src) =>
					new Promise<void>((resolve) => {
						const img = new Image();
						img.src = src;
						img.onload = img.onerror = () => resolve();
					}),
			),
		).then(() => setImagesReady(true));
	}, [items]);

	// Calculate how many items to display based on columns and maxItemsPerColumn
	const itemsToDisplay = useMemo(() => {
		const maxItems = columns * maxItemsPerColumn;
		return items.slice(0, maxItems);
	}, [items, columns, maxItemsPerColumn]);

	const grid = useMemo<GridItem[]>(() => {
		if (!width) return [];
		const colHeights = new Array(columns).fill(0);
		const gap = 16;
		const totalGaps = (columns - 1) * gap;
		const columnWidth = (width - totalGaps) / columns;

		return itemsToDisplay.map((child) => {
			const col = colHeights.indexOf(Math.min(...colHeights));
			const x = col * (columnWidth + gap);
			const y = colHeights[col];

			colHeights[col] += child.height + gap;
			return { ...child, x, y, w: columnWidth, h: child.height };
		});
	}, [columns, itemsToDisplay, width]);

	// Compute the minimum height of the container
	const containerHeight = useMemo(() => {
		if (!width || grid.length === 0) return 0;
		const gap = 16;
		const colHeights = new Array(columns).fill(0);

		// Only calculate height for displayed items
		itemsToDisplay.forEach((item) => {
			const col = colHeights.indexOf(Math.min(...colHeights));
			colHeights[col] += item.height + gap;
		});

		// Return the height of the tallest column
		return Math.max(...colHeights);
	}, [grid, columns, width, itemsToDisplay]);

	const hasMounted = useRef(false);

	useLayoutEffect(() => {
		if (!imagesReady) return;

		grid.forEach((item, index) => {
			const selector = `[data-key="${item.id}"]`;
			const animProps = { x: item.x, y: item.y, width: item.w, height: item.h };

			if (!hasMounted.current) {
				const start = getInitialPosition(item);
				gsap.fromTo(
					selector,
					{
						opacity: 0,
						x: start.x,
						y: start.y,
						width: item.w,
						height: item.h,
						filter: "blur(10px)",
					},
					{
						opacity: 1,
						...animProps,
						filter: "blur(0px)",
						duration: 0.8,
						ease: "power3.out",
						delay: index * stagger,
					},
				);
			} else {
				gsap.to(selector, {
					...animProps,
					duration,
					ease,
					overwrite: "auto",
				});
			}
		});

		hasMounted.current = true;
	}, [grid, imagesReady, stagger, animateFrom, duration, ease]);

	const handleMouseEnter = (id: string) => {
		if (scaleOnHover) {
			gsap.to(`[data-key="${id}"]`, {
				scale: hoverScale,
				duration: 0.3,
				ease: "power2.out",
			});
		}
	};

	const handleMouseLeave = (id: string) => {
		if (scaleOnHover) {
			gsap.to(`[data-key="${id}"]`, {
				scale: 1,
				duration: 0.3,
				ease: "power2.out",
			});
		}
	};

	return (
		<div
			ref={containerRef}
			className="relative w-full"
			style={{ height: `${containerHeight}px` }}
		>
			{grid.map((item) => (
				<div
					key={item.id}
					data-key={item.id}
					className="absolute"
					style={{ willChange: "transform, width, height, opacity" }}
					onMouseEnter={() => handleMouseEnter(item.id)}
					onMouseLeave={() => handleMouseLeave(item.id)}
				>
					<div className="w-full h-full">
						<Product
							logo={item.logo}
							name={item.name}
							category={item.category}
							avgCost={item.avgCost}
							pros={item.pros}
							cons={item.cons}
							height={item.height}
						/>
					</div>
				</div>
			))}
		</div>
	);
};

export default Masonry;
