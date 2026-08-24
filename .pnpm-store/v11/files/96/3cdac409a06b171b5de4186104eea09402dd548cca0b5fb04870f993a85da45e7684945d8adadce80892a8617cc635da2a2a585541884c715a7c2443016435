function createViteHotChannel(hooks, envName) {
	const listeners = /* @__PURE__ */ new WeakMap();
	return {
		send: (data) => hooks.sendMessage({
			...data,
			viteEnv: envName
		}),
		on: (event, handler) => {
			if (event === "connection") return;
			const listener = (value) => {
				if (value?.type === "custom" && value.event === event && value.viteEnv === envName) handler(value.data, { send: (payload) => hooks.sendMessage({
					...payload,
					viteEnv: envName
				}) });
			};
			listeners.set(handler, listener);
			hooks.onMessage(listener);
		},
		off: (event, handler) => {
			if (event === "connection") return;
			const listener = listeners.get(handler);
			if (listener) {
				hooks.offMessage(listener);
				listeners.delete(handler);
			}
		}
	};
}
function createViteTransport(sendMessage, onMessage, envName) {
	return {
		connect({ onMessage: onRunnerMessage }) {
			onMessage((payload) => {
				if (payload?.type === "custom" && payload.viteEnv === envName) onRunnerMessage(payload);
			});
		},
		send(payload) {
			sendMessage?.({
				...payload,
				viteEnv: envName
			});
		}
	};
}
export { createViteHotChannel, createViteTransport };
