import { buildJsonLd, type JsonLdInput } from "@/lib/seo";

export function JsonLd({ data }: { data: JsonLdInput }) {
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: buildJsonLd(data) }}
		/>
	);
}
