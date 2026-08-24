import { DBFieldAttribute } from "@better-auth/core/db";
import * as z from "zod";

//#region src/db/to-zod.d.ts
declare function toZodSchema<Fields extends Record<string, DBFieldAttribute | never>, IsClientSide extends boolean>({
  fields,
  isClientSide
}: {
  fields: Fields;
  /**
   * If true, then any fields that have `input: false` will be removed from the schema to prevent user input.
   */
  isClientSide: IsClientSide;
}): z.ZodObject<RemoveNeverProps<{ [key in keyof Fields]: FieldAttributeToSchema<Fields[key], IsClientSide> }>, z.core.$strip>;
type FieldAttributeToSchema<Field extends DBFieldAttribute | Record<string, never>, isClientSide$1 extends boolean = false> = Field extends {
  type: any;
} ? GetInput<isClientSide$1, Field, GetRequired<Field, GetType<Field>>> : Record<string, never>;
type GetType<F extends DBFieldAttribute> = F extends {
  type: "string";
} ? z.ZodString : F extends {
  type: "number";
} ? z.ZodNumber : F extends {
  type: "boolean";
} ? z.ZodBoolean : F extends {
  type: "date";
} ? z.ZodDate : z.ZodAny;
type GetRequired<F extends DBFieldAttribute, Schema extends z.core.SomeType> = F extends {
  required: true;
} ? Schema : z.ZodOptional<Schema>;
type GetInput<isClientSide$1 extends boolean, Field extends DBFieldAttribute, Schema extends z.core.SomeType> = Field extends {
  input: false;
} ? isClientSide$1 extends true ? never : Schema : Schema;
type RemoveNeverProps<T> = { [K in keyof T as [T[K]] extends [never] ? never : K]: T[K] };
//#endregion
export { FieldAttributeToSchema, toZodSchema };
//# sourceMappingURL=to-zod.d.mts.map