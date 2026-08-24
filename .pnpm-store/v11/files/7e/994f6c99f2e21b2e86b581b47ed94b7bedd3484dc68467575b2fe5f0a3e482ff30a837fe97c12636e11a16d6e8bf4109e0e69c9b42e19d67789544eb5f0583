//#region src/plugins/captcha/utils.ts
const encodeToURLParams = (obj) => {
	if (typeof obj !== "object" || obj === null || Array.isArray(obj)) throw new Error("Input must be a non-null object.");
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(obj)) if (value !== void 0 && value !== null) params.append(key, String(value));
	return params.toString();
};

//#endregion
export { encodeToURLParams };
//# sourceMappingURL=utils.mjs.map