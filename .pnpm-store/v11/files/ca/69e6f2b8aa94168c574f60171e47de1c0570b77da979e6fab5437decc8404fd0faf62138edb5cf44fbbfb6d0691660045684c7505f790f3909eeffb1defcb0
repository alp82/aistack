import e, { lstatSync as t, realpathSync as n, statSync as r } from "node:fs";
import { URL as i, fileURLToPath as a, pathToFileURL as o } from "node:url";
import s, { isAbsolute as c } from "node:path";
import l from "node:assert";
import u from "node:process";
import d from "node:v8";
import { format as f, inspect as p } from "node:util";
const m = `_http_agent._http_client._http_common._http_incoming._http_outgoing._http_server._stream_duplex._stream_passthrough._stream_readable._stream_transform._stream_wrap._stream_writable._tls_common._tls_wrap.assert.assert/strict.async_hooks.buffer.child_process.cluster.console.constants.crypto.dgram.diagnostics_channel.dns.dns/promises.domain.events.fs.fs/promises.http.http2.https.inspector.inspector/promises.module.net.os.path.path/posix.path/win32.perf_hooks.process.punycode.querystring.readline.readline/promises.repl.stream.stream/consumers.stream/promises.stream/web.string_decoder.sys.timers.timers/promises.tls.trace_events.tty.url.util.util/types.v8.vm.wasi.worker_threads.zlib`.split(`.`), h = {}.hasOwnProperty, g = /^([A-Z][a-z\d]*)+$/, ee = new Set([
	`string`,
	`function`,
	`number`,
	`object`,
	`Function`,
	`Object`,
	`boolean`,
	`bigint`,
	`symbol`
]), _ = /* @__PURE__ */ new Map();
let v;
function y(e, t = `and`) {
	return e.length < 3 ? e.join(` ${t} `) : `${e.slice(0, -1).join(`, `)}, ${t} ${e.at(-1)}`;
}
function b(e, t, n) {
	return _.set(e, t), te(n, e);
}
function te(e, t) {
	return function(...n) {
		let r = Error.stackTraceLimit;
		x() && (Error.stackTraceLimit = 0);
		let i = new e();
		x() && (Error.stackTraceLimit = r);
		let a = re(t, n, i);
		return Object.defineProperties(i, {
			message: {
				value: a,
				enumerable: !1,
				writable: !0,
				configurable: !0
			},
			toString: {
				value() {
					return `${this.name} [${t}]: ${this.message}`;
				},
				enumerable: !1,
				writable: !0,
				configurable: !0
			}
		}), S(i), i.code = t, i;
	};
}
function x() {
	try {
		if (d.startupSnapshot.isBuildingSnapshot()) return !1;
	} catch {}
	let e = Object.getOwnPropertyDescriptor(Error, `stackTraceLimit`);
	return e === void 0 ? Object.isExtensible(Error) : h.call(e, `writable`) && e.writable !== void 0 ? e.writable : e.set !== void 0;
}
function ne(e) {
	let t = `__node_internal_` + e.name;
	return Object.defineProperty(e, `name`, { value: t }), e;
}
const S = ne(function(e) {
	let t = x();
	return t && (v = Error.stackTraceLimit, Error.stackTraceLimit = Infinity), Error.captureStackTrace(e), t && (Error.stackTraceLimit = v), e;
});
function re(e, t, n) {
	let r = _.get(e);
	if (l.ok(r !== void 0, "expected `message` to be found"), typeof r == `function`) return l.ok(r.length <= t.length, `Code: ${e}; The provided arguments length (${t.length}) does not match the required ones (${r.length}).`), Reflect.apply(r, n, t);
	let i = /%[dfijoOs]/g, a = 0;
	for (; i.exec(r) !== null;) a++;
	return l.ok(a === t.length, `Code: ${e}; The provided arguments length (${t.length}) does not match the required ones (${a}).`), t.length === 0 ? r : (t.unshift(r), Reflect.apply(f, null, t));
}
function ie(e) {
	if (e == null) return String(e);
	if (typeof e == `function` && e.name) return `function ${e.name}`;
	if (typeof e == `object`) return e.constructor && e.constructor.name ? `an instance of ${e.constructor.name}` : `${p(e, { depth: -1 })}`;
	let t = p(e, { colors: !1 });
	return t.length > 28 && (t = `${t.slice(0, 25)}...`), `type ${typeof e} (${t})`;
}
b(`ERR_INVALID_ARG_TYPE`, (e, t, n) => {
	l.ok(typeof e == `string`, `'name' must be a string`), Array.isArray(t) || (t = [t]);
	let r = `The `;
	if (e.endsWith(` argument`)) r += `${e} `;
	else {
		let t = e.includes(`.`) ? `property` : `argument`;
		r += `"${e}" ${t} `;
	}
	r += `must be `;
	let i = [], a = [], o = [];
	for (let e of t) l.ok(typeof e == `string`, `All expected entries have to be of type string`), ee.has(e) ? i.push(e.toLowerCase()) : g.exec(e) === null ? (l.ok(e !== `object`, `The value "object" should be written as "Object"`), o.push(e)) : a.push(e);
	if (a.length > 0) {
		let e = i.indexOf(`object`);
		e !== -1 && (i.slice(e, 1), a.push(`Object`));
	}
	return i.length > 0 && (r += `${i.length > 1 ? `one of type` : `of type`} ${y(i, `or`)}`, (a.length > 0 || o.length > 0) && (r += ` or `)), a.length > 0 && (r += `an instance of ${y(a, `or`)}`, o.length > 0 && (r += ` or `)), o.length > 0 && (o.length > 1 ? r += `one of ${y(o, `or`)}` : (o[0]?.toLowerCase() !== o[0] && (r += `an `), r += `${o[0]}`)), r += `. Received ${ie(n)}`, r;
}, TypeError);
const C = b(`ERR_INVALID_MODULE_SPECIFIER`, (e, t, n) => `Invalid module "${e}" ${t}${n ? ` imported from ${n}` : ``}`, TypeError), w = b(`ERR_INVALID_PACKAGE_CONFIG`, (e, t, n) => `Invalid package config ${e}${t ? ` while importing ${t}` : ``}${n ? `. ${n}` : ``}`, Error), ae = b(`ERR_INVALID_PACKAGE_TARGET`, (e, t, n, r = !1, i) => {
	let a = typeof n == `string` && !r && n.length > 0 && !n.startsWith(`./`);
	return t === `.` ? (l.ok(r === !1), `Invalid "exports" main target ${JSON.stringify(n)} defined in the package config ${e}package.json${i ? ` imported from ${i}` : ``}${a ? `; targets must start with "./"` : ``}`) : `Invalid "${r ? `imports` : `exports`}" target ${JSON.stringify(n)} defined for '${t}' in the package config ${e}package.json${i ? ` imported from ${i}` : ``}${a ? `; targets must start with "./"` : ``}`;
}, Error), T = b(`ERR_MODULE_NOT_FOUND`, (e, t, n = !1) => `Cannot find ${n ? `module` : `package`} '${e}' imported from ${t}`, Error);
b(`ERR_NETWORK_IMPORT_DISALLOWED`, `import of '%s' by %s is not supported: %s`, Error);
const E = b(`ERR_PACKAGE_IMPORT_NOT_DEFINED`, (e, t, n) => `Package import specifier "${e}" is not defined${t ? ` in package ${t || ``}package.json` : ``} imported from ${n}`, TypeError), D = b(`ERR_PACKAGE_PATH_NOT_EXPORTED`, (e, t, n) => t === `.` ? `No "exports" main defined in ${e}package.json${n ? ` imported from ${n}` : ``}` : `Package subpath '${t}' is not defined by "exports" in ${e}package.json${n ? ` imported from ${n}` : ``}`, Error), O = b(`ERR_UNSUPPORTED_DIR_IMPORT`, `Directory import '%s' is not supported resolving ES modules imported from %s`, Error), k = b(`ERR_UNSUPPORTED_RESOLVE_REQUEST`, `Failed to resolve module specifier "%s" from "%s": Invalid relative URL or base scheme is not hierarchical.`, TypeError), oe = b(`ERR_UNKNOWN_FILE_EXTENSION`, (e, t) => `Unknown file extension "${e}" for ${t}`, TypeError);
b(`ERR_INVALID_ARG_VALUE`, (e, t, n = `is invalid`) => {
	let r = p(t);
	return r.length > 128 && (r = `${r.slice(0, 128)}...`), `The ${e.includes(`.`) ? `property` : `argument`} '${e}' ${n}. Received ${r}`;
}, TypeError);
const A = {}.hasOwnProperty, j = /* @__PURE__ */ new Map();
function M(t, { base: n, specifier: r }) {
	let i = j.get(t);
	if (i) return i;
	let o;
	try {
		o = e.readFileSync(s.toNamespacedPath(t), `utf8`);
	} catch (e) {
		let t = e;
		if (t.code !== `ENOENT`) throw t;
	}
	let c = {
		exists: !1,
		pjsonPath: t,
		main: void 0,
		name: void 0,
		type: `none`,
		exports: void 0,
		imports: void 0
	};
	if (o !== void 0) {
		let e;
		try {
			e = JSON.parse(o);
		} catch (e) {
			let i = new w(t, (n ? `"${r}" from ` : ``) + a(n || r), e.message);
			throw i.cause = e, i;
		}
		c.exists = !0, A.call(e, `name`) && typeof e.name == `string` && (c.name = e.name), A.call(e, `main`) && typeof e.main == `string` && (c.main = e.main), A.call(e, `exports`) && (c.exports = e.exports), A.call(e, `imports`) && (c.imports = e.imports), A.call(e, `type`) && (e.type === `commonjs` || e.type === `module`) && (c.type = e.type);
	}
	return j.set(t, c), c;
}
function N(e) {
	let t = new URL(`package.json`, e);
	for (; !t.pathname.endsWith(`node_modules/package.json`);) {
		let n = M(a(t), { specifier: e });
		if (n.exists) return n;
		let r = t;
		if (t = new URL(`../package.json`, t), t.pathname === r.pathname) break;
	}
	return {
		pjsonPath: a(t),
		exists: !1,
		type: `none`
	};
}
const se = {}.hasOwnProperty, ce = {
	__proto__: null,
	".json": `json`,
	".cjs": `commonjs`,
	".cts": `commonjs`,
	".js": `module`,
	".ts": `module`,
	".mts": `module`,
	".mjs": `module`
}, P = {
	__proto__: null,
	"data:": ue,
	"file:": fe,
	"node:": () => `builtin`
};
function le(e) {
	return e && /\s*(text|application)\/javascript\s*(;\s*charset=utf-?8\s*)?/i.test(e) ? `module` : e === `application/json` ? `json` : null;
}
function ue(e) {
	let { 1: t } = /^([^/]+\/[^;,]+)[^,]*?(;base64)?,/.exec(e.pathname) || [
		null,
		null,
		null
	];
	return le(t);
}
function de(e) {
	let t = e.pathname, n = t.length;
	for (; n--;) {
		let e = t.codePointAt(n);
		if (e === 47) return ``;
		if (e === 46) return t.codePointAt(n - 1) === 47 ? `` : t.slice(n);
	}
	return ``;
}
function fe(e, t, n) {
	let r = de(e);
	if (r === `.js`) {
		let { type: t } = N(e);
		return t === `none` ? `commonjs` : t;
	}
	if (r === ``) {
		let { type: t } = N(e);
		return t === `none` || t === `commonjs` ? `commonjs` : `module`;
	}
	let i = ce[r];
	if (i) return i;
	if (!n) throw new oe(r, a(e));
}
function pe(e, t) {
	let n = e.protocol;
	return se.call(P, n) && P[n](e, t, !0) || null;
}
const F = RegExp.prototype[Symbol.replace], I = {}.hasOwnProperty, L = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))?(\\|\/|$)/i, R = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i, z = /^\.|%|\\/, B = /\*/g, me = /%2f|%5c/i, V = /* @__PURE__ */ new Set(), he = /[/\\]{2}/;
function H(e, t, n, r, i, o, s) {
	if (u.noDeprecation) return;
	let c = a(r), l = he.exec(s ? e : t) !== null;
	u.emitWarning(`Use of deprecated ${l ? `double slash` : `leading or trailing slash matching`} resolving "${e}" for module request "${t}" ${t === n ? `` : `matched to "${n}" `}in the "${i ? `imports` : `exports`}" field module resolution of the package at ${c}${o ? ` imported from ${a(o)}` : ``}.`, `DeprecationWarning`, `DEP0166`);
}
function U(e, t, n, r) {
	if (u.noDeprecation || pe(e, { parentURL: n.href }) !== `module`) return;
	let o = a(e.href), c = a(new i(`.`, t)), l = a(n);
	r ? s.resolve(c, r) !== o && u.emitWarning(`Package ${c} has a "main" field set to "${r}", excluding the full filename and extension to the resolved file at "${o.slice(c.length)}", imported from ${l}.\n Automatic extension resolution of the "main" field is deprecated for ES modules.`, `DeprecationWarning`, `DEP0151`) : u.emitWarning(`No "main" or "exports" field defined in the package.json for ${c} resolving the main entry point "${o.slice(c.length)}", imported from ${l}.\nDefault "index" lookups for the main are deprecated for ES modules.`, `DeprecationWarning`, `DEP0151`);
}
function W(e) {
	try {
		return r(e);
	} catch {}
}
function G(e) {
	let t = r(e, { throwIfNoEntry: !1 });
	return (t ? t.isFile() : void 0) ?? !1;
}
function ge(e, t, n) {
	let r;
	if (t.main !== void 0) {
		if (r = new i(t.main, e), G(r)) return r;
		let a = [
			`./${t.main}.js`,
			`./${t.main}.json`,
			`./${t.main}.node`,
			`./${t.main}/index.js`,
			`./${t.main}/index.json`,
			`./${t.main}/index.node`
		], o = -1;
		for (; ++o < a.length && (r = new i(a[o], e), !G(r));) r = void 0;
		if (r) return U(r, e, n, t.main), r;
	}
	let o = [
		`./index.js`,
		`./index.json`,
		`./index.node`
	], s = -1;
	for (; ++s < o.length && (r = new i(o[s], e), !G(r));) r = void 0;
	if (r) return U(r, e, n, t.main), r;
	throw new T(a(new i(`.`, e)), a(n));
}
function _e(e, t, r) {
	if (me.exec(e.pathname) !== null) throw new C(e.pathname, String.raw`must not include encoded "/" or "\" characters`, a(t));
	let i;
	try {
		i = a(e);
	} catch (n) {
		throw Object.defineProperty(n, `input`, { value: String(e) }), Object.defineProperty(n, `module`, { value: String(t) }), n;
	}
	let c = W(i.endsWith(`/`) ? i.slice(-1) : i);
	if (c && c.isDirectory()) {
		let n = new O(i, a(t));
		throw n.url = String(e), n;
	}
	if (!c || !c.isFile()) {
		let n = new T(i || e.pathname, t && a(t), !0);
		throw n.url = String(e), n;
	}
	if (!r) {
		let t = n(i), { search: r, hash: a } = e;
		e = o(t + (i.endsWith(s.sep) ? `/` : ``)), e.search = r, e.hash = a;
	}
	return e;
}
function ve(e, t, n) {
	return new E(e, t && a(new i(`.`, t)), a(n));
}
function K(e, t, n) {
	return new D(a(new i(`.`, t)), e, n && a(n));
}
function ye(e, t, n, r, i) {
	throw new C(e, `request is not a valid match in pattern "${t}" for the "${r ? `imports` : `exports`}" resolution of ${a(n)}`, i && a(i));
}
function q(e, t, n, r, o) {
	return t = typeof t == `object` && t ? JSON.stringify(t, null, ``) : `${t}`, new ae(a(new i(`.`, n)), e, t, r, o && a(o));
}
function be(e, t, n, r, a, o, s, c, l) {
	if (t !== `` && !o && e.at(-1) !== `/`) throw q(n, e, r, s, a);
	if (!e.startsWith(`./`)) {
		if (s && !e.startsWith(`../`) && !e.startsWith(`/`)) {
			let n = !1;
			try {
				new i(e), n = !0;
			} catch {}
			if (!n) return Z(o ? F.call(B, e, () => t) : e + t, r, l);
		}
		throw q(n, e, r, s, a);
	}
	if (L.exec(e.slice(2)) !== null) if (R.exec(e.slice(2)) === null) {
		if (!c) {
			let i = o ? n.replace(`*`, () => t) : n + t;
			H(o ? F.call(B, e, () => t) : e, i, n, r, s, a, !0);
		}
	} else throw q(n, e, r, s, a);
	let u = new i(e, r), d = u.pathname, f = new i(`.`, r).pathname;
	if (!d.startsWith(f)) throw q(n, e, r, s, a);
	if (t === ``) return u;
	if (L.exec(t) !== null) {
		let i = o ? n.replace(`*`, () => t) : n + t;
		R.exec(t) === null ? c || H(o ? F.call(B, e, () => t) : e, i, n, r, s, a, !1) : ye(i, n, r, s, a);
	}
	return o ? new i(F.call(B, u.href, () => t)) : new i(t, u);
}
function xe(e) {
	let t = Number(e);
	return `${t}` === e ? t >= 0 && t < 4294967295 : !1;
}
function J(e, t, n, r, i, o, s, c, l) {
	if (typeof t == `string`) return be(t, n, r, e, i, o, s, c, l);
	if (Array.isArray(t)) {
		let a = t;
		if (a.length === 0) return null;
		let u, d = -1;
		for (; ++d < a.length;) {
			let t = a[d], f;
			try {
				f = J(e, t, n, r, i, o, s, c, l);
			} catch (e) {
				let t = e;
				if (u = t, t.code === `ERR_INVALID_PACKAGE_TARGET`) continue;
				throw e;
			}
			if (f !== void 0) {
				if (f === null) {
					u = null;
					continue;
				}
				return f;
			}
		}
		if (u == null) return null;
		throw u;
	}
	if (typeof t == `object` && t) {
		let u = Object.getOwnPropertyNames(t), d = -1;
		for (; ++d < u.length;) {
			let t = u[d];
			if (xe(t)) throw new w(a(e), a(i), `"exports" cannot contain numeric property keys.`);
		}
		for (d = -1; ++d < u.length;) {
			let a = u[d];
			if (a === `default` || l && l.has(a)) {
				let u = t[a], d = J(e, u, n, r, i, o, s, c, l);
				if (d === void 0) continue;
				return d;
			}
		}
		return null;
	}
	if (t === null) return null;
	throw q(r, t, e, s, i);
}
function Se(e, t, n) {
	if (typeof e == `string` || Array.isArray(e)) return !0;
	if (typeof e != `object` || !e) return !1;
	let r = Object.getOwnPropertyNames(e), i = !1, o = 0, s = -1;
	for (; ++s < r.length;) {
		let e = r[s], c = e === `` || e[0] !== `.`;
		if (o++ === 0) i = c;
		else if (i !== c) throw new w(a(t), a(n), `"exports" cannot contain some keys starting with '.' and some not. The exports object must either be an object of package subpath keys or an object of main entry condition name keys only.`);
	}
	return i;
}
function Ce(e, t, n) {
	if (u.noDeprecation) return;
	let r = a(t);
	V.has(r + `|` + e) || (V.add(r + `|` + e), u.emitWarning(`Use of deprecated trailing slash pattern mapping "${e}" in the "exports" field module resolution of the package at ${r}${n ? ` imported from ${a(n)}` : ``}. Mapping specifiers ending in "/" is no longer supported.`, `DeprecationWarning`, `DEP0155`));
}
function Y(e, t, n, r, i) {
	let a = n.exports;
	if (Se(a, e, r) && (a = { ".": a }), I.call(a, t) && !t.includes(`*`) && !t.endsWith(`/`)) {
		let n = a[t], o = J(e, n, ``, t, r, !1, !1, !1, i);
		if (o == null) throw K(t, e, r);
		return o;
	}
	let o = ``, s = ``, c = Object.getOwnPropertyNames(a), l = -1;
	for (; ++l < c.length;) {
		let n = c[l], i = n.indexOf(`*`);
		if (i !== -1 && t.startsWith(n.slice(0, i))) {
			t.endsWith(`/`) && Ce(t, e, r);
			let a = n.slice(i + 1);
			t.length >= n.length && t.endsWith(a) && X(o, n) === 1 && n.lastIndexOf(`*`) === i && (o = n, s = t.slice(i, t.length - a.length));
		}
	}
	if (o) {
		let n = a[o], c = J(e, n, s, o, r, !0, !1, t.endsWith(`/`), i);
		if (c == null) throw K(t, e, r);
		return c;
	}
	throw K(t, e, r);
}
function X(e, t) {
	let n = e.indexOf(`*`), r = t.indexOf(`*`), i = n === -1 ? e.length : n + 1, a = r === -1 ? t.length : r + 1;
	return i > a ? -1 : a > i || n === -1 ? 1 : r === -1 || e.length > t.length ? -1 : +(t.length > e.length);
}
function we(e, t, n) {
	if (e === `#` || e.startsWith(`#/`) || e.endsWith(`/`)) throw new C(e, `is not a valid internal imports specifier name`, a(t));
	let r, i = N(t);
	if (i.exists) {
		r = o(i.pjsonPath);
		let a = i.imports;
		if (a) if (I.call(a, e) && !e.includes(`*`)) {
			let i = J(r, a[e], ``, e, t, !1, !0, !1, n);
			if (i != null) return i;
		} else {
			let i = ``, o = ``, s = Object.getOwnPropertyNames(a), c = -1;
			for (; ++c < s.length;) {
				let t = s[c], n = t.indexOf(`*`);
				if (n !== -1 && e.startsWith(t.slice(0, -1))) {
					let r = t.slice(n + 1);
					e.length >= t.length && e.endsWith(r) && X(i, t) === 1 && t.lastIndexOf(`*`) === n && (i = t, o = e.slice(n, e.length - r.length));
				}
			}
			if (i) {
				let e = a[i], s = J(r, e, o, i, t, !0, !0, !1, n);
				if (s != null) return s;
			}
		}
	}
	throw ve(e, r, t);
}
function Te(e, t) {
	let n = e.indexOf(`/`), r = !0, i = !1;
	e[0] === `@` && (i = !0, n === -1 || e.length === 0 ? r = !1 : n = e.indexOf(`/`, n + 1));
	let o = n === -1 ? e : e.slice(0, n);
	if (z.exec(o) !== null && (r = !1), !r) throw new C(e, `is not a valid package name`, a(t));
	return {
		packageName: o,
		packageSubpath: `.` + (n === -1 ? `` : e.slice(n)),
		isScoped: i
	};
}
function Z(e, t, n) {
	if (m.includes(e)) return new i(`node:` + e);
	let { packageName: r, packageSubpath: s, isScoped: c } = Te(e, t), l = N(t);
	if (l.exists && l.name === r && l.exports !== void 0 && l.exports !== null) return Y(o(l.pjsonPath), s, l, t, n);
	let u = new i(`./node_modules/` + r + `/package.json`, t), d = a(u), f;
	do {
		let o = W(d.slice(0, -13));
		if (!o || !o.isDirectory()) {
			f = d, u = new i((c ? `../../../../node_modules/` : `../../../node_modules/`) + r + `/package.json`, u), d = a(u);
			continue;
		}
		let l = M(d, {
			base: t,
			specifier: e
		});
		return l.exports !== void 0 && l.exports !== null ? Y(u, s, l, t, n) : s === `.` ? ge(u, l, t) : new i(s, u);
	} while (d.length !== f.length);
	throw new T(r, a(t), !1);
}
function Ee(e) {
	return e[0] === `.` && (e.length === 1 || e[1] === `/` || e[1] === `.` && (e.length === 2 || e[2] === `/`));
}
function De(e) {
	return e === `` ? !1 : e[0] === `/` ? !0 : Ee(e);
}
function Oe(e, t, n, r) {
	let a = t.protocol, o = a === `data:`, s;
	if (De(e)) try {
		s = new i(e, t);
	} catch (n) {
		let r = new k(e, t);
		throw r.cause = n, r;
	}
	else if (a === `file:` && e[0] === `#`) s = we(e, t, n);
	else try {
		s = new i(e);
	} catch (r) {
		if (o && !m.includes(e)) {
			let n = new k(e, t);
			throw n.cause = r, n;
		}
		s = Z(e, t, n);
	}
	return l.ok(s !== void 0, `expected to be defined`), s.protocol === `file:` ? _e(s, t, r) : s;
}
const ke = new Set([`node`, `import`]), Ae = process.platform === `win32`, je = globalThis.__EXSOLVE_CACHE__ ||= /* @__PURE__ */ new Map();
function Q(e, r) {
	let i = Be(e);
	if (`external` in i) return i.external;
	let a = i.specifier, s = i.url, c = i.absolutePath, l, u;
	if (r?.cache !== !1 && (l = Le(c || a, r), u = r?.cache && typeof r?.cache == `object` ? r.cache : je), u) {
		let e = u.get(l);
		if (typeof e == `string`) return e;
		if (e instanceof Error) {
			if (r?.try) return;
			throw e;
		}
	}
	if (c) try {
		let e = t(c);
		if (e.isSymbolicLink() && (c = n(c), s = o(c)), e.isFile()) return u && u.set(l, s.href), s.href;
	} catch (e) {
		if (e?.code !== `ENOENT`) throw u && u.set(l, e), e;
	}
	let d = r?.conditions ? new Set(r.conditions) : ke, f = a || s.href, p = Pe(r?.from), m = r?.suffixes || [``], h = r?.extensions ? [``, ...r.extensions] : [``], g;
	for (let e of p) {
		for (let t of m) {
			let n = Re(f, t);
			n === `.` && (n += `/.`);
			for (let t of h) if (g = Ne(n + t, e, d), g) break;
			if (g) break;
		}
		if (g) break;
	}
	if (!g) {
		let t = Error(`Cannot resolve module "${e}" (from: ${p.map((e) => Ie(e)).join(`, `)})`);
		if (t.code = `ERR_MODULE_NOT_FOUND`, u && u.set(l, t), r?.try) return;
		throw t;
	}
	return u && u.set(l, g.href), g.href;
}
function Me(e, t) {
	let n = Q(e, t);
	if (!n || !n.startsWith(`file://`) && t?.try) return;
	let r = a(n);
	return Ae ? ze(r) : r;
}
function Ne(e, t, n) {
	try {
		return Oe(e, t, n);
	} catch {}
}
function Pe(e) {
	let t = (Array.isArray(e) ? e : [e]).flatMap((e) => Fe(e));
	return t.length === 0 ? [o(`./`)] : t;
}
function Fe(e) {
	if (!e) return [];
	if ($(e)) return [e];
	if (typeof e != `string`) return [];
	if (/^(?:node|data|http|https|file):/.test(e)) return new URL(e);
	try {
		return e.endsWith(`/`) || r(e).isDirectory() ? o(e + `/`) : o(e);
	} catch {
		return [o(e + `/`), o(e)];
	}
}
function Ie(e) {
	try {
		return a(e);
	} catch {
		return e;
	}
}
function Le(e, t) {
	return JSON.stringify([
		e,
		(t?.conditions || [`node`, `import`]).sort(),
		t?.extensions,
		t?.from,
		t?.suffixes
	]);
}
function Re(e, t) {
	return !e || !t || t === `/` ? e : (e.endsWith(`/`) ? e : e + `/`) + (t.startsWith(`/`) ? t.slice(1) : t);
}
function ze(e) {
	return e.replace(/\\/g, `/`).replace(/^[a-z]:\//, (e) => e.toUpperCase());
}
function $(e) {
	return e instanceof URL || e?.constructor?.name === `URL`;
}
function Be(e) {
	if (typeof e == `string`) {
		if (e.startsWith(`file:`)) {
			let t = new URL(e);
			return {
				url: t,
				absolutePath: a(t)
			};
		}
		return c(e) ? {
			url: o(e),
			absolutePath: e
		} : /^(?:node|data|http|https):/.test(e) ? { external: e } : m.includes(e) && !e.includes(`:`) ? { external: `node:${e}` } : { specifier: e };
	}
	if ($(e)) return e.protocol === `file:` ? {
		url: e,
		absolutePath: a(e)
	} : { external: e.href };
	throw TypeError("id must be a `string` or `URL`");
}
export { Me as t };
