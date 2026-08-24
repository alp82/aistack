import { HTTPError, type HTTPEvent } from "h3";
import type { InternalHandlerResponse } from "./utils.mjs";
import type { NitroErrorHandler } from "nitro/types";
declare const errorHandler: NitroErrorHandler;
export default errorHandler;
export declare function defaultHandler(error: HTTPError, event: HTTPEvent, opts?: {
	silent?: boolean;
	json?: boolean;
}): Promise<InternalHandlerResponse>;
export declare function loadStackTrace(error: any): Promise<void>;
