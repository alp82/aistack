//#region src/validator.ts
/**
* Runs validation on body and query
* @returns error and data object
*/
async function runValidation(options, context = {}) {
	let request = {
		body: context.body,
		query: context.query
	};
	if (options.body) {
		const result = await options.body["~standard"].validate(context.body);
		if (result.issues) return {
			data: null,
			error: fromError(result.issues, "body")
		};
		request.body = result.value;
	}
	if (options.query) {
		const result = await options.query["~standard"].validate(context.query);
		if (result.issues) return {
			data: null,
			error: fromError(result.issues, "query")
		};
		request.query = result.value;
	}
	if (options.requireHeaders && !context.headers) return {
		data: null,
		error: {
			message: "Headers is required",
			issues: []
		}
	};
	if (options.requireRequest && !context.request) return {
		data: null,
		error: {
			message: "Request is required",
			issues: []
		}
	};
	return {
		data: request,
		error: null
	};
}
function fromError(error, validating) {
	return {
		message: error.map((e) => {
			return `[${e.path?.length ? `${validating}.` + e.path.map((x) => typeof x === "object" ? x.key : x).join(".") : validating}] ${e.message}`;
		}).join("; "),
		issues: error
	};
}

//#endregion
export { runValidation };
//# sourceMappingURL=validator.mjs.map