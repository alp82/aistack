import { serverFetch } from "../app.mjs";
import { rendererTemplate, rendererTemplateFile, isStaticTemplate } from "#nitro/virtual/renderer-template";
import { HTTPResponse } from "h3";
import { hasTemplateSyntax, renderToResponse, compileTemplate } from "rendu";
export default async function renderIndexHTML(event) {
	let html = await rendererTemplate(event.req);
	if (globalThis.__transform_html__) {
		html = await globalThis.__transform_html__(html);
	}
	const isStatic = isStaticTemplate ?? !hasTemplateSyntax(html);
	if (isStatic) {
		return new HTTPResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
	}
	const template = compileTemplate(html, { filename: rendererTemplateFile });
	return renderToResponse(template, {
		request: event.req,
		context: { serverFetch }
	});
}
