import { createFilter, dataToEsm } from "../_build/common.mjs";
function json(options) {
	if (options === void 0) options = {};
	var filter = createFilter(options.include, options.exclude);
	var indent = "indent" in options ? options.indent : "	";
	return {
		name: "json",
		transform: function transform(code, id) {
			if (id.slice(-5) !== ".json" || !filter(id)) return null;
			try {
				return {
					code: dataToEsm(JSON.parse(code), {
						preferConst: options.preferConst,
						compact: options.compact,
						namedExports: options.namedExports,
						includeArbitraryNames: options.includeArbitraryNames,
						indent
					}),
					map: { mappings: "" }
				};
			} catch (err) {
				this.error({
					message: "Could not parse JSON file",
					id,
					cause: err
				});
				return null;
			}
		}
	};
}
export { json };
