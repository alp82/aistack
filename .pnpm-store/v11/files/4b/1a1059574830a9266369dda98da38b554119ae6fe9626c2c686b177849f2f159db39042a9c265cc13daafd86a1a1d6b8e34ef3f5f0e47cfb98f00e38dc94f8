import { resolve } from "../../_build/common.mjs";
import { defineCommand } from "../../_libs/citty.mjs";
import { consola as consola$1 } from "consola";
import { listTasks, loadOptions } from "nitro/builder";
var list_default = defineCommand({
	meta: {
		name: "run",
		description: "List available tasks (experimental)"
	},
	args: { dir: {
		type: "string",
		description: "project root directory"
	} },
	async run({ args }) {
		const cwd = resolve(args.dir || args.cwd || ".");
		const tasks = await listTasks({
			cwd,
			buildDir: (await loadOptions({ rootDir: cwd }).catch(() => void 0))?.buildDir || ".nitro"
		});
		for (const [name, task] of Object.entries(tasks)) consola$1.log(` - \`${name}\`${task.meta?.description ? ` - ${task.meta.description}` : ""}`);
	}
});
export { list_default as default };
