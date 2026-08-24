import { AnyRouter } from '@tanstack/router-core';
import { QueryClient } from '@tanstack/query-core';
export type RouterSsrQueryOptions<TRouter extends AnyRouter> = {
    router: TRouter;
    queryClient: QueryClient;
    /**
     * If `true`, the QueryClient will handle errors thrown by `redirect()` inside of mutations and queries.
     *
     * @default true
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/api/router/redirectFunction)
     */
    handleRedirects?: boolean;
};
export declare function setupCoreRouterSsrQueryIntegration<TRouter extends AnyRouter>({ router, queryClient, handleRedirects, }: RouterSsrQueryOptions<TRouter>): void;
