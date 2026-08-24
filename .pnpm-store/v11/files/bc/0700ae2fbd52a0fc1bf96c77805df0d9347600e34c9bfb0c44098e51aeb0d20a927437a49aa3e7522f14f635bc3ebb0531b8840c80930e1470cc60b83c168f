//#region src/plugins/one-tap/client.ts
let isRequestInProgress = null;
function isFedCMSupported() {
	return typeof window !== "undefined" && "IdentityCredential" in window;
}
const oneTapClient = (options) => {
	return {
		id: "one-tap",
		fetchPlugins: [{
			id: "fedcm-signout-handle",
			name: "FedCM Sign-Out Handler",
			hooks: { async onResponse(ctx) {
				if (!ctx.request.url.toString().includes("/sign-out")) return;
				if (options.promptOptions?.fedCM === false || !isFedCMSupported()) return;
				navigator.credentials.preventSilentAccess();
			} }
		}],
		getActions: ($fetch, _) => {
			return { oneTap: async (opts, fetchOptions) => {
				if (isRequestInProgress && !isRequestInProgress.signal.aborted) {
					console.warn("A Google One Tap request is already in progress. Please wait.");
					return;
				}
				if (typeof window === "undefined" || !window.document) {
					console.warn("Google One Tap is only available in browser environments");
					return;
				}
				async function callback(idToken) {
					await $fetch("/one-tap/callback", {
						method: "POST",
						body: { idToken },
						...opts?.fetchOptions,
						...fetchOptions
					});
					if (!opts?.fetchOptions && !fetchOptions || opts?.callbackURL) window.location.href = opts?.callbackURL ?? "/";
				}
				const { autoSelect, cancelOnTapOutside, context } = opts ?? {};
				const contextValue = context ?? options.context ?? "signin";
				const clients = {
					fedCM: async () => {
						try {
							const identityCredential = await navigator.credentials.get({
								identity: {
									context: contextValue,
									providers: [{
										configURL: "https://accounts.google.com/gsi/fedcm.json",
										clientId: options.clientId,
										nonce: opts?.nonce
									}]
								},
								mediation: autoSelect ? "optional" : "required",
								signal: isRequestInProgress?.signal
							});
							if (!identityCredential?.token) {
								opts?.onPromptNotification?.(void 0);
								return;
							}
							try {
								await callback(identityCredential.token);
								return;
							} catch (error) {
								console.error("Error during FedCM callback:", error);
								throw error;
							}
						} catch (error) {
							if (error?.code && (error.code === 19 || error.code === 20)) {
								opts?.onPromptNotification?.(void 0);
								return;
							}
							throw error;
						}
					},
					oneTap: () => {
						return new Promise((resolve, reject) => {
							let isResolved = false;
							const baseDelay = options.promptOptions?.baseDelay ?? 1e3;
							const maxAttempts = options.promptOptions?.maxAttempts ?? 5;
							window.google?.accounts.id.initialize({
								client_id: options.clientId,
								callback: async (response) => {
									isResolved = true;
									try {
										await callback(response.credential);
										resolve();
									} catch (error) {
										console.error("Error during One Tap callback:", error);
										reject(error);
									}
								},
								auto_select: autoSelect,
								cancel_on_tap_outside: cancelOnTapOutside,
								context: contextValue,
								ux_mode: opts?.uxMode || "popup",
								nonce: opts?.nonce,
								itp_support: true,
								...options.additionalOptions
							});
							const handlePrompt = (attempt) => {
								if (isResolved) return;
								window.google?.accounts.id.prompt((notification) => {
									if (isResolved) return;
									if (notification.isDismissedMoment && notification.isDismissedMoment()) if (attempt < maxAttempts) {
										const delay = Math.pow(2, attempt) * baseDelay;
										setTimeout(() => handlePrompt(attempt + 1), delay);
									} else opts?.onPromptNotification?.(notification);
									else if (notification.isSkippedMoment && notification.isSkippedMoment()) if (attempt < maxAttempts) {
										const delay = Math.pow(2, attempt) * baseDelay;
										setTimeout(() => handlePrompt(attempt + 1), delay);
									} else opts?.onPromptNotification?.(notification);
								});
							};
							handlePrompt(0);
						});
					}
				};
				if (isRequestInProgress) isRequestInProgress?.abort();
				isRequestInProgress = new AbortController();
				try {
					const client = options.promptOptions?.fedCM === false || !isFedCMSupported() ? "oneTap" : "fedCM";
					if (client === "oneTap") await loadGoogleScript();
					await clients[client]();
				} catch (error) {
					console.error("Error during Google One Tap flow:", error);
					throw error;
				} finally {
					isRequestInProgress = null;
				}
			} };
		},
		getAtoms($fetch) {
			return {};
		}
	};
};
const loadGoogleScript = () => {
	return new Promise((resolve) => {
		if (window.googleScriptInitialized) {
			resolve();
			return;
		}
		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		script.onload = () => {
			window.googleScriptInitialized = true;
			resolve();
		};
		document.head.appendChild(script);
	});
};

//#endregion
export { oneTapClient };
//# sourceMappingURL=client.mjs.map