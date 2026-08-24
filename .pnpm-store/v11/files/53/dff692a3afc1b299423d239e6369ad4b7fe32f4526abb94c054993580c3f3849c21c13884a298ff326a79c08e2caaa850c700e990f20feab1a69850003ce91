import { handleInvalidateModule, isVirtualSpecifier, parseServerAddress, registerVirtualModules, reloadEntryModule, resolveEntry } from "../../_chunks/common-worker-utils.mjs";
import { serve } from "srvx";
import { plugin } from "crossws/server";
const data = JSON.parse(process.env.ENV_RUNNER_DATA || "{}");
const _stdout = globalThis.Deno?.stdout ? { write: (s) => globalThis.Deno.stdout.writeSync(new TextEncoder().encode(s)) } : process.stdout;
const sendMessage = (message) => _stdout.write(JSON.stringify(message) + "\n");
const _stdin = globalThis.Deno?.stdin?.readable || process.stdin;
const virtualEntry = isVirtualSpecifier(data.entry, data.virtual);
let unregisterVirtualModules;
let entry;
try {
	unregisterVirtualModules = await registerVirtualModules(data.virtual);
	entry = await resolveEntry(data.entry, virtualEntry);
} catch (error) {
	const message = error?.message || String(error);
	sendMessage({
		event: "init-error",
		error: message
	});
	console.error(`[env-runner] worker init failed: ${message}`);
	process.exit(1);
}
const server = serve({
	port: 0,
	hostname: "127.0.0.1",
	silent: true,
	fetch: (request) => entry.fetch(request),
	middleware: entry.middleware,
	plugins: [...entry.plugins || [], ...entry.websocket ? [plugin(entry.websocket)] : []],
	gracefulShutdown: false
});
await server.ready();
if (entry.upgrade) server.node?.server?.on("upgrade", (req, socket, head) => {
	entry.upgrade({ node: {
		req,
		socket,
		head
	} });
});
if (entry.ipc) await entry.ipc.onOpen?.({ sendMessage });
sendMessage({ address: parseServerAddress(server) });
async function readMessages() {
	const decoder = new TextDecoder();
	let buffer = "";
	for await (const chunk of _stdin) {
		buffer += decoder.decode(chunk, { stream: true });
		let newlineIdx;
		while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
			const line = buffer.slice(0, newlineIdx);
			buffer = buffer.slice(newlineIdx + 1);
			if (!line) continue;
			let message;
			try {
				message = JSON.parse(line);
			} catch {
				continue;
			}
			await handleMessage(message);
		}
	}
}
async function handleMessage(message) {
	if (message?.event === "shutdown") {
		Promise.resolve(entry.ipc?.onClose?.()).then(() => server.close()).then(() => {
			unregisterVirtualModules();
			sendMessage({ event: "exit" });
		});
		return;
	}
	if (message?.event === "reload-module") {
		try {
			entry = await reloadEntryModule(data.entry, entry, sendMessage, virtualEntry);
			sendMessage({ event: "module-reloaded" });
		} catch (error) {
			sendMessage({
				event: "module-reloaded",
				error: error?.message || String(error)
			});
		}
		return;
	}
	if (message?.event === "invalidate-module") {
		handleInvalidateModule(message, sendMessage);
		return;
	}
	if (message?.type === "ping") {
		sendMessage({
			type: "pong",
			data: message.data
		});
		return;
	}
	entry.ipc?.onMessage?.(message);
}
readMessages().catch(() => {});
export {};
