import { ExplainerSection } from "@/features/landing/sections/ExplainerSection";
import { FeaturedStacksSection, type LandingStackPreview } from "@/features/landing/sections/FeaturedStacksSection";
import { HeroSection } from "@/features/landing/sections/HeroSection";
import { PublishCTASection } from "@/features/landing/sections/PublishCTASection";

type LandingPageShellProps = {
	stacks: LandingStackPreview[];
};

function LandingPageShell({ stacks }: LandingPageShellProps) {
	return (
		<div className="min-h-screen bg-bg-canvas">
			<HeroSection />
			<FeaturedStacksSection stacks={stacks} />
			<ExplainerSection />
			<PublishCTASection />
		</div>
	);
}

export { LandingPageShell };
export type { LandingPageShellProps };
