import { type DriverFactory } from "./utils/index.mjs";
export interface LocalStorageOptions {
	base?: string;
	window?: typeof window;
	windowKey?: "localStorage" | "sessionStorage";
	storage?: typeof window.localStorage | typeof window.sessionStorage;
	/** @deprecated use `storage` option */
	sessionStorage?: typeof window.sessionStorage;
	/** @deprecated use `storage` option */
	localStorage?: typeof window.localStorage;
}
declare const driver: DriverFactory<LocalStorageOptions, Storage>;
export default driver;
