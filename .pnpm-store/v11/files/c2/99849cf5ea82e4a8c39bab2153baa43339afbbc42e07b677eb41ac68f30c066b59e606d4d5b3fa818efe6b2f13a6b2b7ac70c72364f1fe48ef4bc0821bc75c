import * as z from "zod";

//#region src/db/to-zod.ts
function toZodSchema({ fields, isClientSide }) {
	const zodFields = Object.keys(fields).reduce((acc, key) => {
		const field = fields[key];
		if (!field) return acc;
		if (isClientSide && field.input === false) return acc;
		let schema;
		if (field.type === "json") schema = z.json ? z.json() : z.any();
		else if (field.type === "string[]" || field.type === "number[]") schema = z.array(field.type === "string[]" ? z.string() : z.number());
		else if (Array.isArray(field.type)) schema = z.any();
		else schema = z[field.type]();
		if (field?.required === false) schema = schema.optional();
		if (field?.returned === false) return acc;
		return {
			...acc,
			[key]: schema
		};
	}, {});
	return z.object(zodFields);
}

//#endregion
export { toZodSchema };
//# sourceMappingURL=to-zod.mjs.map