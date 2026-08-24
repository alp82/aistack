import { asObjectValidator, v } from "convex/values";
import { assert } from "./index.js";
/**
 * Helper for defining a union of literals more concisely.
 *
 * e.g. `literals("a", 1, false)` is equivalent to
 * `v.union(v.literal("a"), v.literal(1), v.literal(false))`
 * To use with an array:
 * ```ts
 * const myLiterals = ["a", 1, false] as const;
 * const literalValidator = literals(...myLiterals)
 * ```
 * A similar result can be achieved with `v.union(...myLiterals.map(v.literal))`
 * however the type of each union member will be the union of literal types,
 * rather than each member being a specific literal type.
 *
 * @param args Values you want to use in a union of literals.
 * @returns A validator for the union of the literals.
 */
export const literals = (...args) => {
    return v.union(...args.map(v.literal));
};
/**
 * nullable define a validator that can be the value or null more consisely.
 *
 * @param x The validator to make nullable. As in, it can be the value or null.
 * @returns A new validator that can be the value or null.
 */
export const nullable = (x) => v.union(v.null(), x);
export function partial(fieldsOrObjOrUnion) {
    if (fieldsOrObjOrUnion.isConvexValidator) {
        if (fieldsOrObjOrUnion.kind === "object") {
            return partialVObject(fieldsOrObjOrUnion);
        }
        if (fieldsOrObjOrUnion.kind === "union") {
            return partialUnion(fieldsOrObjOrUnion);
        }
        throw new Error("partial only works with union or object Validators, or a Record<string, Validator> currently");
    }
    return partialFields(fieldsOrObjOrUnion);
}
/**
 * partialFields helps you define an object of optional validators more concisely.
 *
 * e.g. `partialFields({a: v.string(), b: v.number()})` is equivalent to
 * `{a: v.optional(v.string()), b: v.optional(v.number())}`
 *
 * @param obj The object of validators to make optional. e.g. {a: v.string()}
 * @returns A new object of validators that can be the value or undefined.
 */
function partialFields(obj) {
    return Object.fromEntries(Object.entries(obj).map(([k, vv]) => [
        k,
        vv.isOptional === "optional" ? vv : v.optional(vv),
    ]));
}
/**
 * partialObject helps you define an object of optional validators more concisely.
 *
 * e.g. `partialObject({a: v.string(), b: v.number()})` is equivalent to
 * `{a: v.optional(v.string()), b: v.optional(v.number())}`
 *
 * @param obj The object of validators to make optional. e.g. {a: v.string()}
 * @returns A new object of validators that can be the value or undefined.
 */
function partialVObject(obj) {
    const o = v.object(partialFields(obj.fields));
    if (obj.isOptional === "optional") {
        return v.optional(o);
    }
    return o;
}
function partialUnion(union) {
    const u = v.union(...union.members.map((m) => {
        assert(m.isOptional === "required", "Union members cannot be optional");
        if (m.kind === "object") {
            return partialVObject(m);
        }
        if (m.kind === "union") {
            return partialUnion(m);
        }
        throw new Error(`Invalid union member type: ${m.kind}`);
    }));
    if (union.isOptional === "optional") {
        return v.optional(u);
    }
    return u;
}
// Shorthand for defining validators that look like types.
/** @deprecated Use `v.string()` instead. Any string value. */
export const string = v.string();
/** @deprecated Use `v.float64()` instead. JavaScript number, represented as a float64 in the database. */
export const number = v.float64();
/** @deprecated Use `v.float64()` instead. JavaScript number, represented as a float64 in the database. */
export const float64 = v.float64();
/** @deprecated Use `v.boolean()` instead. boolean value. For typing it only as true, use `l(true)` */
export const boolean = v.boolean();
/** @deprecated Use `v.int64()` instead. bigint, though stored as an int64 in the database. */
export const biging = v.int64();
/** @deprecated Use `v.int64()` instead. bigint, though stored as an int64 in the database. */
export const int64 = v.int64();
/** @deprecated Use `v.any()` instead. Any Convex value */
export const any = v.any();
/** @deprecated Use `v.null()` instead. Null value. Underscore is so it doesn't shadow the null builtin */
export const null_ = v.null();
/** @deprecated Use `v.*()` instead. */
export const { id, object, array, bytes, literal, optional, union } = v;
/** @deprecated Use `v.bytes()` instead. ArrayBuffer validator. */
export const arrayBuffer = v.bytes();
/**
 * Utility to get the validators for fields associated with a table.
 * e.g. for systemFields("users") it would return:
 * { _id: v.id("users"), _creationTime: v.number() }
 *
 * @param tableName The table name in the schema.
 * @returns Validators for the system fields: _id and _creationTime
 */
