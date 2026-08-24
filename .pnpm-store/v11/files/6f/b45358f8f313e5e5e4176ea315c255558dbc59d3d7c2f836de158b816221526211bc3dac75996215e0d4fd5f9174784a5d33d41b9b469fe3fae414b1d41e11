import { snakeCase } from "scule";
import { runtimeConfig } from "#nitro/virtual/runtime-config";
export function useRuntimeConfig() {
	return useRuntimeConfig._cached ||= getRuntimeConfig();
}
function getRuntimeConfig() {
	const env = globalThis.process?.env || {};
	applyEnv(runtimeConfig, {
		prefix: "NITRO_",
		altPrefix: runtimeConfig.nitro?.envPrefix ?? env?.NITRO_ENV_PREFIX ?? "_",
		envExpansion: Boolean(runtimeConfig.nitro?.envExpansion ?? env?.NITRO_ENV_EXPANSION ?? false)
	});
	return runtimeConfig;
}
export function applyEnv(obj, opts, parentKey = "") {
	for (const key in obj) {
		const subKey = parentKey ? `${parentKey}_${key}` : key;
		const envValue = getEnv(subKey, opts);
		if (_isObject(obj[key])) {
			
			if (_isObject(envValue)) {
				obj[key] = {
					...obj[key],
					...envValue
				};
				applyEnv(obj[key], opts, subKey);
			} else if (envValue === undefined) {
				applyEnv(obj[key], opts, subKey);
			} else {
				obj[key] = envValue ?? obj[key];
			}
		} else {
			obj[key] = envValue ?? obj[key];
		}
		
		if (opts.envExpansion && typeof obj[key] === "string") {
			obj[key] = _expandFromEnv(obj[key]);
		}
	}
	return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
	return value.replace(envExpandRx, (match, key) => {
		return process.env[key] || match;
	});
}
function getEnv(key, opts) {
	const envKey = snakeCase(key).toUpperCase();
	return process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey];
}
function _isObject(input) {
	return input !== null && typeof input === "object" && !Array.isArray(input);
}
