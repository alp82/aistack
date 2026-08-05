import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SWITCH_TITLE } from "./autoSync";
import { MONO_LABEL } from "./copy";

/**
 * What `/sync` says about auto-sync (#104).
 *
 * A MENTION, NOT A SECOND CONTROL. The permission belongs to one stack (#102),
 * and this page has no stack in hand. It names the switch, says where it is and
 * what it does, and leaves the acting to the owner box.
 */
export function AutoSyncNote() {
	return (
		<div className="mt-14 border border-stroke-strong bg-bg-panel px-6 py-6">
			<p className={cn(MONO_LABEL, "text-accent-lime")}>{SWITCH_TITLE}</p>
			<p className="mt-3 max-w-xl text-sm text-fg-primary">
				Your stack can also publish on a schedule, when a session starts on a
				machine you have linked.
			</p>
			<p className="mt-2 max-w-xl text-sm text-fg-muted">
				The switch is on your own stack page, above the numbers it keeps
				current. It is the one place this is decided, so you can turn it off
				from any browser, and the machines stop publishing even when their
				triggers keep firing.
			</p>
			<Link
				to="/stacks"
				className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-fg-muted hover:text-accent-lime"
			>
				find your stack <ArrowRight size={12} />
			</Link>
		</div>
	);
}
