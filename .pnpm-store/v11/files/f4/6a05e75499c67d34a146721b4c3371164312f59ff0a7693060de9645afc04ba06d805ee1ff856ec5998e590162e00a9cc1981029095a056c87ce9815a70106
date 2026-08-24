import { StandardSchemaV1 } from "./standard-schema.cjs";

//#region src/error.d.ts

/**
 * Hide internal stack frames from the error stack trace.
 */
declare function hideInternalStackFrames(stack: string): string;
/**
 * Creates a custom error class that hides stack frames.
 */
declare function makeErrorForHideStackFrame<B extends new (...args: any[]) => Error>(Base: B, clazz: any): {
  new (...args: ConstructorParameters<B>): InstanceType<B> & {
    errorStack: string | undefined;
  };
};
declare const statusCodes: {
  OK: number;
  CREATED: number;
  ACCEPTED: number;
  NO_CONTENT: number;
  MULTIPLE_CHOICES: number;
  MOVED_PERMANENTLY: number;
  FOUND: number;
  SEE_OTHER: number;
  NOT_MODIFIED: number;
  TEMPORARY_REDIRECT: number;
  BAD_REQUEST: number;
  UNAUTHORIZED: number;
  PAYMENT_REQUIRED: number;
  FORBIDDEN: number;
  NOT_FOUND: number;
  METHOD_NOT_ALLOWED: number;
  NOT_ACCEPTABLE: number;
  PROXY_AUTHENTICATION_REQUIRED: number;
  REQUEST_TIMEOUT: number;
  CONFLICT: number;
  GONE: number;
  LENGTH_REQUIRED: number;
  PRECONDITION_FAILED: number;
  PAYLOAD_TOO_LARGE: number;
  URI_TOO_LONG: number;
  UNSUPPORTED_MEDIA_TYPE: number;
  RANGE_NOT_SATISFIABLE: number;
  EXPECTATION_FAILED: number;
  "I'M_A_TEAPOT": number;
  MISDIRECTED_REQUEST: number;
  UNPROCESSABLE_ENTITY: number;
  LOCKED: number;
  FAILED_DEPENDENCY: number;
  TOO_EARLY: number;
  UPGRADE_REQUIRED: number;
  PRECONDITION_REQUIRED: number;
  TOO_MANY_REQUESTS: number;
  REQUEST_HEADER_FIELDS_TOO_LARGE: number;
  UNAVAILABLE_FOR_LEGAL_REASONS: number;
  INTERNAL_SERVER_ERROR: number;
  NOT_IMPLEMENTED: number;
  BAD_GATEWAY: number;
  SERVICE_UNAVAILABLE: number;
  GATEWAY_TIMEOUT: number;
  HTTP_VERSION_NOT_SUPPORTED: number;
  VARIANT_ALSO_NEGOTIATES: number;
  INSUFFICIENT_STORAGE: number;
  LOOP_DETECTED: number;
  NOT_EXTENDED: number;
  NETWORK_AUTHENTICATION_REQUIRED: number;
};
type Status = 100 | 101 | 102 | 103 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;
declare class InternalAPIError extends Error {
  status: keyof typeof statusCodes | Status;
  body: ({
    message?: string;
    code?: string;
    cause?: unknown;
  } & Record<string, any>) | undefined;
  headers: HeadersInit;
  statusCode: number;
  constructor(status?: keyof typeof statusCodes | Status, body?: ({
    message?: string;
    code?: string;
    cause?: unknown;
  } & Record<string, any>) | undefined, headers?: HeadersInit, statusCode?: number);
}
declare class ValidationError extends InternalAPIError {
  message: string;
  issues: readonly StandardSchemaV1.Issue[];
  constructor(message: string, issues: readonly StandardSchemaV1.Issue[]);
}
declare class BetterCallError extends Error {
  constructor(message: string);
}
type APIError = InstanceType<typeof InternalAPIError>;
declare const APIError: new (status?: "OK" | "CREATED" | "ACCEPTED" | "NO_CONTENT" | "MULTIPLE_CHOICES" | "MOVED_PERMANENTLY" | "FOUND" | "SEE_OTHER" | "NOT_MODIFIED" | "TEMPORARY_REDIRECT" | "BAD_REQUEST" | "UNAUTHORIZED" | "PAYMENT_REQUIRED" | "FORBIDDEN" | "NOT_FOUND" | "METHOD_NOT_ALLOWED" | "NOT_ACCEPTABLE" | "PROXY_AUTHENTICATION_REQUIRED" | "REQUEST_TIMEOUT" | "CONFLICT" | "GONE" | "LENGTH_REQUIRED" | "PRECONDITION_FAILED" | "PAYLOAD_TOO_LARGE" | "URI_TOO_LONG" | "UNSUPPORTED_MEDIA_TYPE" | "RANGE_NOT_SATISFIABLE" | "EXPECTATION_FAILED" | "I'M_A_TEAPOT" | "MISDIRECTED_REQUEST" | "UNPROCESSABLE_ENTITY" | "LOCKED" | "FAILED_DEPENDENCY" | "TOO_EARLY" | "UPGRADE_REQUIRED" | "PRECONDITION_REQUIRED" | "TOO_MANY_REQUESTS" | "REQUEST_HEADER_FIELDS_TOO_LARGE" | "UNAVAILABLE_FOR_LEGAL_REASONS" | "INTERNAL_SERVER_ERROR" | "NOT_IMPLEMENTED" | "BAD_GATEWAY" | "SERVICE_UNAVAILABLE" | "GATEWAY_TIMEOUT" | "HTTP_VERSION_NOT_SUPPORTED" | "VARIANT_ALSO_NEGOTIATES" | "INSUFFICIENT_STORAGE" | "LOOP_DETECTED" | "NOT_EXTENDED" | "NETWORK_AUTHENTICATION_REQUIRED" | Status | undefined, body?: ({
  message?: string;
  code?: string;
  cause?: unknown;
} & Record<string, any>) | undefined, headers?: HeadersInit | undefined, statusCode?: number | undefined) => InternalAPIError & {
  errorStack: string | undefined;
};
//#endregion
export { APIError, BetterCallError, Status, ValidationError, hideInternalStackFrames, makeErrorForHideStackFrame, statusCodes };
//# sourceMappingURL=error.d.cts.map