/**
 * Merge target and source into a new null-proto object, filtering dangerous keys.
 */
export declare function safeObjectMerge<T extends Record<string, unknown>>(target: T | undefined, source: Record<string, unknown> | null | undefined): T;
/**
 * Create a null-prototype object, optionally copying from source.
 */
export declare function createNullProtoObject<T extends object>(source?: T): {
    [K in keyof T]: T[K];
};
