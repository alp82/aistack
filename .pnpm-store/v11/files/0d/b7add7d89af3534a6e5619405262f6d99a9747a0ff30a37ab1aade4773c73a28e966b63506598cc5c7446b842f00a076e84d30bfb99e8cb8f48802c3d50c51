import { TSS_SERVER_FUNCTION_FACTORY, TSS_SERVER_FUNCTION } from './constants.js';
import { AnyValidator, Constrain, Expand, Register, RegisteredSerializableInput, ResolveValidatorInput, ValidateSerializable, ValidateSerializableInput, Validator } from '@tanstack/router-core';
import { AnyFunctionMiddleware, AnyRequestMiddleware, AssignAllServerFnContext, IntersectAllValidatorInputs, IntersectAllValidatorOutputs } from './createMiddleware.js';
export type CreateServerFn<TRegister> = <TMethod extends Method, TResponse = unknown, TMiddlewares = undefined, TInputValidator = undefined>(options?: {
    method?: TMethod;
}, __opts?: ServerFnBaseOptions<TRegister, TMethod, TResponse, TMiddlewares, TInputValidator>) => ServerFnBuilder<TRegister, TMethod>;
export declare const createServerFn: CreateServerFn<Register>;
export declare function executeMiddleware(middlewares: Array<AnyFunctionMiddleware | AnyRequestMiddleware>, env: 'client' | 'server', opts: ServerFnMiddlewareOptions): Promise<ServerFnMiddlewareResult>;
export type CompiledFetcherFnOptions = {
    method: Method;
    data: unknown;
    headers?: HeadersInit;
    signal?: AbortSignal;
    context?: any;
};
export type Fetcher<TMiddlewares, TInputValidator, TResponse> = undefined extends IntersectAllValidatorInputs<TMiddlewares, TInputValidator> ? OptionalFetcher<TMiddlewares, TInputValidator, TResponse> : RequiredFetcher<TMiddlewares, TInputValidator, TResponse>;
export interface FetcherBase {
    [TSS_SERVER_FUNCTION]: true;
    url: string;
    __executeServer: (opts: {
        method: Method;
        data: unknown;
        headers?: HeadersInit;
        context?: any;
        signal: AbortSignal;
    }) => Promise<unknown>;
}
export interface OptionalFetcher<TMiddlewares, TInputValidator, TResponse> extends FetcherBase {
    (options?: OptionalFetcherDataOptions<TMiddlewares, TInputValidator>): Promise<Awaited<TResponse>>;
}
export interface RequiredFetcher<TMiddlewares, TInputValidator, TResponse> extends FetcherBase {
    (opts: RequiredFetcherDataOptions<TMiddlewares, TInputValidator>): Promise<Awaited<TResponse>>;
}
export type FetcherBaseOptions = {
    headers?: HeadersInit;
    signal?: AbortSignal;
};
export interface OptionalFetcherDataOptions<TMiddlewares, TInputValidator> extends FetcherBaseOptions {
    data?: Expand<IntersectAllValidatorInputs<TMiddlewares, TInputValidator>>;
}
export interface RequiredFetcherDataOptions<TMiddlewares, TInputValidator> extends FetcherBaseOptions {
    data: Expand<IntersectAllValidatorInputs<TMiddlewares, TInputValidator>>;
}
export type RscStream<T> = {
    __cacheState: T;
};
export type Method = 'GET' | 'POST';
export type ServerFnReturnType<TRegister, TResponse> = TResponse extends PromiseLike<infer U> ? Promise<ServerFnReturnType<TRegister, U>> : TResponse extends Response ? TResponse : ValidateSerializableInput<TRegister, TResponse>;
export type ServerFn<TRegister, TMethod, TMiddlewares, TInputValidator, TResponse> = (ctx: ServerFnCtx<TRegister, TMiddlewares, TInputValidator>) => ServerFnReturnType<TRegister, TResponse>;
export interface ServerFnCtx<TRegister, TMiddlewares, TInputValidator> {
    data: Expand<IntersectAllValidatorOutputs<TMiddlewares, TInputValidator>>;
    context: Expand<AssignAllServerFnContext<TRegister, TMiddlewares, {}>>;
    signal: AbortSignal;
}
export type CompiledFetcherFn<TRegister, TResponse> = {
    (opts: CompiledFetcherFnOptions & ServerFnBaseOptions<TRegister, Method>): Promise<TResponse>;
    url: string;
};
export type ServerFnBaseOptions<TRegister, TMethod extends Method = 'GET', TResponse = unknown, TMiddlewares = unknown, TInputValidator = unknown> = {
    method: TMethod;
    middleware?: Constrain<TMiddlewares, ReadonlyArray<AnyFunctionMiddleware | AnyRequestMiddleware>>;
    inputValidator?: ConstrainValidator<TRegister, TMethod, TInputValidator>;
    extractedFn?: CompiledFetcherFn<TRegister, TResponse>;
    serverFn?: ServerFn<TRegister, TMethod, TMiddlewares, TInputValidator, TResponse>;
    functionId: string;
};
export type ValidateValidatorInput<TRegister, TMethod extends Method, TInputValidator> = TMethod extends 'POST' ? ResolveValidatorInput<TInputValidator> extends FormData ? ResolveValidatorInput<TInputValidator> : ValidateSerializable<ResolveValidatorInput<TInputValidator>, RegisteredSerializableInput<TRegister>> : ValidateSerializable<ResolveValidatorInput<TInputValidator>, RegisteredSerializableInput<TRegister>>;
export type ValidateValidator<TRegister, TMethod extends Method, TInputValidator> = ValidateValidatorInput<TRegister, TMethod, TInputValidator> extends infer TInput ? Validator<TInput, any> : never;
export type ConstrainValidator<TRegister, TMethod extends Method, TInputValidator> = (unknown extends TInputValidator ? TInputValidator : ResolveValidatorInput<TInputValidator> extends ValidateValidator<TRegister, TMethod, TInputValidator> ? TInputValidator : never) | ValidateValidator<TRegister, TMethod, TInputValidator>;
export type AppendMiddlewares<TMiddlewares, TNewMiddlewares> = TMiddlewares extends ReadonlyArray<any> ? TNewMiddlewares extends ReadonlyArray<any> ? readonly [...TMiddlewares, ...TNewMiddlewares] : TMiddlewares : TNewMiddlewares;
export interface ServerFnMiddleware<TRegister, TMethod extends Method, TMiddlewares, TInputValidator> {
    middleware: <const TNewMiddlewares>(middlewares: Constrain<TNewMiddlewares, ReadonlyArray<AnyFunctionMiddleware | AnyRequestMiddleware | AnyServerFn>>) => ServerFnAfterMiddleware<TRegister, TMethod, AppendMiddlewares<TMiddlewares, TNewMiddlewares>, TInputValidator>;
}
export interface ServerFnAfterMiddleware<TRegister, TMethod extends Method, TMiddlewares, TInputValidator> extends ServerFnWithTypes<TRegister, TMethod, TMiddlewares, TInputValidator, undefined>, ServerFnMiddleware<TRegister, TMethod, TMiddlewares, undefined>, ServerFnValidator<TRegister, TMethod, TMiddlewares>, ServerFnHandler<TRegister, TMethod, TMiddlewares, TInputValidator> {
    <TNewMethod extends Method = TMethod>(options?: {
        method?: TNewMethod;
    }): ServerFnAfterMiddleware<TRegister, TNewMethod, TMiddlewares, TInputValidator>;
}
export type ValidatorFn<TRegister, TMethod extends Method, TMiddlewares> = <TInputValidator>(inputValidator: ConstrainValidator<TRegister, TMethod, TInputValidator>) => ServerFnAfterValidator<TRegister, TMethod, TMiddlewares, TInputValidator>;
export interface ServerFnValidator<TRegister, TMethod extends Method, TMiddlewares> {
    inputValidator: ValidatorFn<TRegister, TMethod, TMiddlewares>;
}
export interface ServerFnAfterValidator<TRegister, TMethod extends Method, TMiddlewares, TInputValidator> extends ServerFnWithTypes<TRegister, TMethod, TMiddlewares, TInputValidator, undefined>, ServerFnMiddleware<TRegister, TMethod, TMiddlewares, TInputValidator>, ServerFnHandler<TRegister, TMethod, TMiddlewares, TInputValidator> {
}
export interface ServerFnAfterTyper<TRegister, TMethod extends Method, TMiddlewares, TInputValidator> extends ServerFnWithTypes<TRegister, TMethod, TMiddlewares, TInputValidator, undefined>, ServerFnHandler<TRegister, TMethod, TMiddlewares, TInputValidator> {
}
export interface ServerFnHandler<TRegister, TMethod extends Method, TMiddlewares, TInputValidator> {
    handler: <TNewResponse>(fn?: ServerFn<TRegister, TMethod, TMiddlewares, TInputValidator, TNewResponse>) => Fetcher<TMiddlewares, TInputValidator, TNewResponse>;
}
export interface ServerFnBuilder<TRegister, TMethod extends Method = 'GET'> extends ServerFnWithTypes<TRegister, TMethod, undefined, undefined, undefined>, ServerFnMiddleware<TRegister, TMethod, undefined, undefined>, ServerFnValidator<TRegister, TMethod, undefined>, ServerFnHandler<TRegister, TMethod, undefined, undefined> {
    options: ServerFnBaseOptions<TRegister, TMethod, unknown, undefined, undefined>;
}
export interface ServerFnWithTypes<in out TRegister, in out TMethod extends Method, in out TMiddlewares, in out TInputValidator, in out TResponse> {
    '~types': ServerFnTypes<TRegister, TMethod, TMiddlewares, TInputValidator, TResponse>;
    options: ServerFnBaseOptions<TRegister, TMethod, unknown, undefined, undefined>;
    [TSS_SERVER_FUNCTION_FACTORY]: true;
}
export type AnyServerFn = ServerFnWithTypes<any, any, any, any, any>;
export interface ServerFnTypes<in out TRegister, in out TMethod extends Method, in out TMiddlewares, in out TInputValidator, in out TResponse> {
    method: TMethod;
    middlewares: TMiddlewares;
    inputValidator: TInputValidator;
    response: TResponse;
    allServerContext: AssignAllServerFnContext<TRegister, TMiddlewares>;
    allInput: IntersectAllValidatorInputs<TMiddlewares, TInputValidator>;
    allOutput: IntersectAllValidatorOutputs<TMiddlewares, TInputValidator>;
}
export declare function flattenMiddlewares<T extends AnyFunctionMiddleware | AnyRequestMiddleware>(middlewares: Array<T>, maxDepth?: number): Array<T>;
export type ServerFnMiddlewareOptions = {
    method: Method;
    data: any;
    headers?: HeadersInit;
    signal?: AbortSignal;
    sendContext?: any;
    context?: any;
    functionId: string;
};
export type ServerFnMiddlewareResult = ServerFnMiddlewareOptions & {
    result?: unknown;
    error?: unknown;
};
export type NextFn = (ctx: ServerFnMiddlewareResult) => Promise<ServerFnMiddlewareResult>;
export type MiddlewareFn = (ctx: ServerFnMiddlewareOptions & {
    next: NextFn;
}) => Promise<ServerFnMiddlewareResult>;
export declare function execValidator(validator: AnyValidator, input: unknown): Promise<unknown>;
