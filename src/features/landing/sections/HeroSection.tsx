import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";

function HeroSection() {
	return (
		<section className="relative border-b-2 border-stroke-strong px-6 py-24 md:px-16 lg:px-24 md:py-32 lg:py-48 overflow-hidden">
			<div className="mx-auto w-full max-w-7xl">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
					className="relative z-10 max-w-[90vw]"
				>
					{/* Builder Reference Label */}
					<div className="font-mono text-accent-lime mb-8 flex items-center gap-4 text-sm">
						<span>// FOR:</span>
						<span>SOLO FOUNDERS</span>
						<span className="h-px w-4 bg-accent-lime/50" />
						<span>SMALL STARTUPS</span>
						<span className="h-px w-4 bg-accent-lime/50" />
						<span>BUILDERS</span>
					</div>

					{/* Massive Headline */}
					<h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black tracking-tighter leading-[0.9] mb-12 text-fg-primary">
						SEE EXACTLY WHAT
						<br />
						REAL{" "}<span className="text-highlight-lime ml-2 md:ml-4 -rotate-1">BUILDERS</span>
						<br />
						USE TO SHIP
					</h1>

					{/* Description + CTAs */}
					<div className="flex flex-col lg:flex-row items-start lg:items-end gap-12 justify-between">
						<p className="max-w-2xl text-xl md:text-2xl text-fg-secondary leading-relaxed border-l-4 border-accent-lime pl-8 py-2">
							AI Stack is where founders publish the exact tools to build
							their products. Learn what they pay every month and how their
							daily AI workflow looks like.
						</p>

						<div className="flex flex-col md:flex-row gap-4 lg:mr-24">
							<Link to="/stacks/new">
								<motion.span
									whileHover={{
										scale: 1.02,
										x: -2,
										y: -2,
										boxShadow: "4px 4px 0px 0px rgba(163, 230, 53, 1)",
									}}
									whileTap={{
										scale: 0.98,
										x: 0,
										y: 0,
										boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
									}}
									transition={{ duration: 0.15 }}
									className="inline-flex items-center gap-3 px-6 py-4 font-mono text-sm uppercase tracking-widest font-bold border-2 border-accent-lime bg-accent-lime text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors"
								>
									Share Your Stack
									<ArrowRight className="size-5" />
								</motion.span>
							</Link>
							<Link to="/stacks">
								<motion.span
									whileHover={{
										scale: 1.02,
										x: -2,
										y: -2,
										boxShadow: "4px 4px 0px 0px rgba(163, 230, 53, 1)",
									}}
									whileTap={{
										scale: 0.98,
										x: 0,
										y: 0,
										boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
									}}
									transition={{ duration: 0.15 }}
									className="inline-flex items-center gap-3 px-6 py-4 font-mono text-sm uppercase tracking-widest font-bold border-2 border-fg-primary bg-transparent text-fg-primary hover:bg-bg-panel transition-colors"
								>
									<Search className="size-4" />
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
