//#region src/db/field-converter.ts
function convertToDB(fields, values) {
	let result = values.id ? { id: values.id } : {};
	for (const key in fields) {
		const field = fields[key];
		const value = values[key];
		if (value === void 0) continue;
		result[field.fieldName || key] = value;
	}
	return result;
}
function convertFromDB(fields, values) {
	if (!values) return null;
	let result = { id: values.id };
	for (const [key, value] of Object.entries(fields)) result[key] = values[value.fieldName || key];
	return result;
}

//#endregion
export { convertFromDB, convertToDB };
//# sourceMappingURL=field-converter.mjs.map