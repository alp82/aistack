import * as _better_auth_core26 from "@better-auth/core";
import { BetterAuthOptions } from "@better-auth/core";
import * as _better_auth_core_db27 from "@better-auth/core/db";
import { DBFieldAttribute, DBFieldAttributeConfig, DBFieldType } from "@better-auth/core/db";
import * as _standard_schema_spec0 from "@standard-schema/spec";

//#region src/db/field.d.ts
declare const createFieldAttribute: <T extends DBFieldType, C extends DBFieldAttributeConfig>(type: T, config?: C | undefined) => {
  required?: boolean | undefined;
  returned?: boolean | undefined;
  input?: boolean | undefined;
  defaultValue?: (_better_auth_core_db27.DBPrimitive | (() => _better_auth_core_db27.DBPrimitive)) | undefined;
  onUpdate?: (() => _better_auth_core_db27.DBPrimitive) | undefined;
  transform?: {
    input?: (value: _better_auth_core_db27.DBPrimitive) => _better_auth_core26.Awaitable<_better_auth_core_db27.DBPrimitive>;
    output?: (value: _better_auth_core_db27.DBPrimitive) => _better_auth_core26.Awaitable<_better_auth_core_db27.DBPrimitive>;
  } | undefined;
  references?: {
    model: string;
    field: string;
    onDelete?: "no action" | "restrict" | "cascade" | "set null" | "set default";
  } | undefined;
  unique?: boolean | undefined;
  bigint?: boolean | undefined;
  validator?: {
    input?: _standard_schema_spec0.StandardSchemaV1;
    output?: _standard_schema_spec0.StandardSchemaV1;
  } | undefined;
  fieldName?: string | undefined;
  sortable?: boolean | undefined;
  index?: boolean | undefined;
  type: T;
};
type InferValueType<T extends DBFieldType> = T extends "string" ? string : T extends "number" ? number : T extends "boolean" ? boolean : T extends "date" ? Date : T extends "json" ? Record<string, any> : T extends `${infer U}[]` ? U extends "string" ? string[] : number[] : T extends Array<any> ? T[number] : never;
type InferFieldsOutput<Field$1> = Field$1 extends Record<infer Key, DBFieldAttribute> ? { [key in Key as Field$1[key]["returned"] extends false ? never : Field$1[key]["required"] extends false ? Field$1[key]["defaultValue"] extends boolean | string | number | Date ? key : never : key]: InferFieldOutput<Field$1[key]> } & { [key in Key as Field$1[key]["returned"] extends false ? never : Field$1[key]["required"] extends false ? Field$1[key]["defaultValue"] extends boolean | string | number | Date ? never : key : never]?: InferFieldOutput<Field$1[key]> | null } : {};
type InferFieldsInput<Field$1> = Field$1 extends Record<infer Key, DBFieldAttribute> ? { [key in Key as Field$1[key]["required"] extends false ? never : Field$1[key]["defaultValue"] extends string | number | boolean | Date ? never : Field$1[key]["input"] extends false ? never : key]: InferFieldInput<Field$1[key]> } & { [key in Key as Field$1[key]["input"] extends false ? never : key]?: InferFieldInput<Field$1[key]> | undefined | null } : {};
/**
 * For client will add "?" on optional fields
 */
type InferFieldsInputClient<Field$1> = Field$1 extends Record<infer Key, DBFieldAttribute> ? { [key in Key as Field$1[key]["required"] extends false ? never : Field$1[key]["defaultValue"] extends string | number | boolean | Date ? never : Field$1[key]["input"] extends false ? never : key]: InferFieldInput<Field$1[key]> } & { [key in Key as Field$1[key]["input"] extends false ? never : Field$1[key]["required"] extends false ? key : Field$1[key]["defaultValue"] extends string | number | boolean | Date ? key : never]?: InferFieldInput<Field$1[key]> | undefined | null } : {};
type InferFieldOutput<T extends DBFieldAttribute> = T["returned"] extends false ? never : T["required"] extends false ? InferValueType<T["type"]> | undefined | null : InferValueType<T["type"]>;
/**
 * Converts a Record<string, DBFieldAttribute> to an object type
 * with keys and value types inferred from DBFieldAttribute["type"].
 */
type FieldAttributeToObject<Fields extends Record<string, DBFieldAttribute>> = AddOptionalFields<{ [K in keyof Fields]: InferValueType<Fields[K]["type"]> }, Fields>;
type AddOptionalFields<T extends Record<string, any>, Fields extends Record<keyof T, DBFieldAttribute>> = { [K in keyof T as Fields[K] extends {
  required: true;
} ? K : never]: T[K] } & { [K in keyof T as Fields[K] extends {
  required: true;
} ? never : K]?: T[K] };
/**
 * Infer the additional fields from the plugin options.
 * For example, you can infer the additional fields of the org plugin's organization schema like this:
 * ```ts
 * type AdditionalFields = InferAdditionalFieldsFromPluginOptions<"organization", OrganizationOptions>
 * ```
 */
type InferAdditionalFieldsFromPluginOptions<SchemaName extends string, Options extends {
  schema?: { [key in SchemaName]?: {
    additionalFields?: Record<string, DBFieldAttribute>;
  } } | undefined;
}, isClientSide extends boolean = true> = Options["schema"] extends { [key in SchemaName]?: {
  additionalFields: infer Field extends Record<string, DBFieldAttribute>;
} } ? isClientSide extends true ? FieldAttributeToObject<RemoveFieldsWithInputFalse<Field>> : FieldAttributeToObject<Field> : {};
type RemoveFieldsWithInputFalse<T extends Record<string, DBFieldAttribute>> = { [K in keyof T as T[K]["input"] extends false ? never : K]: T[K] };
type InferFieldInput<T extends DBFieldAttribute> = InferValueType<T["type"]>;
type PluginFieldAttribute = Omit<DBFieldAttribute, "transform" | "defaultValue" | "hashValue">;
type InferFieldsFromPlugins<Options extends BetterAuthOptions, Key$1 extends string, Format extends "output" | "input"> = Options["plugins"] extends [] ? {} : Options["plugins"] extends Array<infer T> ? T extends {
  schema: { [key in Key$1]: {
    fields: infer Field;
  } };
} ? Format extends "output" ? InferFieldsOutput<Field> : InferFieldsInput<Field> : {} : {};
type InferFieldsFromOptions<Options extends BetterAuthOptions, Key$1 extends "session" | "user", Format extends "output" | "input"> = Options[Key$1] extends {
  additionalFields: infer Field;
} ? Format extends "output" ? InferFieldsOutput<Field> : InferFieldsInput<Field> : {};
//#endregion
export { FieldAttributeToObject, InferAdditionalFieldsFromPluginOptions, InferFieldsFromOptions, InferFieldsFromPlugins, InferFieldsInput, InferFieldsInputClient, InferFieldsOutput, InferValueType, PluginFieldAttribute, createFieldAttribute };
//# sourceMappingURL=field.d.mts.map