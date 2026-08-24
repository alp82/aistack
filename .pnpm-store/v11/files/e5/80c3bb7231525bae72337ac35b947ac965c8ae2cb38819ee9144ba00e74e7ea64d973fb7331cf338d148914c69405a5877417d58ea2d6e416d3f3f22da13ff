import type { Driver } from "unstorage";
export type DriverFactory<
	OptionsT,
	InstanceT = never
> = (opts: OptionsT) => Driver<OptionsT, InstanceT>;
export interface ErrorOptions {}
export declare function normalizeKey(key: string | undefined, sep?: ":" | "/"): string;
export declare function joinKeys(...keys: string[]): string;
export declare function createError(driver: string, message: string, opts?: ErrorOptions): Error;
export declare function createRequiredError(driver: string, name: string | string[]): Error;