export const systemFields = (tableName) => ({
    _id: v.id(tableName),
    _creationTime: v.number(),
});
/**
 * Utility to add system fields to an object with fields mapping to validators.
 * e.g. withSystemFields("users", { name: v.string() }) would return:
 * { name: v.string(), _id: v.id("users"), _creationTime: v.number() }
 *
 * @param tableName Table name in the schema.
 * @param fields The fields of the table mapped to their validators.
 * @returns The fields plus system fields _id and _creationTime.
 */
export const withSystemFields = (tableName, fields) => {
    const system = systemFields(tableName);
    return {
        ...fields,
        ...system,
    };
};
export function addFieldsToValidator(validatorOrFields, fields) {
    const validator = asObjectValidator(validatorOrFields);
    if (Object.keys(fields).length === 0) {
        return validator;
    }
    switch (validator.kind) {
        case "object":
            return v.object(intersectValidators(validator.fields, fields));
        case "union":
            return v.union(...validator.members.map((m) => addFieldsToValidator(m, fields)));
        default:
            throw new Error("Cannot add arguments to a validator that is not an object or union.");
    }
}
function intersectValidators(fields, fields2) {
    const specificFields = { ...fields };
    for (const [k, v] of Object.entries(fields2)) {
        const existing = specificFields[k];
        if (existing) {
            if (existing.kind !== v.kind) {
                // TODO: handle unions & literals & other sub-types (incl. optionals)
                throw new Error(`Cannot intersect validators with different kinds: ${existing.kind} and ${v.kind}`);
            }
            if (existing.isOptional !== v.isOptional) {
                if (existing.isOptional === "optional") {
                    // prefer the required validator
                    specificFields[k] = v;
                }
            }
        }
        else {
            specificFields[k] = v;
        }
    }
    return specificFields;
}
export const doc = (schema, tableName) => {
    function addSystemFields(validator) {
        if (validator.kind === "object") {
            return v.object({
                ...validator.fields,
                ...systemFields(tableName),
            });
        }
        if (validator.kind !== "union") {
            throw new Error("Only object and union validators are supported for documents");
        }
        return v.union(...validator.members.map(addSystemFields));
    }
    return addSystemFields(schema.tables[tableName].validator);
};
/**
 * Creates a validator with a type-safe `.id(table)` and a new `.doc(table)`.
 * Can be used instead of `v` for function arugments & return validators.
 * However, it cannot be used as part of defining a schema, since it would be
 * circular.
 * ```ts
 * import schema from "./schema";
 * export const vv = typedV(schema);
 *
 * export const myQuery = query({
 *   args: { docId: vv.id("mytable") },
 *   returns: vv.doc("mytable"),
 *   handler: (ctx, args) => ctx.db.get(args.docId),
 * })
 *
 * @param schema Typically from `import schema from "./schema"`.
 * @returns A validator like `v` with type-safe `v.id` and a new `v.doc`
 */
export function typedV(schema) {
    return {
        ...v,
        /**
         * Similar to v.id but is type-safe on the table name.
         * @param tableName A table named in your schema.
         * @returns A validator for an ID to the named table.
         */
        id: (tableName) => v.id(tableName),
        /**
         * Generates a validator for a document, including system fields.
         * To be used in validators when passing a full document in or out of a
         * function.
         * @param tableName A table named in your schema.
         * @returns A validator that matches the schema validator, adding _id and
         * _creationTime. If the validator was a union, it will update all documents
         * recursively, but will currently lose the VUnion-specific type.
         */
        doc: (tableName) => doc(schema, tableName),
    };
}
/**
 * A string validator that is a branded string type.
 *
 * Read more at https://stack.convex.dev/using-branded-types-in-validators
 *
 * @param _brand - A unique string literal to brand the string with
 */
export const brandedString = (_brand) => v.string();
/** Mark fields as deprecated with this permissive validator typed as null */
export const deprecated = v.optional(v.any());
/** A maximally permissive validator that type checks as a given validator.
 *
 * If you want to have types that match some validator but you have invalid data
 * and you want to temporarily not validate schema for this field,
 * you can use this function to cast the permissive validator.
 *
 * Example in a schema:
 * ```ts
 * export default defineSchema({
 *   myTable: defineTable({
 *    myString: pretend(v.array(v.string())),
 *   }),
 * });
 * //...in some mutation
 * ctx.db.insert("myTable", { myString: 123 as any }); // no runtime error
 * ```
 * Example in function argument validation:
 * ```ts
 * const myQuery = defineQuery({
 *   args: { myNumber: pretend(v.number()) },
 *   handler: async (ctx, args) => {
 *     // args.myNumber is typed as number, but it's not validated.
 *     const num = typeof args.myNumber === "number" ?
 *       args.myNumber : Number(args.myNumber);
 *   },
 * });
 */
