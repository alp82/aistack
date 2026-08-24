import { __exportAll } from "../_common.mjs";
import { MagicString, attachScopes, createFilter, makeLegalIdentifier, walk } from "../_build/common.mjs";
import { sep } from "path";
var es_exports = /* @__PURE__ */ __exportAll({ default: () => inject });
var escape = function(str) {
	return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
};
var isReference = function(node, parent) {
	if (node.type === "MemberExpression") return !node.computed && isReference(node.object, node);
	if (node.type === "Identifier") {
		if (parent.type === "MemberExpression") return parent.computed || node === parent.object;
		if (parent.type === "Property" && node !== parent.value) return false;
		if (parent.type === "MethodDefinition") return false;
		if (parent.type === "ExportSpecifier" && node !== parent.local) return false;
		if (parent.type === "ImportSpecifier" && node === parent.imported) return false;
		return true;
	}
	return false;
};
var flatten = function(startNode) {
	var parts = [];
	var node = startNode;
	while (node.type === "MemberExpression") {
		parts.unshift(node.property.name);
		node = node.object;
	}
	var name = node.name;
	parts.unshift(name);
	return {
		name,
		keypath: parts.join(".")
	};
};
function inject(options) {
	if (!options) throw new Error("Missing options");
	var filter = createFilter(options.include, options.exclude);
	var modules = options.modules;
	if (!modules) {
		modules = Object.assign({}, options);
		delete modules.include;
		delete modules.exclude;
		delete modules.sourceMap;
		delete modules.sourcemap;
	}
	var modulesMap = new Map(Object.entries(modules));
	if (sep !== "/") modulesMap.forEach(function(mod, key) {
		modulesMap.set(key, Array.isArray(mod) ? [mod[0].split(sep).join("/"), mod[1]] : mod.split(sep).join("/"));
	});
	var firstpass = new RegExp("(?:" + Array.from(modulesMap.keys()).map(escape).join("|") + ")", "g");
	var sourceMap = options.sourceMap !== false && options.sourcemap !== false;
	return {
		name: "inject",
		transform: function transform(code, id) {
			if (!filter(id)) return null;
			if (code.search(firstpass) === -1) return null;
			if (sep !== "/") id = id.split(sep).join("/");
			var ast = null;
			try {
				ast = this.parse(code);
			} catch (err) {
				this.warn({
					code: "PARSE_ERROR",
					message: "rollup-plugin-inject: failed to parse " + id + ". Consider restricting the plugin to particular files via options.include"
				});
			}
			if (!ast) return null;
			var imports = /* @__PURE__ */ new Set();
			ast.body.forEach(function(node) {
				if (node.type === "ImportDeclaration") node.specifiers.forEach(function(specifier) {
					imports.add(specifier.local.name);
				});
			});
			var scope = attachScopes(ast, "scope");
			var magicString = new MagicString(code);
			var newImports = /* @__PURE__ */ new Map();
			function handleReference(node, name, keypath) {
				var mod = modulesMap.get(keypath);
				if (mod && !imports.has(name) && !scope.contains(name)) {
					if (typeof mod === "string") mod = [mod, "default"];
					if (mod[0] === id) return false;
					var hash = keypath + ":" + mod[0] + ":" + mod[1];
					var importLocalName = name === keypath ? name : makeLegalIdentifier("$inject_" + keypath);
					if (!newImports.has(hash)) {
						var modName = mod[0].replace(/[''\\]/g, "\\$&");
						if (mod[1] === "*") newImports.set(hash, "import * as " + importLocalName + " from '" + modName + "';");
						else newImports.set(hash, "import { " + mod[1] + " as " + importLocalName + " } from '" + modName + "';");
					}
					if (name !== keypath) magicString.overwrite(node.start, node.end, importLocalName, { storeName: true });
					return true;
				}
				return false;
			}
			walk(ast, {
				enter: function enter(node, parent) {
					if (sourceMap) {
						magicString.addSourcemapLocation(node.start);
						magicString.addSourcemapLocation(node.end);
					}
					if (node.scope) scope = node.scope;
					if (node.type === "Property" && node.shorthand && node.value.type === "Identifier") {
						var name = node.key.name;
						handleReference(node, name, name);
						this.skip();
						return;
					}
					if (isReference(node, parent)) {
						var ref$1 = flatten(node);
						var name$1 = ref$1.name;
						var keypath = ref$1.keypath;
						if (handleReference(node, name$1, keypath)) this.skip();
					}
				},
				leave: function leave(node) {
					if (node.scope) scope = scope.parent;
				}
			});
			if (newImports.size === 0) return {
				code,
				ast,
				map: sourceMap ? magicString.generateMap({ hires: true }) : null
			};
			var importBlock = Array.from(newImports.values()).join("\n\n");
			magicString.prepend(importBlock + "\n\n");
			return {
				code: magicString.toString(),
				map: sourceMap ? magicString.generateMap({ hires: true }) : null
			};
		}
	};
}
export { es_exports, inject };
