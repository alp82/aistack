import { symmetricDecrypt, symmetricEncrypt } from "../crypto/index.mjs";

//#region src/oauth2/utils.ts
function decryptOAuthToken(token, ctx) {
	if (!token) return token;
	if (ctx.options.account?.encryptOAuthTokens) return symmetricDecrypt({
		key: ctx.secret,
		data: token
	});
	return token;
}
function setTokenUtil(token, ctx) {
	if (ctx.options.account?.encryptOAuthTokens && token) return symmetricEncrypt({
		key: ctx.secret,
		data: token
	});
	return token;
}

//#endregion
export { decryptOAuthToken, setTokenUtil };
//# sourceMappingURL=utils.mjs.map