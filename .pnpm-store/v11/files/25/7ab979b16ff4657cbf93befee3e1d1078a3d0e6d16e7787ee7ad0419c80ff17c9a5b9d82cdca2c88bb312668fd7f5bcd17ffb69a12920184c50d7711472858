import { type DriverFactory } from "./utils/index.mjs";
import { UTApi } from "uploadthing/server";
type UTApiOptions = Omit<Exclude<ConstructorParameters<typeof UTApi>[0], undefined>, "defaultKeyType">;
export interface UploadThingOptions extends UTApiOptions {
	/** base key to add to keys */
	base?: string;
}
declare const driver: DriverFactory<UploadThingOptions, UTApi>;
export default driver;
