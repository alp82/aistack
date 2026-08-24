import { createError } from "./utils/index.mjs";
import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
const DRIVER_NAME = "azure-storage-blob";
const driver = (opts) => {
	let containerClient;
	const endpointSuffix = opts.endpointSuffix || ".blob.core.windows.net";
	const getContainerClient = () => {
		if (containerClient) {
			return containerClient;
		}
		if (!opts.connectionString && !opts.sasUrl && !opts.accountName) {
			throw createError(DRIVER_NAME, "missing accountName");
		}
		let serviceClient;
		if (opts.accountKey) {
			// StorageSharedKeyCredential is only available in Node.js runtime, not in browsers
			const credential = new StorageSharedKeyCredential(opts.accountName, opts.accountKey);
			serviceClient = new BlobServiceClient(`https://${opts.accountName}${endpointSuffix}`, credential);
		} else if (opts.sasUrl) {
			if (opts.containerName && opts.sasUrl.includes(`${opts.containerName}?`)) {
				// Check if the sas url is a container url
				containerClient = new ContainerClient(`${opts.sasUrl}`);
				return containerClient;
			}
			serviceClient = new BlobServiceClient(opts.sasUrl);
		} else if (opts.sasKey) {
			if (opts.containerName) {
				containerClient = new ContainerClient(`https://${opts.accountName}${endpointSuffix}/${opts.containerName}?${opts.sasKey}`);
				return containerClient;
			}
			serviceClient = new BlobServiceClient(`https://${opts.accountName}${endpointSuffix}?${opts.sasKey}`);
		} else if (opts.connectionString) {
			// fromConnectionString is only available in Node.js runtime, not in browsers
			serviceClient = BlobServiceClient.fromConnectionString(opts.connectionString);
		} else {
			const credential = new DefaultAzureCredential();
			serviceClient = new BlobServiceClient(`https://${opts.accountName}${endpointSuffix}`, credential);
		}
		containerClient = serviceClient.getContainerClient(opts.containerName || "unstorage");
		containerClient.createIfNotExists();
		return containerClient;
	};
	return {
		name: DRIVER_NAME,
		options: opts,
		getInstance: getContainerClient,
		async hasItem(key) {
			return await getContainerClient().getBlockBlobClient(key).exists();
		},
		async getItem(key) {
			try {
				const blob = await getContainerClient().getBlockBlobClient(key).download();
				if (isBrowser) {
					return blob.blobBody ? await blobToString(await blob.blobBody) : null;
				}
				return blob.readableStreamBody ? (await streamToBuffer(blob.readableStreamBody)).toString() : null;
			} catch {
				return null;
			}
		},
		async getItemRaw(key) {
			try {
				const blob = await getContainerClient().getBlockBlobClient(key).download();
				if (isBrowser) {
					return blob.blobBody ? await blobToString(await blob.blobBody) : null;
				}
				return blob.readableStreamBody ? await streamToBuffer(blob.readableStreamBody) : null;
			} catch {
				return null;
			}
		},
		async setItem(key, value) {
			await getContainerClient().getBlockBlobClient(key).upload(value, Buffer.byteLength(value));
		},
		async setItemRaw(key, value) {
			await getContainerClient().getBlockBlobClient(key).upload(value, Buffer.byteLength(value));
		},
		async removeItem(key) {
			await getContainerClient().getBlockBlobClient(key).deleteIfExists({ deleteSnapshots: "include" });
		},
		async getKeys() {
			const iterator = getContainerClient().listBlobsFlat().byPage({ maxPageSize: 1e3 });
			const keys = [];
			for await (const page of iterator) {
				const pageKeys = page.segment.blobItems.map((blob) => blob.name);
				keys.push(...pageKeys);
			}
			return keys;
		},
		async getMeta(key) {
			const blobProperties = await getContainerClient().getBlockBlobClient(key).getProperties();
			return {
				mtime: blobProperties.lastModified,
				atime: blobProperties.lastAccessed,
				cr: blobProperties.createdOn,
				...blobProperties.metadata
			};
		},
		async clear() {
			const iterator = getContainerClient().listBlobsFlat().byPage({ maxPageSize: 1e3 });
			for await (const page of iterator) {
				await Promise.all(page.segment.blobItems.map(async (blob) => await getContainerClient().deleteBlob(blob.name, { deleteSnapshots: "include" })));
			}
		}
	};
};
const isBrowser = typeof window !== "undefined";
// Helper function to read a Node.js readable stream into a Buffer. (https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
async function streamToBuffer(readableStream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		readableStream.on("data", (data) => {
			chunks.push(data instanceof Buffer ? data : Buffer.from(data));
		});
		readableStream.on("end", () => {
			resolve(Buffer.concat(chunks));
		});
		readableStream.on("error", reject);
	});
}
// Helper function used to convert a browser Blob into string. (https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
async function blobToString(blob) {
	const fileReader = new FileReader();
	return new Promise((resolve, reject) => {
		fileReader.onloadend = (ev) => {
			resolve(ev.target?.result);
		};
		// eslint-disable-next-line unicorn/prefer-add-event-listener
		fileReader.onerror = reject;
		// eslint-disable-next-line unicorn/prefer-blob-reading-methods
		fileReader.readAsText(blob);
	});
}
export default driver;
