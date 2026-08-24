import { createError, createRequiredError } from "./utils/index.mjs";
import { getStore, getDeployStore } from "@netlify/blobs";
const DRIVER_NAME = "netlify-blobs";
const driver = (options) => {
	const { deployScoped, name, ...opts } = options;
	let store;
	const getClient = () => {
		if (!store) {
			if (deployScoped) {
				if (name) {
					throw createError(DRIVER_NAME, "deploy-scoped stores cannot have a name");
				}
				store = getDeployStore({
					fetch,
					...options
				});
			} else {
				if (!name) {
					throw createRequiredError(DRIVER_NAME, "name");
				}
				// Ensures that reserved characters are encoded
				store = getStore({
					name: encodeURIComponent(name),
					fetch,
					...opts
				});
			}
		}
		return store;
	};
	return {
		name: DRIVER_NAME,
		options,
		getInstance: getClient,
		async hasItem(key) {
			return getClient().getMetadata(key).then(Boolean);
		},
		getItem: (key, tops) => {
			// @ts-expect-error has trouble with the overloaded types
			return getClient().get(key, tops);
		},
		getMeta(key) {
			return getClient().getMetadata(key);
		},
		getItemRaw(key, topts) {
			// @ts-expect-error has trouble with the overloaded types
			return getClient().get(key, { type: topts?.type ?? "arrayBuffer" });
		},
		async setItem(key, value, topts) {
			// NOTE: this returns either Promise<void> (pre-v10) or Promise<WriteResult> (v10+)
			// TODO(serhalp): Allow drivers to return a value from `setItem`. The @netlify/blobs v10
			// functionality isn't usable without this.
			await getClient().set(key, value, topts);
		},
		async setItemRaw(key, value, topts) {
			// NOTE: this returns either Promise<void> (pre-v10) or Promise<WriteResult> (v10+)
			// See TODO above.
			await getClient().set(key, value, topts);
		},
		removeItem(key) {
			return getClient().delete(key);
		},
		async getKeys(base, tops) {
			return (await getClient().list({
				...tops,
				prefix: base
			})).blobs.map((item) => item.key);
		},
		async clear(base) {
			const client = getClient();
			return Promise.allSettled((await client.list({ prefix: base })).blobs.map((item) => client.delete(item.key))).then(() => {});
		}
	};
};
export default driver;
