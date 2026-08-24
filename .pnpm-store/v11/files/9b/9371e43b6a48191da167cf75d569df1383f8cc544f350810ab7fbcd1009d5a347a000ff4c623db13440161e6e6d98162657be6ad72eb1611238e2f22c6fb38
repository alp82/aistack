import { prefixStorage } from "unstorage";
import { initStorage } from "#nitro/virtual/storage";
export function useStorage(base = "") {
	const storage = useStorage._storage ??= initStorage();
	return base ? prefixStorage(storage, base) : storage;
}
