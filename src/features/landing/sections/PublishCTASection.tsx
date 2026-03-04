import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Pencil } from "lucide-react";

type PublishCTASectionProps = {
	userStack?: { slug: string } | null;
};

function PublishCTASection({ userStack }: PublishCTASectionProps) {
	const hasPublished = !!userStack;
	return (
		<section className="section-cta py-32 px-6 md:px-16 lg:px-24 flex flex-col items-center text-center relative border-b border-lime-500">
			<div className="relative z-10 max-w-4xl">
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-5xl md:text-8xl font-black tracking-tighter mb-8 text-black leading-[0.9]"
				>
					{hasPublished ? (<>UPDATE YOUR<br />STACK</>) : (<>PUBLISH YOUR<br />STACK TODAY</>)}
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.1 }}
					className="text-xl md:text-2xl font-mono text-black/80 mb-12 max-w-2xl mx-auto"
				>
					{hasPublished
						? "Keep your stack up to date. Add new tools, tweak your workflow."
						: "Share the tools, costs, and workflows you run. Help other builders skip the guesswork."}
				</motion.p>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="flex flex-col md:flex-row gap-6 justify-center"
				>
					{hasPublished ? (
						<Link to="/stacks/$slug/edit" params={{ slug: userStack.slug }}>
							<motion.span
								whileHover={{ y: 2 }}
								whileTap={{ y: 0 }}
								transition={{ duration: 0.15 }}
								className="inline-flex items-center gap-3 px-8 py-5 bg-black text-white font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors text-lg shadow-2xl"
							>
								Update Your Stack
								<Pencil className="size-5" />
							</motion.span>
						</Link>
					) : (
						<Link to="/stacks/new">
							<motion.span
								whileHover={{ y: 2 }}
								whileTap={{ y: 0 }}
								transition={{ duration: 0.15 }}
								className="inline-flex items-center gap-3 px-8 py-5 bg-black text-white font-mono font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors text-lg shadow-2xl"
							>
								Start Sharing
								<ArrowRight className="size-5" />
							</motion.span>
						</Link>
					)}
					<Link to="/stacks">
						<motion.span
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							transition={{ duration: 0.15 }}
							className="inline-flex items-center gap-3 px-8 py-5 bg-transparent border-4 border-black text-black font-mono font-bold uppercase tracking-widest hover:bg-black hover:text-lime-400 transition-colors text-lg"
						>
							Browse Stacks
						</motion.span>
					</Link>
				</motion.div>
			</div>
		</section>
	);
}

export { PublishCTASection };
