import { Command } from "commander";
import { collectCommand } from "./commands/collect.js";
import { createCommand } from "./commands/create.js";
import { loginCommand } from "./commands/login.js";

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
	.description("Download and write AI config files from a shared project")
	.argument("<slug>", "Project slug or short ID")
	.action(createCommand);

program.parse();
