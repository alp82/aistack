import { MessageHandler, RetryHandler } from "@vercel/queue";
interface VercelQueueDevConsumer {
  /** Topic name. Wildcard patterns (e.g. `"user-*"`) are supported. */
  topic: string;
  /** Function invoked with each delivered message. */
  handler: MessageHandler;
  /**
   * Logical consumer identifier. Re-registering with the same group on the same
   * topic replaces the previous handler (HMR-safe). Use distinct groups to fan
   * a topic out to multiple coexisting handlers.
   *
   * @default "env-runner-vercel-dev"
   */
  consumerGroup?: string;
  /**
   * Lock duration for in-flight messages. Forwarded to the SDK's
   * `coreHandleCallback`.
   */
  visibilityTimeoutSeconds?: number;
  /**
   * Convenience: rescheduled re-delivery delay applied when the handler throws.
   * Equivalent to `retry: () => ({ afterSeconds })`. Ignored if `retry` is set.
   */
  retryAfterSeconds?: number;
  /**
   * Full retry handler. Receives the thrown error and message metadata; return
   * `{ afterSeconds }` to reschedule, `{ acknowledge: true }` to drop, or
   * `undefined` to let the error propagate.
   */
  retry?: RetryHandler;
}
/**
 * Bind a handler to a topic. Resolves to an unregister function.
 *
 * The first call across the worker process lazily loads `@vercel/queue` and
 * constructs a shared `QueueClient`. Re-registering with the same topic
 * replaces the handler (HMR-safe; the SDK keys consumers by `consumerGroup`,
 * so calling unregister on a replaced registration is a no-op).
 *
 * If `@vercel/queue` is not installed or does not expose `registerDevConsumer`,
 * resolves to a no-op unregister and logs a one-time warning.
 */
declare function registerVercelQueueConsumer(consumer: VercelQueueDevConsumer): Promise<() => void>;
export { VercelQueueDevConsumer, registerVercelQueueConsumer };