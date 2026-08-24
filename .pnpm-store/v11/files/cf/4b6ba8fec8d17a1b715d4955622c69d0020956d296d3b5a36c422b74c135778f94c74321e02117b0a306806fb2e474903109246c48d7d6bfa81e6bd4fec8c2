import { WebAuthnError, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useAuthQuery } from "better-auth/client";
import { atom } from "nanostores";

//#region src/client.ts
const getPasskeyActions = ($fetch, { $listPasskeys, $store }) => {
	const signInPasskey = async (opts, options) => {
		const response = await $fetch("/passkey/generate-authenticate-options", {
			method: "GET",
			throw: false
		});
		if (!response.data) return response;
		try {
			const verified = await $fetch("/passkey/verify-authentication", {
				body: { response: await startAuthentication({
					optionsJSON: response.data,
					useBrowserAutofill: opts?.autoFill
				}) },
				...opts?.fetchOptions,
				...options,
				method: "POST",
				throw: false
			});
			$listPasskeys.set(Math.random());
			$store.notify("$sessionSignal");
			return verified;
		} catch {
			return {
				data: null,
				error: {
					code: "AUTH_CANCELLED",
					message: "auth cancelled",
					status: 400,
					statusText: "BAD_REQUEST"
				}
			};
		}
	};
	const registerPasskey = async (opts, fetchOpts) => {
		const options = await $fetch("/passkey/generate-register-options", {
			method: "GET",
			query: {
				...opts?.authenticatorAttachment && { authenticatorAttachment: opts.authenticatorAttachment },
				...opts?.name && { name: opts.name }
			},
			throw: false
		});
		if (!options.data) return options;
		try {
			const res = await startRegistration({
				optionsJSON: options.data,
				useAutoRegister: opts?.useAutoRegister
			});
			const verified = await $fetch("/passkey/verify-registration", {
				...opts?.fetchOptions,
				...fetchOpts,
				body: {
					response: res,
					name: opts?.name
				},
				method: "POST",
				throw: false
			});
			if (!verified.data) return verified;
			$listPasskeys.set(Math.random());
			return verified;
		} catch (e) {
			if (e instanceof WebAuthnError) {
				if (e.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") return {
					data: null,
					error: {
						code: e.code,
						message: "previously registered",
						status: 400,
						statusText: "BAD_REQUEST"
					}
				};
				if (e.code === "ERROR_CEREMONY_ABORTED") return {
					data: null,
					error: {
						code: e.code,
						message: "registration cancelled",
						status: 400,
						statusText: "BAD_REQUEST"
					}
				};
				return {
					data: null,
					error: {
						code: e.code,
						message: e.message,
						status: 400,
						statusText: "BAD_REQUEST"
					}
				};
			}
			return {
				data: null,
				error: {
					code: "UNKNOWN_ERROR",
					message: e instanceof Error ? e.message : "unknown error",
					status: 500,
					statusText: "INTERNAL_SERVER_ERROR"
				}
			};
		}
	};
	return {
		signIn: { passkey: signInPasskey },
		passkey: { addPasskey: registerPasskey },
		$Infer: {}
	};
};
const passkeyClient = () => {
	const $listPasskeys = atom();
	return {
		id: "passkey",
		$InferServerPlugin: {},
		getActions: ($fetch, $store) => getPasskeyActions($fetch, {
			$listPasskeys,
			$store
		}),
		getAtoms($fetch) {
			return {
				listPasskeys: useAuthQuery($listPasskeys, "/passkey/list-user-passkeys", $fetch, { method: "GET" }),
				$listPasskeys
			};
		},
		pathMethods: {
			"/passkey/register": "POST",
			"/passkey/authenticate": "POST"
		},
		atomListeners: [{
			matcher(path) {
				return path === "/passkey/verify-registration" || path === "/passkey/delete-passkey" || path === "/passkey/update-passkey" || path === "/sign-out";
			},
			signal: "$listPasskeys"
		}, {
			matcher: (path) => path === "/passkey/verify-authentication",
			signal: "$sessionSignal"
		}]
	};
};

//#endregion
export { getPasskeyActions, passkeyClient };