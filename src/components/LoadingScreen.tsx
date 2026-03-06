import { useEffect, useRef, useState } from "react";
import { GridBackground } from "@/components/GridBackground";

export function LoadingScreen() {
	const [rotationY, setRotationY] = useState(0);
	const [rotationX, setRotationX] = useState(0);
	const animationRef = useRef<number>(0);

	useEffect(() => {
		let lastTime = performance.now();

		const animate = (currentTime: number) => {
			const delta = (currentTime - lastTime) / 1000;
			lastTime = currentTime;

			setRotationY((prev) => prev + delta * 18);
			setRotationX((prev) => prev + delta * 6);

			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	const radius = 80;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-canvas">
			<GridBackground />
			<div className="relative flex flex-col items-center gap-8">
				{/* Spinning wireframe sphere */}
				<div
					className="relative"
					style={{
						width: `${radius * 2 + 20}px`,
						height: `${radius * 2 + 20}px`,
						perspective: "600px",
					}}
				>
					<div
						className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
						style={{
							transformStyle: "preserve-3d",
							transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
						}}
					>
						{/* Horizontal rings */}
						{[0, 45, 90, 135].map((angle) => (
							<div
								key={`ring-h-${angle}`}
								className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
								style={{
									width: `${radius * 2}px`,
									height: `${radius * 2}px`,
									border: "2px solid rgba(163, 230, 53, 0.25)",
									transform: `rotateX(${angle}deg)`,
									transformStyle: "preserve-3d",
								}}
							/>
						))}
						{/* Vertical rings */}
						{[0, 60, 120].map((angle) => (
							<div
								key={`ring-v-${angle}`}
								className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
								style={{
									width: `${radius * 2}px`,
									height: `${radius * 2}px`,
									border: "2px solid rgba(163, 230, 53, 0.25)",
									transform: `rotateY(${angle}deg)`,
									transformStyle: "preserve-3d",
								}}
							/>
						))}
					</div>
				</div>
				{/* Loading text */}
				<span className="font-mono text-xs uppercase tracking-[0.2em] text-fg-muted">
					Loading...
				</span>
			</div>
		</div>
	);
}