export const pretend = (_typeToImmitate) => v.optional(v.any());
/** A validator that validates as optional but type checks as required.
 *
 * If you want to assume a field is set for type checking, but your data may not
 * actually have it set for all documents (e.g. when adding a new field),
 * you can use this function to allow the field to be unset at runtime.
 * This is unsafe, but can be convenient in these situations:
 *
 * 1. You are developing locally and want to add a required field and write
 *   code assuming it is set. Once you push the code & schema, you can update
 *   the data to match before running your code.
 * 2. You are going to run a migration right after pushing code, and are ok with
 *   and you don't want to edit your code to handle the field being unset,
 *   your app being in an inconsistent state until the migration completes.
 *
 * This differs from {@link pretend} in that it type checks the inner validator,
 * if the value is provided.
 *
 * Example in a schema:
 * ```ts
 * export default defineSchema({
 *   myTable: defineTable({
 *    myString: pretendRequired(v.array(v.string())),
 *   }),
 * });
 * //...in some mutation
 * ctx.db.insert("myTable", { myString: undefined }); // no runtime error
 * ```
 * Example in function argument validation:
 * ```ts
 * const myQuery = defineQuery({
 *   args: { myNumber: pretendRequired(v.number()) },
 *   handler: async (ctx, args) => {
 *     // args.myNumber is typed as number, but it might be undefined
 *     const num = args.myNumber || 0;
 *   },
 * });
 */
export const pretendRequired = (optionalType) => v.optional(optionalType);
export class ValidationError extends Error {
    expected;
    got;
    path;
    constructor(expected, got, path) {
        const message = `Validator error${path ? ` for ${path}` : ""}: Expected \`${expected}\`, got \`${got}\``;
        super(message);
        this.expected = expected;
        this.got = got;
        this.path = path;
        this.name = "ValidationError";
    }
}
/**
 * Validate a value against a validator.
 *
 * WARNING: This does not validate that v.id is an ID for the given table.
 * It only validates that the ID is a string. Function `args`, `returns` and
 * schema definitions will validate that the ID is an ID for the given table.
 *
 * @param validator The validator to validate against.
 * @param value The value to validate.
 * @returns Whether the value is valid against the validator.
 */
export function validate(validator, value, opts) {
    let valid = true;
    let expected = validator.kind;
    let got;
    if (value === undefined) {
        if (validator.isOptional !== "optional") {
            valid = false;
        }
    }
    else {
        switch (validator.kind) {
            case "null": {
                if (value !== null) {
                    valid = false;
                }
                break;
            }
            case "float64": {
                if (typeof value !== "number") {
                    expected = "number";
                    valid = false;
                }
                break;
            }
            case "int64": {
                if (typeof value !== "bigint") {
                    expected = "bigint";
                    valid = false;
                }
                break;
            }
            case "boolean": {
                if (typeof value !== "boolean") {
                    valid = false;
                }
                break;
            }
            case "string": {
                if (typeof value !== "string") {
                    valid = false;
                }
                break;
            }
            case "bytes": {
                if (!(value instanceof ArrayBuffer)) {
                    valid = false;
                }
                break;
            }
            case "any": {
                break;
            }
            case "literal": {
                if (value !== validator.value) {
                    valid = false;
                    expected = validator.value;
                    if (["string", "number", "boolean", "bigint"].includes(typeof value)) {
                        got = `"${value}"`;
                    }
                }
                break;
            }
            case "id": {
                if (typeof value !== "string") {
                    valid = false;
                }
                else if (opts?.db) {
                    expected = `Id<${validator.tableName}>`;
                    const id = opts.db.normalizeId(validator.tableName, value);
                    if (!id) {
                        valid = false;
                    }
                }
                break;
            }
            case "array": {
                if (!Array.isArray(value)) {
                    valid = false;
                    break;
                }
                for (const [index, v] of value.entries()) {
                    const path = `${opts?._pathPrefix ?? ""}[${index}]`;
                    valid = validate(validator.element, v, {
                        ...opts,
                        _pathPrefix: path,
                    });
                    if (!valid) {
                        expected = validator.element.kind;
                        break;
                    }
                }
                break;
            }
            case "object": {
                if (typeof value !== "object" || value === null) {
                    valid = false;
                    break;
                }
                const prototype = Object.getPrototypeOf(value);
                const isSimple = prototype === null ||
                    prototype === Object.prototype ||
                    // Objects generated from other contexts (e.g. across Node.js `vm` modules) will not satisfy the previous
                    // conditions but are still simple objects.
                    prototype?.constructor?.name === "Object";
                if (!isSimple) {
                    expected =
                        (prototype?.constructor?.name ?? typeof prototype) || "object";
                    valid = false;
                    break;
                }
                for (const [k, fieldValidator] of Object.entries(validator.fields)) {
                    valid = validate(fieldValidator, value[k], {
                        ...opts,
                        _pathPrefix: appendPath(opts, k),
                    });
                    if (!valid) {
                        break;
                    }
                }
                if (!opts?.allowUnknownFields) {
                    for (const k of Object.keys(value)) {
                        if (validator.fields[k] === undefined) {
                            if (opts?.throw) {
                                throw new ValidationError("nothing", typeof value[k], appendPath(opts, k));
                            }
                            valid = false;
                            break;
                        }
                    }
                }
                break;
            }
            case "union": {
                valid = false;
                let error;
                for (const member of validator.members) {
                    try {
                        if (validate(member, value, opts)) {
                            valid = true;
                            break;
                        }
                    }
                    catch (e) {
                        error = e;
                    }
                }
                if (!valid && error) {
                    throw error;
                }
                break;
            }
            case "record": {
                if (typeof value !== "object" || value === null) {
                    valid = false;
                    break;
                }
                for (const [k, fieldValue] of Object.entries(value)) {
                    valid = validate(validator.key, k, {
                        ...opts,
                        _pathPrefix: appendPath(opts, k),
                    });
                    if (!valid) {
                        expected = validator.key.kind;
                        break;
                    }
                    valid = validate(validator.value, fieldValue, {
                        ...opts,
                        _pathPrefix: appendPath(opts, k),
                    });
                    if (!valid) {
                        expected = validator.value.kind;
                        break;
                    }
                }
                break;
            }
        }
    }
    if (!valid && opts?.throw) {
        throw new ValidationError(expected, got ?? (value === null ? "null" : typeof value), opts?._pathPrefix);
    }
    return valid;
}
/**
 * Parse a value, using a Convex validator. This differs from `validate` in that
 * it strips unknown fields instead of throwing an error on them.
 *
 * @param validator - The Convex validator to parse the value against.
 * @param value - The value to parse.
 * @returns The parsed value, without fields not specified in the validator.
 */
