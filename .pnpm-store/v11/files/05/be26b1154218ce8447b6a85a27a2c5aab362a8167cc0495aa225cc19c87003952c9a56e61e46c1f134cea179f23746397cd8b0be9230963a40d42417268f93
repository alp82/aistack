import { __commonJSMin, __require, __toESM } from "../_common.mjs";
import { createFilter } from "../_build/common.mjs";
import { builtinModules } from "module";
import fs, { realpathSync } from "fs";
import path, { dirname, extname, normalize, resolve, sep } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { promisify } from "util";
var require_cjs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isMergeableObject = function isMergeableObject(value) {
		return isNonNullObject(value) && !isSpecial(value);
	};
	function isNonNullObject(value) {
		return !!value && typeof value === "object";
	}
	function isSpecial(value) {
		var stringValue = Object.prototype.toString.call(value);
		return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
	}
	var REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for ? Symbol.for("react.element") : 60103;
	function isReactElement(value) {
		return value.$$typeof === REACT_ELEMENT_TYPE;
	}
	function emptyTarget(val) {
		return Array.isArray(val) ? [] : {};
	}
	function cloneUnlessOtherwiseSpecified(value, options) {
		return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
	}
	function defaultArrayMerge(target, source, options) {
		return target.concat(source).map(function(element) {
			return cloneUnlessOtherwiseSpecified(element, options);
		});
	}
	function getMergeFunction(key, options) {
		if (!options.customMerge) return deepmerge;
		var customMerge = options.customMerge(key);
		return typeof customMerge === "function" ? customMerge : deepmerge;
	}
	function getEnumerableOwnPropertySymbols(target) {
		return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return Object.propertyIsEnumerable.call(target, symbol);
		}) : [];
	}
	function getKeys(target) {
		return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
	}
	function propertyIsOnObject(object, property) {
		try {
			return property in object;
		} catch (_) {
			return false;
		}
	}
	function propertyIsUnsafe(target, key) {
		return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
	}
	function mergeObject(target, source, options) {
		var destination = {};
		if (options.isMergeableObject(target)) getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
		getKeys(source).forEach(function(key) {
			if (propertyIsUnsafe(target, key)) return;
			if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
			else destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		});
		return destination;
	}
	function deepmerge(target, source, options) {
		options = options || {};
		options.arrayMerge = options.arrayMerge || defaultArrayMerge;
		options.isMergeableObject = options.isMergeableObject || isMergeableObject;
		options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
		var sourceIsArray = Array.isArray(source);
		if (!(sourceIsArray === Array.isArray(target))) return cloneUnlessOtherwiseSpecified(source, options);
		else if (sourceIsArray) return options.arrayMerge(target, source, options);
		else return mergeObject(target, source, options);
	}
	deepmerge.all = function deepmergeAll(array, options) {
		if (!Array.isArray(array)) throw new Error("first argument should be an array");
		return array.reduce(function(prev, next) {
			return deepmerge(prev, next, options);
		}, {});
	};
	module.exports = deepmerge;
}));
var require_is_module = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ES6ImportExportRegExp = /(?:^\s*|[}{\(\);,\n]\s*)(import\s+['"]|(import|module)\s+[^"'\(\)\n;]+\s+from\s+['"]|export\s+(\*|\{|default|function|var|const|let|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*))/;
	var ES6AliasRegExp = /(?:^\s*|[}{\(\);,\n]\s*)(export\s*\*\s*from\s*(?:'([^']+)'|"([^"]+)"))/;
	module.exports = function(sauce) {
		return ES6ImportExportRegExp.test(sauce) || ES6AliasRegExp.test(sauce);
	};
}));
var require_homedir = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = __require("os").homedir || function homedir() {
		var home = process.env.HOME;
		var user = process.env.LOGNAME || process.env.USER || process.env.LNAME || process.env.USERNAME;
		if (process.platform === "win32") return process.env.USERPROFILE || process.env.HOMEDRIVE && process.env.HOMEPATH && process.env.HOMEDRIVE + process.env.HOMEPATH || home || null;
		if (process.platform === "darwin") return home || (user ? "/Users/" + user : null);
		if (process.platform === "linux") return home || (process.getuid() === 0 ? "/root" : user ? "/home/" + user : null);
		return home || null;
	};
}));
var require_es_errors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = Error;
}));
var require_caller = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var $Error = require_es_errors();
	module.exports = function() {
		var origPrepareStackTrace = $Error.prepareStackTrace;
		$Error.prepareStackTrace = function(_, stack) {
			return stack;
		};
		var stack = new $Error().stack;
		$Error.prepareStackTrace = origPrepareStackTrace;
		return stack[2].getFileName();
	};
}));
var require_path_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isWindows = process.platform === "win32";
	var splitWindowsRe = /^(((?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?[\\\/]?)(?:[^\\\/]*[\\\/])*)((\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))[\\\/]*$/;
	var win32 = {};
	function win32SplitPath(filename) {
		return splitWindowsRe.exec(filename).slice(1);
	}
	win32.parse = function(pathString) {
		if (typeof pathString !== "string") throw new TypeError("Parameter 'pathString' must be a string, not " + typeof pathString);
		var allParts = win32SplitPath(pathString);
		if (!allParts || allParts.length !== 5) throw new TypeError("Invalid path '" + pathString + "'");
		return {
			root: allParts[1],
			dir: allParts[0] === allParts[1] ? allParts[0] : allParts[0].slice(0, -1),
			base: allParts[2],
			ext: allParts[4],
			name: allParts[3]
		};
	};
	var splitPathRe = /^((\/?)(?:[^\/]*\/)*)((\.{1,2}|[^\/]+?|)(\.[^.\/]*|))[\/]*$/;
	var posix = {};
	function posixSplitPath(filename) {
		return splitPathRe.exec(filename).slice(1);
	}
	posix.parse = function(pathString) {
		if (typeof pathString !== "string") throw new TypeError("Parameter 'pathString' must be a string, not " + typeof pathString);
		var allParts = posixSplitPath(pathString);
		if (!allParts || allParts.length !== 5) throw new TypeError("Invalid path '" + pathString + "'");
		return {
			root: allParts[1],
			dir: allParts[0].slice(0, -1),
			base: allParts[2],
			ext: allParts[4],
			name: allParts[3]
		};
	};
	if (isWindows) module.exports = win32.parse;
	else module.exports = posix.parse;
	module.exports.posix = posix.parse;
	module.exports.win32 = win32.parse;
}));
var require_node_modules_paths = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var path$3 = __require("path");
	var parse = path$3.parse || require_path_parse();
	var driveLetterRegex = /^([A-Za-z]:)/;
	var uncPathRegex = /^\\\\/;
	function getNodeModulesDirs(absoluteStart, modules) {
		var prefix = "/";
		if (driveLetterRegex.test(absoluteStart)) prefix = "";
		else if (uncPathRegex.test(absoluteStart)) prefix = "\\\\";
		var paths = [absoluteStart];
		var parsed = parse(absoluteStart);
		while (parsed.dir !== paths[paths.length - 1]) {
			paths.push(parsed.dir);
			parsed = parse(parsed.dir);
		}
		return paths.reduce(function(dirs, aPath) {
			return dirs.concat(modules.map(function(moduleDir) {
				return path$3.resolve(prefix, aPath, moduleDir);
			}));
		}, []);
	}
	module.exports = function nodeModulesPaths(start, opts, request) {
		var modules = opts && opts.moduleDirectory ? [].concat(opts.moduleDirectory) : ["node_modules"];
		if (opts && typeof opts.paths === "function") return opts.paths(request, start, function() {
			return getNodeModulesDirs(start, modules);
		}, opts);
		var dirs = getNodeModulesDirs(start, modules);
		return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
	};
}));
var require_normalize_options = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(x, opts) {
		return opts || {};
	};
}));
var require_implementation = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
	var toStr = Object.prototype.toString;
	var max = Math.max;
	var funcType = "[object Function]";
	var concatty = function concatty(a, b) {
		var arr = [];
		for (var i = 0; i < a.length; i += 1) arr[i] = a[i];
		for (var j = 0; j < b.length; j += 1) arr[j + a.length] = b[j];
		return arr;
	};
	var slicy = function slicy(arrLike, offset) {
		var arr = [];
		for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) arr[j] = arrLike[i];
		return arr;
	};
	var joiny = function(arr, joiner) {
		var str = "";
		for (var i = 0; i < arr.length; i += 1) {
			str += arr[i];
			if (i + 1 < arr.length) str += joiner;
		}
		return str;
	};
	module.exports = function bind(that) {
		var target = this;
		if (typeof target !== "function" || toStr.apply(target) !== funcType) throw new TypeError(ERROR_MESSAGE + target);
		var args = slicy(arguments, 1);
		var bound;
		var binder = function() {
			if (this instanceof bound) {
				var result = target.apply(this, concatty(args, arguments));
				if (Object(result) === result) return result;
				return this;
			}
			return target.apply(that, concatty(args, arguments));
		};
		var boundLength = max(0, target.length - args.length);
		var boundArgs = [];
		for (var i = 0; i < boundLength; i++) boundArgs[i] = "$" + i;
		bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
		if (target.prototype) {
			var Empty = function Empty() {};
			Empty.prototype = target.prototype;
			bound.prototype = new Empty();
			Empty.prototype = null;
		}
		return bound;
	};
}));
var require_function_bind = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var implementation = require_implementation();
	module.exports = Function.prototype.bind || implementation;
}));
var require_hasown = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var call = Function.prototype.call;
	var $hasOwn = Object.prototype.hasOwnProperty;
	module.exports = require_function_bind().call(call, $hasOwn);
}));
var require_core$2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		"assert": true,
		"node:assert": [">= 14.18 && < 15", ">= 16"],
		"assert/strict": ">= 15",
		"node:assert/strict": ">= 16",
		"async_hooks": ">= 8",
		"node:async_hooks": [">= 14.18 && < 15", ">= 16"],
		"buffer_ieee754": ">= 0.5 && < 0.9.7",
		"buffer": true,
		"node:buffer": [">= 14.18 && < 15", ">= 16"],
		"child_process": true,
		"node:child_process": [">= 14.18 && < 15", ">= 16"],
		"cluster": ">= 0.5",
		"node:cluster": [">= 14.18 && < 15", ">= 16"],
		"console": true,
		"node:console": [">= 14.18 && < 15", ">= 16"],
		"constants": true,
		"node:constants": [">= 14.18 && < 15", ">= 16"],
		"crypto": true,
		"node:crypto": [">= 14.18 && < 15", ">= 16"],
		"_debug_agent": ">= 1 && < 8",
		"_debugger": "< 8",
		"dgram": true,
		"node:dgram": [">= 14.18 && < 15", ">= 16"],
		"diagnostics_channel": [">= 14.17 && < 15", ">= 15.1"],
		"node:diagnostics_channel": [">= 14.18 && < 15", ">= 16"],
		"dns": true,
		"node:dns": [">= 14.18 && < 15", ">= 16"],
		"dns/promises": ">= 15",
		"node:dns/promises": ">= 16",
		"domain": ">= 0.7.12",
		"node:domain": [">= 14.18 && < 15", ">= 16"],
		"events": true,
		"node:events": [">= 14.18 && < 15", ">= 16"],
		"freelist": "< 6",
		"fs": true,
		"node:fs": [">= 14.18 && < 15", ">= 16"],
		"fs/promises": [">= 10 && < 10.1", ">= 14"],
		"node:fs/promises": [">= 14.18 && < 15", ">= 16"],
		"_http_agent": ">= 0.11.1",
		"node:_http_agent": [">= 14.18 && < 15", ">= 16"],
		"_http_client": ">= 0.11.1",
		"node:_http_client": [">= 14.18 && < 15", ">= 16"],
		"_http_common": ">= 0.11.1",
		"node:_http_common": [">= 14.18 && < 15", ">= 16"],
		"_http_incoming": ">= 0.11.1",
		"node:_http_incoming": [">= 14.18 && < 15", ">= 16"],
		"_http_outgoing": ">= 0.11.1",
		"node:_http_outgoing": [">= 14.18 && < 15", ">= 16"],
		"_http_server": ">= 0.11.1",
		"node:_http_server": [">= 14.18 && < 15", ">= 16"],
		"http": true,
		"node:http": [">= 14.18 && < 15", ">= 16"],
		"http2": ">= 8.8",
		"node:http2": [">= 14.18 && < 15", ">= 16"],
		"https": true,
		"node:https": [">= 14.18 && < 15", ">= 16"],
		"inspector": ">= 8",
		"node:inspector": [">= 14.18 && < 15", ">= 16"],
		"inspector/promises": [">= 19"],
		"node:inspector/promises": [">= 19"],
		"_linklist": "< 8",
		"module": true,
		"node:module": [">= 14.18 && < 15", ">= 16"],
		"net": true,
		"node:net": [">= 14.18 && < 15", ">= 16"],
		"node-inspect/lib/_inspect": ">= 7.6 && < 12",
		"node-inspect/lib/internal/inspect_client": ">= 7.6 && < 12",
		"node-inspect/lib/internal/inspect_repl": ">= 7.6 && < 12",
		"os": true,
		"node:os": [">= 14.18 && < 15", ">= 16"],
		"path": true,
		"node:path": [">= 14.18 && < 15", ">= 16"],
		"path/posix": ">= 15.3",
		"node:path/posix": ">= 16",
		"path/win32": ">= 15.3",
		"node:path/win32": ">= 16",
		"perf_hooks": ">= 8.5",
		"node:perf_hooks": [">= 14.18 && < 15", ">= 16"],
		"process": ">= 1",
		"node:process": [">= 14.18 && < 15", ">= 16"],
		"punycode": ">= 0.5",
		"node:punycode": [">= 14.18 && < 15", ">= 16"],
		"querystring": true,
		"node:querystring": [">= 14.18 && < 15", ">= 16"],
		"readline": true,
		"node:readline": [">= 14.18 && < 15", ">= 16"],
		"readline/promises": ">= 17",
		"node:readline/promises": ">= 17",
		"repl": true,
		"node:repl": [">= 14.18 && < 15", ">= 16"],
		"node:sea": [">= 20.12 && < 21", ">= 21.7"],
		"smalloc": ">= 0.11.5 && < 3",
		"node:sqlite": [">= 22.13 && < 23", ">= 23.4"],
		"_stream_duplex": ">= 0.9.4 && < 26",
		"node:_stream_duplex": [">= 14.18 && < 15", ">= 16 && < 26"],
		"_stream_transform": ">= 0.9.4 && < 26",
		"node:_stream_transform": [">= 14.18 && < 15", ">= 16 && < 26"],
		"_stream_wrap": ">= 1.4.1 && < 26",
		"node:_stream_wrap": [">= 14.18 && < 15", ">= 16 && < 26"],
		"_stream_passthrough": ">= 0.9.4 && < 26",
		"node:_stream_passthrough": [">= 14.18 && < 15", ">= 16 && < 26"],
		"_stream_readable": ">= 0.9.4 && < 26",
		"node:_stream_readable": [">= 14.18 && < 15", ">= 16 && < 26"],
		"_stream_writable": ">= 0.9.4 && < 26",
		"node:_stream_writable": [">= 14.18 && < 15", ">= 16 && < 26"],
		"stream": true,
		"node:stream": [">= 14.18 && < 15", ">= 16"],
		"stream/consumers": ">= 16.7",
		"node:stream/consumers": ">= 16.7",
		"stream/promises": ">= 15",
		"node:stream/promises": ">= 16",
		"stream/web": ">= 16.5",
		"node:stream/web": ">= 16.5",
		"string_decoder": true,
		"node:string_decoder": [">= 14.18 && < 15", ">= 16"],
		"sys": [">= 0.4 && < 0.7", ">= 0.8"],
		"node:sys": [">= 14.18 && < 15", ">= 16"],
		"test/reporters": ">= 19.9 && < 20.2",
		"node:test/reporters": [
			">= 18.17 && < 19",
			">= 19.9",
			">= 20"
		],
		"test/mock_loader": ">= 22.3 && < 22.7",
		"node:test/mock_loader": ">= 22.3 && < 22.7",
		"node:test": [">= 16.17 && < 17", ">= 18"],
		"timers": true,
		"node:timers": [">= 14.18 && < 15", ">= 16"],
		"timers/promises": ">= 15",
		"node:timers/promises": ">= 16",
		"_tls_common": ">= 0.11.13",
		"node:_tls_common": [">= 14.18 && < 15", ">= 16"],
		"_tls_legacy": ">= 0.11.3 && < 10",
		"_tls_wrap": ">= 0.11.3",
		"node:_tls_wrap": [">= 14.18 && < 15", ">= 16"],
		"tls": true,
		"node:tls": [">= 14.18 && < 15", ">= 16"],
		"trace_events": ">= 10",
		"node:trace_events": [">= 14.18 && < 15", ">= 16"],
		"tty": true,
		"node:tty": [">= 14.18 && < 15", ">= 16"],
		"url": true,
		"node:url": [">= 14.18 && < 15", ">= 16"],
		"util": true,
		"node:util": [">= 14.18 && < 15", ">= 16"],
		"util/types": ">= 15.3",
		"node:util/types": ">= 16",
		"v8/tools/arguments": ">= 10 && < 12",
		"v8/tools/codemap": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/consarray": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/csvparser": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/logreader": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/profile_view": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/splaytree": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8": ">= 1",
		"node:v8": [">= 14.18 && < 15", ">= 16"],
		"vm": true,
		"node:vm": [">= 14.18 && < 15", ">= 16"],
		"wasi": [
			">= 13.4 && < 13.5",
			">= 18.17 && < 19",
			">= 20"
		],
		"node:wasi": [">= 18.17 && < 19", ">= 20"],
		"worker_threads": ">= 11.7",
		"node:worker_threads": [">= 14.18 && < 15", ">= 16"],
		"zlib": ">= 0.5",
		"node:zlib": [">= 14.18 && < 15", ">= 16"]
	};
}));
var require_is_core_module = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var hasOwn = require_hasown();
	function specifierIncluded(current, specifier) {
		var nodeParts = current.split(".");
		var parts = specifier.split(" ");
		var op = parts.length > 1 ? parts[0] : "=";
		var versionParts = (parts.length > 1 ? parts[1] : parts[0]).split(".");
		for (var i = 0; i < 3; ++i) {
			var cur = parseInt(nodeParts[i] || 0, 10);
			var ver = parseInt(versionParts[i] || 0, 10);
			if (cur === ver) continue;
			if (op === "<") return cur < ver;
			if (op === ">=") return cur >= ver;
			return false;
		}
		return op === ">=";
	}
	function matchesRange(current, range) {
		var specifiers = range.split(/ ?&& ?/);
		if (specifiers.length === 0) return false;
		for (var i = 0; i < specifiers.length; ++i) if (!specifierIncluded(current, specifiers[i])) return false;
		return true;
	}
	function versionIncluded(nodeVersion, specifierValue) {
		if (typeof specifierValue === "boolean") return specifierValue;
		var current = typeof nodeVersion === "undefined" ? process.versions && process.versions.node : nodeVersion;
		if (typeof current !== "string") throw new TypeError(typeof nodeVersion === "undefined" ? "Unable to determine current node version" : "If provided, a valid node version is required");
		if (specifierValue && typeof specifierValue === "object") {
			for (var i = 0; i < specifierValue.length; ++i) if (matchesRange(current, specifierValue[i])) return true;
			return false;
		}
		return matchesRange(current, specifierValue);
	}
	var data = require_core$2();
	module.exports = function isCore(x, nodeVersion) {
		return hasOwn(data, x) && versionIncluded(nodeVersion, data[x]);
	};
}));
var require_type = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = TypeError;
}));
var require_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs$2 = __require("fs");
	var getHomedir = require_homedir();
	var path$2 = __require("path");
	var caller = require_caller();
	var nodeModulesPaths = require_node_modules_paths();
	var normalizeOptions = require_normalize_options();
	var isCore = require_is_core_module();
	var $Error = require_es_errors();
	var $TypeError = require_type();
	var realpathFS = process.platform !== "win32" && fs$2.realpath && typeof fs$2.realpath.native === "function" ? fs$2.realpath.native : fs$2.realpath;
	var relativePathRegex = /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/;
	var windowsDriveRegex = /^\w:[/\\]*$/;
	var nodeModulesRegex = /[/\\]node_modules[/\\]*$/;
	var homedir = getHomedir();
	function defaultPaths() {
		if (!homedir) return [];
		return [path$2.join(homedir, ".node_modules"), path$2.join(homedir, ".node_libraries")];
	}
	var defaultIsFile = function isFile(file, cb) {
		fs$2.stat(file, function(err, stat) {
			if (!err) return cb(null, stat.isFile() || stat.isFIFO());
			if (err.code === "ENOENT" || err.code === "ENOTDIR") return cb(null, false);
			return cb(err);
		});
	};
	var defaultIsDir = function isDirectory(dir, cb) {
		fs$2.stat(dir, function(err, stat) {
			if (!err) return cb(null, stat.isDirectory());
			if (err.code === "ENOENT" || err.code === "ENOTDIR") return cb(null, false);
			return cb(err);
		});
	};
	var defaultRealpath = function realpath(x, cb) {
		realpathFS(x, function(realpathErr, realPath) {
			if (realpathErr && realpathErr.code !== "ENOENT") cb(realpathErr);
			else cb(null, realpathErr ? x : realPath);
		});
	};
	function maybeRealpath(realpath, x, opts, cb) {
		if (opts && opts.preserveSymlinks === false) realpath(x, cb);
		else cb(null, x);
	}
	function defaultReadPackage(readFile, pkgfile, cb) {
		readFile(pkgfile, function(readFileErr, body) {
			if (readFileErr) cb(readFileErr);
			else try {
				cb(null, JSON.parse(body));
			} catch (jsonErr) {
				cb(null);
			}
		});
	}
	function getPackageCandidates(x, start, opts) {
		var dirs = nodeModulesPaths(start, opts, x);
		for (var i = 0; i < dirs.length; i++) dirs[i] = path$2.join(dirs[i], x);
		return dirs;
	}
	module.exports = function resolve(x, options, callback) {
		var cb = callback;
		var opts = options;
		if (typeof options === "function") {
			cb = opts;
			opts = {};
		}
		if (typeof x !== "string") {
			var err = new $TypeError("Path must be a string.");
			return process.nextTick(function() {
				cb(err);
			});
		}
		opts = normalizeOptions(x, opts);
		var isFile = opts.isFile || defaultIsFile;
		var isDirectory = opts.isDirectory || defaultIsDir;
		var readFile = opts.readFile || fs$2.readFile;
		var realpath = opts.realpath || defaultRealpath;
		var readPackage = opts.readPackage || defaultReadPackage;
		if (opts.readFile && opts.readPackage) {
			var conflictErr = new $TypeError("`readFile` and `readPackage` are mutually exclusive.");
			return process.nextTick(function() {
				cb(conflictErr);
			});
		}
		var packageIterator = opts.packageIterator;
		var extensions = opts.extensions || [".js"];
		var includeCoreModules = opts.includeCoreModules !== false;
		var basedir = opts.basedir || path$2.dirname(caller());
		var parent = opts.filename || basedir;
		opts.paths = opts.paths || defaultPaths();
		maybeRealpath(realpath, path$2.resolve(basedir), opts, function(err, realStart) {
			if (err) cb(err);
			else init(realStart);
		});
		var res;
		function init(basedir) {
			if (relativePathRegex.test(x)) {
				res = path$2.resolve(basedir, x);
				if (x === "." || x === ".." || x.slice(-1) === "/") res += "/";
				if (x.slice(-1) === "/" && res === basedir) loadAsDirectory(res, opts.package, onfile);
				else loadAsFile(res, opts.package, onfile);
			} else if (includeCoreModules && isCore(x)) return cb(null, x);
			else loadNodeModules(x, basedir, function(err, n, pkg) {
				if (err) cb(err);
				else if (n) return maybeRealpath(realpath, n, opts, function(err, realN) {
					if (err) cb(err);
					else cb(null, realN, pkg);
				});
				else {
					var moduleError = new $Error("Cannot find module '" + x + "' from '" + parent + "'");
					moduleError.code = "MODULE_NOT_FOUND";
					cb(moduleError);
				}
			});
		}
		function onfile(err, m, pkg) {
			if (err) cb(err);
			else if (m) cb(null, m, pkg);
			else loadAsDirectory(res, function(err, d, pkg) {
				if (err) cb(err);
				else if (d) maybeRealpath(realpath, d, opts, function(err, realD) {
					if (err) cb(err);
					else cb(null, realD, pkg);
				});
				else {
					var moduleError = new $Error("Cannot find module '" + x + "' from '" + parent + "'");
					moduleError.code = "MODULE_NOT_FOUND";
					cb(moduleError);
				}
			});
		}
		function loadAsFile(x, thePackage, callback) {
			var loadAsFilePackage = thePackage;
			var cb = callback;
			if (typeof loadAsFilePackage === "function") {
				cb = loadAsFilePackage;
				loadAsFilePackage = void 0;
			}
			load([""].concat(extensions), x, loadAsFilePackage);
			function load(exts, x, loadPackage) {
				if (exts.length === 0) return cb(null, void 0, loadPackage);
				var file = x + exts[0];
				var pkg = loadPackage;
				if (pkg) onpkg(null, pkg);
				else loadpkg(path$2.dirname(file), onpkg);
				function onpkg(err, pkg_, dir) {
					pkg = pkg_;
					if (err) return cb(err);
					if (dir && pkg && opts.pathFilter) {
						var rfile = path$2.relative(dir, file);
						var rel = rfile.slice(0, rfile.length - exts[0].length);
						var r = opts.pathFilter(pkg, x, rel);
						if (r) return load([""].concat(extensions), path$2.resolve(dir, r), pkg);
					}
					isFile(file, onex);
				}
				function onex(err, ex) {
					if (err) return cb(err);
					if (ex) return cb(null, file, pkg);
					load(exts.slice(1), x, pkg);
				}
			}
		}
		function loadpkg(dir, cb) {
			if (dir === "" || dir === "/") return cb(null);
			if (process.platform === "win32" && windowsDriveRegex.test(dir)) return cb(null);
			if (nodeModulesRegex.test(dir)) return cb(null);
			maybeRealpath(realpath, dir, opts, function(unwrapErr, pkgdir) {
				if (unwrapErr) return loadpkg(path$2.dirname(dir), cb);
				var pkgfile = path$2.join(pkgdir, "package.json");
				isFile(pkgfile, function(err, ex) {
					if (!ex) return loadpkg(path$2.dirname(dir), cb);
					readPackage(readFile, pkgfile, function(err, pkgParam) {
						if (err) return cb(err);
						var pkg = pkgParam;
						if (pkg && opts.packageFilter) pkg = opts.packageFilter(pkg, pkgfile);
						cb(null, pkg, dir);
					});
				});
			});
		}
		function loadAsDirectory(x, loadAsDirectoryPackage, callback) {
			var cb = callback;
			var fpkg = loadAsDirectoryPackage;
			if (typeof fpkg === "function") {
				cb = fpkg;
				fpkg = opts.package;
			}
			maybeRealpath(realpath, x, opts, function(unwrapErr, pkgdir) {
				if (unwrapErr) return cb(unwrapErr);
				var pkgfile = path$2.join(pkgdir, "package.json");
				isFile(pkgfile, function(err, ex) {
					if (err) return cb(err);
					if (!ex) return loadAsFile(path$2.join(x, "index"), fpkg, cb);
					readPackage(readFile, pkgfile, function(err, pkgParam) {
						if (err) return cb(err);
						var pkg = pkgParam;
						if (pkg && opts.packageFilter) pkg = opts.packageFilter(pkg, pkgfile);
						if (pkg && pkg.main) {
							if (typeof pkg.main !== "string") {
								var mainError = new $TypeError("package “" + pkg.name + "” `main` must be a string");
								mainError.code = "INVALID_PACKAGE_MAIN";
								return cb(mainError);
							}
							if (pkg.main === "." || pkg.main === "./") pkg.main = "index";
							loadAsFile(path$2.resolve(x, pkg.main), pkg, function(err, m, pkg) {
								if (err) return cb(err);
								if (m) return cb(null, m, pkg);
								if (!pkg) return loadAsFile(path$2.join(x, "index"), pkg, cb);
								loadAsDirectory(path$2.resolve(x, pkg.main), pkg, function(err, n, pkg) {
									if (err) return cb(err);
									if (n) return cb(null, n, pkg);
									loadAsFile(path$2.join(x, "index"), pkg, cb);
								});
							});
							return;
						}
						loadAsFile(path$2.join(x, "/index"), pkg, cb);
					});
				});
			});
		}
		function processDirs(cb, dirs) {
			if (dirs.length === 0) return cb(null, void 0);
			var dir = dirs[0];
			isDirectory(path$2.dirname(dir), isdir);
			function isdir(err, isdir) {
				if (err) return cb(err);
				if (!isdir) return processDirs(cb, dirs.slice(1));
				loadAsFile(dir, opts.package, onfile);
			}
			function onfile(err, m, pkg) {
				if (err) return cb(err);
				if (m) return cb(null, m, pkg);
				loadAsDirectory(dir, opts.package, ondir);
			}
			function ondir(err, n, pkg) {
				if (err) return cb(err);
				if (n) return cb(null, n, pkg);
				processDirs(cb, dirs.slice(1));
			}
		}
		function loadNodeModules(x, start, cb) {
			var thunk = function() {
				return getPackageCandidates(x, start, opts);
			};
			processDirs(cb, packageIterator ? packageIterator(x, start, thunk, opts) : thunk());
		}
	};
}));
var require_core$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		"assert": true,
		"node:assert": [">= 14.18 && < 15", ">= 16"],
		"assert/strict": ">= 15",
		"node:assert/strict": ">= 16",
		"async_hooks": ">= 8",
		"node:async_hooks": [">= 14.18 && < 15", ">= 16"],
		"buffer_ieee754": ">= 0.5 && < 0.9.7",
		"buffer": true,
		"node:buffer": [">= 14.18 && < 15", ">= 16"],
		"child_process": true,
		"node:child_process": [">= 14.18 && < 15", ">= 16"],
		"cluster": ">= 0.5",
		"node:cluster": [">= 14.18 && < 15", ">= 16"],
		"console": true,
		"node:console": [">= 14.18 && < 15", ">= 16"],
		"constants": true,
		"node:constants": [">= 14.18 && < 15", ">= 16"],
		"crypto": true,
		"node:crypto": [">= 14.18 && < 15", ">= 16"],
		"_debug_agent": ">= 1 && < 8",
		"_debugger": "< 8",
		"dgram": true,
		"node:dgram": [">= 14.18 && < 15", ">= 16"],
		"diagnostics_channel": [">= 14.17 && < 15", ">= 15.1"],
		"node:diagnostics_channel": [">= 14.18 && < 15", ">= 16"],
		"dns": true,
		"node:dns": [">= 14.18 && < 15", ">= 16"],
		"dns/promises": ">= 15",
		"node:dns/promises": ">= 16",
		"domain": ">= 0.7.12",
		"node:domain": [">= 14.18 && < 15", ">= 16"],
		"events": true,
		"node:events": [">= 14.18 && < 15", ">= 16"],
		"freelist": "< 6",
		"fs": true,
		"node:fs": [">= 14.18 && < 15", ">= 16"],
		"fs/promises": [">= 10 && < 10.1", ">= 14"],
		"node:fs/promises": [">= 14.18 && < 15", ">= 16"],
		"_http_agent": ">= 0.11.1",
		"node:_http_agent": [">= 14.18 && < 15", ">= 16"],
		"_http_client": ">= 0.11.1",
		"node:_http_client": [">= 14.18 && < 15", ">= 16"],
		"_http_common": ">= 0.11.1",
		"node:_http_common": [">= 14.18 && < 15", ">= 16"],
		"_http_incoming": ">= 0.11.1",
		"node:_http_incoming": [">= 14.18 && < 15", ">= 16"],
		"_http_outgoing": ">= 0.11.1",
		"node:_http_outgoing": [">= 14.18 && < 15", ">= 16"],
		"_http_server": ">= 0.11.1",
		"node:_http_server": [">= 14.18 && < 15", ">= 16"],
		"http": true,
		"node:http": [">= 14.18 && < 15", ">= 16"],
		"http2": ">= 8.8",
		"node:http2": [">= 14.18 && < 15", ">= 16"],
		"https": true,
		"node:https": [">= 14.18 && < 15", ">= 16"],
		"inspector": ">= 8",
		"node:inspector": [">= 14.18 && < 15", ">= 16"],
		"inspector/promises": [">= 19"],
		"node:inspector/promises": [">= 19"],
		"_linklist": "< 8",
		"module": true,
		"node:module": [">= 14.18 && < 15", ">= 16"],
		"net": true,
		"node:net": [">= 14.18 && < 15", ">= 16"],
		"node-inspect/lib/_inspect": ">= 7.6 && < 12",
		"node-inspect/lib/internal/inspect_client": ">= 7.6 && < 12",
		"node-inspect/lib/internal/inspect_repl": ">= 7.6 && < 12",
		"os": true,
		"node:os": [">= 14.18 && < 15", ">= 16"],
		"path": true,
		"node:path": [">= 14.18 && < 15", ">= 16"],
		"path/posix": ">= 15.3",
		"node:path/posix": ">= 16",
		"path/win32": ">= 15.3",
		"node:path/win32": ">= 16",
		"perf_hooks": ">= 8.5",
		"node:perf_hooks": [">= 14.18 && < 15", ">= 16"],
		"process": ">= 1",
		"node:process": [">= 14.18 && < 15", ">= 16"],
		"punycode": ">= 0.5",
		"node:punycode": [">= 14.18 && < 15", ">= 16"],
		"querystring": true,
		"node:querystring": [">= 14.18 && < 15", ">= 16"],
		"readline": true,
		"node:readline": [">= 14.18 && < 15", ">= 16"],
		"readline/promises": ">= 17",
		"node:readline/promises": ">= 17",
		"repl": true,
		"node:repl": [">= 14.18 && < 15", ">= 16"],
		"node:sea": [">= 20.12 && < 21", ">= 21.7"],
		"smalloc": ">= 0.11.5 && < 3",
		"node:sqlite": [">= 22.13 && < 23", ">= 23.4"],
		"_stream_duplex": ">= 0.9.4",
		"node:_stream_duplex": [">= 14.18 && < 15", ">= 16"],
		"_stream_transform": ">= 0.9.4",
		"node:_stream_transform": [">= 14.18 && < 15", ">= 16"],
		"_stream_wrap": ">= 1.4.1",
		"node:_stream_wrap": [">= 14.18 && < 15", ">= 16"],
		"_stream_passthrough": ">= 0.9.4",
		"node:_stream_passthrough": [">= 14.18 && < 15", ">= 16"],
		"_stream_readable": ">= 0.9.4",
		"node:_stream_readable": [">= 14.18 && < 15", ">= 16"],
		"_stream_writable": ">= 0.9.4",
		"node:_stream_writable": [">= 14.18 && < 15", ">= 16"],
		"stream": true,
		"node:stream": [">= 14.18 && < 15", ">= 16"],
		"stream/consumers": ">= 16.7",
		"node:stream/consumers": ">= 16.7",
		"stream/promises": ">= 15",
		"node:stream/promises": ">= 16",
		"stream/web": ">= 16.5",
		"node:stream/web": ">= 16.5",
		"string_decoder": true,
		"node:string_decoder": [">= 14.18 && < 15", ">= 16"],
		"sys": [">= 0.4 && < 0.7", ">= 0.8"],
		"node:sys": [">= 14.18 && < 15", ">= 16"],
		"test/reporters": ">= 19.9 && < 20.2",
		"node:test/reporters": [
			">= 18.17 && < 19",
			">= 19.9",
			">= 20"
		],
		"test/mock_loader": ">= 22.3 && < 22.7",
		"node:test/mock_loader": ">= 22.3 && < 22.7",
		"node:test": [">= 16.17 && < 17", ">= 18"],
		"timers": true,
		"node:timers": [">= 14.18 && < 15", ">= 16"],
		"timers/promises": ">= 15",
		"node:timers/promises": ">= 16",
		"_tls_common": ">= 0.11.13",
		"node:_tls_common": [">= 14.18 && < 15", ">= 16"],
		"_tls_legacy": ">= 0.11.3 && < 10",
		"_tls_wrap": ">= 0.11.3",
		"node:_tls_wrap": [">= 14.18 && < 15", ">= 16"],
		"tls": true,
		"node:tls": [">= 14.18 && < 15", ">= 16"],
		"trace_events": ">= 10",
		"node:trace_events": [">= 14.18 && < 15", ">= 16"],
		"tty": true,
		"node:tty": [">= 14.18 && < 15", ">= 16"],
		"url": true,
		"node:url": [">= 14.18 && < 15", ">= 16"],
		"util": true,
		"node:util": [">= 14.18 && < 15", ">= 16"],
		"util/types": ">= 15.3",
		"node:util/types": ">= 16",
		"v8/tools/arguments": ">= 10 && < 12",
		"v8/tools/codemap": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/consarray": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/csvparser": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/logreader": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/profile_view": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8/tools/splaytree": [">= 4.4 && < 5", ">= 5.2 && < 12"],
		"v8": ">= 1",
		"node:v8": [">= 14.18 && < 15", ">= 16"],
		"vm": true,
		"node:vm": [">= 14.18 && < 15", ">= 16"],
		"wasi": [
			">= 13.4 && < 13.5",
			">= 18.17 && < 19",
			">= 20"
		],
		"node:wasi": [">= 18.17 && < 19", ">= 20"],
		"worker_threads": ">= 11.7",
		"node:worker_threads": [">= 14.18 && < 15", ">= 16"],
		"zlib": ">= 0.5",
		"node:zlib": [">= 14.18 && < 15", ">= 16"]
	};
}));
var require_core = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isCoreModule = require_is_core_module();
	var data = require_core$1();
	var core = {};
	for (var mod in data) if (Object.prototype.hasOwnProperty.call(data, mod)) core[mod] = isCoreModule(mod);
	module.exports = core;
}));
var require_is_core = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isCoreModule = require_is_core_module();
	module.exports = function isCore(x) {
		return isCoreModule(x);
	};
}));
var require_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isCore = require_is_core_module();
	var fs$1 = __require("fs");
	var path$1 = __require("path");
	var $Error = require_es_errors();
	var $TypeError = require_type();
	var getHomedir = require_homedir();
	var caller = require_caller();
	var nodeModulesPaths = require_node_modules_paths();
	var normalizeOptions = require_normalize_options();
	var realpathFS = process.platform !== "win32" && fs$1.realpathSync && typeof fs$1.realpathSync.native === "function" ? fs$1.realpathSync.native : fs$1.realpathSync;
	var relativePathRegex = /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/;
	var windowsDriveRegex = /^\w:[/\\]*$/;
	var nodeModulesRegex = /[/\\]node_modules[/\\]*$/;
	var homedir = getHomedir();
	function defaultPaths() {
		if (!homedir) return [];
		return [path$1.join(homedir, ".node_modules"), path$1.join(homedir, ".node_libraries")];
	}
	var defaultIsFile = function isFile(file) {
		try {
			var stat = fs$1.statSync(file, { throwIfNoEntry: false });
		} catch (e) {
			if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
			throw e;
		}
		return !!stat && (stat.isFile() || stat.isFIFO());
	};
	var defaultIsDir = function isDirectory(dir) {
		try {
			var stat = fs$1.statSync(dir, { throwIfNoEntry: false });
		} catch (e) {
			if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
			throw e;
		}
		return !!stat && stat.isDirectory();
	};
	var defaultRealpathSync = function realpathSync(x) {
		try {
			return realpathFS(x);
		} catch (realpathErr) {
			if (realpathErr.code !== "ENOENT") throw realpathErr;
		}
		return x;
	};
	function maybeRealpathSync(realpathSync, x, opts) {
		if (opts && opts.preserveSymlinks === false) return realpathSync(x);
		return x;
	}
	function defaultReadPackageSync(readFileSync, pkgfile) {
		var body = readFileSync(pkgfile);
		try {
			return JSON.parse(body);
		} catch (jsonErr) {}
	}
	function getPackageCandidates(x, start, opts) {
		var dirs = nodeModulesPaths(start, opts, x);
		for (var i = 0; i < dirs.length; i++) dirs[i] = path$1.join(dirs[i], x);
		return dirs;
	}
	module.exports = function resolveSync(x, options) {
		if (typeof x !== "string") throw new $TypeError("Path must be a string.");
		var opts = normalizeOptions(x, options);
		var isFile = opts.isFile || defaultIsFile;
		var readFileSync = opts.readFileSync || fs$1.readFileSync;
		var isDirectory = opts.isDirectory || defaultIsDir;
		var realpathSync = opts.realpathSync || defaultRealpathSync;
		var readPackageSync = opts.readPackageSync || defaultReadPackageSync;
		if (opts.readFileSync && opts.readPackageSync) throw new $TypeError("`readFileSync` and `readPackageSync` are mutually exclusive.");
		var packageIterator = opts.packageIterator;
		var extensions = opts.extensions || [".js"];
		var includeCoreModules = opts.includeCoreModules !== false;
		var basedir = opts.basedir || path$1.dirname(caller());
		var parent = opts.filename || basedir;
		opts.paths = opts.paths || defaultPaths();
		var absoluteStart = maybeRealpathSync(realpathSync, path$1.resolve(basedir), opts);
		if (relativePathRegex.test(x)) {
			var res = path$1.resolve(absoluteStart, x);
			if (x === "." || x === ".." || x.slice(-1) === "/") res += "/";
			var m = loadAsFileSync(res) || loadAsDirectorySync(res);
			if (m) return maybeRealpathSync(realpathSync, m, opts);
		} else if (includeCoreModules && isCore(x)) return x;
		else {
			var n = loadNodeModulesSync(x, absoluteStart);
			if (n) return maybeRealpathSync(realpathSync, n, opts);
		}
		var err = new $Error("Cannot find module '" + x + "' from '" + parent + "'");
		err.code = "MODULE_NOT_FOUND";
		throw err;
		function loadAsFileSync(x) {
			var pkg = loadpkg(path$1.dirname(x));
			if (pkg && pkg.dir && pkg.pkg && opts.pathFilter) {
				var rfile = path$1.relative(pkg.dir, x);
				var r = opts.pathFilter(pkg.pkg, x, rfile);
				if (r) x = path$1.resolve(pkg.dir, r);
			}
			if (isFile(x)) return x;
			for (var i = 0; i < extensions.length; i++) {
				var file = x + extensions[i];
				if (isFile(file)) return file;
			}
		}
		function loadpkg(dir) {
			if (dir === "" || dir === "/") return;
			if (process.platform === "win32" && windowsDriveRegex.test(dir)) return;
			if (nodeModulesRegex.test(dir)) return;
			var pkgfile = path$1.join(maybeRealpathSync(realpathSync, dir, opts), "package.json");
			if (!isFile(pkgfile)) return loadpkg(path$1.dirname(dir));
			var pkg = readPackageSync(readFileSync, pkgfile);
			if (pkg && opts.packageFilter) pkg = opts.packageFilter(pkg, dir);
			return {
				pkg,
				dir
			};
		}
		function loadAsDirectorySync(x) {
			var pkgfile = path$1.join(maybeRealpathSync(realpathSync, x, opts), "/package.json");
			if (isFile(pkgfile)) {
				try {
					var pkg = readPackageSync(readFileSync, pkgfile);
				} catch (e) {}
				if (pkg && opts.packageFilter) pkg = opts.packageFilter(pkg, x);
				if (pkg && pkg.main) {
					if (typeof pkg.main !== "string") {
						var mainError = new $TypeError("package “" + pkg.name + "” `main` must be a string");
						mainError.code = "INVALID_PACKAGE_MAIN";
						throw mainError;
					}
					if (pkg.main === "." || pkg.main === "./") pkg.main = "index";
					try {
						var m = loadAsFileSync(path$1.resolve(x, pkg.main));
						if (m) return m;
						var n = loadAsDirectorySync(path$1.resolve(x, pkg.main));
						if (n) return n;
					} catch (e) {}
				}
			}
			return loadAsFileSync(path$1.join(x, "/index"));
		}
		function loadNodeModulesSync(x, start) {
			var thunk = function() {
				return getPackageCandidates(x, start, opts);
			};
			var dirs = packageIterator ? packageIterator(x, start, thunk, opts) : thunk();
			for (var i = 0; i < dirs.length; i++) {
				var dir = dirs[i];
				if (isDirectory(path$1.dirname(dir))) {
					var m = loadAsFileSync(dir);
					if (m) return m;
					var n = loadAsDirectorySync(dir);
					if (n) return n;
				}
			}
		}
	};
}));
var require_resolve = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var async = require_async();
	async.core = require_core();
	async.isCore = require_is_core();
	async.sync = require_sync();
	module.exports = async;
}));
var import_cjs = /* @__PURE__ */ __toESM(require_cjs(), 1);
var import_is_module = /* @__PURE__ */ __toESM(require_is_module(), 1);
var import_resolve = /* @__PURE__ */ __toESM(require_resolve(), 1);
var version = "16.0.3";
var peerDependencies = { rollup: "^2.78.0||^3.0.0||^4.0.0" };
promisify(fs.access);
const readFile$1 = promisify(fs.readFile);
const realpath$1 = promisify(fs.realpath);
const stat$1 = promisify(fs.stat);
async function fileExists(filePath) {
	try {
		return (await stat$1(filePath)).isFile();
	} catch {
		return false;
	}
}
async function resolveSymlink(path) {
	return await fileExists(path) ? realpath$1(path) : path;
}
const onError = (error) => {
	if (error.code === "ENOENT") return false;
	throw error;
};
const makeCache = (fn) => {
	const cache = /* @__PURE__ */ new Map();
	const wrapped = async (param, done) => {
		if (cache.has(param) === false) cache.set(param, fn(param).catch((err) => {
			cache.delete(param);
			throw err;
		}));
		try {
			return done(null, await cache.get(param));
		} catch (error) {
			return done(error);
		}
	};
	wrapped.clear = () => cache.clear();
	return wrapped;
};
const isDirCached = makeCache(async (file) => {
	try {
		return (await stat$1(file)).isDirectory();
	} catch (error) {
		return onError(error);
	}
});
const isFileCached = makeCache(async (file) => {
	try {
		return (await stat$1(file)).isFile();
	} catch (error) {
		return onError(error);
	}
});
const readCachedFile = makeCache(readFile$1);
function handleDeprecatedOptions(opts) {
	const warnings = [];
	if (opts.customResolveOptions) {
		const { customResolveOptions } = opts;
		if (customResolveOptions.moduleDirectory) {
			opts.moduleDirectories = Array.isArray(customResolveOptions.moduleDirectory) ? customResolveOptions.moduleDirectory : [customResolveOptions.moduleDirectory];
			warnings.push("node-resolve: The `customResolveOptions.moduleDirectory` option has been deprecated. Use `moduleDirectories`, which must be an array.");
		}
		if (customResolveOptions.preserveSymlinks) throw new Error("node-resolve: `customResolveOptions.preserveSymlinks` is no longer an option. We now always use the rollup `preserveSymlinks` option.");
		[
			"basedir",
			"package",
			"extensions",
			"includeCoreModules",
			"readFile",
			"isFile",
			"isDirectory",
			"realpath",
			"packageFilter",
			"pathFilter",
			"paths",
			"packageIterator"
		].forEach((resolveOption) => {
			if (customResolveOptions[resolveOption]) throw new Error(`node-resolve: \`customResolveOptions.${resolveOption}\` is no longer an option. If you need this, please open an issue.`);
		});
	}
	return { warnings };
}
function getPackageName(id) {
	if (id.startsWith(".") || id.startsWith("/")) return null;
	const split = id.split("/");
	if (split[0][0] === "@") return `${split[0]}/${split[1]}`;
	return split[0];
}
function getMainFields(options) {
	let mainFields;
	if (options.mainFields) ({mainFields} = options);
	else mainFields = ["module", "main"];
	if (options.browser && mainFields.indexOf("browser") === -1) return ["browser"].concat(mainFields);
	if (!mainFields.length) throw new Error("Please ensure at least one `mainFields` value is specified");
	return mainFields;
}
function getPackageInfo(options) {
	const { cache, extensions, pkg, mainFields, preserveSymlinks, useBrowserOverrides, rootDir, ignoreSideEffectsForRoot } = options;
	let { pkgPath } = options;
	if (cache.has(pkgPath)) return cache.get(pkgPath);
	if (!preserveSymlinks) pkgPath = realpathSync(pkgPath);
	const pkgRoot = dirname(pkgPath);
	const packageInfo = {
		packageJson: { ...pkg },
		packageJsonPath: pkgPath,
		root: pkgRoot,
		resolvedMainField: "main",
		browserMappedMain: false,
		resolvedEntryPoint: ""
	};
	let overriddenMain = false;
	for (let i = 0; i < mainFields.length; i++) {
		const field = mainFields[i];
		if (typeof pkg[field] === "string") {
			pkg.main = pkg[field];
			packageInfo.resolvedMainField = field;
			overriddenMain = true;
			break;
		}
	}
	const internalPackageInfo = {
		cachedPkg: pkg,
		hasModuleSideEffects: () => null,
		hasPackageEntry: overriddenMain !== false || mainFields.indexOf("main") !== -1,
		packageBrowserField: useBrowserOverrides && typeof pkg.browser === "object" && Object.keys(pkg.browser).reduce((browser, key) => {
			let resolved = pkg.browser[key];
			if (resolved && resolved[0] === ".") resolved = resolve(pkgRoot, resolved);
			browser[key] = resolved;
			if (key[0] === ".") {
				const absoluteKey = resolve(pkgRoot, key);
				browser[absoluteKey] = resolved;
				if (!extname(key)) extensions.reduce((subBrowser, ext) => {
					subBrowser[absoluteKey + ext] = subBrowser[key];
					return subBrowser;
				}, browser);
			}
			return browser;
		}, {}),
		packageInfo
	};
	const browserMap = internalPackageInfo.packageBrowserField;
	if (useBrowserOverrides && typeof pkg.browser === "object" && browserMap.hasOwnProperty(pkg.main)) {
		packageInfo.resolvedEntryPoint = browserMap[pkg.main];
		packageInfo.browserMappedMain = true;
	} else {
		packageInfo.resolvedEntryPoint = resolve(pkgRoot, pkg.main || "index.js");
		packageInfo.browserMappedMain = false;
	}
	if (!ignoreSideEffectsForRoot || rootDir !== pkgRoot) {
		const packageSideEffects = pkg.sideEffects;
		if (typeof packageSideEffects === "boolean") internalPackageInfo.hasModuleSideEffects = () => packageSideEffects;
		else if (Array.isArray(packageSideEffects)) internalPackageInfo.hasModuleSideEffects = createFilter(packageSideEffects.map((sideEffect) => {
			if (sideEffect.includes("/")) return sideEffect;
			return `**/${sideEffect}`;
		}), null, { resolve: pkgRoot });
	}
	cache.set(pkgPath, internalPackageInfo);
	return internalPackageInfo;
}
function normalizeInput(input) {
	if (Array.isArray(input)) return input;
	else if (typeof input === "object") return Object.values(input);
	return [input];
}
function isModuleDir(current, moduleDirs) {
	return moduleDirs.some((dir) => current.endsWith(dir));
}
async function findPackageJson(base, moduleDirs) {
	const { root } = path.parse(base);
	let current = base;
	while (current !== root && !isModuleDir(current, moduleDirs)) {
		const pkgJsonPath = path.join(current, "package.json");
		if (await fileExists(pkgJsonPath)) {
			const pkgJsonString = fs.readFileSync(pkgJsonPath, "utf-8");
			return {
				pkgJson: JSON.parse(pkgJsonString),
				pkgPath: current,
				pkgJsonPath
			};
		}
		current = path.resolve(current, "..");
	}
	return null;
}
function isUrl(str) {
	try {
		return !!new URL(str);
	} catch (_) {
		return false;
	}
}
function isConditions(exports) {
	return typeof exports === "object" && Object.keys(exports).every((k) => !k.startsWith("."));
}
function isMappings(exports) {
	return typeof exports === "object" && !isConditions(exports);
}
function isMixedExports(exports) {
	const keys = Object.keys(exports);
	return keys.some((k) => k.startsWith(".")) && keys.some((k) => !k.startsWith("."));
}
function createBaseErrorMsg(importSpecifier, importer) {
	return `Could not resolve import "${importSpecifier}" in ${importer}`;
}
function createErrorMsg(context, reason, isImports) {
	const { importSpecifier, importer, pkgJsonPath } = context;
	return `${createBaseErrorMsg(importSpecifier, importer)} using ${isImports ? "imports" : "exports"} defined in ${pkgJsonPath}.${reason ? ` ${reason}` : ""}`;
}
var ResolveError = class extends Error {};
var InvalidConfigurationError = class extends ResolveError {
	constructor(context, reason) {
		super(createErrorMsg(context, `Invalid "exports" field. ${reason}`));
	}
};
var InvalidModuleSpecifierError = class extends ResolveError {
	constructor(context, isImports, reason) {
		super(createErrorMsg(context, reason, isImports));
	}
};
var InvalidPackageTargetError = class extends ResolveError {
	constructor(context, reason) {
		super(createErrorMsg(context, reason));
	}
};
function includesInvalidSegments(pathSegments, moduleDirs) {
	const invalidSegments = [
		"",
		".",
		"..",
		...moduleDirs
	];
	return pathSegments.some((v) => invalidSegments.includes(v) || invalidSegments.includes(decodeURI(v)));
}
async function resolvePackageTarget(context, { target, patternMatch, isImports }) {
	if (typeof target === "string") {
		if (!target.startsWith("./")) {
			if (!isImports || ["/", "../"].some((p) => target.startsWith(p)) || isUrl(target)) throw new InvalidPackageTargetError(context, `Invalid mapping: "${target}".`);
			if (typeof patternMatch === "string") {
				const result = await context.resolveId(target.replace(/\*/g, patternMatch), context.pkgURL.href);
				return result ? pathToFileURL(result.location).href : null;
			}
			const result = await context.resolveId(target, context.pkgURL.href);
			return result ? pathToFileURL(result.location).href : null;
		}
		if (context.allowExportsFolderMapping) target = target.replace(/\/$/, "/*");
		{
			const pathSegments = target.split(/\/|\\/);
			const firstDot = pathSegments.indexOf(".");
			firstDot !== -1 && pathSegments.slice(firstDot);
			if (firstDot !== -1 && firstDot < pathSegments.length - 1 && includesInvalidSegments(pathSegments.slice(firstDot + 1), context.moduleDirs)) throw new InvalidPackageTargetError(context, `Invalid mapping: "${target}".`);
		}
		const resolvedTarget = new URL(target, context.pkgURL);
		if (!resolvedTarget.href.startsWith(context.pkgURL.href)) throw new InvalidPackageTargetError(context, `Resolved to ${resolvedTarget.href} which is outside package ${context.pkgURL.href}`);
		if (!patternMatch) return resolvedTarget;
		if (includesInvalidSegments(patternMatch.split(/\/|\\/), context.moduleDirs)) throw new InvalidModuleSpecifierError(context);
		return resolvedTarget.href.replace(/\*/g, patternMatch);
	}
	if (Array.isArray(target)) {
		if (target.length === 0) return null;
		let lastError = null;
		for (const item of target) try {
			const resolved = await resolvePackageTarget(context, {
				target: item,
				patternMatch,
				isImports
			});
			if (resolved !== void 0) return resolved;
		} catch (error) {
			if (!(error instanceof InvalidPackageTargetError)) throw error;
			else lastError = error;
		}
		if (lastError) throw lastError;
		return null;
	}
	if (target && typeof target === "object") {
		for (const [key, value] of Object.entries(target)) if (key === "default" || context.conditions.includes(key)) {
			const resolved = await resolvePackageTarget(context, {
				target: value,
				patternMatch,
				isImports
			});
			if (resolved !== void 0) return resolved;
		}
		return;
	}
	if (target === null) return null;
	throw new InvalidPackageTargetError(context, `Invalid exports field.`);
}
function nodePatternKeyCompare(keyA, keyB) {
	const baseLengthA = keyA.includes("*") ? keyA.indexOf("*") + 1 : keyA.length;
	const rval = (keyB.includes("*") ? keyB.indexOf("*") + 1 : keyB.length) - baseLengthA;
	if (rval !== 0) return rval;
	if (!keyA.includes("*")) return 1;
	if (!keyB.includes("*")) return -1;
	return keyB.length - keyA.length;
}
async function resolvePackageImportsExports(context, { matchKey, matchObj, isImports }) {
	if (!matchKey.includes("*") && matchKey in matchObj) {
		const target = matchObj[matchKey];
		return await resolvePackageTarget(context, {
			target,
			patternMatch: "",
			isImports
		});
	}
	const expansionKeys = Object.keys(matchObj).filter((k) => k.endsWith("/") || k.includes("*")).sort(nodePatternKeyCompare);
	for (const expansionKey of expansionKeys) {
		const indexOfAsterisk = expansionKey.indexOf("*");
		const patternBase = indexOfAsterisk === -1 ? expansionKey : expansionKey.substring(0, indexOfAsterisk);
		if (matchKey.startsWith(patternBase) && matchKey !== patternBase) {
			const patternTrailer = indexOfAsterisk !== -1 ? expansionKey.substring(indexOfAsterisk + 1) : "";
			if (patternTrailer.length === 0 || matchKey.endsWith(patternTrailer) && matchKey.length >= expansionKey.length) {
				const target = matchObj[expansionKey];
				return await resolvePackageTarget(context, {
					target,
					patternMatch: matchKey.substring(patternBase.length, matchKey.length - patternTrailer.length),
					isImports
				});
			}
		}
	}
	throw new InvalidModuleSpecifierError(context, isImports);
}
async function resolvePackageExports(context, subpath, exports) {
	if (isMixedExports(exports)) throw new InvalidConfigurationError(context, "All keys must either start with ./, or without one.");
	if (subpath === ".") {
		let mainExport;
		if (typeof exports === "string" || Array.isArray(exports) || isConditions(exports)) mainExport = exports;
		else if (isMappings(exports)) mainExport = exports["."];
		if (mainExport) {
			const resolved = await resolvePackageTarget(context, {
				target: mainExport,
				patternMatch: "",
				isImports: false
			});
			if (resolved) return resolved;
		}
	} else if (isMappings(exports)) {
		const resolvedMatch = await resolvePackageImportsExports(context, {
			matchKey: subpath,
			matchObj: exports,
			isImports: false
		});
		if (resolvedMatch) return resolvedMatch;
	}
	throw new InvalidModuleSpecifierError(context);
}
async function resolvePackageImports({ importSpecifier, importer, moduleDirs, conditions, resolveId }) {
	const result = await findPackageJson(importer, moduleDirs);
	if (!result) throw new Error(`${createBaseErrorMsg(importSpecifier, importer)}. Could not find a parent package.json.`);
	const { pkgPath, pkgJsonPath, pkgJson } = result;
	const context = {
		importer,
		importSpecifier,
		moduleDirs,
		pkgURL: pathToFileURL(`${pkgPath}/`),
		pkgJsonPath,
		conditions,
		resolveId
	};
	if (!importSpecifier.startsWith("#")) throw new InvalidModuleSpecifierError(context, true, "Invalid import specifier.");
	if (importSpecifier === "#" || importSpecifier.startsWith("#/")) throw new InvalidModuleSpecifierError(context, true, "Invalid import specifier.");
	const { imports } = pkgJson;
	if (!imports) throw new InvalidModuleSpecifierError(context, true);
	return resolvePackageImportsExports(context, {
		matchKey: importSpecifier,
		matchObj: imports,
		isImports: true
	});
}
const resolveImportPath = promisify(import_resolve.default);
const readFile = promisify(fs.readFile);
async function getPackageJson(importer, pkgName, resolveOptions, moduleDirectories) {
	if (importer) {
		const selfPackageJsonResult = await findPackageJson(importer, moduleDirectories);
		if (selfPackageJsonResult && selfPackageJsonResult.pkgJson.name === pkgName) return selfPackageJsonResult;
	}
	try {
		const pkgJsonPath = await resolveImportPath(`${pkgName}/package.json`, resolveOptions);
		return {
			pkgJsonPath,
			pkgJson: JSON.parse(await readFile(pkgJsonPath, "utf-8")),
			pkgPath: dirname(pkgJsonPath)
		};
	} catch (_) {
		return null;
	}
}
async function resolveIdClassic({ importSpecifier, packageInfoCache, extensions, mainFields, preserveSymlinks, useBrowserOverrides, baseDir, moduleDirectories, modulePaths, rootDir, ignoreSideEffectsForRoot }) {
	let hasModuleSideEffects = () => null;
	let hasPackageEntry = true;
	let packageBrowserField = false;
	let packageInfo;
	const filter = (pkg, pkgPath) => {
		const info = getPackageInfo({
			cache: packageInfoCache,
			extensions,
			pkg,
			pkgPath,
			mainFields,
			preserveSymlinks,
			useBrowserOverrides,
			rootDir,
			ignoreSideEffectsForRoot
		});
		({packageInfo, hasModuleSideEffects, hasPackageEntry, packageBrowserField} = info);
		return info.cachedPkg;
	};
	const resolveOptions = {
		basedir: baseDir,
		readFile: readCachedFile,
		isFile: isFileCached,
		isDirectory: isDirCached,
		extensions,
		includeCoreModules: false,
		moduleDirectory: moduleDirectories,
		paths: modulePaths,
		preserveSymlinks,
		packageFilter: filter
	};
	let location;
	try {
		location = await resolveImportPath(importSpecifier, resolveOptions);
	} catch (error) {
		if (error.code !== "MODULE_NOT_FOUND") throw error;
		return null;
	}
	return {
		location: preserveSymlinks ? location : await resolveSymlink(location),
		hasModuleSideEffects,
		hasPackageEntry,
		packageBrowserField,
		packageInfo
	};
}
async function resolveWithExportMap({ importer, importSpecifier, exportConditions, packageInfoCache, extensions, mainFields, preserveSymlinks, useBrowserOverrides, baseDir, moduleDirectories, modulePaths, rootDir, ignoreSideEffectsForRoot, allowExportsFolderMapping }) {
	if (importSpecifier.startsWith("#")) {
		const resolveResult = await resolvePackageImports({
			importSpecifier,
			importer,
			moduleDirs: moduleDirectories,
			conditions: exportConditions,
			resolveId(id) {
				return resolveImportSpecifiers({
					importer,
					importSpecifierList: [id],
					exportConditions,
					packageInfoCache,
					extensions,
					mainFields,
					preserveSymlinks,
					useBrowserOverrides,
					baseDir,
					moduleDirectories,
					modulePaths,
					rootDir,
					ignoreSideEffectsForRoot,
					allowExportsFolderMapping
				});
			}
		});
		if (resolveResult == null) throw new ResolveError(`Could not resolve import "${importSpecifier}" in ${importer} using imports.`);
		const location = fileURLToPath(resolveResult);
		return {
			location: preserveSymlinks ? location : await resolveSymlink(location),
			hasModuleSideEffects: () => null,
			hasPackageEntry: true,
			packageBrowserField: false,
			packageInfo: void 0
		};
	}
	const pkgName = getPackageName(importSpecifier);
	if (pkgName) {
		let hasModuleSideEffects = () => null;
		let hasPackageEntry = true;
		let packageBrowserField = false;
		let packageInfo;
		const filter = (pkg, pkgPath) => {
			const info = getPackageInfo({
				cache: packageInfoCache,
				extensions,
				pkg,
				pkgPath,
				mainFields,
				preserveSymlinks,
				useBrowserOverrides,
				rootDir,
				ignoreSideEffectsForRoot
			});
			({packageInfo, hasModuleSideEffects, hasPackageEntry, packageBrowserField} = info);
			return info.cachedPkg;
		};
		const result = await getPackageJson(importer, pkgName, {
			basedir: baseDir,
			readFile: readCachedFile,
			isFile: isFileCached,
			isDirectory: isDirCached,
			extensions,
			includeCoreModules: false,
			moduleDirectory: moduleDirectories,
			paths: modulePaths,
			preserveSymlinks,
			packageFilter: filter
		}, moduleDirectories);
		if (result && result.pkgJson.exports) {
			const { pkgJson, pkgJsonPath } = result;
			const subpath = pkgName === importSpecifier ? "." : `.${importSpecifier.substring(pkgName.length)}`;
			const location = fileURLToPath(await resolvePackageExports({
				importer,
				importSpecifier,
				moduleDirs: moduleDirectories,
				pkgURL: pathToFileURL(pkgJsonPath.replace("package.json", "")),
				pkgJsonPath,
				allowExportsFolderMapping,
				conditions: exportConditions
			}, subpath, pkgJson.exports));
			if (location) return {
				location: preserveSymlinks ? location : await resolveSymlink(location),
				hasModuleSideEffects,
				hasPackageEntry,
				packageBrowserField,
				packageInfo
			};
		}
	}
	return null;
}
async function resolveWithClassic({ importer, importSpecifierList, exportConditions, warn, packageInfoCache, extensions, mainFields, preserveSymlinks, useBrowserOverrides, baseDir, moduleDirectories, modulePaths, rootDir, ignoreSideEffectsForRoot }) {
	for (let i = 0; i < importSpecifierList.length; i++) {
		const result = await resolveIdClassic({
			importer,
			importSpecifier: importSpecifierList[i],
			exportConditions,
			warn,
			packageInfoCache,
			extensions,
			mainFields,
			preserveSymlinks,
			useBrowserOverrides,
			baseDir,
			moduleDirectories,
			modulePaths,
			rootDir,
			ignoreSideEffectsForRoot
		});
		if (result) return result;
	}
	return null;
}
async function resolveImportSpecifiers({ importer, importSpecifierList, exportConditions, warn, packageInfoCache, extensions, mainFields, preserveSymlinks, useBrowserOverrides, baseDir, moduleDirectories, modulePaths, rootDir, ignoreSideEffectsForRoot, allowExportsFolderMapping }) {
	try {
		const exportMapRes = await resolveWithExportMap({
			importer,
			importSpecifier: importSpecifierList[0],
			exportConditions,
			packageInfoCache,
			extensions,
			mainFields,
			preserveSymlinks,
			useBrowserOverrides,
			baseDir,
			moduleDirectories,
			modulePaths,
			rootDir,
			ignoreSideEffectsForRoot,
			allowExportsFolderMapping
		});
		if (exportMapRes) return exportMapRes;
	} catch (error) {
		if (error instanceof ResolveError) {
			warn(error);
			return null;
		}
		throw error;
	}
	return resolveWithClassic({
		importer,
		importSpecifierList,
		exportConditions,
		warn,
		packageInfoCache,
		extensions,
		mainFields,
		preserveSymlinks,
		useBrowserOverrides,
		baseDir,
		moduleDirectories,
		modulePaths,
		rootDir,
		ignoreSideEffectsForRoot
	});
}
const versionRegexp = /\^(\d+\.\d+\.\d+)/g;
function validateVersion(actualVersion, peerDependencyVersion) {
	let minMajor = Infinity;
	let minMinor = Infinity;
	let minPatch = Infinity;
	let foundVersion;
	while (foundVersion = versionRegexp.exec(peerDependencyVersion)) {
		const [foundMajor, foundMinor, foundPatch] = foundVersion[1].split(".").map(Number);
		if (foundMajor < minMajor) {
			minMajor = foundMajor;
			minMinor = foundMinor;
			minPatch = foundPatch;
		}
	}
	if (!actualVersion) throw new Error(`Insufficient Rollup version: "@rollup/plugin-node-resolve" requires at least rollup@${minMajor}.${minMinor}.${minPatch}.`);
	const [major, minor, patch] = actualVersion.split(".").map(Number);
	if (major < minMajor || major === minMajor && (minor < minMinor || minor === minMinor && patch < minPatch)) throw new Error(`Insufficient rollup version: "@rollup/plugin-node-resolve" requires at least rollup@${minMajor}.${minMinor}.${minPatch} but found rollup@${actualVersion}.`);
}
const ES6_BROWSER_EMPTY = "\0node-resolve:empty.js";
const deepFreeze = (object) => {
	Object.freeze(object);
	for (const value of Object.values(object)) if (typeof value === "object" && !Object.isFrozen(value)) deepFreeze(value);
	return object;
};
const baseConditions = ["default", "module"];
const baseConditionsEsm = [...baseConditions, "import"];
const baseConditionsCjs = [...baseConditions, "require"];
const defaults = {
	dedupe: [],
	extensions: [
		".mjs",
		".js",
		".json",
		".node"
	],
	resolveOnly: [],
	moduleDirectories: ["node_modules"],
	modulePaths: [],
	ignoreSideEffectsForRoot: false,
	allowExportsFolderMapping: true
};
const nodeImportPrefix = /^node:/;
deepFreeze((0, import_cjs.default)({}, defaults));
function nodeResolve(opts = {}) {
	const { warnings } = handleDeprecatedOptions(opts);
	const options = {
		...defaults,
		...opts
	};
	const { extensions, jail, moduleDirectories, modulePaths, ignoreSideEffectsForRoot } = options;
	const exportConditions = options.exportConditions || [];
	const devProdCondition = exportConditions.includes("development") || exportConditions.includes("production") ? [] : [process.env.NODE_ENV && process.env.NODE_ENV !== "production" ? "development" : "production"];
	const conditionsEsm = [
		...baseConditionsEsm,
		...exportConditions,
		...devProdCondition
	];
	const conditionsCjs = [
		...baseConditionsCjs,
		...exportConditions,
		...devProdCondition
	];
	const packageInfoCache = /* @__PURE__ */ new Map();
	const idToPackageInfo = /* @__PURE__ */ new Map();
	const mainFields = getMainFields(options);
	const useBrowserOverrides = mainFields.indexOf("browser") !== -1;
	const isPreferBuiltinsSet = Object.prototype.hasOwnProperty.call(options, "preferBuiltins");
	const preferBuiltins = isPreferBuiltinsSet ? options.preferBuiltins : true;
	const rootDir = resolve(options.rootDir || process.cwd());
	let { dedupe } = options;
	let rollupOptions;
	if (moduleDirectories.some((name) => name.includes("/"))) throw new Error("`moduleDirectories` option must only contain directory names. If you want to load modules from somewhere not supported by the default module resolution algorithm, see `modulePaths`.");
	if (typeof dedupe !== "function") dedupe = (importee) => options.dedupe.includes(importee) || options.dedupe.includes(getPackageName(importee));
	const allowPatterns = (patterns) => {
		const regexPatterns = patterns.map((pattern) => {
			if (pattern instanceof RegExp) return pattern;
			const normalized = pattern.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
			return new RegExp(`^${normalized}$`);
		});
		return (id) => !regexPatterns.length || regexPatterns.some((pattern) => pattern.test(id));
	};
	const resolveOnly = typeof options.resolveOnly === "function" ? options.resolveOnly : allowPatterns(options.resolveOnly);
	const browserMapCache = /* @__PURE__ */ new Map();
	let preserveSymlinks;
	const resolveLikeNode = async (context, importee, importer, custom) => {
		const [importPath, params] = importee.split("?");
		const importSuffix = `${params ? `?${params}` : ""}`;
		importee = importPath;
		const baseDir = !importer || dedupe(importee) ? rootDir : dirname(importer);
		const browser = browserMapCache.get(importer);
		if (useBrowserOverrides && browser) {
			const resolvedImportee = resolve(baseDir, importee);
			if (browser[importee] === false || browser[resolvedImportee] === false) return { id: ES6_BROWSER_EMPTY };
			const browserImportee = importee[0] !== "." && browser[importee] || browser[resolvedImportee] || browser[`${resolvedImportee}.js`] || browser[`${resolvedImportee}.json`];
			if (browserImportee) importee = browserImportee;
		}
		const parts = importee.split(/[/\\]/);
		let id = parts.shift();
		let isRelativeImport = false;
		if (id[0] === "@" && parts.length > 0) id += `/${parts.shift()}`;
		else if (id[0] === ".") {
			id = resolve(baseDir, importee);
			isRelativeImport = true;
		}
		if (!isRelativeImport && !resolveOnly(id)) {
			if (normalizeInput(rollupOptions.input).includes(importee)) return null;
			return false;
		}
		const importSpecifierList = [importee];
		if (importer === void 0 && importee[0] && !importee[0].match(/^\.?\.?\//)) importSpecifierList.push(`./${importee}`);
		if (importer && /\.(ts|mts|cts|tsx)$/.test(importer)) {
			for (const [importeeExt, resolvedExt] of [
				[".js", ".ts"],
				[".js", ".tsx"],
				[".jsx", ".tsx"],
				[".mjs", ".mts"],
				[".cjs", ".cts"]
			]) if (importee.endsWith(importeeExt) && extensions.includes(resolvedExt)) importSpecifierList.push(importee.slice(0, -importeeExt.length) + resolvedExt);
		}
		const warn = (...args) => context.warn(...args);
		const exportConditions = custom && custom["node-resolve"] && custom["node-resolve"].isRequire ? conditionsCjs : conditionsEsm;
		if (useBrowserOverrides && !exportConditions.includes("browser")) exportConditions.push("browser");
		const resolvedWithoutBuiltins = await resolveImportSpecifiers({
			importer,
			importSpecifierList,
			exportConditions,
			warn,
			packageInfoCache,
			extensions,
			mainFields,
			preserveSymlinks,
			useBrowserOverrides,
			baseDir,
			moduleDirectories,
			modulePaths,
			rootDir,
			ignoreSideEffectsForRoot,
			allowExportsFolderMapping: options.allowExportsFolderMapping
		});
		const importeeIsBuiltin = builtinModules.includes(importee.replace(nodeImportPrefix, ""));
		const preferImporteeIsBuiltin = typeof preferBuiltins === "function" ? preferBuiltins(importee) : preferBuiltins;
		const resolved = importeeIsBuiltin && preferImporteeIsBuiltin ? {
			packageInfo: void 0,
			hasModuleSideEffects: () => null,
			hasPackageEntry: true,
			packageBrowserField: false
		} : resolvedWithoutBuiltins;
		if (!resolved) return null;
		const { packageInfo, hasModuleSideEffects, hasPackageEntry, packageBrowserField } = resolved;
		let { location } = resolved;
		if (packageBrowserField) {
			if (Object.prototype.hasOwnProperty.call(packageBrowserField, location)) {
				if (!packageBrowserField[location]) {
					browserMapCache.set(location, packageBrowserField);
					return { id: ES6_BROWSER_EMPTY };
				}
				location = packageBrowserField[location];
			}
			browserMapCache.set(location, packageBrowserField);
		}
		if (hasPackageEntry && !preserveSymlinks) {
			if (await fileExists(location)) location = await realpath$1(location);
		}
		idToPackageInfo.set(location, packageInfo);
		if (hasPackageEntry) {
			if (importeeIsBuiltin && preferImporteeIsBuiltin) {
				if (!isPreferBuiltinsSet && resolvedWithoutBuiltins && resolved !== importee) context.warn({
					message: `preferring built-in module '${importee}' over local alternative at '${resolvedWithoutBuiltins.location}', pass 'preferBuiltins: false' to disable this behavior or 'preferBuiltins: true' to disable this warning.or passing a function to 'preferBuiltins' to provide more fine-grained control over which built-in modules to prefer.`,
					pluginCode: "PREFER_BUILTINS"
				});
				return false;
			} else if (jail && location.indexOf(normalize(jail.trim(sep))) !== 0) return null;
		}
		if (options.modulesOnly && await fileExists(location)) {
			if ((0, import_is_module.default)(await readFile$1(location, "utf-8"))) return {
				id: `${location}${importSuffix}`,
				moduleSideEffects: hasModuleSideEffects(location)
			};
			return null;
		}
		return {
			id: `${location}${importSuffix}`,
			moduleSideEffects: hasModuleSideEffects(location)
		};
	};
	return {
		name: "node-resolve",
		version,
		buildStart(buildOptions) {
			validateVersion(this.meta.rollupVersion, peerDependencies.rollup);
			rollupOptions = buildOptions;
			for (const warning of warnings) this.warn(warning);
			({preserveSymlinks} = buildOptions);
		},
		generateBundle() {
			readCachedFile.clear();
			isFileCached.clear();
			isDirCached.clear();
		},
		resolveId: {
			order: "post",
			async handler(importee, importer, resolveOptions) {
				if (importee === ES6_BROWSER_EMPTY) return importee;
				if (importee && importee.includes("\0")) return null;
				const { custom = {} } = resolveOptions;
				const { "node-resolve": { resolved: alreadyResolved } = {} } = custom;
				if (alreadyResolved) return alreadyResolved;
				if (importer && importer.includes("\0")) importer = void 0;
				const resolved = await resolveLikeNode(this, importee, importer, custom);
				if (resolved) {
					const resolvedResolved = await this.resolve(resolved.id, importer, {
						...resolveOptions,
						skipSelf: false,
						custom: {
							...custom,
							"node-resolve": {
								...custom["node-resolve"],
								resolved,
								importee
							}
						}
					});
					if (resolvedResolved) {
						if (resolvedResolved.external) return false;
						if (resolvedResolved.id !== resolved.id) return resolvedResolved;
						return {
							...resolved,
							meta: resolvedResolved.meta
						};
					}
				}
				return resolved;
			}
		},
		load(importee) {
			if (importee === ES6_BROWSER_EMPTY) return "export default {};";
			return null;
		},
		getPackageInfoForId(id) {
			return idToPackageInfo.get(id);
		}
	};
}
export { nodeResolve };
