/**
 * The owner's auto-sync switch - its state machine and its words (#104, map
 * #76, building #100 decision 5).
 *
 * The permission moved to the stack in #102. This file is the web half: it
 * turns the pair the server keeps - `autoSync` and `lastAutoSyncAt` - into the
 * one honest sentence the owner box prints.
 *
 * THE PAIR IS THE POINT. The flag says what is allowed. The stamp says what
 * happened. A revoke takes the first and never the second, so a stack can be
 * off with a stamp (automation ran, then the owner stopped it) and on without
 * one (the owner said yes, and no machine has acted on it yet). A switch that
 * read the flag alone would call that second state "working" and be wrong on
 * the exact day the owner needs the truth.
 *
 * OWNER VOICE, distinct from the public voice in `copy.ts`: the reader here
 * owns the machines and the stack, so it is "your machines", not "this machine".
 */

/** What `autoSync.get` answers - the flag and the stamp, together. */
export type AutoSyncFlag = {
	autoSync: { enabled: boolean; frequencyHours: number } | null;
	lastAutoSyncAt: number | null;
};

export type AutoSyncState =
	/** Nobody decided, or the owner said no. Both draw the same switch. */
	| { kind: "off" }
	/** On, and no machine has ever fired an automatic sync. */
	| { kind: "never-fired"; frequencyHours: number }
	/** On, and a machine fired one at this time. */
	| { kind: "running"; frequencyHours: number; at: number };

export function autoSyncState(flag: AutoSyncFlag): AutoSyncState {
	if (!flag.autoSync?.enabled) return { kind: "off" };
	const { frequencyHours } = flag.autoSync;
	if (flag.lastAutoSyncAt === null)
		return { kind: "never-fired", frequencyHours };
	return { kind: "running", frequencyHours, at: flag.lastAutoSyncAt };
}

/**
 * The intervals the select offers, inside the 1..24 range the server clamps to.
 *
 * Short enough to feel live, long enough to feel unobtrusive, with the CLI's
 * six-hour default in the list.
 */
const OFFERED_HOURS = [1, 6, 12, 24] as const;

/**
 * The list to draw, with the STORED interval folded in.
 *
 * A machine could have seeded any whole number of hours, so the current value
 * is not always one this list offers. It is added rather than replaced: a
 * select that cannot show its own value shows the wrong schedule.
 */
export function frequencyChoices(current: number): number[] {
	const hours = new Set<number>(OFFERED_HOURS);
	if (current >= 1 && current <= 24) hours.add(current);
	return [...hours].sort((a, b) => a - b);
}

/** How an interval reads in the owner box: a phrase, never a bare number. */
export function frequencyLabel(hours: number): string {
	if (hours === 24) return "every day";
	if (hours === 1) return "every hour";
	return `every ${hours} hours`;
}

export const SWITCH_TITLE = "// auto-sync";

/**
 * OFF NAMES THE ALTERNATIVE, never a lack. Automation off is a working stack
 * that publishes when its owner says so, not a stack with a missing feature.
 */
export const OFF_LINE = "Off. Only a sync you run yourself publishes.";

/**
 * What a revoke leaves behind (#103). Hooks are dumb local triggers, and a
 * browser cannot reach the machines that hold them, so the honest sentence is
 * that they keep firing and land nothing - not "go remove them".
 */
export const OFF_REVOKE_NOTE =
	"Machines that still have a hook keep firing on their own schedule. They publish nothing while this is off.";

/** The on sentence, with the schedule it is running. */
export function runningLine(frequencyHours: number): string {
	return `On, ${frequencyLabel(frequencyHours)} at most.`;
}

/** ON WITHOUT A STAMP SAYS SO. This is the sentence the whole `trigger` field on the wire (#102) exists to make true. */
export const NEVER_FIRED_LINE = "No machine has synced automatically yet.";

export const NEVER_FIRED_FIX =
	"Run this once on the machine you want to publish from. It installs the trigger for every harness you use, and after that the schedule runs on its own.";

export const ON_NOTE =
	"A sync fires when a session starts on a linked machine, and at most once per interval. Turn this off and it stops everywhere.";

/* ------------------------------------- the switch as the remedy (#107 C) -- */

/**
 * The two CLI forms of this switch. #102 moved the permission onto the stack,
 * so these and the toggle above write the same flag.
 */
export const AUTO_ON_CMD = "npx @use-aistack/cli sync --auto on";
export const AUTO_OFF_CMD = "npx @use-aistack/cli sync --auto off";

/**
 * WHAT THE OWNER READS WHEN THE PAGE IS PAST 48 HOURS AND AUTOMATION IS OFF.
 *
 * #107 answered "one element or two?" with ONE: the page shows a dated stamp
 * and no sentence, and this switch - promoted above the reading - is the only
 * place that asks for anything. The remedy lives on the control, so there is
 * never a callout and a switch selling the same feature.
 *
 * It states the age and what turning this on would do. It does not say why the
 * stack went quiet, because a browser cannot know that (#40).
 */
export function stalePromptLine(syncedAgo: string): string {
	return `Last synced ${syncedAgo}. Auto-sync keeps this page current without you running anything.`;
}

/**
 * WHAT AUTO-SYNC IS, in the CLI's own terms - the trigger, the ceiling and the
 * revoke, in one sentence.
 *
 * The CLI says "a silent sync at most every 6 hours when a session starts", and on
 * enable "about every 6h when a session starts. Turn it off any
 * time". The harness name is dropped, because this reader may publish from
 * several and the browser does not know which.
 *
 * The ceiling follows the STORED interval. A stack that chose six hours and
 * then turned the switch off would restore six hours, so a fixed "once a day"
 * here would promise a schedule the toggle does not set.
 */
export function autoSyncExplainer(frequencyHours: number): string {
	const cadence =
		frequencyHours === 24 ? "once a day" : frequencyLabel(frequencyHours);
	return `It publishes when a session starts on a machine you have linked, at most ${cadence}. Turning it off revokes it everywhere, from this switch or with ${AUTO_OFF_CMD}.`;
}
