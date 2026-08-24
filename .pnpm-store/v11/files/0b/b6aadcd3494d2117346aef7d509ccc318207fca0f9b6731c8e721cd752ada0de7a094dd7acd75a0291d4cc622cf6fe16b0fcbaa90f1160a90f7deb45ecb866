import { resolve } from "../../_build/common.mjs";
import { defineCommand } from "../../_libs/citty.mjs";
import { consola as consola$1 } from "consola";
import destr from "destr";
import { loadOptions, runTask } from "nitro/builder";
var run_default = defineCommand({
	meta: {
		name: "run",
		description: "Run a runtime task in the currently running dev server (experimental)"
	},
	args: {
		name: {
			type: "positional",
			description: "task name",
			required: true
		},
		dir: {
			type: "string",
			description: "project root directory"
		},
		payload: {
			type: "string",
			description: "payload json to pass to the task"
		}
	},
	async run({ args }) {
		const cwd = resolve(args.dir || args.cwd || ".");
		const options = await loadOptions({ rootDir: cwd }).catch(() => void 0);
		consola$1.info(`Running task \`${args.name}\`...`);
		let payload = destr(args.payload || "{}");
		if (typeof payload !== "object") {
			consola$1.error(`Invalid payload: \`${args.payload}\` (it should be a valid JSON object)`);
			payload = void 0;
		}
		try {
			const { result } = await runTask({
				name: args.name,
				context: {},
				payload
			}, {
				cwd,
				buildDir: options?.buildDir || ".nitro"
			});
			consola$1.success("Result:", result);
		} catch (error) {
			consola$1.error(`Failed to run task \`${args.name}\`: ${error}`);
			process.exit(1);
		}
	}
});
export { run_default as default };
