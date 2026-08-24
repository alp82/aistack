import { resolve } from "../../_build/common.mjs";
import { defineCommand } from "../../_libs/citty.mjs";
import { startPreview } from "../../_chunks/nitro2.mjs";
import { commonArgs } from "./common.mjs";
import { serve } from "srvx";
import { log } from "srvx/log";
var preview_default = defineCommand({
	meta: {
		name: "preview",
		description: "Start a local server to preview the built server"
	},
	args: {
		...commonArgs,
		port: {
			type: "string",
			description: "specify port"
		},
		host: {
			type: "string",
			description: "specify hostname"
		}
	},
	async run({ args }) {
		const rootDir = resolve(args.dir || args._dir || ".");
		const server = serve({
			fetch(req) {
				return preview.fetch(req);
			},
			middleware: [log()],
			gracefulShutdown: false,
			port: args.port,
			hostname: args.host
		});
		const preview = await startPreview({
			rootDir,
			loader: { srvxServer: server }
		});
		if (preview.upgrade) server.node?.server?.on("upgrade", (req, socket, head) => {
			preview.upgrade(req, socket, head);
		});
		process.on("SIGINT", async () => {
			await server.close();
			await preview.close();
			process.exit(0);
		});
	}
});
export { preview_default as default };
