import { Command } from "commander";
import { BASE_URL } from "./api.js";
import { collectCommand } from "./commands/collect.js";
import { connectCommand } from "./commands/connect.js";
import { createCommand } from "./commands/create.js";
import { loginCommand } from "./commands/login.js";
import { syncCommand } from "./commands/sync.js";
import { runStdioSyncServer } from "./sync/server.js";
import { CLI_VERSION } from "./version.js";

const program = new Command();

program
	.name("aistack")
	.description("Measure and share your AI stack from your terminal")
	.version(CLI_VERSION);

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

// The documented default sync surface (#56): terminal-first, TTY gate.
program
	.command("sync")
	.description("Scan, preview, and publish measured usage (rolling 30 days)")
	.option(
		"--auto [state]",
		"silent background sync; 'on' enables the SessionStart hook, 'off' revokes it",
	)
	.option(
		"--every <hours>",
		"with --auto on: hours between auto-syncs (default 24)",
	)
	.action((options) => syncCommand(options));

program
	.command("connect")
	.description("Install the in-session sync surface (MCP server + Skill)")
	.argument("<harness>", 'the harness to connect ("claude")')
	.action(connectCommand);

program.parse();
