// @vitest-environment node
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { TiptapEditor } from "../TiptapEditor";

it.each([false, true])(
	"does not abort server rendering with editable=%s",
	(editable) => {
		expect(() =>
			renderToString(
				<TiptapEditor
					content="<h2>Setup guide</h2><p>Use these tools.</p>"
					editable={editable}
				/>,
			),
		).not.toThrow();
	},
);
