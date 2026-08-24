import { db_exports } from "./index.mjs";

//#region src/db/get-schema.ts
function getSchema(config) {
	const tables = (0, db_exports.getAuthTables)(config);
	let schema = {};
	for (const key in tables) {
		const table = tables[key];
		const fields = table.fields;
		let actualFields = {};
		Object.entries(fields).forEach(([key$1, field]) => {
			actualFields[field.fieldName || key$1] = field;
			if (field.references) {
				const refTable = tables[field.references.model];
				if (refTable) actualFields[field.fieldName || key$1].references = {
					...field.references,
					model: refTable.modelName,
					field: field.references.field
				};
			}
		});
		if (schema[table.modelName]) {
			schema[table.modelName].fields = {
				...schema[table.modelName].fields,
				...actualFields
			};
			continue;
		}
		schema[table.modelName] = {
			fields: actualFields,
			order: table.order || Infinity
		};
	}
	return schema;
}

//#endregion
export { getSchema };
//# sourceMappingURL=get-schema.mjs.map