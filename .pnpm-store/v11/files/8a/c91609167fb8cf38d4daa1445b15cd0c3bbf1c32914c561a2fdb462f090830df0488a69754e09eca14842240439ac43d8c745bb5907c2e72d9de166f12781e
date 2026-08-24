import { fileURLToPath } from "node:url";
import packageJson from "../../package.json" with { type: "json" };
export const version = packageJson.version;
const resolve = (path) => fileURLToPath(new URL(path, import.meta.url));
export const runtimeDir = /* @__PURE__ */ resolve("./");
export const presetsDir = /* @__PURE__ */ resolve("../presets/");
export const pkgDir = /* @__PURE__ */ resolve("../../");
export const docsDir = /* @__PURE__ */ resolve("../docs");
export const runtimeDependencies = [
	"crossws",
	"croner",
	"db0",
	"defu",
	"destr",
	"h3",
	"rou3",
	"hookable",
	"ofetch",
	"ocache",
	"ohash",
	"rendu",
	"scule",
	"srvx",
	"ufo",
	"unctx",
	"unenv",
	"unstorage"
];
