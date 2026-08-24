import { __exportAll } from "../_common.mjs";
import { stat, unwatchFile, watch, watchFile } from "node:fs";
import { lstat, open, readdir, realpath, stat as stat$1 } from "node:fs/promises";
import { type } from "node:os";
import * as sp from "node:path";
import { join, relative, resolve, sep } from "node:path";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
const EntryTypes = {
	FILE_TYPE: "files",
	DIR_TYPE: "directories",
	FILE_DIR_TYPE: "files_directories",
	EVERYTHING_TYPE: "all"
};
const defaultOptions = {
	root: ".",
	fileFilter: (_entryInfo) => true,
	directoryFilter: (_entryInfo) => true,
	type: EntryTypes.FILE_TYPE,
	lstat: false,
	depth: 2147483648,
	alwaysStat: false,
	highWaterMark: 4096
};
Object.freeze(defaultOptions);
const RECURSIVE_ERROR_CODE = "READDIRP_RECURSIVE_ERROR";
const NORMAL_FLOW_ERRORS = new Set([
	"ENOENT",
	"EPERM",
	"EACCES",
	"ELOOP",
	RECURSIVE_ERROR_CODE
]);
const ALL_TYPES = [
	EntryTypes.DIR_TYPE,
	EntryTypes.EVERYTHING_TYPE,
	EntryTypes.FILE_DIR_TYPE,
	EntryTypes.FILE_TYPE
];
const DIR_TYPES = new Set([
	EntryTypes.DIR_TYPE,
	EntryTypes.EVERYTHING_TYPE,
	EntryTypes.FILE_DIR_TYPE
]);
const FILE_TYPES = new Set([
	EntryTypes.EVERYTHING_TYPE,
	EntryTypes.FILE_DIR_TYPE,
	EntryTypes.FILE_TYPE
]);
const isNormalFlowError = (error) => NORMAL_FLOW_ERRORS.has(error.code);
const wantBigintFsStats = process.platform === "win32";
const emptyFn = (_entryInfo) => true;
const normalizeFilter = (filter) => {
	if (filter === void 0) return emptyFn;
	if (typeof filter === "function") return filter;
	if (typeof filter === "string") {
		const fl = filter.trim();
		return (entry) => entry.basename === fl;
	}
	if (Array.isArray(filter)) {
		const trItems = filter.map((item) => item.trim());
		return (entry) => trItems.some((f) => entry.basename === f);
	}
	return emptyFn;
};
var ReaddirpStream = class extends Readable {
	parents;
	reading;
	parent;
	_stat;
	_maxDepth;
	_wantsDir;
	_wantsFile;
	_wantsEverything;
	_root;
	_isDirent;
	_statsProp;
	_rdOptions;
	_fileFilter;
	_directoryFilter;
	constructor(options = {}) {
		super({
			objectMode: true,
			autoDestroy: true,
			highWaterMark: options.highWaterMark
		});
		const opts = {
			...defaultOptions,
			...options
		};
		const { root, type } = opts;
		this._fileFilter = normalizeFilter(opts.fileFilter);
		this._directoryFilter = normalizeFilter(opts.directoryFilter);
		const statMethod = opts.lstat ? lstat : stat$1;
		if (wantBigintFsStats) this._stat = (path) => statMethod(path, { bigint: true });
		else this._stat = statMethod;
		this._maxDepth = opts.depth != null && Number.isSafeInteger(opts.depth) ? opts.depth : defaultOptions.depth;
		this._wantsDir = type ? DIR_TYPES.has(type) : false;
		this._wantsFile = type ? FILE_TYPES.has(type) : false;
		this._wantsEverything = type === EntryTypes.EVERYTHING_TYPE;
		this._root = resolve(root);
		this._isDirent = !opts.alwaysStat;
		this._statsProp = this._isDirent ? "dirent" : "stats";
		this._rdOptions = {
			encoding: "utf8",
			withFileTypes: this._isDirent
		};
		this.parents = [this._exploreDir(root, 1)];
		this.reading = false;
		this.parent = void 0;
	}
	async _read(batch) {
		if (this.reading) return;
		this.reading = true;
		try {
			while (!this.destroyed && batch > 0) {
				const par = this.parent;
				const fil = par && par.files;
				if (fil && fil.length > 0) {
					const { path, depth } = par;
					const slice = fil.splice(0, batch).map((dirent) => this._formatEntry(dirent, path));
					const awaited = await Promise.all(slice);
					for (const entry of awaited) {
						if (!entry) continue;
						if (this.destroyed) return;
						const entryType = await this._getEntryType(entry);
						if (entryType === "directory" && this._directoryFilter(entry)) {
							if (depth <= this._maxDepth) this.parents.push(this._exploreDir(entry.fullPath, depth + 1));
							if (this._wantsDir) {
								this.push(entry);
								batch--;
							}
						} else if ((entryType === "file" || this._includeAsFile(entry)) && this._fileFilter(entry)) {
							if (this._wantsFile) {
								this.push(entry);
								batch--;
							}
						}
					}
				} else {
					const parent = this.parents.pop();
					if (!parent) {
						this.push(null);
						break;
					}
					this.parent = await parent;
					if (this.destroyed) return;
				}
			}
		} catch (error) {
			this.destroy(error);
		} finally {
			this.reading = false;
		}
	}
	async _exploreDir(path, depth) {
		let files;
		try {
			files = await readdir(path, this._rdOptions);
		} catch (error) {
			this._onError(error);
		}
		return {
			files,
			depth,
			path
		};
	}
	async _formatEntry(dirent, path) {
		let entry;
		const basename = this._isDirent ? dirent.name : dirent;
		try {
			const fullPath = resolve(join(path, basename));
			entry = {
				path: relative(this._root, fullPath),
				fullPath,
				basename
			};
			entry[this._statsProp] = this._isDirent ? dirent : await this._stat(fullPath);
		} catch (err) {
			this._onError(err);
			return;
		}
		return entry;
	}
	_onError(err) {
		if (isNormalFlowError(err) && !this.destroyed) this.emit("warn", err);
		else this.destroy(err);
	}
	async _getEntryType(entry) {
		if (!entry && this._statsProp in entry) return "";
		const stats = entry[this._statsProp];
		if (stats.isFile()) return "file";
		if (stats.isDirectory()) return "directory";
		if (stats && stats.isSymbolicLink()) {
			const full = entry.fullPath;
			try {
				const entryRealPath = await realpath(full);
				const entryRealPathStats = await lstat(entryRealPath);
				if (entryRealPathStats.isFile()) return "file";
				if (entryRealPathStats.isDirectory()) {
					const len = entryRealPath.length;
					if (full.startsWith(entryRealPath) && full.substr(len, 1) === sep) {
						const recursiveError = /* @__PURE__ */ new Error(`Circular symlink detected: "${full}" points to "${entryRealPath}"`);
						recursiveError.code = RECURSIVE_ERROR_CODE;
						return this._onError(recursiveError);
					}
					return "directory";
				}
			} catch (error) {
				this._onError(error);
				return "";
			}
		}
	}
	_includeAsFile(entry) {
		const stats = entry && entry[this._statsProp];
		return stats && this._wantsEverything && !stats.isDirectory();
	}
};
function readdirp(root, options = {}) {
	let type = options.entryType || options.type;
	if (type === "both") type = EntryTypes.FILE_DIR_TYPE;
	if (type) options.type = type;
	if (!root) throw new Error("readdirp: root argument is required. Usage: readdirp(root, options)");
	else if (typeof root !== "string") throw new TypeError("readdirp: root argument must be a string. Usage: readdirp(root, options)");
	else if (type && !ALL_TYPES.includes(type)) throw new Error(`readdirp: Invalid type passed. Use one of ${ALL_TYPES.join(", ")}`);
	options.root = root;
	return new ReaddirpStream(options);
}
const STR_DATA = "data";
const STR_CLOSE = "close";
const EMPTY_FN = () => {};
const pl = process.platform;
const isWindows = pl === "win32";
const isMacos = pl === "darwin";
const isLinux = pl === "linux";
const isFreeBSD = pl === "freebsd";
const isIBMi = type() === "OS400";
const EVENTS = {
	ALL: "all",
	READY: "ready",
	ADD: "add",
	CHANGE: "change",
	ADD_DIR: "addDir",
	UNLINK: "unlink",
	UNLINK_DIR: "unlinkDir",
	RAW: "raw",
	ERROR: "error"
};
const EV = EVENTS;
const THROTTLE_MODE_WATCH = "watch";
const statMethods = {
	lstat,
	stat: stat$1
};
const KEY_LISTENERS = "listeners";
const KEY_ERR = "errHandlers";
const KEY_RAW = "rawEmitters";
const HANDLER_KEYS = [
	KEY_LISTENERS,
	KEY_ERR,
	KEY_RAW
];
const binaryExtensions = new Set([
	"3dm",
	"3ds",
	"3g2",
	"3gp",
	"7z",
	"a",
	"aac",
	"adp",
	"afdesign",
	"afphoto",
	"afpub",
	"ai",
	"aif",
	"aiff",
	"alz",
	"ape",
	"apk",
	"appimage",
	"ar",
	"arj",
	"asf",
	"au",
	"avi",
	"bak",
	"baml",
	"bh",
	"bin",
	"bk",
	"bmp",
	"btif",
	"bz2",
	"bzip2",
	"cab",
	"caf",
	"cgm",
	"class",
	"cmx",
	"cpio",
	"cr2",
	"cur",
	"dat",
	"dcm",
	"deb",
	"dex",
	"djvu",
	"dll",
	"dmg",
	"dng",
	"doc",
	"docm",
	"docx",
	"dot",
	"dotm",
	"dra",
	"DS_Store",
	"dsk",
	"dts",
	"dtshd",
	"dvb",
	"dwg",
	"dxf",
	"ecelp4800",
	"ecelp7470",
	"ecelp9600",
	"egg",
	"eol",
	"eot",
	"epub",
	"exe",
	"f4v",
	"fbs",
	"fh",
	"fla",
	"flac",
	"flatpak",
	"fli",
	"flv",
	"fpx",
	"fst",
	"fvt",
	"g3",
	"gh",
	"gif",
	"graffle",
	"gz",
	"gzip",
	"h261",
	"h263",
	"h264",
	"icns",
	"ico",
	"ief",
	"img",
	"ipa",
	"iso",
	"jar",
	"jpeg",
	"jpg",
	"jpgv",
	"jpm",
	"jxr",
	"key",
	"ktx",
	"lha",
	"lib",
	"lvp",
	"lz",
	"lzh",
	"lzma",
	"lzo",
	"m3u",
	"m4a",
	"m4v",
	"mar",
	"mdi",
	"mht",
	"mid",
	"midi",
	"mj2",
	"mka",
	"mkv",
	"mmr",
	"mng",
	"mobi",
	"mov",
	"movie",
	"mp3",
	"mp4",
	"mp4a",
	"mpeg",
	"mpg",
	"mpga",
	"mxu",
	"nef",
	"npx",
	"numbers",
	"nupkg",
	"o",
	"odp",
	"ods",
	"odt",
	"oga",
	"ogg",
	"ogv",
	"otf",
	"ott",
	"pages",
	"pbm",
	"pcx",
	"pdb",
	"pdf",
	"pea",
	"pgm",
	"pic",
	"png",
	"pnm",
	"pot",
	"potm",
	"potx",
	"ppa",
	"ppam",
	"ppm",
	"pps",
	"ppsm",
	"ppsx",
	"ppt",
	"pptm",
	"pptx",
	"psd",
	"pya",
	"pyc",
	"pyo",
	"pyv",
	"qt",
	"rar",
	"ras",
	"raw",
	"resources",
	"rgb",
	"rip",
	"rlc",
	"rmf",
	"rmvb",
	"rpm",
	"rtf",
	"rz",
	"s3m",
	"s7z",
	"scpt",
	"sgi",
	"shar",
	"snap",
	"sil",
	"sketch",
	"slk",
	"smv",
	"snk",
	"so",
	"stl",
	"suo",
	"sub",
	"swf",
	"tar",
	"tbz",
	"tbz2",
	"tga",
	"tgz",
	"thmx",
	"tif",
	"tiff",
	"tlz",
	"ttc",
	"ttf",
	"txz",
	"udf",
	"uvh",
	"uvi",
	"uvm",
	"uvp",
	"uvs",
	"uvu",
	"viv",
	"vob",
	"war",
	"wav",
	"wax",
	"wbmp",
	"wdp",
	"weba",
	"webm",
	"webp",
	"whl",
	"wim",
	"wm",
	"wma",
	"wmv",
	"wmx",
	"woff",
	"woff2",
	"wrm",
	"wvx",
	"xbm",
	"xif",
	"xla",
	"xlam",
	"xls",
	"xlsb",
	"xlsm",
	"xlsx",
	"xlt",
	"xltm",
	"xltx",
	"xm",
	"xmind",
	"xpi",
	"xpm",
	"xwd",
	"xz",
	"z",
	"zip",
	"zipx"
]);
const isBinaryPath = (filePath) => binaryExtensions.has(sp.extname(filePath).slice(1).toLowerCase());
const foreach = (val, fn) => {
	if (val instanceof Set) val.forEach(fn);
	else fn(val);
};
const addAndConvert = (main, prop, item) => {
	let container = main[prop];
	if (!(container instanceof Set)) main[prop] = container = new Set([container]);
	container.add(item);
};
const clearItem = (cont) => (key) => {
	const set = cont[key];
	if (set instanceof Set) set.clear();
	else delete cont[key];
};
const delFromSet = (main, prop, item) => {
	const container = main[prop];
	if (container instanceof Set) container.delete(item);
	else if (container === item) delete main[prop];
};
const isEmptySet = (val) => val instanceof Set ? val.size === 0 : !val;
const FsWatchInstances = /* @__PURE__ */ new Map();
function createFsWatchInstance(path, options, listener, errHandler, emitRaw) {
	const handleEvent = (rawEvent, evPath) => {
		listener(path);
		emitRaw(rawEvent, evPath, { watchedPath: path });
		if (evPath && path !== evPath) fsWatchBroadcast(sp.resolve(path, evPath), KEY_LISTENERS, sp.join(path, evPath));
	};
	try {
		return watch(path, { persistent: options.persistent }, handleEvent);
	} catch (error) {
		errHandler(error);
		return;
	}
}
const fsWatchBroadcast = (fullPath, listenerType, val1, val2, val3) => {
	const cont = FsWatchInstances.get(fullPath);
	if (!cont) return;
	foreach(cont[listenerType], (listener) => {
		listener(val1, val2, val3);
	});
};
const setFsWatchListener = (path, fullPath, options, handlers) => {
	const { listener, errHandler, rawEmitter } = handlers;
	let cont = FsWatchInstances.get(fullPath);
	let watcher;
	if (!options.persistent) {
		watcher = createFsWatchInstance(path, options, listener, errHandler, rawEmitter);
		if (!watcher) return;
		return watcher.close.bind(watcher);
	}
	if (cont) {
		addAndConvert(cont, KEY_LISTENERS, listener);
		addAndConvert(cont, KEY_ERR, errHandler);
		addAndConvert(cont, KEY_RAW, rawEmitter);
	} else {
		watcher = createFsWatchInstance(path, options, fsWatchBroadcast.bind(null, fullPath, KEY_LISTENERS), errHandler, fsWatchBroadcast.bind(null, fullPath, KEY_RAW));
		if (!watcher) return;
		watcher.on(EV.ERROR, async (error) => {
			const broadcastErr = fsWatchBroadcast.bind(null, fullPath, KEY_ERR);
			if (cont) cont.watcherUnusable = true;
			if (isWindows && error.code === "EPERM") try {
				await (await open(path, "r")).close();
				broadcastErr(error);
			} catch (err) {}
			else broadcastErr(error);
		});
		cont = {
			listeners: listener,
			errHandlers: errHandler,
			rawEmitters: rawEmitter,
			watcher
		};
		FsWatchInstances.set(fullPath, cont);
	}
	return () => {
		delFromSet(cont, KEY_LISTENERS, listener);
		delFromSet(cont, KEY_ERR, errHandler);
		delFromSet(cont, KEY_RAW, rawEmitter);
		if (isEmptySet(cont.listeners)) {
			cont.watcher.close();
			FsWatchInstances.delete(fullPath);
			HANDLER_KEYS.forEach(clearItem(cont));
			cont.watcher = void 0;
			Object.freeze(cont);
		}
	};
};
const FsWatchFileInstances = /* @__PURE__ */ new Map();
const setFsWatchFileListener = (path, fullPath, options, handlers) => {
	const { listener, rawEmitter } = handlers;
	let cont = FsWatchFileInstances.get(fullPath);
	const copts = cont && cont.options;
	if (copts && (copts.persistent < options.persistent || copts.interval > options.interval)) {
		unwatchFile(fullPath);
		cont = void 0;
	}
	if (cont) {
		addAndConvert(cont, KEY_LISTENERS, listener);
		addAndConvert(cont, KEY_RAW, rawEmitter);
	} else {
		cont = {
			listeners: listener,
			rawEmitters: rawEmitter,
			options,
			watcher: watchFile(fullPath, options, (curr, prev) => {
				foreach(cont.rawEmitters, (rawEmitter) => {
					rawEmitter(EV.CHANGE, fullPath, {
						curr,
						prev
					});
				});
				const currmtime = curr.mtimeMs;
				if (curr.size !== prev.size || currmtime > prev.mtimeMs || currmtime === 0) foreach(cont.listeners, (listener) => listener(path, curr));
			})
		};
		FsWatchFileInstances.set(fullPath, cont);
	}
	return () => {
		delFromSet(cont, KEY_LISTENERS, listener);
		delFromSet(cont, KEY_RAW, rawEmitter);
		if (isEmptySet(cont.listeners)) {
			FsWatchFileInstances.delete(fullPath);
			unwatchFile(fullPath);
			cont.options = cont.watcher = void 0;
			Object.freeze(cont);
		}
	};
};
var NodeFsHandler = class {
	fsw;
	_boundHandleError;
	constructor(fsW) {
		this.fsw = fsW;
		this._boundHandleError = (error) => fsW._handleError(error);
	}
	_watchWithNodeFs(path, listener) {
		const opts = this.fsw.options;
		const directory = sp.dirname(path);
		const basename = sp.basename(path);
		this.fsw._getWatchedDir(directory).add(basename);
		const absolutePath = sp.resolve(path);
		const options = { persistent: opts.persistent };
		if (!listener) listener = EMPTY_FN;
		let closer;
		if (opts.usePolling) {
			options.interval = opts.interval !== opts.binaryInterval && isBinaryPath(basename) ? opts.binaryInterval : opts.interval;
			closer = setFsWatchFileListener(path, absolutePath, options, {
				listener,
				rawEmitter: this.fsw._emitRaw
			});
		} else closer = setFsWatchListener(path, absolutePath, options, {
			listener,
			errHandler: this._boundHandleError,
			rawEmitter: this.fsw._emitRaw
		});
		return closer;
	}
	_handleFile(file, stats, initialAdd) {
		if (this.fsw.closed) return;
		const dirname = sp.dirname(file);
		const basename = sp.basename(file);
		const parent = this.fsw._getWatchedDir(dirname);
		let prevStats = stats;
		if (parent.has(basename)) return;
		const listener = async (path, newStats) => {
			if (!this.fsw._throttle(THROTTLE_MODE_WATCH, file, 5)) return;
			if (!newStats || newStats.mtimeMs === 0) try {
				const newStats = await stat$1(file);
				if (this.fsw.closed) return;
				const at = newStats.atimeMs;
				const mt = newStats.mtimeMs;
				if (!at || at <= mt || mt !== prevStats.mtimeMs) this.fsw._emit(EV.CHANGE, file, newStats);
				if ((isMacos || isLinux || isFreeBSD) && prevStats.ino !== newStats.ino) {
					this.fsw._closeFile(path);
					prevStats = newStats;
					const closer = this._watchWithNodeFs(file, listener);
					if (closer) this.fsw._addPathCloser(path, closer);
				} else prevStats = newStats;
			} catch (error) {
				this.fsw._remove(dirname, basename);
			}
			else if (parent.has(basename)) {
				const at = newStats.atimeMs;
				const mt = newStats.mtimeMs;
				if (!at || at <= mt || mt !== prevStats.mtimeMs) this.fsw._emit(EV.CHANGE, file, newStats);
				prevStats = newStats;
			}
		};
		const closer = this._watchWithNodeFs(file, listener);
		if (!(initialAdd && this.fsw.options.ignoreInitial) && this.fsw._isntIgnored(file)) {
			if (!this.fsw._throttle(EV.ADD, file, 0)) return;
			this.fsw._emit(EV.ADD, file, stats);
		}
		return closer;
	}
	async _handleSymlink(entry, directory, path, item) {
		if (this.fsw.closed) return;
		const full = entry.fullPath;
		const dir = this.fsw._getWatchedDir(directory);
		if (!this.fsw.options.followSymlinks) {
			this.fsw._incrReadyCount();
			let linkPath;
			try {
				linkPath = await realpath(path);
			} catch (e) {
				this.fsw._emitReady();
				return true;
			}
			if (this.fsw.closed) return;
			if (dir.has(item)) {
				if (this.fsw._symlinkPaths.get(full) !== linkPath) {
					this.fsw._symlinkPaths.set(full, linkPath);
					this.fsw._emit(EV.CHANGE, path, entry.stats);
				}
			} else {
				dir.add(item);
				this.fsw._symlinkPaths.set(full, linkPath);
				this.fsw._emit(EV.ADD, path, entry.stats);
			}
			this.fsw._emitReady();
			return true;
		}
		if (this.fsw._symlinkPaths.has(full)) return true;
		this.fsw._symlinkPaths.set(full, true);
	}
	_handleRead(directory, initialAdd, wh, target, dir, depth, throttler) {
		directory = sp.join(directory, "");
		const throttleKey = target ? `${directory}:${target}` : directory;
		throttler = this.fsw._throttle("readdir", throttleKey, 1e3);
		if (!throttler) return;
		const previous = this.fsw._getWatchedDir(wh.path);
		const current = /* @__PURE__ */ new Set();
		let stream = this.fsw._readdirp(directory, {
			fileFilter: (entry) => wh.filterPath(entry),
			directoryFilter: (entry) => wh.filterDir(entry)
		});
		if (!stream) return;
		stream.on(STR_DATA, async (entry) => {
			if (this.fsw.closed) {
				stream = void 0;
				return;
			}
			const item = entry.path;
			let path = sp.join(directory, item);
			current.add(item);
			if (entry.stats.isSymbolicLink() && await this._handleSymlink(entry, directory, path, item)) return;
			if (this.fsw.closed) {
				stream = void 0;
				return;
			}
			if (item === target || !target && !previous.has(item)) {
				this.fsw._incrReadyCount();
				path = sp.join(dir, sp.relative(dir, path));
				this._addToNodeFs(path, initialAdd, wh, depth + 1);
			}
		}).on(EV.ERROR, this._boundHandleError);
		return new Promise((resolve, reject) => {
			if (!stream) return reject();
			stream.once("end", () => {
				if (this.fsw.closed) {
					stream = void 0;
					return;
				}
				const wasThrottled = throttler ? throttler.clear() : false;
				resolve(void 0);
				previous.getChildren().filter((item) => {
					return item !== directory && !current.has(item);
				}).forEach((item) => {
					this.fsw._remove(directory, item);
				});
				stream = void 0;
				if (wasThrottled) this._handleRead(directory, false, wh, target, dir, depth, throttler);
			});
		});
	}
	async _handleDir(dir, stats, initialAdd, depth, target, wh, realpath) {
		const parentDir = this.fsw._getWatchedDir(sp.dirname(dir));
		const tracked = parentDir.has(sp.basename(dir));
		if (!(initialAdd && this.fsw.options.ignoreInitial) && !target && !tracked) this.fsw._emit(EV.ADD_DIR, dir, stats);
		parentDir.add(sp.basename(dir));
		this.fsw._getWatchedDir(dir);
		let throttler;
		let closer;
		const oDepth = this.fsw.options.depth;
		if ((oDepth == null || depth <= oDepth) && !this.fsw._symlinkPaths.has(realpath)) {
			if (!target) {
				await this._handleRead(dir, initialAdd, wh, target, dir, depth, throttler);
				if (this.fsw.closed) return;
			}
			closer = this._watchWithNodeFs(dir, (dirPath, stats) => {
				if (stats && stats.mtimeMs === 0) return;
				this._handleRead(dirPath, false, wh, target, dir, depth, throttler);
			});
		}
		return closer;
	}
	async _addToNodeFs(path, initialAdd, priorWh, depth, target) {
		const ready = this.fsw._emitReady;
		if (this.fsw._isIgnored(path) || this.fsw.closed) {
			ready();
			return false;
		}
		const wh = this.fsw._getWatchHelpers(path);
		if (priorWh) {
			wh.filterPath = (entry) => priorWh.filterPath(entry);
			wh.filterDir = (entry) => priorWh.filterDir(entry);
		}
		try {
			const stats = await statMethods[wh.statMethod](wh.watchPath);
			if (this.fsw.closed) return;
			if (this.fsw._isIgnored(wh.watchPath, stats)) {
				ready();
				return false;
			}
			const follow = this.fsw.options.followSymlinks;
			let closer;
			if (stats.isDirectory()) {
				const absPath = sp.resolve(path);
				const targetPath = follow ? await realpath(path) : path;
				if (this.fsw.closed) return;
				closer = await this._handleDir(wh.watchPath, stats, initialAdd, depth, target, wh, targetPath);
				if (this.fsw.closed) return;
				if (absPath !== targetPath && targetPath !== void 0) this.fsw._symlinkPaths.set(absPath, targetPath);
			} else if (stats.isSymbolicLink()) {
				const targetPath = follow ? await realpath(path) : path;
				if (this.fsw.closed) return;
				const parent = sp.dirname(wh.watchPath);
				this.fsw._getWatchedDir(parent).add(wh.watchPath);
				this.fsw._emit(EV.ADD, wh.watchPath, stats);
				closer = await this._handleDir(parent, stats, initialAdd, depth, path, wh, targetPath);
				if (this.fsw.closed) return;
				if (targetPath !== void 0) this.fsw._symlinkPaths.set(sp.resolve(path), targetPath);
			} else closer = this._handleFile(wh.watchPath, stats, initialAdd);
			ready();
			if (closer) this.fsw._addPathCloser(path, closer);
			return false;
		} catch (error) {
			if (this.fsw._handleError(error)) {
				ready();
				return path;
			}
		}
	}
};
var chokidar_exports = /* @__PURE__ */ __exportAll({
	FSWatcher: () => FSWatcher,
	WatchHelper: () => WatchHelper,
	default: () => chokidar_default,
	watch: () => watch$1
});
const SLASH = "/";
const SLASH_SLASH = "//";
const ONE_DOT = ".";
const TWO_DOTS = "..";
const STRING_TYPE = "string";
const BACK_SLASH_RE = /\\/g;
const DOUBLE_SLASH_RE = /\/\//g;
const DOT_RE = /\..*\.(sw[px])$|~$|\.subl.*\.tmp/;
const REPLACER_RE = /^\.[/\\]/;
function arrify(item) {
	return Array.isArray(item) ? item : [item];
}
const isMatcherObject = (matcher) => typeof matcher === "object" && matcher !== null && !(matcher instanceof RegExp);
function createPattern(matcher) {
	if (typeof matcher === "function") return matcher;
	if (typeof matcher === "string") return (string) => matcher === string;
	if (matcher instanceof RegExp) return (string) => matcher.test(string);
	if (typeof matcher === "object" && matcher !== null) return (string) => {
		if (matcher.path === string) return true;
		if (matcher.recursive) {
			const relative = sp.relative(matcher.path, string);
			if (!relative) return false;
			return !relative.startsWith("..") && !sp.isAbsolute(relative);
		}
		return false;
	};
	return () => false;
}
function normalizePath(path) {
	if (typeof path !== "string") throw new Error("string expected");
	path = sp.normalize(path);
	path = path.replace(/\\/g, "/");
	let prepend = false;
	if (path.startsWith("//")) prepend = true;
	path = path.replace(DOUBLE_SLASH_RE, "/");
	if (prepend) path = "/" + path;
	return path;
}
function matchPatterns(patterns, testString, stats) {
	const path = normalizePath(testString);
	for (let index = 0; index < patterns.length; index++) {
		const pattern = patterns[index];
		if (pattern(path, stats)) return true;
	}
	return false;
}
function anymatch(matchers, testString) {
	if (matchers == null) throw new TypeError("anymatch: specify first argument");
	const patterns = arrify(matchers).map((matcher) => createPattern(matcher));
	if (testString == null) return (testString, stats) => {
		return matchPatterns(patterns, testString, stats);
	};
	return matchPatterns(patterns, testString);
}
const unifyPaths = (paths_) => {
	const paths = arrify(paths_).flat();
	if (!paths.every((p) => typeof p === STRING_TYPE)) throw new TypeError(`Non-string provided as watch path: ${paths}`);
	return paths.map(normalizePathToUnix);
};
const toUnix = (string) => {
	let str = string.replace(BACK_SLASH_RE, SLASH);
	let prepend = false;
	if (str.startsWith(SLASH_SLASH)) prepend = true;
	str = str.replace(DOUBLE_SLASH_RE, SLASH);
	if (prepend) str = SLASH + str;
	return str;
};
const normalizePathToUnix = (path) => toUnix(sp.normalize(toUnix(path)));
const normalizeIgnored = (cwd = "") => (path) => {
	if (typeof path === "string") return normalizePathToUnix(sp.isAbsolute(path) ? path : sp.join(cwd, path));
	else return path;
};
const getAbsolutePath = (path, cwd) => {
	if (sp.isAbsolute(path)) return path;
	return sp.join(cwd, path);
};
const EMPTY_SET = Object.freeze(/* @__PURE__ */ new Set());
var DirEntry = class {
	path;
	_removeWatcher;
	items;
	constructor(dir, removeWatcher) {
		this.path = dir;
		this._removeWatcher = removeWatcher;
		this.items = /* @__PURE__ */ new Set();
	}
	add(item) {
		const { items } = this;
		if (!items) return;
		if (item !== ONE_DOT && item !== TWO_DOTS) items.add(item);
	}
	async remove(item) {
		const { items } = this;
		if (!items) return;
		items.delete(item);
		if (items.size > 0) return;
		const dir = this.path;
		try {
			await readdir(dir);
		} catch (err) {
			if (this._removeWatcher) this._removeWatcher(sp.dirname(dir), sp.basename(dir));
		}
	}
	has(item) {
		const { items } = this;
		if (!items) return;
		return items.has(item);
	}
	getChildren() {
		const { items } = this;
		if (!items) return [];
		return [...items.values()];
	}
	dispose() {
		this.items.clear();
		this.path = "";
		this._removeWatcher = EMPTY_FN;
		this.items = EMPTY_SET;
		Object.freeze(this);
	}
};
const STAT_METHOD_F = "stat";
const STAT_METHOD_L = "lstat";
var WatchHelper = class {
	fsw;
	path;
	watchPath;
	fullWatchPath;
	dirParts;
	followSymlinks;
	statMethod;
	constructor(path, follow, fsw) {
		this.fsw = fsw;
		const watchPath = path;
		this.path = path = path.replace(REPLACER_RE, "");
		this.watchPath = watchPath;
		this.fullWatchPath = sp.resolve(watchPath);
		this.dirParts = [];
		this.dirParts.forEach((parts) => {
			if (parts.length > 1) parts.pop();
		});
		this.followSymlinks = follow;
		this.statMethod = follow ? STAT_METHOD_F : STAT_METHOD_L;
	}
	entryPath(entry) {
		return sp.join(this.watchPath, sp.relative(this.watchPath, entry.fullPath));
	}
	filterPath(entry) {
		const { stats } = entry;
		if (stats && stats.isSymbolicLink()) return this.filterDir(entry);
		const resolvedPath = this.entryPath(entry);
		return this.fsw._isntIgnored(resolvedPath, stats) && this.fsw._hasReadPermissions(stats);
	}
	filterDir(entry) {
		return this.fsw._isntIgnored(this.entryPath(entry), entry.stats);
	}
};
var FSWatcher = class extends EventEmitter {
	closed;
	options;
	_closers;
	_ignoredPaths;
	_throttled;
	_streams;
	_symlinkPaths;
	_watched;
	_pendingWrites;
	_pendingUnlinks;
	_readyCount;
	_emitReady;
	_closePromise;
	_userIgnored;
	_readyEmitted;
	_emitRaw;
	_boundRemove;
	_nodeFsHandler;
	constructor(_opts = {}) {
		super();
		this.closed = false;
		this._closers = /* @__PURE__ */ new Map();
		this._ignoredPaths = /* @__PURE__ */ new Set();
		this._throttled = /* @__PURE__ */ new Map();
		this._streams = /* @__PURE__ */ new Set();
		this._symlinkPaths = /* @__PURE__ */ new Map();
		this._watched = /* @__PURE__ */ new Map();
		this._pendingWrites = /* @__PURE__ */ new Map();
		this._pendingUnlinks = /* @__PURE__ */ new Map();
		this._readyCount = 0;
		this._readyEmitted = false;
		const awf = _opts.awaitWriteFinish;
		const DEF_AWF = {
			stabilityThreshold: 2e3,
			pollInterval: 100
		};
		const opts = {
			persistent: true,
			ignoreInitial: false,
			ignorePermissionErrors: false,
			interval: 100,
			binaryInterval: 300,
			followSymlinks: true,
			usePolling: false,
			atomic: true,
			..._opts,
			ignored: _opts.ignored ? arrify(_opts.ignored) : arrify([]),
			awaitWriteFinish: awf === true ? DEF_AWF : typeof awf === "object" ? {
				...DEF_AWF,
				...awf
			} : false
		};
		if (isIBMi) opts.usePolling = true;
		if (opts.atomic === void 0) opts.atomic = !opts.usePolling;
		const envPoll = process.env.CHOKIDAR_USEPOLLING;
		if (envPoll !== void 0) {
			const envLower = envPoll.toLowerCase();
			if (envLower === "false" || envLower === "0") opts.usePolling = false;
			else if (envLower === "true" || envLower === "1") opts.usePolling = true;
			else opts.usePolling = !!envLower;
		}
		const envInterval = process.env.CHOKIDAR_INTERVAL;
		if (envInterval) opts.interval = Number.parseInt(envInterval, 10);
		let readyCalls = 0;
		this._emitReady = () => {
			readyCalls++;
			if (readyCalls >= this._readyCount) {
				this._emitReady = EMPTY_FN;
				this._readyEmitted = true;
				process.nextTick(() => this.emit(EVENTS.READY));
			}
		};
		this._emitRaw = (...args) => this.emit(EVENTS.RAW, ...args);
		this._boundRemove = this._remove.bind(this);
		this.options = opts;
		this._nodeFsHandler = new NodeFsHandler(this);
		Object.freeze(opts);
	}
	_addIgnoredPath(matcher) {
		if (isMatcherObject(matcher)) {
			for (const ignored of this._ignoredPaths) if (isMatcherObject(ignored) && ignored.path === matcher.path && ignored.recursive === matcher.recursive) return;
		}
		this._ignoredPaths.add(matcher);
	}
	_removeIgnoredPath(matcher) {
		this._ignoredPaths.delete(matcher);
		if (typeof matcher === "string") {
			for (const ignored of this._ignoredPaths) if (isMatcherObject(ignored) && ignored.path === matcher) this._ignoredPaths.delete(ignored);
		}
	}
	add(paths_, _origAdd, _internal) {
		const { cwd } = this.options;
		this.closed = false;
		this._closePromise = void 0;
		let paths = unifyPaths(paths_);
		if (cwd) paths = paths.map((path) => {
			return getAbsolutePath(path, cwd);
		});
		paths.forEach((path) => {
			this._removeIgnoredPath(path);
		});
		this._userIgnored = void 0;
		if (!this._readyCount) this._readyCount = 0;
		this._readyCount += paths.length;
		Promise.all(paths.map(async (path) => {
			const res = await this._nodeFsHandler._addToNodeFs(path, !_internal, void 0, 0, _origAdd);
			if (res) this._emitReady();
			return res;
		})).then((results) => {
			if (this.closed) return;
			results.forEach((item) => {
				if (item) this.add(sp.dirname(item), sp.basename(_origAdd || item));
			});
		});
		return this;
	}
	unwatch(paths_) {
		if (this.closed) return this;
		const paths = unifyPaths(paths_);
		const { cwd } = this.options;
		paths.forEach((path) => {
			if (!sp.isAbsolute(path) && !this._closers.has(path)) {
				if (cwd) path = sp.join(cwd, path);
				path = sp.resolve(path);
			}
			this._closePath(path);
			this._addIgnoredPath(path);
			if (this._watched.has(path)) this._addIgnoredPath({
				path,
				recursive: true
			});
			this._userIgnored = void 0;
		});
		return this;
	}
	close() {
		if (this._closePromise) return this._closePromise;
		this.closed = true;
		this.removeAllListeners();
		const closers = [];
		this._closers.forEach((closerList) => closerList.forEach((closer) => {
			const promise = closer();
			if (promise instanceof Promise) closers.push(promise);
		}));
		this._streams.forEach((stream) => stream.destroy());
		this._userIgnored = void 0;
		this._readyCount = 0;
		this._readyEmitted = false;
		this._watched.forEach((dirent) => dirent.dispose());
		this._closers.clear();
		this._watched.clear();
		this._streams.clear();
		this._symlinkPaths.clear();
		this._throttled.clear();
		this._closePromise = closers.length ? Promise.all(closers).then(() => void 0) : Promise.resolve();
		return this._closePromise;
	}
	getWatched() {
		const watchList = {};
		this._watched.forEach((entry, dir) => {
			const index = (this.options.cwd ? sp.relative(this.options.cwd, dir) : dir) || ONE_DOT;
			watchList[index] = entry.getChildren().sort();
		});
		return watchList;
	}
	emitWithAll(event, args) {
		this.emit(event, ...args);
		if (event !== EVENTS.ERROR) this.emit(EVENTS.ALL, event, ...args);
	}
	async _emit(event, path, stats) {
		if (this.closed) return;
		const opts = this.options;
		if (isWindows) path = sp.normalize(path);
		if (opts.cwd) path = sp.relative(opts.cwd, path);
		const args = [path];
		if (stats != null) args.push(stats);
		const awf = opts.awaitWriteFinish;
		let pw;
		if (awf && (pw = this._pendingWrites.get(path))) {
			pw.lastChange = /* @__PURE__ */ new Date();
			return this;
		}
		if (opts.atomic) {
			if (event === EVENTS.UNLINK) {
				this._pendingUnlinks.set(path, [event, ...args]);
				setTimeout(() => {
					this._pendingUnlinks.forEach((entry, path) => {
						this.emit(...entry);
						this.emit(EVENTS.ALL, ...entry);
						this._pendingUnlinks.delete(path);
					});
				}, typeof opts.atomic === "number" ? opts.atomic : 100);
				return this;
			}
			if (event === EVENTS.ADD && this._pendingUnlinks.has(path)) {
				event = EVENTS.CHANGE;
				this._pendingUnlinks.delete(path);
			}
		}
		if (awf && (event === EVENTS.ADD || event === EVENTS.CHANGE) && this._readyEmitted) {
			const awfEmit = (err, stats) => {
				if (err) {
					event = EVENTS.ERROR;
					args[0] = err;
					this.emitWithAll(event, args);
				} else if (stats) {
					if (args.length > 1) args[1] = stats;
					else args.push(stats);
					this.emitWithAll(event, args);
				}
			};
			this._awaitWriteFinish(path, awf.stabilityThreshold, event, awfEmit);
			return this;
		}
		if (event === EVENTS.CHANGE) {
			if (!this._throttle(EVENTS.CHANGE, path, 50)) return this;
		}
		if (opts.alwaysStat && stats === void 0 && (event === EVENTS.ADD || event === EVENTS.ADD_DIR || event === EVENTS.CHANGE)) {
			const fullPath = opts.cwd ? sp.join(opts.cwd, path) : path;
			let stats;
			try {
				stats = await stat$1(fullPath);
			} catch (err) {}
			if (!stats || this.closed) return;
			args.push(stats);
		}
		this.emitWithAll(event, args);
		return this;
	}
	_handleError(error) {
		const code = error && error.code;
		if (error && code !== "ENOENT" && code !== "ENOTDIR" && (!this.options.ignorePermissionErrors || code !== "EPERM" && code !== "EACCES")) this.emit(EVENTS.ERROR, error);
		return error || this.closed;
	}
	_throttle(actionType, path, timeout) {
		if (!this._throttled.has(actionType)) this._throttled.set(actionType, /* @__PURE__ */ new Map());
		const action = this._throttled.get(actionType);
		if (!action) throw new Error("invalid throttle");
		const actionPath = action.get(path);
		if (actionPath) {
			actionPath.count++;
			return false;
		}
		let timeoutObject;
		const clear = () => {
			const item = action.get(path);
			const count = item ? item.count : 0;
			action.delete(path);
			clearTimeout(timeoutObject);
			if (item) clearTimeout(item.timeoutObject);
			return count;
		};
		timeoutObject = setTimeout(clear, timeout);
		const thr = {
			timeoutObject,
			clear,
			count: 0
		};
		action.set(path, thr);
		return thr;
	}
	_incrReadyCount() {
		return this._readyCount++;
	}
	_awaitWriteFinish(path, threshold, event, awfEmit) {
		const awf = this.options.awaitWriteFinish;
		if (typeof awf !== "object") return;
		const pollInterval = awf.pollInterval;
		let timeoutHandler;
		let fullPath = path;
		if (this.options.cwd && !sp.isAbsolute(path)) fullPath = sp.join(this.options.cwd, path);
		const now = /* @__PURE__ */ new Date();
		const writes = this._pendingWrites;
		function awaitWriteFinishFn(prevStat) {
			stat(fullPath, (err, curStat) => {
				if (err || !writes.has(path)) {
					if (err && err.code !== "ENOENT") awfEmit(err);
					return;
				}
				const now = Number(/* @__PURE__ */ new Date());
				if (prevStat && curStat.size !== prevStat.size) writes.get(path).lastChange = now;
				if (now - writes.get(path).lastChange >= threshold) {
					writes.delete(path);
					awfEmit(void 0, curStat);
				} else timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval, curStat);
			});
		}
		if (!writes.has(path)) {
			writes.set(path, {
				lastChange: now,
				cancelWait: () => {
					writes.delete(path);
					clearTimeout(timeoutHandler);
					return event;
				}
			});
			timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval);
		}
	}
	_isIgnored(path, stats) {
		if (this.options.atomic && DOT_RE.test(path)) return true;
		if (!this._userIgnored) {
			const { cwd } = this.options;
			const ignored = (this.options.ignored || []).map(normalizeIgnored(cwd));
			const list = [...[...this._ignoredPaths].map(normalizeIgnored(cwd)), ...ignored];
			this._userIgnored = anymatch(list, void 0);
		}
		return this._userIgnored(path, stats);
	}
	_isntIgnored(path, stat) {
		return !this._isIgnored(path, stat);
	}
	_getWatchHelpers(path) {
		return new WatchHelper(path, this.options.followSymlinks, this);
	}
	_getWatchedDir(directory) {
		const dir = sp.resolve(directory);
		if (!this._watched.has(dir)) this._watched.set(dir, new DirEntry(dir, this._boundRemove));
		return this._watched.get(dir);
	}
	_hasReadPermissions(stats) {
		if (this.options.ignorePermissionErrors) return true;
		return Boolean(Number(stats.mode) & 256);
	}
	_remove(directory, item, isDirectory) {
		const path = sp.join(directory, item);
		const fullPath = sp.resolve(path);
		isDirectory = isDirectory != null ? isDirectory : this._watched.has(path) || this._watched.has(fullPath);
		if (!this._throttle("remove", path, 100)) return;
		if (!isDirectory && this._watched.size === 1) this.add(directory, item, true);
		this._getWatchedDir(path).getChildren().forEach((nested) => this._remove(path, nested));
		const parent = this._getWatchedDir(directory);
		const wasTracked = parent.has(item);
		parent.remove(item);
		if (this._symlinkPaths.has(fullPath)) this._symlinkPaths.delete(fullPath);
		let relPath = path;
		if (this.options.cwd) relPath = sp.relative(this.options.cwd, path);
		if (this.options.awaitWriteFinish && this._pendingWrites.has(relPath)) {
			if (this._pendingWrites.get(relPath).cancelWait() === EVENTS.ADD) return;
		}
		this._watched.delete(path);
		this._watched.delete(fullPath);
		const eventName = isDirectory ? EVENTS.UNLINK_DIR : EVENTS.UNLINK;
		if (wasTracked && !this._isIgnored(path)) this._emit(eventName, path);
		this._closePath(path);
	}
	_closePath(path) {
		this._closeFile(path);
		const dir = sp.dirname(path);
		this._getWatchedDir(dir).remove(sp.basename(path));
	}
	_closeFile(path) {
		const closers = this._closers.get(path);
		if (!closers) return;
		closers.forEach((closer) => closer());
		this._closers.delete(path);
	}
	_addPathCloser(path, closer) {
		if (!closer) return;
		let list = this._closers.get(path);
		if (!list) {
			list = [];
			this._closers.set(path, list);
		}
		list.push(closer);
	}
	_readdirp(root, opts) {
		if (this.closed) return;
		let stream = readdirp(root, {
			type: EVENTS.ALL,
			alwaysStat: true,
			lstat: true,
			...opts,
			depth: 0
		});
		this._streams.add(stream);
		stream.once(STR_CLOSE, () => {
			stream = void 0;
		});
		stream.once("end", () => {
			if (stream) {
				this._streams.delete(stream);
				stream = void 0;
			}
		});
		return stream;
	}
};
function watch$1(paths, options = {}) {
	const watcher = new FSWatcher(options);
	watcher.add(paths);
	return watcher;
}
var chokidar_default = {
	watch: watch$1,
	FSWatcher
};
export { chokidar_exports, watch$1 as watch };
