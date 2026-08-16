/**
 * PROTOTYPE — throwaway. Three variants of the landing pulse band, switchable
 * via `?variant=A|B|C` on `/`. Without the param (or in production) the real
 * `PulseBand` renders and nothing else mounts.
 */

import type { Band } from "../feed";
import { PulseBand } from "../PulseBand";
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
		return <PulseBand band={band} variant="landing" />;
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
