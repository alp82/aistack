#!/usr/bin/env node
import { defineCommand, runMain } from "../_libs/citty.mjs";
import { version } from "nitro/meta";
runMain(defineCommand({
	meta: {
		name: "nitro",
		description: "Nitro CLI",
		version
	},
	subCommands: {
		dev: () => import("./_chunks/dev.mjs").then((r) => r.default),
		build: () => import("./_chunks/build.mjs").then((r) => r.default),
		deploy: () => import("./_chunks/deploy.mjs").then((r) => r.default),
		prepare: () => import("./_chunks/prepare.mjs").then((r) => r.default),
		task: () => import("./_chunks/task.mjs").then((r) => r.default),
		preview: () => import("./_chunks/preview.mjs").then((r) => r.default),
		docs: () => import("./_chunks/docs.mjs").then((r) => r.default)
	}
}));
export {};
