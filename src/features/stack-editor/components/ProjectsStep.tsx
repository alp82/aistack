import { useRef, useState } from "react";
import { ProjectsSection } from "@/components/ProjectsSection";
import { ProjectsManager } from "@/components/projects/ProjectsManager";
import type {
	ManagerProject,
	StagedProject,
} from "@/components/projects/types";
import type { StackEditorMode } from "@/features/stack-editor/types";
import { safeExternalUrl } from "@/lib/utils";
import type { Id } from "../../../../convex/_generated/dataModel";

type ProjectsStepProps = {
	mode: StackEditorMode;
	stackId?: Id<"stacks">;
	isOwner?: boolean;
	projects?: StagedProject[];
	onProjectsChange?: (projects: StagedProject[]) => void;
};

function ProjectsStep({
	mode,
	stackId,
	isOwner = true,
	projects,
	onProjectsChange,
}: ProjectsStepProps) {
	if (mode === "edit" && stackId) {
		return <ProjectsStepEdit stackId={stackId} isOwner={isOwner} />;
	}
	return (
		<ProjectsStepCreate
			projects={projects ?? []}
			onProjectsChange={onProjectsChange ?? (() => {})}
		/>
	);
}

/** Editor kicker shared by both modes; mirrors the public section's kicker slot. */
const EDITOR_KICKER = (
	<p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
		{"// STEP 02: PROJECTS"}
	</p>
);

const INVALID_URL_ERROR =
	"Invalid URL. Use a valid http:// or https:// address.";

/** Coalesce a manager create/update value into the id-free StagedProject shape. */
function toStaged(value: {
	name?: string;
	description?: string;
	url?: string;
	tags?: string[];
}): StagedProject {
	return {
		name: (value.name ?? "").trim(),
		description: value.description?.trim() || undefined,
		url: value.url?.trim() || undefined,
		tags: value.tags?.length ? value.tags : undefined,
	};
}

// ---------------------------------------------------------------------------
// Create mode - staged local state, rendered through the shared ProjectsManager
// with a parallel stable-id array kept in lockstep with the staged projects.
// ---------------------------------------------------------------------------

function ProjectsStepCreate({
	projects,
	onProjectsChange,
}: {
	projects: StagedProject[];
	onProjectsChange: (projects: StagedProject[]) => void;
}) {
	const [ids, setIds] = useState<string[]>(() =>
		projects.map((_, i) => `p-init-${i}`),
	);
	const nextId = useRef(0);

	// Reconcile the parallel id array with the staged length during render.
	// In normal flow the parent echoes onProjectsChange straight back, so this is
	// a no-op; it only fires if `projects` and `ids` momentarily diverge, keeping
	// every row keyed by a unique, stable id (never undefined).
	if (ids.length !== projects.length) {
		const next = projects.map((_, i) => ids[i] ?? `p-${++nextId.current}`);
		setIds(next);
	}

	const items: ManagerProject[] = projects.map((p, i) => ({
		id: ids[i] ?? `p-fallback-${i}`,
		name: p.name,
		description: p.description,
		url: p.url,
		tags: p.tags,
	}));

	const handleCreate = async (value: {
		name: string;
		description?: string;
		url?: string;
		tags?: string[];
	}) => {
		if (value.url && !safeExternalUrl(value.url)) {
			throw new Error(INVALID_URL_ERROR);
		}
		const id = `p-${++nextId.current}`;
		setIds([...ids, id]);
		onProjectsChange([...projects, toStaged(value)]);
	};

	const handleUpdate = async (
		id: string,
		value: {
			name?: string;
			description?: string;
			url?: string;
			tags?: string[];
		},
	) => {
		if (value.url && !safeExternalUrl(value.url)) {
			throw new Error(INVALID_URL_ERROR);
		}
		const i = ids.indexOf(id);
		if (i === -1) return;
		const staged = toStaged({ ...projects[i], ...value });
		// Leave `ids` untouched: editing must NOT change a row's parallel id, or
		// Motion would remount the row and collapse its accordion panel.
		onProjectsChange(projects.map((p, k) => (k === i ? staged : p)));
	};

	const handleDelete = async (id: string) => {
		const i = ids.indexOf(id);
		if (i === -1) return;
		setIds(ids.filter((_, k) => k !== i));
		onProjectsChange(projects.filter((_, k) => k !== i));
	};

	const handleReorder = async (orderedIds: string[]) => {
		const byId = new Map(ids.map((id, i) => [id, projects[i]]));
		const reordered = orderedIds
			.map((id) => byId.get(id))
			.filter((p): p is StagedProject => p !== undefined);
		setIds(orderedIds);
		onProjectsChange(reordered);
	};

	return (
		// biome-ignore lint/correctness/useUniqueElementIds: stable anchor target for in-editor section navigation
		<ProjectsManager
			items={items}
			keyOf={(it) => it.id}
			isOwner
			index={2}
			loading={false}
			header={EDITOR_KICKER}
			id="section-projects"
			onCreate={handleCreate}
			onUpdate={handleUpdate}
			onDelete={handleDelete}
			onReorder={handleReorder}
		/>
	);
}

// ---------------------------------------------------------------------------
// Edit mode - delegates to the public ProjectsSection (live Convex mutations,
// Motion reorder, favicon rows, New Project dialog) with the editor kicker.
// ---------------------------------------------------------------------------

function ProjectsStepEdit({
	stackId,
	isOwner,
}: {
	stackId: Id<"stacks">;
	isOwner: boolean;
}) {
	return (
		// biome-ignore lint/correctness/useUniqueElementIds: stable anchor target for in-editor section navigation
		<ProjectsSection
			stackId={stackId}
			isOwner={isOwner}
			index={2}
			id="section-projects"
			header={EDITOR_KICKER}
		/>
	);
}

export { ProjectsStep };
export type { ProjectsStepProps };
