import { GridBackground } from "@/components/GridBackground";
import { ExplainerSection } from "@/features/landing/sections/ExplainerSection";
import {
	FeaturedStacksSection,
	type LandingStackPreview,
} from "@/features/landing/sections/FeaturedStacksSection";
import { HeroSection } from "@/features/landing/sections/HeroSection";
import { PublishCTASection } from "@/features/landing/sections/PublishCTASection";

type LandingPageShellProps = {
	stacks: LandingStackPreview[];
	me?: { handle: string; hasStack: boolean } | null;
};

function LandingPageShell({ stacks, me }: LandingPageShellProps) {
	return (
		<div className="min-h-screen bg-bg-canvas">
			<GridBackground />
			<HeroSection />
			<FeaturedStacksSection stacks={stacks} />
			<ExplainerSection />
			<PublishCTASection me={me} />
		</div>
	);
}

export { LandingPageShell };
export type { LandingPageShellProps };
