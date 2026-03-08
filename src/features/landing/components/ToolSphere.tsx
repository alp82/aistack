import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../../convex/_generated/api";

interface ToolPoint {
	theta: number;
	phi: number;
	iconUrl?: string;
	name: string;
}

function distributePointsOnSphere(
	count: number,
): { theta: number; phi: number }[] {
	const points: { theta: number; phi: number }[] = [];
	const goldenRatio = (1 + Math.sqrt(5)) / 2;

	for (let i = 0; i < count; i++) {
		const theta = (2 * Math.PI * i) / goldenRatio;
		const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
		points.push({ theta, phi });
	}

	return points;
}

function sphereToCartesian(theta: number, phi: number, radius: number) {
	return {
		x: radius * Math.sin(phi) * Math.cos(theta),
		y: radius * Math.sin(phi) * Math.sin(theta),
		z: radius * Math.cos(phi),
	};
}

interface ToolSphereProps {
	mouseClient?: { x: number; y: number } | null;
}

export function ToolSphere({ mouseClient }: ToolSphereProps) {
	const allTools = useQuery(api.tools.listAll) ?? [];
	const containerRef = useRef<HTMLDivElement>(null);
	const rotationYRef = useRef(0);
	const rotationXRef = useRef(0);
	const cursorPxRef = useRef({ x: 0, y: 0 });
	const mouseClientRef = useRef(mouseClient);
	const [, forceUpdate] = useState(0);
	const animationRef = useRef<number>(0);

	// Keep ref in sync without restarting animation
	mouseClientRef.current = mouseClient;

	const toolPoints = useMemo(() => {
		const positions = distributePointsOnSphere(allTools.length || 20);
		return allTools.map((tool, index) => ({
			...positions[index],
			iconUrl: tool.iconUrl,
			name: tool.name,
		})) as ToolPoint[];
	}, [allTools]);

	useEffect(() => {
		let lastTime = performance.now();

		const animate = (currentTime: number) => {
			const delta = (currentTime - lastTime) / 1000;
			lastTime = currentTime;

			// Rotate sphere around Y axis (horizontal spin) - this makes logos go front to back
			rotationYRef.current += delta * 12;

			// Slight X rotation for more dynamic feel
			rotationXRef.current += delta * 2;

			// Compute cursor position in pixels relative to sphere center
			let targetX = 0;
			let targetY = 0;
			const client = mouseClientRef.current;
			const el = containerRef.current;
			if (client && el) {
				const rect = el.getBoundingClientRect();
				targetX = client.x - (rect.left + rect.width / 2);
				targetY = client.y - (rect.top + rect.height / 2);
			}

			// Smooth interpolation
			cursorPxRef.current = {
				x: cursorPxRef.current.x + (targetX - cursorPxRef.current.x) * 0.1,
				y: cursorPxRef.current.y + (targetY - cursorPxRef.current.y) * 0.1,
			};
			// Force re-render
			forceUpdate((n) => n + 1);

			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	if (toolPoints.length === 0) {
		return null;
	}

	const radius = 220;

	const rotationY = rotationYRef.current;
	const rotationX = rotationXRef.current;

	return (
		<div
			ref={containerRef}
			className="absolute inset-0 select-none"
			style={{ perspective: "1200px" }}
		>
			{/* Main sphere container - slight tilt based on mouse */}
			<div
				className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
				style={{
					transformStyle: "preserve-3d",
					transform: `rotateX(0deg) rotateY(0deg)`,
				}}
			>
				{/* Wireframe sphere rings - brutalist style */}
				{[0, 45, 90, 135].map((angle) => (
					<div
						key={`ring-h-${angle}`}
						className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
						style={{
							width: `${radius * 2}px`,
							height: `${radius * 2}px`,
							border: "3px solid rgba(163, 230, 53, 0.2)",
							transform: `rotateX(${angle}deg)`,
							transformStyle: "preserve-3d",
						}}
					/>
				))}
				{[0, 60, 120].map((angle) => (
					<div
						key={`ring-v-${angle}`}
						className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
						style={{
							width: `${radius * 2}px`,
							height: `${radius * 2}px`,
							border: "3px solid rgba(163, 230, 53, 0.2)",
							transform: `rotateY(${angle}deg)`,
							transformStyle: "preserve-3d",
						}}
					/>
				))}

				{/* Tool logos - rotate with sphere so they move front to back */}
				{toolPoints.map((tool, index) => {
					// Apply sphere rotation to each logo position
					const rotYRad = (rotationY * Math.PI) / 180;
					const rotXRad = (rotationX * Math.PI) / 180;

					// Get base position
					const basePos = sphereToCartesian(tool.theta, tool.phi, radius);

					// Apply Y rotation (horizontal spin)
					const afterYRot = {
						x: basePos.x * Math.cos(rotYRad) + basePos.z * Math.sin(rotYRad),
						y: basePos.y,
						z: -basePos.x * Math.sin(rotYRad) + basePos.z * Math.cos(rotYRad),
					};

					// Apply X rotation (vertical tilt)
					const pos = {
						x: afterYRot.x,
						y:
							afterYRot.y * Math.cos(rotXRad) - afterYRot.z * Math.sin(rotXRad),
						z:
							afterYRot.y * Math.sin(rotXRad) + afterYRot.z * Math.cos(rotXRad),
					};

					// Opacity based on z position - fade out as they go behind
					const normalizedZ = (pos.z + radius) / (radius * 2);
					const zOpacity = Math.max(0, Math.min(1, normalizedZ * 1.8 - 0.4));

					// Staggered fade in/out - pseudo-random phase per logo
					const scramble = ((index * 7919 + 104729) % 997) / 997; // hash to [0,1]
					const phase = scramble * Math.PI * 2;
					const fadeWave = (Math.sin(rotationY * 0.03 + phase) + 1) / 2; // 0 to 1
					const fadeFactor = fadeWave * fadeWave * fadeWave; // cubic for sharper on/off

					const opacity = zOpacity * fadeFactor;

					// Skip completely invisible logos
					if (opacity < 0.05) return null;

					// Scale based on z position for depth
					const scale = 0.5 + normalizedZ * 0.7;
					const size = 40;

					// Logos "look at" the mouse like eyes following cursor
					// cursorPxRef tracks mouse in pixel space relative to ToolSphere center
					const cursor = cursorPxRef.current;
					const dirX = cursor.x - pos.x;
					const dirY = cursor.y - pos.y;
					const dist = Math.sqrt(dirX * dirX + dirY * dirY) || 1;

					// Normalize and apply max tilt angle (30deg), attenuate by distance
					const maxTilt = 30;
					const strength = Math.min(1, dist / 200);
					const logoRotateY = (dirX / dist) * maxTilt * strength;
					const logoRotateX = -(dirY / dist) * maxTilt * strength;

					return (
						<div
							key={`${tool.name}-${index}`}
							className="absolute left-1/2 top-1/2"
							style={{
								transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) translate(-50%, -50%)`,
								opacity,
								zIndex: Math.round(pos.z + radius),
								perspective: "150px",
							}}
						>
							<div
								className="border-2 border-accent-lime/40 bg-bg-canvas/90"
								style={{
									width: `${size * scale}px`,
									height: `${size * scale}px`,
									boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
									transform: `rotateX(${logoRotateX}deg) rotateY(${logoRotateY}deg)`,
									transformStyle: "preserve-3d",
								}}
							>
								{tool.iconUrl ? (
									<img
										src={tool.iconUrl}
										alt={tool.name}
										className="w-full h-full object-contain p-1"
										draggable={false}
									/>
								) : (
									<div className="w-full h-full bg-accent-lime/20" />
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
