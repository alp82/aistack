import { InferParamPath, InferParamWildCard, IsEmptyObject, Prettify, UnionToIntersection } from "./helper.mjs";
import { StandardSchemaV1 } from "./standard-schema.mjs";
import { Status, statusCodes } from "./error.mjs";
import { CookieOptions, CookiePrefixOptions } from "./cookies.mjs";
import { Middleware, MiddlewareOptions } from "./middleware.mjs";
import { EndpointOptions } from "./endpoint.mjs";

//#region src/context.d.ts
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type Method = HTTPMethod | "*";
type InferBodyInput<Options extends EndpointOptions | MiddlewareOptions, Body = (Options["metadata"] extends {
  $Infer: {
    body: infer B;
  };
} ? B : Options["body"] extends StandardSchemaV1 ? StandardSchemaV1.InferInput<Options["body"]> : undefined)> = undefined extends Body ? {
  body?: Body;
} : {
  body: Body;
};
type InferBody<Options extends EndpointOptions | MiddlewareOptions> = Options["metadata"] extends {
  $Infer: {
    body: infer Body;
  };
} ? Body : Options["body"] extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<Options["body"]> : any;
type InferQueryInput<Options extends EndpointOptions | MiddlewareOptions, Query = (Options["metadata"] extends {
  $Infer: {
    query: infer Query;
  };
} ? Query : Options["query"] extends StandardSchemaV1 ? StandardSchemaV1.InferInput<Options["query"]> : Record<string, any> | undefined)> = undefined extends Query ? {
  query?: Query;
} : {
  query: Query;
};
type InferQuery<Options extends EndpointOptions | MiddlewareOptions> = Options["metadata"] extends {
  $Infer: {
    query: infer Query;
  };
} ? Query : Options["query"] extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<Options["query"]> : Record<string, any> | undefined;
type InferMethod<Options extends EndpointOptions> = Options["method"] extends Array<Method> ? Options["method"][number] : Options["method"] extends "*" ? HTTPMethod : Options["method"];
type InferInputMethod<Options extends EndpointOptions, Method$1 = (Options["method"] extends Array<any> ? Options["method"][number] | undefined : Options["method"] extends "*" ? HTTPMethod : Options["method"] | undefined)> = undefined extends Method$1 ? {
  method?: Method$1;
} : {
  method: Method$1;
};
type InferParam<Path extends string> = [Path] extends [never] ? Record<string, any> | undefined : IsEmptyObject<InferParamPath<Path> & InferParamWildCard<Path>> extends true ? Record<string, any> | undefined : Prettify<InferParamPath<Path> & InferParamWildCard<Path>>;
type InferParamInput<Path extends string> = [Path] extends [never] ? {
  params?: Record<string, any>;
} : IsEmptyObject<InferParamPath<Path> & InferParamWildCard<Path>> extends true ? {
  params?: Record<string, any>;
} : {
  params: Prettify<InferParamPath<Path> & InferParamWildCard<Path>>;
};
type InferRequest<Option extends EndpointOptions | MiddlewareOptions> = Option["requireRequest"] extends true ? Request : Request | undefined;
type InferRequestInput<Option extends EndpointOptions | MiddlewareOptions> = Option["requireRequest"] extends true ? {
  request: Request;
} : {
  request?: Request;
};
type InferHeaders<Option extends EndpointOptions | MiddlewareOptions> = Option["requireHeaders"] extends true ? Headers : Headers | undefined;
type InferHeadersInput<Option extends EndpointOptions | MiddlewareOptions> = Option["requireHeaders"] extends true ? {
  headers: HeadersInit;
} : {
  headers?: HeadersInit;
};
type InferUse<Opts extends EndpointOptions["use"]> = Opts extends Middleware[] ? UnionToIntersection<Awaited<ReturnType<Opts[number]>>> : {};
type InferMiddlewareBody<Options extends MiddlewareOptions> = Options["body"] extends StandardSchemaV1<infer T> ? T : any;
type InferMiddlewareQuery<Options extends MiddlewareOptions> = Options["query"] extends StandardSchemaV1<infer T> ? T : Record<string, any> | undefined;
type InputContext<Path extends string, Options extends EndpointOptions> = InferBodyInput<Options> & InferInputMethod<Options> & InferQueryInput<Options> & InferParamInput<Path> & InferRequestInput<Options> & InferHeadersInput<Options> & {
  asResponse?: boolean;
  returnHeaders?: boolean;
  returnStatus?: boolean;
  use?: Middleware[];
  path?: string;
};
declare const createInternalContext: (context: InputContext<any, any>, {
  options,
  path
}: {
  options: EndpointOptions;
  path?: string;
}) => Promise<{
  body: any;
  query: any;
  path: string;
  context: {};
  returned: any;
  headers: HeadersInit | undefined;
  request: Request | undefined;
  params: Record<string, any> | undefined;
  method: any;
  setHeader: (key: string, value: string) => void;
  getHeader: (key: string) => string | null;
  getCookie: (key: string, prefix?: CookiePrefixOptions) => string | null;
  getSignedCookie: (key: string, secret: string, prefix?: CookiePrefixOptions) => Promise<string | false | null>;
  setCookie: (key: string, value: string, options?: CookieOptions) => string;
  setSignedCookie: (key: string, value: string, secret: string, options?: CookieOptions) => Promise<string>;
  redirect: (url: string) => {
    status: keyof typeof statusCodes | Status;
    body: ({
      message?: string;
      code?: string;
      cause?: unknown;
    } & Record<string, any>) | undefined;
    headers: HeadersInit;
    statusCode: number;
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  } & {
    errorStack: string | undefined;
  };
  error: (status: keyof typeof statusCodes | Status, body?: {
    message?: string;
    code?: string;
  } | undefined, headers?: HeadersInit) => {
    status: keyof typeof statusCodes | Status;
    body: ({
      message?: string;
      code?: string;
      cause?: unknown;
    } & Record<string, any>) | undefined;
    headers: HeadersInit;
    statusCode: number;
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  } & {
    errorStack: string | undefined;
  };
  setStatus: (status: Status) => void;
  json: (json: Record<string, any>, routerResponse?: {
    status?: number;
    headers?: Record<string, string>;
    response?: Response;
    body?: Record<string, any>;
  } | Response) => Record<string, any>;
  responseHeaders: Headers;
  responseStatus: Status | undefined;
  asResponse?: boolean;
  returnHeaders?: boolean;
  returnStatus?: boolean;
  use?: Middleware[];
} | {
  body: any;
  query: any;
  path: string;
  context: {};
  returned: any;
  headers: HeadersInit | undefined;
  request: Request | undefined;
  params: Record<string, any> | undefined;
  method: any;
  setHeader: (key: string, value: string) => void;
  getHeader: (key: string) => string | null;
  getCookie: (key: string, prefix?: CookiePrefixOptions) => string | null;
  getSignedCookie: (key: string, secret: string, prefix?: CookiePrefixOptions) => Promise<string | false | null>;
  setCookie: (key: string, value: string, options?: CookieOptions) => string;
  setSignedCookie: (key: string, value: string, secret: string, options?: CookieOptions) => Promise<string>;
  redirect: (url: string) => {
    status: keyof typeof statusCodes | Status;
    body: ({
      message?: string;
      code?: string;
      cause?: unknown;
    } & Record<string, any>) | undefined;
    headers: HeadersInit;
    statusCode: number;
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  } & {
    errorStack: string | undefined;
  };
  error: (status: keyof typeof statusCodes | Status, body?: {
    message?: string;
    code?: string;
  } | undefined, headers?: HeadersInit) => {
    status: keyof typeof statusCodes | Status;
    body: ({
      message?: string;
      code?: string;
      cause?: unknown;
    } & Record<string, any>) | undefined;
    headers: HeadersInit;
    statusCode: number;
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  } & {
    errorStack: string | undefined;
  };
  setStatus: (status: Status) => void;
  json: (json: Record<string, any>, routerResponse?: {
    status?: number;
    headers?: Record<string, string>;
    response?: Response;
    body?: Record<string, any>;
  } | Response) => Record<string, any>;
  responseHeaders: Headers;
  responseStatus: Status | undefined;
  asResponse?: boolean;
  returnHeaders?: boolean;
  returnStatus?: boolean;
  use?: Middleware[];
} | {
  body: any;
  query: any;
  path: string;
  context: {};
  returned: any;
  headers: HeadersInit | undefined;
  request: Request | undefined;
  params: Record<string, any> | undefined;
  method: any;
  setHeader: (key: string, value: string) => void;
  getHeader: (key: string) => string | null;
  getCookie: (key: string, prefix?: CookiePrefixOptions) => string | null;
  getSignedCookie: (key: string, secret: string, prefix?: CookiePrefixOptions) => Promise<string | false | null>;
  setCookie: (key: string, value: string, options?: CookieOptions) => string;
  setSignedCookie: (key: string, value: string, secret: string, options?: CookieOptions) => Promise<string>;
  redirect: (url: string) => {
    status: keyof typeof statusCodes | Status;
    body: ({
      message?: string;
      code?: string;
      cause?: unknown;
    } & Record<string, any>) | undefined;
    headers: HeadersInit;
    statusCode: number;
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  } & {
    errorStack: string | undefined;
  };
  error: (status: keyof typeof statusCodes | Status, body?: {
    message?: string;
    code?: string;
  } | undefined, headers?: HeadersInit) => {
    status: keyof typeof statusCodes | Status;
    body: ({
      message?: string;
      code?: string;
      cause?: unknown;
    } & Record<string, any>) | undefined;
    headers: HeadersInit;
    statusCode: number;
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  } & {
    errorStack: string | undefined;
  };
  setStatus: (status: Status) => void;
  json: (json: Record<string, any>, routerResponse?: {
    status?: number;
    headers?: Record<string, string>;
    response?: Response;
    body?: Record<string, any>;
  } | Response) => Record<string, any>;
  responseHeaders: Headers;
  responseStatus: Status | undefined;
  asResponse?: boolean;
  returnHeaders?: boolean;
  returnStatus?: boolean;
  use?: Middleware[];
} | {
  body: any;
  query: any;
  path: string;
  context: {};
  returned: any;
  headers: HeadersInit | undefined;
  request: Request | undefined;
  params: Record<string, any> | undefined;
  method: any;
  setHeader: (key: string, value: string) => void;
  getHeader: (key: string) => string | null;
  getCookie: (key: string, prefix?: CookiePrefixOptions) => string | null;
  getSignedCookie: (key: string, secret: string, prefix?: CookiePrefixOptions) => Promise<string | false | null>;
  setCookie: (key: string, value: string, options?: CookieOptions) => string;
  setSignedCookie: (key: string, value: string, secret: string, options?: CookieOptions) => Promise<string>;
  redirect: (url: string) => {
    status: keyof typeof statusCodes | Status;
    body: ({
      message?: string;
      code?: string;
      cause?: unknown;
    } & Record<string, any>) | undefined;
    headers: HeadersInit;
    statusCode: number;
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  } & {
    errorStack: string | undefined;
  };
  error: (status: keyof typeof statusCodes | Status, body?: {
    message?: string;
    code?: string;
  } | undefined, headers?: HeadersInit) => {
    status: keyof typeof statusCodes | Status;
    body: ({
      message?: string;
      code?: string;
      cause?: unknown;
    } & Record<string, any>) | undefined;
    headers: HeadersInit;
    statusCode: number;
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  } & {
    errorStack: string | undefined;
  };
  setStatus: (status: Status) => void;
  json: (json: Record<string, any>, routerResponse?: {
    status?: number;
    headers?: Record<string, string>;
    response?: Response;
    body?: Record<string, any>;
  } | Response) => Record<string, any>;
  responseHeaders: Headers;
  responseStatus: Status | undefined;
  asResponse?: boolean;
  returnHeaders?: boolean;
  returnStatus?: boolean;
  use?: Middleware[];
}>;
//#endregion
export { HTTPMethod, InferBody, InferBodyInput, InferHeaders, InferHeadersInput, InferInputMethod, InferMethod, InferMiddlewareBody, InferMiddlewareQuery, InferParam, InferParamInput, InferQuery, InferQueryInput, InferRequest, InferRequestInput, InferUse, InputContext, Method, createInternalContext };
//# sourceMappingURL=context.d.mts.map