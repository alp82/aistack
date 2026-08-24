//#region src/utils.ts
const storageKeyProperties = [
	"has",
	"hasItem",
	"get",
	"getItem",
	"getItemRaw",
	"set",
	"setItem",
	"setItemRaw",
	"del",
	"remove",
	"removeItem",
	"getMeta",
	"setMeta",
	"removeMeta",
	"getKeys",
	"clear",
	"mount",
	"unmount"
];
function prefixStorage(storage, base) {
	base = normalizeBaseKey(base);
	if (!base) return storage;
	const nsStorage = { ...storage };
	for (const property of storageKeyProperties) nsStorage[property] = (key = "", ...args) => storage[property](base + key, ...args);
	nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key) => key.slice(base.length)));
	nsStorage.keys = nsStorage.getKeys;
	nsStorage.getItems = async (items, commonOptions) => {
		const prefixedItems = items.map((item) => typeof item === "string" ? base + item : {
			...item,
			key: base + item.key
		});
		return (await storage.getItems(prefixedItems, commonOptions)).map((entry) => ({
			key: entry.key.slice(base.length),
			value: entry.value
		}));
	};
	nsStorage.setItems = async (items, commonOptions) => {
		const prefixedItems = items.map((item) => ({
			key: base + item.key,
			value: item.value,
			options: item.options
		}));
		return storage.setItems(prefixedItems, commonOptions);
	};
	return nsStorage;
}
function normalizeKey(key) {
	if (!key) return "";
	return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
	return normalizeKey(keys.join(":"));
}
function normalizeBaseKey(base) {
	base = normalizeKey(base);
	return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
	if (depth === void 0) return true;
	let substrCount = 0;
	let index = key.indexOf(":");
	while (index > -1) {
		substrCount++;
		index = key.indexOf(":", index + 1);
	}
	return substrCount <= depth;
}
function filterKeyByBase(key, base) {
	if (base) return key.startsWith(base) && key[key.length - 1] !== "$";
	return key[key.length - 1] !== "$";
}
//#endregion
export { normalizeKey as a, normalizeBaseKey as i, filterKeyByDepth as n, prefixStorage as o, joinKeys as r, filterKeyByBase as t };
