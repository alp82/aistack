import "#nitro/virtual/polyfills";
import { useNitroApp } from "nitro/app";
import { isPublicAssetURL } from "#nitro/virtual/public-assets";
const nitroApp = useNitroApp();
// @ts-expect-error
addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);
	if (isPublicAssetURL(url.pathname) || url.pathname.includes("/_server/")) {
		return;
	}
	
	const req = event.request;
	req.runtime ??= { name: "service-worker" };
	req.runtime.serviceWorker ??= { event };
	req.waitUntil = event.waitUntil.bind(event);
	event.respondWith(nitroApp.fetch(req));
});
self.addEventListener("install", () => {
	self.skipWaiting();
});
self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});
