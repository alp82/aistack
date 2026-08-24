import type { GenericDatabaseReader } from "convex/server";
import type { Infer, Validator } from "convex/values";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { GenericDataModel } from "convex/server";
/**
 * Convert a Convex validator to a Standard Schema.
 * @param validator - The Convex validator to convert.
 * @param opts - Options for the validation.
 * @returns The Standard Schema validator with the type of the Convex validator.
 */
export declare function toStandardSchema<V extends Validator<any, any, any>>(validator: V, opts?: {
    db?: GenericDatabaseReader<GenericDataModel>;
    allowUnknownFields?: boolean;
    _pathPrefix?: string;
}): StandardSchemaV1<Infer<V>>;
//# sourceMappingURL=standardSchema.d.ts.map