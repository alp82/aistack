//#region src/helper.d.ts
type RequiredKeysOf<BaseType extends object> = Exclude<{ [Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]> ? Key : never }[keyof BaseType], undefined>;
type HasRequiredKeys<BaseType extends object> = RequiredKeysOf<BaseType> extends never ? false : true;
type Prettify<T> = { [K in keyof T]: T[K] } & {};
type IsEmptyObject<T> = keyof T extends never ? true : false;
type UnionToIntersection<Union> = (Union extends unknown ? (distributedUnion: Union) => void : never) extends ((mergedIntersection: infer Intersection) => void) ? Intersection & Union : never;
type MergeObject<T extends Record<string, any> | never, S extends Record<string, any> | never> = T extends never ? S : S extends never ? T : T & S;
type InferParamPath<Path> = Path extends `${infer _Start}:${infer Param}/${infer Rest}` ? { [K in Param | keyof InferParamPath<Rest>]: string } : Path extends `${infer _Start}:${infer Param}` ? { [K in Param]: string } : Path extends `${infer _Start}/${infer Rest}` ? InferParamPath<Rest> : {};
type InferParamWildCard<Path> = Path extends `${infer _Start}/*:${infer Param}/${infer Rest}` | `${infer _Start}/**:${infer Param}/${infer Rest}` ? { [K in Param | keyof InferParamPath<Rest>]: string } : Path extends `${infer _Start}/*` ? { [K in "_"]: string } : Path extends `${infer _Start}/${infer Rest}` ? InferParamWildCard<Rest> : {};
//#endregion
export { HasRequiredKeys, InferParamPath, InferParamWildCard, IsEmptyObject, MergeObject, Prettify, RequiredKeysOf, UnionToIntersection };
//# sourceMappingURL=helper.d.cts.map