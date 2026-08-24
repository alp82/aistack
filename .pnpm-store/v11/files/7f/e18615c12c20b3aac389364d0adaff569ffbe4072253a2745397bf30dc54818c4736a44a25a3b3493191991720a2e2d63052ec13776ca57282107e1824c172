export type IsomorphicFn<TArgs extends Array<any> = [], TServer = undefined, TClient = undefined> = (...args: TArgs) => TServer | TClient;
export interface ServerOnlyFn<TArgs extends Array<any>, TServer> extends IsomorphicFn<TArgs, TServer> {
    client: <TClient>(clientImpl: (...args: TArgs) => TClient) => IsomorphicFn<TArgs, TServer, TClient>;
}
export interface ClientOnlyFn<TArgs extends Array<any>, TClient> extends IsomorphicFn<TArgs, undefined, TClient> {
    server: <TServer>(serverImpl: (...args: TArgs) => TServer) => IsomorphicFn<TArgs, TServer, TClient>;
}
export interface IsomorphicFnBase {
    server: <TArgs extends Array<any>, TServer>(serverImpl: (...args: TArgs) => TServer) => ServerOnlyFn<TArgs, TServer>;
    client: <TArgs extends Array<any>, TClient>(clientImpl: (...args: TArgs) => TClient) => ClientOnlyFn<TArgs, TClient>;
}
export declare function createIsomorphicFn(): IsomorphicFnBase;
