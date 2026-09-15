/**
 * PROTOTYPE - the pulse-band variant switcher (`?variant=A..H` on `/`).
 *
 * F, G and H (2026-09-15) explore three start-page ideas at once: a counter
 * for tokens since the page was opened, the reel replaced by a static list,
 * and the latest line naming the creator or the stack label instead of
 * `creator/slug`. Strip (G) won; I, J and K are its variations with the
 * SpeedingText counter.
 * Variant D won and became `PulseHero` (#147); without the param (or in
 * production) that winner renders and nothing else mounts. The variants stay
 * in main as the record of the exploration.
 */

import type { Band } from "../feed";
import { PulseHero } from "../PulseHero";
import { PulsePrototypeSwitcher } from "./PulsePrototypeSwitcher";
import { usePulsePrototype } from "./usePulsePrototype";
import { VariantAnnotated } from "./VariantAnnotated";
import { VariantGround } from "./VariantGround";
import { VariantLedger } from "./VariantLedger";
import { VariantOneNumber } from "./VariantOneNumber";
import { VariantRail } from "./VariantRail";
import { VariantReel } from "./VariantReel";
import { VariantStrip } from "./VariantStrip";
import { VariantStripCells } from "./VariantStripCells";
import { VariantStripFigures } from "./VariantStripFigures";
import { VariantStripLine } from "./VariantStripLine";
import { VariantTicker } from "./VariantTicker";

export function PulsePrototype({ band }: { readonly band: Band }) {
	const { variant, cycle } = usePulsePrototype();

	if (import.meta.env.PROD || variant === null) {
		return <PulseHero band={band} />;
	}

	return (
		<>
			{variant === "A" ? <VariantGround band={band} /> : null}
			{variant === "B" ? <VariantAnnotated band={band} /> : null}
			{variant === "C" ? <VariantTicker band={band} /> : null}
			{variant === "D" ? <VariantOneNumber band={band} /> : null}
			{variant === "E" ? <VariantReel band={band} /> : null}
			{variant === "F" ? <VariantLedger band={band} /> : null}
			{variant === "G" ? <VariantStrip band={band} /> : null}
			{variant === "H" ? <VariantRail band={band} /> : null}
			{variant === "I" ? <VariantStripCells band={band} /> : null}
			{variant === "J" ? <VariantStripLine band={band} /> : null}
			{variant === "K" ? <VariantStripFigures band={band} /> : null}
			<PulsePrototypeSwitcher variant={variant} onCycle={cycle} />
		</>
	);
}
