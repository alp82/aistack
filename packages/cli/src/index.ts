import { Command } from "commander";
import { BASE_URL } from "./api.js";
import { collectCommand } from "./commands/collect.js";
import { createCommand } from "./commands/create.js";
import { loginCommand } from "./commands/login.js";
import { runStdioSyncServer } from "./sync/server.js";

const program = new Command();

program
	.name("aistack")
	.description("Share and clone AI development configurations")
	.version("0.1.0");

program
	.command("login")
	.description("Authenticate with AI Stack")
	.action(loginCommand);

program
	.command("collect")
	.description("Scan and upload AI config files from your project")
	.option("--no-global", "Exclude global config files (~/.claude, etc.)")
	.action((options) => collectCommand({ global: options.global ?? true }));

program
	.command("create")
	.description("Download and write your stack's AI config files")
	.action(createCommand);

program
	.command("mcp")
	.description(
		"Run the aistack MCP server on stdio (sync preview + gated publish)",
	)
	.action(() => {
		// stdout belongs to the protocol. Diagnostics go to stderr only.
		runStdioSyncServer({
			baseUrl: BASE_URL,
			log: (line) => process.stderr.write(`[aistack-mcp] ${line}\n`),
		});
	});

program.parse();
