"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useConvex, ConvexReactClient } from "convex/react";
import { createContext, useMemo } from "react";
export const ConvexQueryCacheContext = createContext({
    registry: null,
});
/**
 * A provider that establishes a query cache context in the React render
 * tree so that cached `useQuery` calls can be used.
 *
 * @component
 * @param {ConvexQueryCacheOptions} props.options - Options for the query cache
 * @returns {Element}
 */
export const ConvexQueryCacheProvider = ({ children, debug, expiration, maxIdleEntries }) => {
    const convex = useConvex();
    if (convex === undefined) {
        throw new Error("Could not find Convex client! `ConvexQueryCacheProvider` must be used in the React component " +
            "tree under `ConvexProvider`. Did you forget it? " +
            "See https://docs.convex.dev/quick-start#set-up-convex-in-your-react-app");
    }
    const registry = useMemo(() => new CacheRegistry(convex, { debug, expiration, maxIdleEntries }), [convex, debug, expiration, maxIdleEntries]);
    return (_jsx(ConvexQueryCacheContext.Provider, { value: { registry }, children: children }));
};
const DEFAULT_EXPIRATION_MS = 300_000; // 5 minutes
const DEFAULT_MAX_ENTRIES = 250;
// Core caching structure.
class CacheRegistry {
    queries;
    subs;
    convex;
    timeout;
    maxIdleEntries;
    idle;
    constructor(convex, options) {
        this.queries = new Map();
        this.subs = new Map();
        this.convex = convex;
        this.idle = 0;
        this.timeout = options.expiration ?? DEFAULT_EXPIRATION_MS;
        this.maxIdleEntries = options.maxIdleEntries ?? DEFAULT_MAX_ENTRIES;
        if (options.debug ?? false) {
            const weakThis = new WeakRef(this);
            const debugInterval = setInterval(() => {
                const r = weakThis.deref();
                if (r === undefined) {
                    clearInterval(debugInterval);
                }
                else {
                    r.debug();
                }
            }, 3000);
        }
    }
    // Enable a new subscription.
    start(id, queryKey, query, args) {
        let entry = this.queries.get(queryKey);
        this.subs.set(id, queryKey);
        if (entry === undefined) {
            entry = {
                refs: new Set(),
                evictTimer: null,
                // We only need to hold open subscriptions, we don't care about updates.
                unsub: this.convex.watchQuery(query, args).onUpdate(() => { }),
            };
            this.queries.set(queryKey, entry);
        }
        else if (entry.evictTimer !== null) {
            this.idle -= 1;
            clearTimeout(entry.evictTimer);
            entry.evictTimer = null;
        }
        entry.refs.add(id);
    }
    // End a previous subscription.
    end(id) {
        const queryKey = this.subs.get(id);
        if (queryKey) {
            this.subs.delete(id);
            const cq = this.queries.get(queryKey);
            cq?.refs.delete(id);
            // None left?
            if (cq?.refs.size === 0) {
                const remove = () => {
                    cq.unsub();
                    this.queries.delete(queryKey);
                };
                if (this.idle == this.maxIdleEntries) {
                    remove();
                }
                else {
                    this.idle += 1;
                    const evictTimer = window.setTimeout(() => {
                        this.idle -= 1;
                        remove();
                    }, this.timeout);
                    cq.evictTimer = evictTimer;
                }
            }
        }
    }
    debug() {
        console.log("DEBUG CACHE");
        console.log(`IDLE = ${this.idle}`);
        console.log(" SUBS");
        for (const [k, v] of this.subs.entries()) {
            console.log(`  ${k} => ${v}`);
        }
        console.log(" QUERIES");
        for (const [k, v] of this.queries.entries()) {
            console.log(`  ${k} => ${v.refs.size} refs, evict = ${v.evictTimer}`);
        }
        console.log("~~~~~~~~~~~~~~~~~~~~~~");
    }
}
