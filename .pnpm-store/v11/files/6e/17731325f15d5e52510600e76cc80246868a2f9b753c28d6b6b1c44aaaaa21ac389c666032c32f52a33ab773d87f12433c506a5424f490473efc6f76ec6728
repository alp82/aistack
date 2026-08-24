var WalkerBase = class {
	constructor() {
		this.should_skip = false;
		this.should_remove = false;
		this.replacement = null;
		this.context = {
			skip: () => this.should_skip = true,
			remove: () => this.should_remove = true,
			replace: (node) => this.replacement = node
		};
	}
	replace(parent, prop, index, node) {
		if (parent && prop) if (index != null) parent[prop][index] = node;
		else parent[prop] = node;
	}
	remove(parent, prop, index) {
		if (parent && prop) if (index !== null && index !== void 0) parent[prop].splice(index, 1);
		else delete parent[prop];
	}
};
var SyncWalker = class extends WalkerBase {
	constructor(enter, leave) {
		super();
		this.should_skip = false;
		this.should_remove = false;
		this.replacement = null;
		this.context = {
			skip: () => this.should_skip = true,
			remove: () => this.should_remove = true,
			replace: (node) => this.replacement = node
		};
		this.enter = enter;
		this.leave = leave;
	}
	visit(node, parent, prop, index) {
		if (node) {
			if (this.enter) {
				const _should_skip = this.should_skip;
				const _should_remove = this.should_remove;
				const _replacement = this.replacement;
				this.should_skip = false;
				this.should_remove = false;
				this.replacement = null;
				this.enter.call(this.context, node, parent, prop, index);
				if (this.replacement) {
					node = this.replacement;
					this.replace(parent, prop, index, node);
				}
				if (this.should_remove) this.remove(parent, prop, index);
				const skipped = this.should_skip;
				const removed = this.should_remove;
				this.should_skip = _should_skip;
				this.should_remove = _should_remove;
				this.replacement = _replacement;
				if (skipped) return node;
				if (removed) return null;
			}
			let key;
			for (key in node) {
				const value = node[key];
				if (value && typeof value === "object") {
					if (Array.isArray(value)) {
						const nodes = value;
						for (let i = 0; i < nodes.length; i += 1) {
							const item = nodes[i];
							if (isNode(item)) {
								if (!this.visit(item, node, key, i)) i--;
							}
						}
					} else if (isNode(value)) this.visit(value, node, key, null);
				}
			}
			if (this.leave) {
				const _replacement = this.replacement;
				const _should_remove = this.should_remove;
				this.replacement = null;
				this.should_remove = false;
				this.leave.call(this.context, node, parent, prop, index);
				if (this.replacement) {
					node = this.replacement;
					this.replace(parent, prop, index, node);
				}
				if (this.should_remove) this.remove(parent, prop, index);
				const removed = this.should_remove;
				this.replacement = _replacement;
				this.should_remove = _should_remove;
				if (removed) return null;
			}
		}
		return node;
	}
};
function isNode(value) {
	return value !== null && typeof value === "object" && "type" in value && typeof value.type === "string";
}
function walk(ast, { enter, leave }) {
	return new SyncWalker(enter, leave).visit(ast, null);
}
export { walk };
