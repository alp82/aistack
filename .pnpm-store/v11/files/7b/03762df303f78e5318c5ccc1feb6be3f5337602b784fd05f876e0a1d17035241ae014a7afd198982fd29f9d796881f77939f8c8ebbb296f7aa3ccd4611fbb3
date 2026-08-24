import { defineCommand } from "../../_libs/citty.mjs";
import { docsDir } from "nitro/meta";
import { execSync } from "node:child_process";
var docs_default = defineCommand({
	meta: {
		name: "docs",
		description: "Explore Nitro documentation"
	},
	args: { page: {
		type: "string",
		description: "Page path to open"
	} },
	run({ rawArgs }) {
		const runnerCmd = ([
			["bun", "x"],
			["pnpm", "dlx"],
			["npm", "x"]
		].find(([pkg]) => {
			try {
				execSync(`${pkg} -v`, { stdio: "ignore" });
				return true;
			} catch {}
		}) || ["npm", "x"]).join(" ");
		const args = rawArgs?.join(" ") || "";
		execSync(`${runnerCmd} mdzilla ${docsDir}${args ? ` ${args}` : ""}`, { stdio: "inherit" });
	}
});
export { docs_default as default };