export function parse(validator, value) {
    validate(validator, value, { allowUnknownFields: true, throw: true });
    return stripUnknownFields(validator, value);
}
function stripUnknownFields(validator, value) {
    if (validator.isOptional === "optional" && value === undefined) {
        return value;
    }
    assert(value !== undefined);
    switch (validator.kind) {
        case "object": {
            const result = {};
            for (const [k, v] of Object.entries(value)) {
                if (validator.fields[k] !== undefined && v !== undefined) {
                    result[k] = stripUnknownFields(validator.fields[k], v);
                }
            }
            return result;
        }
        case "record": {
            const result = {};
            for (const [k, v] of Object.entries(value)) {
                result[k] = stripUnknownFields(validator.value, v);
            }
            return result;
        }
        case "array": {
            return value.map((e) => stripUnknownFields(validator.element, e));
        }
        case "union": {
            // First try a strict match
            for (const member of validator.members) {
                if (validate(member, value, { allowUnknownFields: false })) {
                    return stripUnknownFields(member, value);
                }
            }
            // Then try a permissive match
            for (const member of validator.members) {
                if (validate(member, value, { allowUnknownFields: true })) {
                    return stripUnknownFields(member, value);
                }
            }
            throw new Error("No matching member in union");
        }
        default: {
            return value;
        }
    }
}
function appendPath(opts, path) {
    return opts?._pathPrefix ? `${opts._pathPrefix}.${path}` : path;
}
/**
 * Converts an optional validator to a required validator.
 *
 * This is the inverse of `v.optional()`. It takes a validator that may be optional
 * and returns the equivalent required validator.
 *
 * ```ts
 * const optionalString = v.optional(v.string());
 * const requiredString = vRequired(optionalString); // v.string()
 *
 * // Already required validators are returned as-is
 * const alreadyRequired = v.string();
 * const stillRequired = vRequired(alreadyRequired); // v.string()
 * ```
 *
 * @param validator The validator to make required.
 * @returns A required version of the validator.
 */
export function vRequired(validator) {
    const { kind, isOptional } = validator;
    if (isOptional === "required") {
        // TypeScript can't prove T is already VRequired<T>, so we go via unknown.
        return validator;
    }
    switch (kind) {
        case "id":
            return v.id(validator.tableName);
        case "string":
            return v.string();
        case "float64":
            return v.float64();
        case "int64":
            return v.int64();
        case "boolean":
            return v.boolean();
        case "null":
            return v.null();
        case "any":
            return v.any();
        case "literal":
            return v.literal(validator.value);
        case "bytes":
            return v.bytes();
        case "object":
            return v.object(validator.fields);
        case "array":
            return v.array(validator.element);
        case "record":
            return v.record(validator.key, validator.value);
        case "union":
            return v.union(...validator.members);
        default:
            kind;
            throw new Error("Unknown Convex validator type: " + kind);
    }
}
