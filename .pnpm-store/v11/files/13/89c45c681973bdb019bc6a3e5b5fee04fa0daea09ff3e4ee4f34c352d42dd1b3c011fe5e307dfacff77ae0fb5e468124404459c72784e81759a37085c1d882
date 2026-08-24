const platforms = [
	"aws",
	"azure",
	"cloudflare",
	"deno",
	"firebase",
	"netlify",
	"vercel"
];
function resolveCompatibilityDates(input, defaults) {
	const dates = { default: "" };
	const _defaults = typeof defaults === "string" ? { default: defaults } : defaults || {};
	for (const [key, value] of Object.entries(_defaults)) if (value) dates[key] = formatDate(value);
	const _input = typeof input === "string" ? { default: input } : input || {};
	for (const [key, value] of Object.entries(_input)) if (value) dates[key] = formatDate(value);
	dates.default = formatDate(dates.default || "") || Object.values(dates).sort().pop() || "";
	return dates;
}
function resolveCompatibilityDatesFromEnv(overridesInput) {
	const defaults = { default: process.env.COMPATIBILITY_DATE ? formatDate(process.env.COMPATIBILITY_DATE) : void 0 };
	for (const platform of platforms) {
		const envName = `COMPATIBILITY_DATE_${platform.toUpperCase()}`;
		const env = process.env[envName];
		if (env) defaults[platform] = formatDate(env);
	}
	return resolveCompatibilityDates(overridesInput, defaults);
}
function formatCompatibilityDate(input) {
	const dates = resolveCompatibilityDates(input);
	if (Object.entries(dates).length === 0) return "-";
	return [`${dates["default"]}`, ...Object.entries(dates).filter(([key, value]) => key !== "default" && value && value !== dates["default"]).map(([key, value]) => `${key}: ${value}`)].join(", ");
}
function formatDate(date) {
	const d = normalizeDate(date);
	if (Number.isNaN(d.getDate())) return "";
	return `${d.getFullYear().toString()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}
function normalizeDate(date) {
	if (date instanceof Date) return date;
	if (date === "latest") return /* @__PURE__ */ new Date();
	return new Date(date);
}
export { formatCompatibilityDate, resolveCompatibilityDates, resolveCompatibilityDatesFromEnv };
