import { GridBackground } from "@/components/GridBackground";
// PROTOTYPE — throwaway, wayfinder #84. Remove this block and the `?variant=`
// branch below when the winning feed design is folded into the real page.
import { PrototypeSwitcher } from "@/features/landing/feed-prototype/PrototypeSwitcher";
import { useFeedPrototype } from "@/features/landing/feed-prototype/useFeedPrototype";
import { VariantA } from "@/features/landing/feed-prototype/VariantA";
import { VariantB } from "@/features/landing/feed-prototype/VariantB";
import { VariantC } from "@/features/landing/feed-prototype/VariantC";
import { VariantD1 } from "@/features/landing/feed-prototype/VariantD1";
import { VariantD2b } from "@/features/landing/feed-prototype/VariantD2b";
import { VariantD2c } from "@/features/landing/feed-prototype/VariantD2c";
import { VariantD3 } from "@/features/landing/feed-prototype/VariantD3";
import { VariantE1 } from "@/features/landing/feed-prototype/VariantE1";
import { VariantE2 } from "@/features/landing/feed-prototype/VariantE2";
import { VariantE3 } from "@/features/landing/feed-prototype/VariantE3";
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
	const proto = useFeedPrototype();

	const switcher =
		proto.variant === null ? null : (
			<PrototypeSwitcher
				variant={proto.variant}
				density={proto.density}
				rowCount={proto.rows.length}
				onCycle={proto.cycle}
				onDensity={proto.setDensity}
				onInject={proto.inject}
			/>
		);

	// C stands in for a dedicated route, so it replaces the page.
	if (proto.variant === "C") {
		return (
			<>
				{proto.ready ? <VariantC rows={proto.rows} /> : null}
				{switcher}
			</>
		);
	}

	return (
		<div className="min-h-screen bg-bg-canvas">
			<GridBackground />
			<HeroSection />
			{proto.ready && proto.variant === "A" ? (
				<VariantA rows={proto.rows} />
			) : null}
			{proto.ready && proto.variant === "B" ? (
				<VariantB rows={proto.rows} />
			) : null}
			{proto.ready && proto.variant === "D1" ? (
				<VariantD1 rows={proto.rows} />
			) : null}
			{proto.ready && proto.variant === "E1" ? (
				<VariantE1 rows={proto.rows} />
			) : null}
			{proto.ready && proto.variant === "E2" ? (
				<VariantE2 rows={proto.rows} />
			) : null}
			{proto.ready && proto.variant === "E3" ? (
				<VariantE3 rows={proto.rows} />
			) : null}
			{proto.ready && proto.variant === "D2b" ? (
				<VariantD2b rows={proto.rows} />
			) : null}
			{proto.ready && proto.variant === "D2c" ? (
				<VariantD2c rows={proto.rows} />
			) : null}
			{proto.ready && proto.variant === "D3" ? (
				<VariantD3 rows={proto.rows} />
			) : null}
			<FeaturedStacksSection stacks={stacks} />
			<ExplainerSection />
			<PublishCTASection me={me} />
			{switcher}
		</div>
	);
}

export { LandingPageShell };
export type { LandingPageShellProps };
