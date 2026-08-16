/**
 * PROTOTYPE — the pulse-band variant switcher (`?variant=A|B|C|D|E` on `/`).
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
import { VariantOneNumber } from "./VariantOneNumber";
import { VariantReel } from "./VariantReel";
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
			<PulsePrototypeSwitcher variant={variant} onCycle={cycle} />
		</>
	);
}
