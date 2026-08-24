import { setOAuthState } from "../api/middlewares/oauth.mjs";
import { generateRandomString } from "../crypto/random.mjs";
import { symmetricDecrypt, symmetricEncrypt } from "../crypto/index.mjs";
import * as z from "zod";
import { APIError } from "better-call";

//#region src/oauth2/state.ts
async function generateState(c, link, additionalData) {
	const callbackURL = c.body?.callbackURL || c.context.options.baseURL;
	if (!callbackURL) throw new APIError("BAD_REQUEST", { message: "callbackURL is required" });
	const codeVerifier = generateRandomString(128);
	const state = generateRandomString(32);
	const storeStateStrategy = c.context.oauthConfig.storeStateStrategy;
	const stateData = {
		...additionalData ? additionalData : {},
		callbackURL,
		codeVerifier,
		errorURL: c.body?.errorCallbackURL,
		newUserURL: c.body?.newUserCallbackURL,
		link,
		expiresAt: Date.now() + 600 * 1e3,
		requestSignUp: c.body?.requestSignUp,
		state
	};
	await setOAuthState(stateData);
	if (storeStateStrategy === "cookie") {
		const encryptedData = await symmetricEncrypt({
			key: c.context.secret,
			data: JSON.stringify(stateData)
		});
		const stateCookie$1 = c.context.createAuthCookie("oauth_state", { maxAge: 600 * 1e3 });
		c.setCookie(stateCookie$1.name, encryptedData, stateCookie$1.attributes);
		return {
			state,
			codeVerifier
		};
	}
	const stateCookie = c.context.createAuthCookie("state", { maxAge: 300 * 1e3 });
	await c.setSignedCookie(stateCookie.name, state, c.context.secret, stateCookie.attributes);
	const expiresAt = /* @__PURE__ */ new Date();
	expiresAt.setMinutes(expiresAt.getMinutes() + 10);
	const verification = await c.context.internalAdapter.createVerificationValue({
		value: JSON.stringify(stateData),
		identifier: state,
		expiresAt
	});
	if (!verification) {
		c.context.logger.error("Unable to create verification. Make sure the database adapter is properly working and there is a verification table in the database");
		throw new APIError("INTERNAL_SERVER_ERROR", { message: "Unable to create verification" });
	}
	return {
		state: verification.identifier,
		codeVerifier
	};
}
async function parseState(c) {
	const state = c.query.state || c.body.state;
	const storeStateStrategy = c.context.oauthConfig.storeStateStrategy;
	const stateDataSchema = z.looseObject({
		callbackURL: z.string(),
		codeVerifier: z.string(),
		errorURL: z.string().optional(),
		newUserURL: z.string().optional(),
		expiresAt: z.number(),
		link: z.object({
			email: z.string(),
			userId: z.coerce.string()
		}).optional(),
		requestSignUp: z.boolean().optional(),
		state: z.string().optional()
	});
	let parsedData;
	/**
	* This is generally cause security issue and should only be used in
	* dev or staging environments. It's currently used by the oauth-proxy
	* plugin
	*/
	const skipStateCookieCheck = c.context.oauthConfig?.skipStateCookieCheck;
	if (storeStateStrategy === "cookie") {
		const stateCookie = c.context.createAuthCookie("oauth_state");
		const encryptedData = c.getCookie(stateCookie.name);
		if (!encryptedData) {
			c.context.logger.error("State Mismatch. OAuth state cookie not found", { state });
			const errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
			throw c.redirect(`${errorURL}?error=please_restart_the_process`);
		}
		try {
			const decryptedData = await symmetricDecrypt({
				key: c.context.secret,
				data: encryptedData
			});
			parsedData = stateDataSchema.parse(JSON.parse(decryptedData));
		} catch (error) {
			c.context.logger.error("Failed to decrypt or parse OAuth state cookie", { error });
			const errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
			throw c.redirect(`${errorURL}?error=please_restart_the_process`);
		}
		if (!c.context.oauthConfig?.skipStateCookieCheck && parsedData.state && parsedData.state !== state) {
			c.context.logger.error("State Mismatch. State parameter does not match", {
				expected: parsedData.state,
				received: state
			});
			const errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
			throw c.redirect(`${errorURL}?error=state_mismatch`);
		}
		c.setCookie(stateCookie.name, "", { maxAge: 0 });
	} else {
		const data = await c.context.internalAdapter.findVerificationValue(state);
		if (!data) {
			c.context.logger.error("State Mismatch. Verification not found", { state });
			const errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
			throw c.redirect(`${errorURL}?error=please_restart_the_process`);
		}
		parsedData = stateDataSchema.parse(JSON.parse(data.value));
		const stateCookie = c.context.createAuthCookie("state");
		const stateCookieValue = await c.getSignedCookie(stateCookie.name, c.context.secret);
		if (!skipStateCookieCheck && (!stateCookieValue || stateCookieValue !== state)) {
			const errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
			throw c.redirect(`${errorURL}?error=state_mismatch`);
		}
		c.setCookie(stateCookie.name, "", { maxAge: 0 });
		await c.context.internalAdapter.deleteVerificationValue(data.id);
	}
	if (!parsedData.errorURL) parsedData.errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
	if (parsedData.expiresAt < Date.now()) {
		const errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
		throw c.redirect(`${errorURL}?error=please_restart_the_process`);
	}
	if (parsedData) await setOAuthState(parsedData);
	return parsedData;
}

//#endregion
export { generateState, parseState };
//# sourceMappingURL=state.mjs.map