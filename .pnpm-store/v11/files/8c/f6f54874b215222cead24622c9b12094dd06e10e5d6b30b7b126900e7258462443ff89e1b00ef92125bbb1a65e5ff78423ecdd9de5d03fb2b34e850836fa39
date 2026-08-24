import { dehydrate, hydrate } from "@tanstack/query-core";
import { isRedirect } from "@tanstack/router-core";
function setupCoreRouterSsrQueryIntegration({
  router,
  queryClient,
  handleRedirects = true
}) {
  const ogHydrate = router.options.hydrate;
  const ogDehydrate = router.options.dehydrate;
  if (router.isServer) {
    const sentQueries = /* @__PURE__ */ new Set();
    const queryStream = createPushableStream();
    let unsubscribe = void 0;
    router.options.dehydrate = async () => {
      router.serverSsr.onRenderFinished(() => {
        queryStream.close();
        unsubscribe?.();
        unsubscribe = void 0;
      });
      const ogDehydrated = await ogDehydrate?.();
      const dehydratedRouter = {
        ...ogDehydrated,
        // prepare the stream for queries coming up during rendering
        queryStream: queryStream.stream
      };
      const dehydratedQueryClient = dehydrate(queryClient);
      if (dehydratedQueryClient.queries.length > 0) {
        dehydratedQueryClient.queries.forEach((query) => {
          sentQueries.add(query.queryHash);
        });
        dehydratedRouter.dehydratedQueryClient = dehydratedQueryClient;
      }
      return dehydratedRouter;
    };
    const ogClientOptions = queryClient.getDefaultOptions();
    queryClient.setDefaultOptions({
      ...ogClientOptions,
      dehydrate: {
        shouldDehydrateQuery: () => true,
        ...ogClientOptions.dehydrate
      }
    });
    unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!router.serverSsr?.isDehydrated()) {
        return;
      }
      if (sentQueries.has(event.query.queryHash)) {
        return;
      }
      if (!event.query.promise) {
        return;
      }
      if (queryStream.isClosed()) {
        console.warn(
          `tried to stream query ${event.query.queryHash} after stream was already closed`
        );
        return;
      }
      sentQueries.add(event.query.queryHash);
      queryStream.enqueue(
        dehydrate(queryClient, {
          shouldDehydrateQuery: (query) => {
            if (query.queryHash === event.query.queryHash) {
              return ogClientOptions.dehydrate?.shouldDehydrateQuery?.(query) ?? true;
            }
            return false;
          }
        })
      );
    });
  } else {
    router.options.hydrate = async (dehydrated) => {
      await ogHydrate?.(dehydrated);
      if (dehydrated.dehydratedQueryClient) {
        hydrate(queryClient, dehydrated.dehydratedQueryClient);
      }
      const reader = dehydrated.queryStream.getReader();
      reader.read().then(async function handle({ done, value }) {
        hydrate(queryClient, value);
        if (done) {
          return;
        }
        const result = await reader.read();
        return handle(result);
      }).catch((err) => {
        console.error("Error reading query stream:", err);
      });
    };
    if (handleRedirects) {
      const ogMutationCacheConfig = queryClient.getMutationCache().config;
      queryClient.getMutationCache().config = {
        ...ogMutationCacheConfig,
        onError: (error, ...rest) => {
          if (isRedirect(error)) {
            error.options._fromLocation = router.state.location;
            return router.navigate(router.resolveRedirect(error).options);
          }
          return ogMutationCacheConfig.onError?.(error, ...rest);
        }
      };
      const ogQueryCacheConfig = queryClient.getQueryCache().config;
      queryClient.getQueryCache().config = {
        ...ogQueryCacheConfig,
        onError: (error, ...rest) => {
          if (isRedirect(error)) {
            error.options._fromLocation = router.state.location;
            return router.navigate(router.resolveRedirect(error).options);
          }
          return ogQueryCacheConfig.onError?.(error, ...rest);
        }
      };
    }
  }
}
function createPushableStream() {
  let controllerRef;
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    }
  });
  let _isClosed = false;
  return {
    stream,
    enqueue: (chunk) => controllerRef.enqueue(chunk),
    close: () => {
      controllerRef.close();
      _isClosed = true;
    },
    isClosed: () => _isClosed,
    error: (err) => controllerRef.error(err)
  };
}
export {
  setupCoreRouterSsrQueryIntegration
};
//# sourceMappingURL=index.js.map
