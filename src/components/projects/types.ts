/** A project staged in create mode (no stackId yet) - metadata only. */
type StagedProject = {
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
};

/** A project shaped for the presentational ProjectsManager - id-keyed, Convex-free. */
export type ManagerProject = {
	id: string;
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
	updatedAt?: number;
};

export type { StagedProject };
