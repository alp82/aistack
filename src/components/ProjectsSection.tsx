import { useMutation, useQuery } from "convex/react";
import { ProjectsManager } from "@/components/projects/ProjectsManager";
import type { ManagerProject } from "@/components/projects/types";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Project = {
	_id: Id<"projects">;
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
	updatedAt: number;
	createdAt: number;
};

export function ProjectsSection({
	stackId,
	isOwner,
	index,
	header,
	id,
}: {
	stackId: Id<"stacks">;
	isOwner: boolean;
	index: number;
	header?: React.ReactNode;
	id?: string;
}) {
	const projects = useQuery(api.projects.listByStack, {
		stackId,
	}) as Project[] | undefined;

	// Declaration order is a positional contract mirrored by the test suite's spy
	// keying and guarded by TC-MUT-ORDER: reorderProjects(1), deleteProject(2),
	// createProject(3), updateProject(4).
	const reorderProjects = useMutation(api.projects.reorderProjects);
	const deleteProject = useMutation(api.projects.deleteProject);
	const createProject = useMutation(api.projects.createProject);
	const updateProject = useMutation(api.projects.updateProject);

	const items: ManagerProject[] = (projects ?? []).map((p) => ({
		id: p._id,
		name: p.name,
		description: p.description,
		url: p.url,
		tags: p.tags,
		updatedAt: p.updatedAt,
	}));

	return (
		<ProjectsManager
			items={items}
			keyOf={(p) => p.id}
			isOwner={isOwner}
			index={index}
			header={header}
			id={id}
			loading={projects === undefined}
			onCreate={(v) => createProject({ ...v, stackId })}
			onUpdate={(projectId, v) =>
				updateProject({ projectId: projectId as Id<"projects">, ...v })
			}
			onDelete={(projectId) =>
				deleteProject({ projectId: projectId as Id<"projects"> })
			}
			onReorder={(ids) =>
				reorderProjects({ stackId, projectIds: ids as Id<"projects">[] })
			}
		/>
	);
}
