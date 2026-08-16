import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

const ToolSphere = lazy(() =>
	import("@/features/landing/components/ToolSphere").then((m) => ({
		default: m.ToolSphere,
	})),
);

function HeroSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const [mouseClient, setMouseClient] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [mounted, setMounted] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		setMouseClient({ x: e.clientX, y: e.clientY });
	}, []);

	const handleMouseLeave = useCallback(() => {
		setMouseClient(null);
	}, []);

	return (
		<section
			ref={sectionRef}
			className="relative border-b-2 border-stroke-strong px-6 py-24 md:py-32 lg:py-48 overflow-hidden"
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
		>
			<div className="mx-auto w-full max-w-content relative">
				{/* 3D Tool Sphere - positioned at right edge of max-w container on wide screens */}
				<div className="absolute top-1/2 -translate-y-1/2 -mt-12 w-[500px] h-[500px] lg:w-[600px] lg:h-[600px] hidden md:block pointer-events-none right-0 translate-x-1/2 2xl:translate-x-0 2xl:right-[-100px]">
					{mounted && isDesktop ? (
						<Suspense fallback={null}>
							<ToolSphere mouseClient={mouseClient} />
						</Suspense>
					) : null}
				</div>
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
					className="relative z-10 max-w-[90vw]"
				>
					{/* Builder Reference Label */}
					<div className="font-mono text-accent-lime mb-16 flex items-center gap-4 text-sm">
						<span>// FOR:</span>
						<span>SOLO FOUNDERS</span>
						<span className="h-px w-4 bg-accent-lime/50" />
						<span>SMALL STARTUPS</span>
						<span className="h-px w-4 bg-accent-lime/50" />
						<span>BUILDERS</span>
					</div>

					{/* Massive Headline */}
					<h1 className="text-5xl sm:text-[3rem] md:text-[5rem] lg:text-[7rem] font-black tracking-tighter leading-[0.9] mb-24 text-fg-primary">
						SEE EXACTLY WHAT
						<br />
						REAL{" "}
						<span className="text-highlight-lime ml-2 md:ml-4 -rotate-1">
							BUILDERS
						</span>
						<br />
						USE TO SHIP
					</h1>

					{/* Description + CTAs */}
					<div className="flex flex-col xl:flex-row items-start xl:items-end gap-12 xl:gap-4 justify-between">
						<p className="max-w-2xl text-xl xl:text-2xl text-fg-secondary leading-relaxed border-l-4 border-accent-lime pl-8 py-2">
							AI Stack shows the setups builders actually work in, synced straight
							from their machines. You see what they run, the costs and how they
							put it together.
						</p>

						<div className="flex flex-row flex-wrap gap-4">
							<Link to="/stacks/new">
								<motion.span
									whileHover={{
										scale: 1.02,
										x: -3,
										y: -3,
										boxShadow: "6px 6px 0px 0px rgba(163, 230, 53, 1)",
									}}
									whileTap={{
										scale: 0.98,
										x: 0,
										y: 0,
										boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
									}}
									transition={{ duration: 0.15 }}
									className="inline-flex items-center gap-4 px-8 py-5 font-mono text-base md:text-lg uppercase tracking-widest font-bold border-2 border-accent-lime bg-accent-lime text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors"
								>
									Share Your Stack
									<ArrowRight className="size-6" />
								</motion.span>
							</Link>
							<Link to="/stacks">
								<motion.span
									whileHover={{
										scale: 1.02,
										x: -3,
										y: -3,
										boxShadow: "6px 6px 0px 0px rgba(163, 230, 53, 1)",
									}}
									whileTap={{
										scale: 0.98,
										x: 0,
										y: 0,
										boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
									}}
									transition={{ duration: 0.15 }}
									className="inline-flex items-center gap-4 px-8 py-5 font-mono text-base md:text-lg uppercase tracking-widest font-bold border-2 border-fg-primary bg-transparent text-fg-primary hover:bg-bg-panel transition-colors"
								>
									<Search className="size-5" />
									<span>Browse</span>
								</motion.span>
							</Link>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}

export { HeroSection };
