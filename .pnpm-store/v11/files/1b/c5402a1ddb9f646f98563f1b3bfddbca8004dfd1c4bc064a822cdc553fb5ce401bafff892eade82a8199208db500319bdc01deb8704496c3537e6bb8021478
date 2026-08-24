import { RunnerRPCHooks } from "./_chunks/types.mjs";
/** Vite HotChannel-compatible interface (avoids hard dependency on vite types). */
interface ViteHotChannel {
  send: (data: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
}
/** Vite ModuleRunner transport-compatible interface. */
interface ViteTransport {
  connect: (handlers: {
    onMessage: (payload: any) => void;
  }) => void;
  send: (payload: any) => void;
}
/**
 * Create a Vite `HotChannel` from an env-runner's RPC hooks.
 *
 * Use on the **host side** to bridge env-runner IPC → Vite's DevEnvironment transport.
 * Messages are namespaced by `envName` so multiple Vite environments can share one runner.
 */
declare function createViteHotChannel(hooks: RunnerRPCHooks, envName: string): ViteHotChannel;
/**
 * Create a Vite `ModuleRunner` transport from worker-side IPC primitives.
 *
 * Use on the **worker side** to bridge worker IPC → Vite's `ModuleRunner` transport.
 * Filters messages by `envName` so multiple Vite environments can share one IPC channel.
 */
declare function createViteTransport(sendMessage: (data: any) => void, onMessage: (listener: (value: any) => void) => void, envName: string): ViteTransport;
export { ViteHotChannel, ViteTransport, createViteHotChannel, createViteTransport };