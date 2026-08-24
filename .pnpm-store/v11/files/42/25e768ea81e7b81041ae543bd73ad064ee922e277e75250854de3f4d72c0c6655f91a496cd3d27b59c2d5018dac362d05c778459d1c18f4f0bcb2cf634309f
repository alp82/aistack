import { i as logger } from "./env-DbssmzoK.mjs";
import { createRandomStringGenerator } from "@better-auth/utils/random";

//#region src/utils/error-codes.ts
function defineErrorCodes(codes) {
	return codes;
}

//#endregion
//#region src/utils/id.ts
const generateId = (size) => {
	return createRandomStringGenerator("a-z", "A-Z", "0-9")(size || 32);
};

//#endregion
//#region src/utils/json.ts
function safeJSONParse(data) {
	function reviver(_, value) {
		if (typeof value === "string") {
			if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)) {
				const date = new Date(value);
				if (!isNaN(date.getTime())) return date;
			}
		}
		return value;
	}
	try {
		if (typeof data !== "string") return data;
		return JSON.parse(data, reviver);
	} catch (e) {
		logger.error("Error parsing JSON", { error: e });
		return null;
	}
}

//#endregion
//#region src/utils/string.ts
function capitalizeFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

//#endregion
export { defineErrorCodes as i, safeJSONParse as n, generateId as r, capitalizeFirstLetter as t };