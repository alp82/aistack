import { defineCommand } from "../../_libs/citty.mjs";
var task_default = defineCommand({
	meta: {
		name: "task",
		description: "Operate in nitro tasks (experimental)"
	},
	subCommands: {
		list: () => import("./list.mjs").then((r) => r.default),
		run: () => import("./run.mjs").then((r) => r.default)
	}
});
export { task_default as default };
