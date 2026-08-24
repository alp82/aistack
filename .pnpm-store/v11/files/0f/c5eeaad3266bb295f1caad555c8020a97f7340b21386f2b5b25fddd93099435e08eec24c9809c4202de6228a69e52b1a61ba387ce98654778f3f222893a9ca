import { HIDE_METADATA } from "../../utils/hide-metadata.mjs";
import "../../utils/index.mjs";
import { APIError } from "../../api/index.mjs";
import { generator } from "./generator.mjs";
import { logo } from "./logo.mjs";
import { createAuthEndpoint } from "@better-auth/core/api";

//#region src/plugins/open-api/index.ts
const getHTML = (apiReference, theme, nonce) => {
	const nonceAttr = nonce ? `nonce="${nonce}"` : "";
	return `<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      type="application/json">
    ${JSON.stringify(apiReference)}
    <\/script>
	 <script ${nonceAttr}>
      var configuration = {
	  	favicon: "data:image/svg+xml;utf8,${encodeURIComponent(logo)}",
	   	theme: "${theme || "default"}",
        metaData: {
			title: "Better Auth API",
			description: "API Reference for your Better Auth Instance",
		}
      }

      document.getElementById('api-reference').dataset.configuration =
        JSON.stringify(configuration)
    <\/script>
	  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" ${nonceAttr}><\/script>
  </body>
</html>`;
};
const openAPI = (options) => {
	const path = options?.path ?? "/reference";
	return {
		id: "open-api",
		endpoints: {
			generateOpenAPISchema: createAuthEndpoint("/open-api/generate-schema", { method: "GET" }, async (ctx) => {
				const schema = await generator(ctx.context, ctx.context.options);
				return ctx.json(schema);
			}),
			openAPIReference: createAuthEndpoint(path, {
				method: "GET",
				metadata: HIDE_METADATA
			}, async (ctx) => {
				if (options?.disableDefaultReference) throw new APIError("NOT_FOUND");
				const schema = await generator(ctx.context, ctx.context.options);
				return new Response(getHTML(schema, options?.theme, options?.nonce), { headers: { "Content-Type": "text/html" } });
			})
		},
		options
	};
};

//#endregion
export { openAPI };
//# sourceMappingURL=index.mjs.map