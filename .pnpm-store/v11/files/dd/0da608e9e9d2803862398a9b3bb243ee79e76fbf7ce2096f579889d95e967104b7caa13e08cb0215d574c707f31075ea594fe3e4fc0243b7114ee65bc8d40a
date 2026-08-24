import { useConvexAuth, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { jsonToConvex } from "convex/values";
import { useEffect, useMemo, useState } from "react";
const useConvexPreloadedQuery = (preloadedQuery, { requireAuth = true } = {}) => {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const [preloadExpired, setPreloadExpired] = useState(false);
    useEffect(() => {
        if (requireAuth && !isLoading && !isAuthenticated) {
            setPreloadExpired(true);
        }
    }, [requireAuth, isLoading, isAuthenticated]);
    const args = useMemo(() => jsonToConvex(preloadedQuery._argsJSON), [preloadedQuery._argsJSON]);
    const preloadedResult = useMemo(() => jsonToConvex(preloadedQuery._valueJSON), [preloadedQuery._valueJSON]);
    const result = useQuery(makeFunctionReference(preloadedQuery._name), requireAuth && !isAuthenticated ? "skip" : args);
    useEffect(() => {
        if (result !== undefined) {
            setPreloadExpired(true);
        }
    }, [result]);
    if (requireAuth) {
        return preloadExpired ? result : preloadedResult;
    }
    return result === undefined ? preloadedResult : result;
};
export const usePreloadedAuthQuery = (preloadedQuery) => {
    const { isLoading } = useConvexAuth();
    const latestData = useConvexPreloadedQuery(preloadedQuery);
    const [data, setData] = useState(latestData);
    useEffect(() => {
        if (!isLoading) {
            setData(latestData);
        }
    }, [latestData, isLoading]);
    return data;
};
//# sourceMappingURL=client.js.map