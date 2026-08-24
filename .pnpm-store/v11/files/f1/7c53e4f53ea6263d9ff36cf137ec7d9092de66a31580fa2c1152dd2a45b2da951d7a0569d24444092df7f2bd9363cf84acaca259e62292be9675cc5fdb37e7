import { c as H3Plugin, r as H3Event } from "./h3.mjs";
/**
* Payload sent to the tracing channels.
*/
interface TracingRequestEvent {
  type: "middleware" | "route";
  event: H3Event;
}
/**
* Options for the tracing plugin.
*/
interface TracingPluginOptions {
  /**
  * Whether to trace middleware executions.
  */
  traceMiddleware?: boolean;
  /**
  * Whether to trace route executions.
  */
  traceRoutes?: boolean;
}
/**
* Enables tracing for H3 apps.
*/
declare function tracingPlugin(traceOpts?: TracingPluginOptions): H3Plugin;
export { TracingPluginOptions, TracingRequestEvent, tracingPlugin };