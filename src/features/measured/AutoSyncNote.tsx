import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

/**
 * What `/sync` says about auto-sync (#104).
 *
 * A MENTION, NOT A SECOND CONTROL. The permission belongs to one stack (#102),
 * and this page has no stack in hand. It names the switch, says where it is and
 * what it does, and leaves the acting to the owner box.
 *
 * Unboxed since the command-sheet redesign: `/sync` renders this inside its
 * "publish on a schedule" disclosure row, which supplies the frame and label.
 */
export function AutoSyncNote() {
	return (
		<>
			<p className="text-sm text-fg-muted">
				Auto-sync publishes your stack on a schedule, when a session starts on a
				machine you have linked.
			</p>
			<p className="mt-2 text-sm text-fg-muted">
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
		</>
	);
}
