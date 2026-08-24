import { db_exports } from "../../db/index.mjs";
import { getEndpoints } from "../../api/index.mjs";
import * as z from "zod";

//#region src/plugins/open-api/generator.ts
const allowedType = new Set([
	"string",
	"number",
	"boolean",
	"array",
	"object"
]);
function getTypeFromZodType(zodType) {
	const type = zodType.type;
	return allowedType.has(type) ? type : "string";
}
function getFieldSchema(field) {
	const schema = {
		type: field.type === "date" ? "string" : field.type,
		...field.type === "date" && { format: "date-time" }
	};
	if (field.defaultValue !== void 0) schema.default = typeof field.defaultValue === "function" ? "Generated at runtime" : field.defaultValue;
	if (field.input === false) schema.readOnly = true;
	return schema;
}
function getParameters(options) {
	const parameters = [];
	if (options.metadata?.openapi?.parameters) {
		parameters.push(...options.metadata.openapi.parameters);
		return parameters;
	}
	if (options.query instanceof z.ZodObject) Object.entries(options.query.shape).forEach(([key, value]) => {
		if (value instanceof z.ZodType) parameters.push({
			name: key,
			in: "query",
			schema: {
				...processZodType(value),
				..."minLength" in value && value.minLength ? { minLength: value.minLength } : {}
			}
		});
	});
	return parameters;
}
function getRequestBody(options) {
	if (options.metadata?.openapi?.requestBody) return options.metadata.openapi.requestBody;
	if (!options.body) return void 0;
	if (options.body instanceof z.ZodObject || options.body instanceof z.ZodOptional) {
		const shape = options.body.shape;
		if (!shape) return void 0;
		const properties = {};
		const required = [];
		Object.entries(shape).forEach(([key, value]) => {
			if (value instanceof z.ZodType) {
				properties[key] = processZodType(value);
				if (!(value instanceof z.ZodOptional)) required.push(key);
			}
		});
		return {
			required: options.body instanceof z.ZodOptional ? false : options.body ? true : false,
			content: { "application/json": { schema: {
				type: "object",
				properties,
				required
			} } }
		};
	}
}
function processZodType(zodType) {
	if (zodType instanceof z.ZodOptional) {
		const innerType = zodType._def.innerType;
		const innerSchema = processZodType(innerType);
		if (innerSchema.type) {
			const type = Array.isArray(innerSchema.type) ? innerSchema.type : [innerSchema.type];
			return {
				...innerSchema,
				type: Array.from(new Set([...type, "null"]))
			};
		}
		return { anyOf: [innerSchema, { type: "null" }] };
	}
	if (zodType instanceof z.ZodObject) {
		const shape = zodType.shape;
		if (shape) {
			const properties = {};
			const required = [];
			Object.entries(shape).forEach(([key, value]) => {
				if (value instanceof z.ZodType) {
					properties[key] = processZodType(value);
					if (!(value instanceof z.ZodOptional)) required.push(key);
				}
			});
			return {
				type: "object",
				properties,
				...required.length > 0 ? { required } : {},
				description: zodType.description
			};
		}
	}
	return {
		type: getTypeFromZodType(zodType),
		description: zodType.description
	};
}
function getResponse(responses) {
	return {
		"400": {
			content: { "application/json": { schema: {
				type: "object",
				properties: { message: { type: "string" } },
				required: ["message"]
			} } },
			description: "Bad Request. Usually due to missing parameters, or invalid parameters."
		},
		"401": {
			content: { "application/json": { schema: {
				type: "object",
				properties: { message: { type: "string" } },
				required: ["message"]
			} } },
			description: "Unauthorized. Due to missing or invalid authentication."
		},
		"403": {
			content: { "application/json": { schema: {
				type: "object",
				properties: { message: { type: "string" } }
			} } },
			description: "Forbidden. You do not have permission to access this resource or to perform this action."
		},
		"404": {
			content: { "application/json": { schema: {
				type: "object",
				properties: { message: { type: "string" } }
			} } },
			description: "Not Found. The requested resource was not found."
		},
		"429": {
			content: { "application/json": { schema: {
				type: "object",
				properties: { message: { type: "string" } }
			} } },
			description: "Too Many Requests. You have exceeded the rate limit. Try again later."
		},
		"500": {
			content: { "application/json": { schema: {
				type: "object",
				properties: { message: { type: "string" } }
			} } },
			description: "Internal Server Error. This is a problem with the server that you cannot fix."
		},
		...responses
	};
}
function toOpenApiPath(path) {
	return path.split("/").map((part) => part.startsWith(":") ? `{${part.slice(1)}}` : part).join("/");
}
async function generator(ctx, options) {
	const baseEndpoints = getEndpoints(ctx, {
		...options,
		plugins: []
	});
	const tables = (0, db_exports.getAuthTables)({
		...options,
		session: {
			...options.session,
			storeSessionInDatabase: true
		}
	});
	const components = { schemas: { ...Object.entries(tables).reduce((acc, [key, value]) => {
		const modelName = key.charAt(0).toUpperCase() + key.slice(1);
		const fields = value.fields;
		const required = [];
		const properties = { id: { type: "string" } };
		Object.entries(fields).forEach(([fieldKey, fieldValue]) => {
			if (!fieldValue) return;
			properties[fieldKey] = getFieldSchema(fieldValue);
			if (fieldValue.required && fieldValue.input !== false) required.push(fieldKey);
		});
		Object.entries(properties).forEach(([key$1, prop]) => {
			const field = value.fields[key$1];
			if (field && field.type === "date" && prop.type === "string") prop.format = "date-time";
		});
		acc[modelName] = {
			type: "object",
			properties,
			required
		};
		return acc;
	}, {}) } };
	const paths = {};
	Object.entries(baseEndpoints.api).forEach(([_, value]) => {
		if (!value.path || ctx.options.disabledPaths?.includes(value.path)) return;
		const options$1 = value.options;
		if (options$1.metadata?.SERVER_ONLY) return;
		const path = toOpenApiPath(value.path);
		if (options$1.method === "GET" || options$1.method === "DELETE") paths[path] = {
			...paths[path],
			[options$1.method.toLowerCase()]: {
				tags: ["Default", ...options$1.metadata?.openapi?.tags || []],
				description: options$1.metadata?.openapi?.description,
				operationId: options$1.metadata?.openapi?.operationId,
				security: [{ bearerAuth: [] }],
				parameters: getParameters(options$1),
				responses: getResponse(options$1.metadata?.openapi?.responses)
			}
		};
		if (options$1.method === "POST" || options$1.method === "PATCH" || options$1.method === "PUT") {
			const body = getRequestBody(options$1);
			paths[path] = {
				...paths[path],
				[options$1.method.toLowerCase()]: {
					tags: ["Default", ...options$1.metadata?.openapi?.tags || []],
					description: options$1.metadata?.openapi?.description,
					operationId: options$1.metadata?.openapi?.operationId,
					security: [{ bearerAuth: [] }],
					parameters: getParameters(options$1),
					...body ? { requestBody: body } : { requestBody: { content: { "application/json": { schema: {
						type: "object",
						properties: {}
					} } } } },
					responses: getResponse(options$1.metadata?.openapi?.responses)
				}
			};
		}
	});
	for (const plugin of options.plugins || []) {
		if (plugin.id === "open-api") continue;
		const pluginEndpoints = getEndpoints(ctx, {
			...options,
			plugins: [plugin]
		});
		const api = Object.keys(pluginEndpoints.api).map((key) => {
			if (baseEndpoints.api[key] === void 0) return pluginEndpoints.api[key];
			return null;
		}).filter((x) => x !== null);
		Object.entries(api).forEach(([key, value]) => {
			if (!value.path || ctx.options.disabledPaths?.includes(value.path)) return;
			const options$1 = value.options;
			if (options$1.metadata?.SERVER_ONLY) return;
			const path = toOpenApiPath(value.path);
			if (options$1.method === "GET" || options$1.method === "DELETE") paths[path] = {
				...paths[path],
				[options$1.method.toLowerCase()]: {
					tags: options$1.metadata?.openapi?.tags || [plugin.id.charAt(0).toUpperCase() + plugin.id.slice(1)],
					description: options$1.metadata?.openapi?.description,
					operationId: options$1.metadata?.openapi?.operationId,
					security: [{ bearerAuth: [] }],
					parameters: getParameters(options$1),
					responses: getResponse(options$1.metadata?.openapi?.responses)
				}
			};
			if (options$1.method === "POST" || options$1.method === "PATCH" || options$1.method === "PUT") paths[path] = {
				...paths[path],
				[options$1.method.toLowerCase()]: {
					tags: options$1.metadata?.openapi?.tags || [plugin.id.charAt(0).toUpperCase() + plugin.id.slice(1)],
					description: options$1.metadata?.openapi?.description,
					operationId: options$1.metadata?.openapi?.operationId,
					security: [{ bearerAuth: [] }],
					parameters: getParameters(options$1),
					requestBody: getRequestBody(options$1),
					responses: getResponse(options$1.metadata?.openapi?.responses)
				}
			};
		});
	}
	return {
		openapi: "3.1.1",
		info: {
			title: "Better Auth",
			description: "API Reference for your Better Auth Instance",
			version: "1.1.0"
		},
		components: {
			...components,
			securitySchemes: {
				apiKeyCookie: {
					type: "apiKey",
					in: "cookie",
					name: "apiKeyCookie",
					description: "API Key authentication via cookie"
				},
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					description: "Bearer token authentication"
				}
			}
		},
		security: [{
			apiKeyCookie: [],
			bearerAuth: []
		}],
		servers: [{ url: ctx.baseURL }],
		tags: [{
			name: "Default",
			description: "Default endpoints that are included with Better Auth by default. These endpoints are not part of any plugin."
		}],
		paths
	};
}

//#endregion
export { generator };
//# sourceMappingURL=generator.mjs.map