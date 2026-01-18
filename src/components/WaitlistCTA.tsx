import { WaitlistForm } from "./WaitlistForm";

interface WaitlistCTAProps {
	variant: "hero" | "footer";
	waitlistCount: number;
	displayCount: number;
	className?: string;
}

export function WaitlistCTA({
	variant,
	waitlistCount,
	displayCount,
	className = "",
}: WaitlistCTAProps) {
	return (
		<div className="relative max-w-4xl mx-auto text-center" data-waitlist-cta>
			<div className="md:bg-black/25 md:backdrop-blur-sm md:border md:border-white/10 rounded-2xl md:p-12 p-6">
				<h2 className="hidden md:block mx-auto mb-2 max-w-sm text-3xl md:text-4xl font-bold text-white">
					Be the first to know when we launch
				</h2>
				<p className="mx-auto max-w-sm text-xl text-gray-300 mb-2 md:mb-8">
					Get early access
					<span className="md:hidden">:</span>
					<span className="hidden md:inline">
						{" "}
						and exclusive insights from the community.
					</span>
				</p>

				<WaitlistForm
					variant={variant}
					displayCount={displayCount}
					className={className}
				/>

				{waitlistCount > 0 && (
					<div className="flex items-center justify-center gap-2 mt-6 md:mt-10">
						<div className="flex -space-x-2">
							{[...Array(Math.min(waitlistCount, 5))].map((_, i) => (
								<img
									key={i}
									src={`https://api.dicebear.com/7.x/avataaars/svg?seed=aistack-${i}`}
									alt="Founder Picture"
									className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-600"
								/>
							))}
						</div>
						<span className="text-gray-300 text-sm font-medium">
							<span className="text-cyan-400 font-bold">{displayCount}+</span>{" "}
							people waiting
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
