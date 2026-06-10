/** A project staged in create mode (no stackId yet) — metadata only. */
type StagedProject = {
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
};

export type { StagedProject };
