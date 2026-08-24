import type { DBAdapterDebugLogOption } from "better-auth/adapters";
import type { GenericActionCtx, GenericDataModel, SchemaDefinition } from "convex/server";
import type defaultSchema from "../component/schema.js";
import type { ComponentApi } from "../component/_generated/component.js";
import type { AuthFunctions, GenericCtx, Triggers } from "./index.js";
export declare const convexAdapter: <DataModel extends GenericDataModel, Ctx extends GenericCtx<DataModel> = GenericActionCtx<DataModel>, Schema extends SchemaDefinition<any, any> = typeof defaultSchema>(ctx: Ctx, api: {
    adapter: ComponentApi["adapter"];
    adapterTest?: ComponentApi["adapterTest"];
}, config?: {
    debugLogs?: DBAdapterDebugLogOption;
    authFunctions?: AuthFunctions;
    triggers?: Triggers<DataModel, Schema>;
}) => import("better-auth/adapters").AdapterFactory;
//# sourceMappingURL=adapter.d.ts.map