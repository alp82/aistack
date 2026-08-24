import type { Auth } from "better-auth";
import type { betterAuth } from "better-auth/minimal";
import type { AuthProvider, DefaultFunctionArgs, FunctionReference, GenericActionCtx, GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { Jwk } from "better-auth/plugins/jwt";
export type CreateAuth<DataModel extends GenericDataModel, A extends ReturnType<typeof betterAuth> = Auth> = (ctx: GenericCtx<DataModel>) => A;
export type EventFunction<T extends DefaultFunctionArgs> = FunctionReference<"mutation", "internal" | "public", T>;
export type GenericCtx<DataModel extends GenericDataModel = GenericDataModel> = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel> | GenericActionCtx<DataModel>;
export type RunMutationCtx<DataModel extends GenericDataModel> = (GenericMutationCtx<DataModel> | GenericActionCtx<DataModel>) & {
    runMutation: GenericMutationCtx<DataModel>["runMutation"];
};
export declare const isQueryCtx: <DataModel extends GenericDataModel>(ctx: GenericCtx<DataModel>) => ctx is GenericQueryCtx<DataModel>;
export declare const isMutationCtx: <DataModel extends GenericDataModel>(ctx: GenericCtx<DataModel>) => ctx is GenericMutationCtx<DataModel>;
export declare const isActionCtx: <DataModel extends GenericDataModel>(ctx: GenericCtx<DataModel>) => ctx is GenericActionCtx<DataModel>;
export declare const isRunMutationCtx: <DataModel extends GenericDataModel>(ctx: GenericCtx<DataModel>) => ctx is RunMutationCtx<DataModel>;
export declare const requireQueryCtx: <DataModel extends GenericDataModel>(ctx: GenericCtx<DataModel>) => GenericQueryCtx<DataModel>;
export declare const requireMutationCtx: <DataModel extends GenericDataModel>(ctx: GenericCtx<DataModel>) => GenericMutationCtx<DataModel>;
export declare const requireActionCtx: <DataModel extends GenericDataModel>(ctx: GenericCtx<DataModel>) => GenericActionCtx<DataModel>;
export declare const requireRunMutationCtx: <DataModel extends GenericDataModel>(ctx: GenericCtx<DataModel>) => RunMutationCtx<DataModel>;
export type GetTokenOptions = {
    forceRefresh?: boolean;
    cookiePrefix?: string;
    jwtCache?: {
        enabled: boolean;
        expirationToleranceSeconds?: number;
        isAuthError: (error: unknown) => boolean;
    };
};
export declare const getToken: (siteUrl: string, headers: Headers, opts?: GetTokenOptions) => Promise<{
    isFresh: boolean;
    token: string | undefined;
}>;
export declare const parseJwks: (providerConfig: AuthProvider) => Jwk | undefined;
//# sourceMappingURL=index.d.ts.map