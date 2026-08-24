import { parse } from "cookie-es";
export function getAzureParsedCookiesFromHeaders(headers) {
	const setCookieHeader = headers.getSetCookie();
	if (setCookieHeader.length === 0) {
		return [];
	}
	const azureCookies = [];
	for (const setCookieStr of setCookieHeader) {
		const setCookie = Object.entries(parse(setCookieStr));
		if (setCookie.length === 0) {
			continue;
		}
		const [[key, value], ..._setCookieOptions] = setCookie;
		const setCookieOptions = Object.fromEntries(_setCookieOptions.map(([k, v]) => [k.toLowerCase(), v]));
		const cookieObject = {
			name: key,
			value: value || "",
			domain: setCookieOptions.domain,
			path: setCookieOptions.path,
			expires: parseNumberOrDate(setCookieOptions.expires || ""),
			sameSite: setCookieOptions.samesite,
			maxAge: parseNumber(setCookieOptions["max-age"] || ""),
			secure: setCookieStr.includes("Secure") ? true : undefined,
			httpOnly: setCookieStr.includes("HttpOnly") ? true : undefined
		};
		azureCookies.push(cookieObject);
	}
	return azureCookies;
}
function parseNumberOrDate(expires) {
	const expiresAsNumber = parseNumber(expires);
	if (expiresAsNumber !== undefined) {
		return expiresAsNumber;
	}
	
	const expiresAsDate = new Date(expires);
	if (!Number.isNaN(expiresAsDate.getTime())) {
		return expiresAsDate;
	}
}
function parseNumber(maxAge) {
	if (!maxAge) {
		return undefined;
	}
	
	const maxAgeAsNumber = Number(maxAge);
	if (!Number.isNaN(maxAgeAsNumber)) {
		return maxAgeAsNumber;
	}
}
