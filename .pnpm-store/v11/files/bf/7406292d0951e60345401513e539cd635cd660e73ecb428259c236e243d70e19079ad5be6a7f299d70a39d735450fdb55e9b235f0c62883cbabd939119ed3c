var D = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"keygen",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
]), x = new Set(["script", "style"]), o = /(?:<(\/?)([a-zA-Z][a-zA-Z0-9\:-]*)(?:\s([^>]*?))?((?:\s*\/)?)>|(<\!\-\-)([\s\S]*?)(\-\->)|(<\!)([\s\S]*?)(>))/gm, b = /[\@\.a-z0-9_\:\-]/i;
function I(e) {
	let t = {};
	if (e) {
		let i = "none", r, n = "", a, l;
		for (let c = 0; c < e.length; c++) {
			let d = e[c];
			i === "none" ? b.test(d) ? (r && (t[r] = n, r = void 0, n = ""), a = c, i = "key") : d === "=" && r && (i = "value") : i === "key" ? b.test(d) || (r = e.substring(a, c), d === "=" ? i = "value" : i = "none") : d === l && c > 0 && e[c - 1] !== "\\" ? l && (n = e.substring(a, c), l = void 0, i = "none") : (d === "\"" || d === "'") && !l && (a = c + 1, l = d);
		}
		i === "key" && a != null && a < e.length && (r = e.substring(a, e.length)), r && (t[r] = n);
	}
	return t;
}
function P(e) {
	let t = typeof e == "string" ? e : e.value, i, r, n, a, l, c, d, m, s, u = [];
	o.lastIndex = 0, r = i = {
		type: 0,
		children: []
	};
	let g = 0;
	function h() {
		a = t.substring(g, o.lastIndex - n[0].length), a && r.children.push({
			type: 2,
			value: a,
			parent: r
		});
	}
	for (; n = o.exec(t);) {
		if (c = n[5] || n[8], d = n[6] || n[9], m = n[7] || n[10], x.has(r.name) && n[2] !== r.name) {
			l = o.lastIndex - n[0].length, r.children.length > 0 && (r.children[0].value += n[0]);
			continue;
		} else if (c === "<!--") {
			if (l = o.lastIndex - n[0].length, x.has(r.name)) continue;
			s = {
				type: 3,
				value: d,
				parent: r,
				loc: [{
					start: l,
					end: l + c.length
				}, {
					start: o.lastIndex - m.length,
					end: o.lastIndex
				}]
			}, u.push(s), s.parent.children.push(s);
		} else if (c === "<!") l = o.lastIndex - n[0].length, s = {
			type: 4,
			value: d,
			parent: r,
			loc: [{
				start: l,
				end: l + c.length
			}, {
				start: o.lastIndex - m.length,
				end: o.lastIndex
			}]
		}, u.push(s), s.parent.children.push(s);
		else if (n[1] !== "/") if (h(), x.has(r.name)) {
			g = o.lastIndex, h();
			continue;
		} else s = {
			type: 1,
			name: n[2] + "",
			attributes: I(n[3]),
			parent: r,
			children: [],
			loc: [{
				start: o.lastIndex - n[0].length,
				end: o.lastIndex
			}]
		}, u.push(s), s.parent.children.push(s), n[4] && n[4].indexOf("/") > -1 || D.has(s.name) ? (s.loc[1] = s.loc[0], s.isSelfClosingTag = !0) : r = s;
		else h(), n[2] + "" === r.name ? (s = r, r = s.parent, s.loc.push({
			start: o.lastIndex - n[0].length,
			end: o.lastIndex
		}), a = t.substring(s.loc[0].end, s.loc[1].start), s.children.length === 0 && s.children.push({
			type: 2,
			value: a,
			parent: r
		})) : n[2] + "" === u[u.length - 1].name && u[u.length - 1].isSelfClosingTag === !0 && (s = u[u.length - 1], s.loc.push({
			start: o.lastIndex - n[0].length,
			end: o.lastIndex
		}));
		g = o.lastIndex;
	}
	return a = t.slice(g), r.children.push({
		type: 2,
		value: a,
		parent: r
	}), i;
}
var T = class {
	constructor(t) {
		this.callback = t;
	}
	async visit(t, i, r) {
		if (await this.callback(t, i, r), Array.isArray(t.children)) {
			let n = [];
			for (let a = 0; a < t.children.length; a++) {
				let l = t.children[a];
				n.push(this.visit(l, t, a));
			}
			await Promise.all(n);
		}
	}
};
function z(e, t) {
	return new T(t).visit(e);
}
export { P, z };
