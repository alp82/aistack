import { z as z3 } from "zod/v3";
import * as z4 from "zod/v4";
import * as z4Core from "zod/v4/core";
import { zid as zid3, zCustomQuery as zCustomQuery3, zCustomMutation as zCustomMutation3, zCustomAction as zCustomAction3, zodToConvex as zodToConvex3, zodOutputToConvex as zodOutputToConvex3, Zid as Zid3, withSystemFields as withSystemFields3, ZodBrandedInputAndOutput as ZodBrandedInputAndOutput3, zBrand as zBrand3, convexToZod as convexToZod3, convexToZodFields as convexToZodFields3, } from "./zod3.js";
import { zodToConvex as zodToConvex4, zodOutputToConvex as zodOutputToConvex4, withSystemFields as withSystemFields4, } from "./zod4.js";
/**
 * @deprecated Please import from `convex-helpers/server/zod3` instead.
 */
export const zid = zid3;
/**
 * @deprecated Please import from `convex-helpers/server/zod3` instead.
 */
export const zCustomQuery = zCustomQuery3;
/**
 * @deprecated Please import from `convex-helpers/server/zod3` instead.
 */
export const zCustomMutation = zCustomMutation3;
/**
 * @deprecated Please import from `convex-helpers/server/zod3` instead.
 */
export const zCustomAction = zCustomAction3;
export function zodToConvex(validator) {
    return "_zod" in validator
        ? zodToConvex4(validator)
        : zodToConvex3(validator);
}
export function zodOutputToConvex(validator) {
    return "_zod" in validator
        ? zodOutputToConvex4(validator)
        : zodOutputToConvex3(validator);
}
export function zodToConvexFields(fields) {
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [
        k,
        "_zod" in v ? zodToConvex4(v) : zodToConvex3(v),
    ]));
}
export function zodOutputToConvexFields(fields) {
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [
        k,
        "_zod" in v ? zodOutputToConvex4(v) : zodOutputToConvex3(v),
    ]));
}
/**
 * @deprecated Please import from `convex-helpers/server/zod3` instead.
 */
export const Zid = Zid3;
export function withSystemFields(tableName, zObject) {
    const firstValidator = Object.values(zObject)[0];
    const isZod4 = firstValidator !== undefined ? "_zod" in firstValidator : true;
    return isZod4
        ? withSystemFields4(tableName, zObject)
        : withSystemFields3(tableName, zObject);
}
/**
 * @deprecated Please import from `convex-helpers/server/zod3` instead.
 */
export const ZodBrandedInputAndOutput = ZodBrandedInputAndOutput3;
/**
 * @deprecated Please import from `convex-helpers/server/zod3` instead.
 */
export const zBrand = zBrand3;
/**
 * @deprecated Please import from `convex-helpers/server/zod3` instead.
 */
export const convexToZod = convexToZod3;
/**
 * @deprecated Please import from `convex-helpers/server/zod3` instead.
 */
export const convexToZodFields = convexToZodFields3;
