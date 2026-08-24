import "#nitro/virtual/polyfills";
import { useNitroApp } from "nitro/app";
import { isPublicAssetURL } from "#nitro/virtual/public-assets";
const nitroApp = useNitroApp();

export default async function netlifyEdge(netlifyReq, context) {
	
	const req = netlifyReq;
	req.ip = context.ip;
	req.runtime ??= { name: "netlify-edge" };
	req.runtime.netlify ??= { context };
	const url = new URL(req.url);
	if (isPublicAssetURL(url.pathname)) {
		return;
	}
	if (!req.headers.has("x-forwarded-proto") && url.protocol === "https:") {
		req.headers.set("x-forwarded-proto", "https");
	}
	return nitroApp.fetch(req);
}
