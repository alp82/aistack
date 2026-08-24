import * as blob from "@vercel/blob";
import { normalizeKey, joinKeys, createError } from "./utils/index.mjs";
const DRIVER_NAME = "vercel-blob";
const driver = (opts) => {
	const optsBase = normalizeKey(opts?.base);
	const r = (...keys) => joinKeys(optsBase, ...keys).replace(/:/g, "/");
	const envName = `${opts.envPrefix || "BLOB"}_READ_WRITE_TOKEN`;
	const getToken = () => {
		const token = opts.token || globalThis.process?.env?.[envName];
		if (!token) {
			throw createError(DRIVER_NAME, `Missing token. Set ${envName} env or token config.`);
		}
		return token;
	};
	const get = (key) => blob.get(r(key), {
		token: getToken(),
		access: opts.access
	});
	return {
		name: DRIVER_NAME,
		options: opts,
		async hasItem(key) {
			try {
				await blob.head(r(key), { token: getToken() });
				return true;
			} catch {
				return false;
			}
		},
		async getItem(key) {
			const result = await get(key);
			if (!result) return null;
			return new Response(result.stream).text();
		},
		async getItemRaw(key) {
			const result = await get(key);
			if (!result) return null;
			return new Response(result.stream).arrayBuffer();
		},
		async getMeta(key) {
			try {
				const blobHead = await blob.head(r(key), { token: getToken() });
				return {
					mtime: blobHead.uploadedAt,
					...blobHead
				};
			} catch {
				return null;
			}
		},
		async setItem(key, value, callOpts) {
			await blob.put(r(key), value, {
				access: opts.access,
				addRandomSuffix: false,
				token: getToken(),
				...callOpts
			});
		},
		async setItemRaw(key, value, callOpts) {
			await blob.put(r(key), value, {
				access: opts.access,
				addRandomSuffix: false,
				token: getToken(),
				...callOpts
			});
		},
		async removeItem(key) {
			await blob.del(r(key), { token: getToken() });
		},
		async getKeys(base) {
			const blobs = [];
			let cursor = undefined;
			do {
				const listBlobResult = await blob.list({
					token: getToken(),
					cursor,
					prefix: r(base)
				});
				cursor = listBlobResult.cursor;
				for (const blob of listBlobResult.blobs) {
					blobs.push(blob);
				}
			} while (cursor);
			return blobs.map((blob) => blob.pathname.replace(new RegExp(`^${optsBase.replace(/:/g, "/")}/`), ""));
		},
		async clear(base) {
			let cursor = undefined;
			const blobs = [];
			do {
				const listBlobResult = await blob.list({
					token: getToken(),
					cursor,
					prefix: r(base)
				});
				blobs.push(...listBlobResult.blobs);
				cursor = listBlobResult.cursor;
			} while (cursor);
			if (blobs.length > 0) {
				await blob.del(blobs.map((blob) => blob.url), { token: getToken() });
			}
		}
	};
};
export default driver;
