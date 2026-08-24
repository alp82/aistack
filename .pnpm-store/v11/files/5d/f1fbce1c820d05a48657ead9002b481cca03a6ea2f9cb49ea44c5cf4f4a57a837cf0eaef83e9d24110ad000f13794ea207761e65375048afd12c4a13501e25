const e = /^[A-Za-z]:\//;
function t(t = ``) {
	return t && t.replace(/\\/g, `/`).replace(e, (e) => e.toUpperCase());
}
const n = /^[/\\]{2}/, r = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/, i = /^[A-Za-z]:$/, a = /^\/([A-Za-z]:)?$/, o = function(e) {
	if (e.length === 0) return `.`;
	e = t(e);
	let r = e.match(n), a = d(e), o = e[e.length - 1] === `/`;
	return e = u(e, !a), e.length === 0 ? a ? `/` : o ? `./` : `.` : (o && (e += `/`), i.test(e) && (e += `/`), r ? a ? `//${e}` : `//./${e}` : a && !d(e) ? `/${e}` : e);
}, s = function(...e) {
	let t = ``;
	for (let n of e) if (n) if (t.length > 0) {
		let e = t[t.length - 1] === `/`, r = n[0] === `/`;
		e && r ? t += n.slice(1) : t += e || r ? n : `/${n}`;
	} else t += n;
	return o(t);
};
function c() {
	return typeof process < `u` && typeof process.cwd == `function` ? process.cwd().replace(/\\/g, `/`) : `/`;
}
const l = function(...e) {
	e = e.map((e) => t(e));
	let n = ``, r = !1;
	for (let t = e.length - 1; t >= -1 && !r; t--) {
		let i = t >= 0 ? e[t] : c();
		!i || i.length === 0 || (n = `${i}/${n}`, r = d(i));
	}
	return n = u(n, !r), r && !d(n) ? `/${n}` : n.length > 0 ? n : `.`;
};
function u(e, t) {
	let n = ``, r = 0, i = -1, a = 0, o = null;
	for (let s = 0; s <= e.length; ++s) {
		if (s < e.length) o = e[s];
		else if (o === `/`) break;
		else o = `/`;
		if (o === `/`) {
			if (!(i === s - 1 || a === 1)) if (a === 2) {
				if (n.length < 2 || r !== 2 || n[n.length - 1] !== `.` || n[n.length - 2] !== `.`) {
					if (n.length > 2) {
						let e = n.lastIndexOf(`/`);
						e === -1 ? (n = ``, r = 0) : (n = n.slice(0, e), r = n.length - 1 - n.lastIndexOf(`/`)), i = s, a = 0;
						continue;
					} else if (n.length > 0) {
						n = ``, r = 0, i = s, a = 0;
						continue;
					}
				}
				t && (n += n.length > 0 ? `/..` : `..`, r = 2);
			} else n.length > 0 ? n += `/${e.slice(i + 1, s)}` : n = e.slice(i + 1, s), r = s - i - 1;
			i = s, a = 0;
		} else o === `.` && a !== -1 ? ++a : a = -1;
	}
	return n;
}
const d = function(e) {
	return r.test(e);
}, f = function(e, t) {
	let n = l(e).replace(a, `$1`).split(`/`), r = l(t).replace(a, `$1`).split(`/`);
	if (r[0][1] === `:` && n[0][1] === `:` && n[0] !== r[0]) return r.join(`/`);
	let i = [...n];
	for (let e of i) {
		if (r[0] !== e) break;
		n.shift(), r.shift();
	}
	return [...n.map(() => `..`), ...r].join(`/`);
}, p = function(e) {
	let n = t(e).replace(/\/$/, ``).split(`/`).slice(0, -1);
	return n.length === 1 && i.test(n[0]) && (n[0] += `/`), n.join(`/`) || (d(e) ? `/` : `.`);
};
globalThis.process?.platform;
export { f as a, o as i, d as n, l as o, s as r, p as t };
