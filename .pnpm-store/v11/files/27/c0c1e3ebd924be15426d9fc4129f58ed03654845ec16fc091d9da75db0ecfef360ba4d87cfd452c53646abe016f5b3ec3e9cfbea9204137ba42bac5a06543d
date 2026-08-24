import "#nitro/virtual/polyfills";
import { NodeRequest } from "srvx/node";
import { useNitroApp } from "nitro/app";
const nitroApp = useNitroApp();

export default async function handle(req) {
	
	const request = new NodeRequest({ req });
	return nitroApp.fetch(request);
}
