/**
 * Inject arguments into a Convex client's calls.
 *
 * Useful when you want to pass an API key or session ID on many calls and don't
 * want to pass the value around and add it to the arguments explicitly.
 *
 * e.g.
 * ```ts
 * const client = new ConvexClient(process.env.CONVEX_URL!);
 * const apiClient = withArgs(client, { apiKey: process.env.API_KEY! });
 *
 * const result = await apiClient.query(api.foo.bar, { ...other args });
 * ```
 *
 * @param client A ConvexClient instance
 * @param injectedArgs Arguments to inject into each query/mutation/action call.
 * @returns { query, mutation, action } functions with the injected arguments
 */
export function withArgs(client, injectedArgs) {
    return {
        query(query, ...args) {
            return client.query(query, {
                ...(args[0] ?? {}),
                ...injectedArgs,
            });
        },
        mutation(mutation, ...args) {
            return client.mutation(mutation, {
                ...(args[0] ?? {}),
                ...injectedArgs,
            });
        },
        action(action, ...args) {
            return client.action(action, {
                ...(args[0] ?? {}),
                ...injectedArgs,
            });
        },
    };
}
