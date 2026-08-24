import { decode, encode } from "../_build/common.mjs";
const schemeRegex = /^[\w+.-]+:\/\//;
const urlRegex = /^([\w+.-]+:)\/\/([^@/#?]*@)?([^:/#?]*)(:\d+)?(\/[^#?]*)?(\?[^#]*)?(#.*)?/;
const fileRegex = /^file:(?:\/\/((?![a-z]:)[^/#?]*)?)?(\/?[^#?]*)(\?[^#]*)?(#.*)?/i;
function isAbsoluteUrl(input) {
	return schemeRegex.test(input);
}
function isSchemeRelativeUrl(input) {
	return input.startsWith("//");
}
function isAbsolutePath(input) {
	return input.startsWith("/");
}
function isFileUrl(input) {
	return input.startsWith("file:");
}
function isRelative(input) {
	return /^[.?#]/.test(input);
}
function parseAbsoluteUrl(input) {
	const match = urlRegex.exec(input);
	return makeUrl(match[1], match[2] || "", match[3], match[4] || "", match[5] || "/", match[6] || "", match[7] || "");
}
function parseFileUrl(input) {
	const match = fileRegex.exec(input);
	const path = match[2];
	return makeUrl("file:", "", match[1] || "", "", isAbsolutePath(path) ? path : "/" + path, match[3] || "", match[4] || "");
}
function makeUrl(scheme, user, host, port, path, query, hash) {
	return {
		scheme,
		user,
		host,
		port,
		path,
		query,
		hash,
		type: 7
	};
}
function parseUrl(input) {
	if (isSchemeRelativeUrl(input)) {
		const url = parseAbsoluteUrl("http:" + input);
		url.scheme = "";
		url.type = 6;
		return url;
	}
	if (isAbsolutePath(input)) {
		const url = parseAbsoluteUrl("http://foo.com" + input);
		url.scheme = "";
		url.host = "";
		url.type = 5;
		return url;
	}
	if (isFileUrl(input)) return parseFileUrl(input);
	if (isAbsoluteUrl(input)) return parseAbsoluteUrl(input);
	const url = parseAbsoluteUrl("http://foo.com/" + input);
	url.scheme = "";
	url.host = "";
	url.type = input ? input.startsWith("?") ? 3 : input.startsWith("#") ? 2 : 4 : 1;
	return url;
}
function stripPathFilename(path) {
	if (path.endsWith("/..")) return path;
	const index = path.lastIndexOf("/");
	return path.slice(0, index + 1);
}
function mergePaths(url, base) {
	normalizePath(base, base.type);
	if (url.path === "/") url.path = base.path;
	else url.path = stripPathFilename(base.path) + url.path;
}
function normalizePath(url, type) {
	const rel = type <= 4;
	const pieces = url.path.split("/");
	let pointer = 1;
	let positive = 0;
	let addTrailingSlash = false;
	for (let i = 1; i < pieces.length; i++) {
		const piece = pieces[i];
		if (!piece) {
			addTrailingSlash = true;
			continue;
		}
		addTrailingSlash = false;
		if (piece === ".") continue;
		if (piece === "..") {
			if (positive) {
				addTrailingSlash = true;
				positive--;
				pointer--;
			} else if (rel) pieces[pointer++] = piece;
			continue;
		}
		pieces[pointer++] = piece;
		positive++;
	}
	let path = "";
	for (let i = 1; i < pointer; i++) path += "/" + pieces[i];
	if (!path || addTrailingSlash && !path.endsWith("/..")) path += "/";
	url.path = path;
}
function resolve(input, base) {
	if (!input && !base) return "";
	const url = parseUrl(input);
	let inputType = url.type;
	if (base && inputType !== 7) {
		const baseUrl = parseUrl(base);
		const baseType = baseUrl.type;
		switch (inputType) {
			case 1: url.hash = baseUrl.hash;
			case 2: url.query = baseUrl.query;
			case 3:
			case 4: mergePaths(url, baseUrl);
			case 5:
				url.user = baseUrl.user;
				url.host = baseUrl.host;
				url.port = baseUrl.port;
			case 6: url.scheme = baseUrl.scheme;
		}
		if (baseType > inputType) inputType = baseType;
	}
	normalizePath(url, inputType);
	const queryHash = url.query + url.hash;
	switch (inputType) {
		case 2:
		case 3: return queryHash;
		case 4: {
			const path = url.path.slice(1);
			if (!path) return queryHash || ".";
			if (isRelative(base || input) && !isRelative(path)) return "./" + path + queryHash;
			return path + queryHash;
		}
		case 5: return url.path + queryHash;
		default: return url.scheme + "//" + url.user + url.host + url.port + url.path + queryHash;
	}
}
function stripFilename(path) {
	if (!path) return "";
	const index = path.lastIndexOf("/");
	return path.slice(0, index + 1);
}
function resolver(mapUrl, sourceRoot) {
	const from = stripFilename(mapUrl);
	const prefix = sourceRoot ? sourceRoot + "/" : "";
	return (source) => resolve(prefix + (source || ""), from);
}
var COLUMN$1 = 0;
function maybeSort(mappings, owned) {
	const unsortedIndex = nextUnsortedSegmentLine(mappings, 0);
	if (unsortedIndex === mappings.length) return mappings;
	if (!owned) mappings = mappings.slice();
	for (let i = unsortedIndex; i < mappings.length; i = nextUnsortedSegmentLine(mappings, i + 1)) mappings[i] = sortSegments(mappings[i], owned);
	return mappings;
}
function nextUnsortedSegmentLine(mappings, start) {
	for (let i = start; i < mappings.length; i++) if (!isSorted(mappings[i])) return i;
	return mappings.length;
}
function isSorted(line) {
	for (let j = 1; j < line.length; j++) if (line[j][COLUMN$1] < line[j - 1][COLUMN$1]) return false;
	return true;
}
function sortSegments(line, owned) {
	if (!owned) line = line.slice();
	return line.sort(sortComparator);
}
function sortComparator(a, b) {
	return a[COLUMN$1] - b[COLUMN$1];
}
var found = false;
function binarySearch(haystack, needle, low, high) {
	while (low <= high) {
		const mid = low + (high - low >> 1);
		const cmp = haystack[mid][COLUMN$1] - needle;
		if (cmp === 0) {
			found = true;
			return mid;
		}
		if (cmp < 0) low = mid + 1;
		else high = mid - 1;
	}
	found = false;
	return low - 1;
}
function upperBound(haystack, needle, index) {
	for (let i = index + 1; i < haystack.length; index = i++) if (haystack[i][COLUMN$1] !== needle) break;
	return index;
}
function lowerBound(haystack, needle, index) {
	for (let i = index - 1; i >= 0; index = i--) if (haystack[i][COLUMN$1] !== needle) break;
	return index;
}
function memoizedState() {
	return {
		lastKey: -1,
		lastNeedle: -1,
		lastIndex: -1
	};
}
function memoizedBinarySearch(haystack, needle, state, key) {
	const { lastKey, lastNeedle, lastIndex } = state;
	let low = 0;
	let high = haystack.length - 1;
	if (key === lastKey) {
		if (needle === lastNeedle) {
			found = lastIndex !== -1 && haystack[lastIndex][COLUMN$1] === needle;
			return lastIndex;
		}
		if (needle >= lastNeedle) low = lastIndex === -1 ? 0 : lastIndex;
		else high = lastIndex;
	}
	state.lastKey = key;
	state.lastNeedle = needle;
	return state.lastIndex = binarySearch(haystack, needle, low, high);
}
function parse(map) {
	return typeof map === "string" ? JSON.parse(map) : map;
}
var TraceMap = class {
	constructor(map, mapUrl) {
		const isString = typeof map === "string";
		if (!isString && map._decodedMemo) return map;
		const parsed = parse(map);
		const { version, file, names, sourceRoot, sources, sourcesContent } = parsed;
		this.version = version;
		this.file = file;
		this.names = names || [];
		this.sourceRoot = sourceRoot;
		this.sources = sources;
		this.sourcesContent = sourcesContent;
		this.ignoreList = parsed.ignoreList || parsed.x_google_ignoreList || void 0;
		const resolve = resolver(mapUrl, sourceRoot);
		this.resolvedSources = sources.map(resolve);
		const { mappings } = parsed;
		if (typeof mappings === "string") {
			this._encoded = mappings;
			this._decoded = void 0;
		} else if (Array.isArray(mappings)) {
			this._encoded = void 0;
			this._decoded = maybeSort(mappings, isString);
		} else if (parsed.sections) throw new Error(`TraceMap passed sectioned source map, please use FlattenMap export instead`);
		else throw new Error(`invalid source map: ${JSON.stringify(parsed)}`);
		this._decodedMemo = memoizedState();
		this._bySources = void 0;
		this._bySourceMemos = void 0;
	}
};
function cast$1(map) {
	return map;
}
function decodedMappings(map) {
	var _a;
	return (_a = cast$1(map))._decoded || (_a._decoded = decode(cast$1(map)._encoded));
}
function traceSegment(map, line, column) {
	const decoded = decodedMappings(map);
	if (line >= decoded.length) return null;
	const segments = decoded[line];
	const index = traceSegmentInternal(segments, cast$1(map)._decodedMemo, line, column, 1);
	return index === -1 ? null : segments[index];
}
function traceSegmentInternal(segments, memo, line, column, bias) {
	let index = memoizedBinarySearch(segments, column, memo, line);
	if (found) index = (bias === -1 ? upperBound : lowerBound)(segments, column, index);
	else if (bias === -1) index++;
	if (index === -1 || index === segments.length) return -1;
	return index;
}
var SetArray = class {
	constructor() {
		this._indexes = { __proto__: null };
		this.array = [];
	}
};
function cast(set) {
	return set;
}
function get(setarr, key) {
	return cast(setarr)._indexes[key];
}
function put(setarr, key) {
	const index = get(setarr, key);
	if (index !== void 0) return index;
	const { array, _indexes: indexes } = cast(setarr);
	return indexes[key] = array.push(key) - 1;
}
function remove(setarr, key) {
	const index = get(setarr, key);
	if (index === void 0) return;
	const { array, _indexes: indexes } = cast(setarr);
	for (let i = index + 1; i < array.length; i++) {
		const k = array[i];
		array[i - 1] = k;
		indexes[k]--;
	}
	indexes[key] = void 0;
	array.pop();
}
var COLUMN = 0;
var SOURCES_INDEX = 1;
var SOURCE_LINE = 2;
var SOURCE_COLUMN = 3;
var NAMES_INDEX = 4;
var NO_NAME = -1;
var GenMapping = class {
	constructor({ file, sourceRoot } = {}) {
		this._names = new SetArray();
		this._sources = new SetArray();
		this._sourcesContent = [];
		this._mappings = [];
		this.file = file;
		this.sourceRoot = sourceRoot;
		this._ignoreList = new SetArray();
	}
};
function cast2(map) {
	return map;
}
var maybeAddSegment = (map, genLine, genColumn, source, sourceLine, sourceColumn, name, content) => {
	return addSegmentInternal(true, map, genLine, genColumn, source, sourceLine, sourceColumn, name, content);
};
function setSourceContent(map, source, content) {
	const { _sources: sources, _sourcesContent: sourcesContent } = cast2(map);
	const index = put(sources, source);
	sourcesContent[index] = content;
}
function setIgnore(map, source, ignore = true) {
	const { _sources: sources, _sourcesContent: sourcesContent, _ignoreList: ignoreList } = cast2(map);
	const index = put(sources, source);
	if (index === sourcesContent.length) sourcesContent[index] = null;
	if (ignore) put(ignoreList, index);
	else remove(ignoreList, index);
}
function toDecodedMap(map) {
	const { _mappings: mappings, _sources: sources, _sourcesContent: sourcesContent, _names: names, _ignoreList: ignoreList } = cast2(map);
	removeEmptyFinalLines(mappings);
	return {
		version: 3,
		file: map.file || void 0,
		names: names.array,
		sourceRoot: map.sourceRoot || void 0,
		sources: sources.array,
		sourcesContent,
		mappings,
		ignoreList: ignoreList.array
	};
}
function toEncodedMap(map) {
	const decoded = toDecodedMap(map);
	return Object.assign({}, decoded, { mappings: encode(decoded.mappings) });
}
function addSegmentInternal(skipable, map, genLine, genColumn, source, sourceLine, sourceColumn, name, content) {
	const { _mappings: mappings, _sources: sources, _sourcesContent: sourcesContent, _names: names } = cast2(map);
	const line = getIndex(mappings, genLine);
	const index = getColumnIndex(line, genColumn);
	if (!source) {
		if (skipable && skipSourceless(line, index)) return;
		return insert(line, index, [genColumn]);
	}
	const sourcesIndex = put(sources, source);
	const namesIndex = name ? put(names, name) : NO_NAME;
	if (sourcesIndex === sourcesContent.length) sourcesContent[sourcesIndex] = content != null ? content : null;
	if (skipable && skipSource(line, index, sourcesIndex, sourceLine, sourceColumn, namesIndex)) return;
	return insert(line, index, name ? [
		genColumn,
		sourcesIndex,
		sourceLine,
		sourceColumn,
		namesIndex
	] : [
		genColumn,
		sourcesIndex,
		sourceLine,
		sourceColumn
	]);
}
function getIndex(arr, index) {
	for (let i = arr.length; i <= index; i++) arr[i] = [];
	return arr[index];
}
function getColumnIndex(line, genColumn) {
	let index = line.length;
	for (let i = index - 1; i >= 0; index = i--) if (genColumn >= line[i][COLUMN]) break;
	return index;
}
function insert(array, index, value) {
	for (let i = array.length; i > index; i--) array[i] = array[i - 1];
	array[index] = value;
}
function removeEmptyFinalLines(mappings) {
	const { length } = mappings;
	let len = length;
	for (let i = len - 1; i >= 0; len = i, i--) if (mappings[i].length > 0) break;
	if (len < length) mappings.length = len;
}
function skipSourceless(line, index) {
	if (index === 0) return true;
	return line[index - 1].length === 1;
}
function skipSource(line, index, sourcesIndex, sourceLine, sourceColumn, namesIndex) {
	if (index === 0) return false;
	const prev = line[index - 1];
	if (prev.length === 1) return false;
	return sourcesIndex === prev[SOURCES_INDEX] && sourceLine === prev[SOURCE_LINE] && sourceColumn === prev[SOURCE_COLUMN] && namesIndex === (prev.length === 5 ? prev[NAMES_INDEX] : NO_NAME);
}
export { GenMapping, TraceMap, decodedMappings, maybeAddSegment, setIgnore, setSourceContent, toDecodedMap, toEncodedMap, traceSegment };
