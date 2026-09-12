import { GridBackground } from "@/components/GridBackground";
import type { Band } from "@/features/activity/feed";
import { PulsePrototype } from "@/features/activity/prototype/PulsePrototype";
import { ExplainerSection } from "@/features/landing/sections/ExplainerSection";
import {
	FeaturedStacksSection,
	type LandingStackPreview,
} from "@/features/landing/sections/FeaturedStacksSection";
import { HeroSection } from "@/features/landing/sections/HeroSection";
import { PublishCTASection } from "@/features/landing/sections/PublishCTASection";
import {
	DiscordGuidePrototype,
	type DiscordGuideVariant,
} from "./prototype/DiscordGuidePrototype";

type LandingPageShellProps = {
	stacks: LandingStackPreview[];
	me?: { handle: string; hasStack: boolean } | null;
	band?: Band | null;
	discordVariant?: DiscordGuideVariant;
	onDiscordVariant?: (variant: DiscordGuideVariant) => void;
};

function LandingPageShell({
	stacks,
	me,
	band,
	discordVariant,
	onDiscordVariant,
}: LandingPageShellProps) {
	return (
		<div className="min-h-screen bg-bg-canvas">
			<GridBackground />
			<HeroSection />
			{/* The pulse sits between the hero and the featured stacks (#84). A site
			    with nothing to report shows no band at all - four em dashes under a
			    live dot is a claim about nothing. */}
			{/* The pulse sits between the hero and the featured stacks (#84). A site
			    with nothing to report shows no band at all - an em dash under a
			    live dot is a claim about nothing. PulsePrototype renders PulseHero
			    (#147's winner) and keeps the dev-only ?variant= switcher alive. */}
			{band && band.rows.length > 0 ? <PulsePrototype band={band} /> : null}
			<FeaturedStacksSection stacks={stacks} />
			{import.meta.env.DEV && discordVariant && onDiscordVariant ? (
				<DiscordGuidePrototype
					variant={discordVariant}
					onVariant={onDiscordVariant}
				/>
			) : null}
			<ExplainerSection />
			<PublishCTASection me={me} />
		</div>
	);
}

export { LandingPageShell };
export type { LandingPageShellProps };
