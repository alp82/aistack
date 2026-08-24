import { normalizeKey } from "./utils/index.mjs";
import { UTApi } from "uploadthing/server";
const DRIVER_NAME = "uploadthing";
const driver = (opts = {}) => {
	let client;
	const base = opts.base ? normalizeKey(opts.base) : "";
	const r = (key) => base ? `${base}:${key}` : key;
	const getClient = () => {
		return client ??= new UTApi({
			...opts,
			defaultKeyType: "customId"
		});
	};
	const getKeys = async (base) => {
		const client = getClient();
		const { files } = await client.listFiles({});
		return files.map((file) => file.customId).filter((k) => k && k.startsWith(base));
	};
	const toFile = (key, value) => {
		return Object.assign(new Blob([value]), {
			name: key,
			customId: key
		});
	};
	return {
		name: DRIVER_NAME,
		getInstance() {
			return getClient();
		},
		getKeys(base) {
			return getKeys(r(base));
		},
		async hasItem(key) {
			const client = getClient();
			const res = await client.getFileUrls(r(key));
			return res.data.length > 0;
		},
		async getItem(key) {
			const client = getClient();
			const url = await client.getFileUrls(r(key)).then((res) => res.data[0]?.url);
			if (!url) return null;
			return fetch(url).then((res) => res.text());
		},
		async getItemRaw(key) {
			const client = getClient();
			const url = await client.getFileUrls(r(key)).then((res) => res.data[0]?.url);
			if (!url) return null;
			return fetch(url).then((res) => res.arrayBuffer());
		},
		async setItem(key, value) {
			const client = getClient();
			await client.uploadFiles(toFile(r(key), value));
		},
		async setItemRaw(key, value) {
			const client = getClient();
			await client.uploadFiles(toFile(r(key), value));
		},
		async setItems(items) {
			const client = getClient();
			await client.uploadFiles(items.map((item) => toFile(r(item.key), item.value)));
		},
		async removeItem(key) {
			const client = getClient();
			await client.deleteFiles([r(key)]);
		},
		async clear(base) {
			const client = getClient();
			const keys = await getKeys(r(base));
			await client.deleteFiles(keys);
		}
	};
};
export default driver;
