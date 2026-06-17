const SITE_NAME = "AI Stack";
export const SITE_URL = "https://aistack.to";
const DEFAULT_IMAGE = `${SITE_URL}/banners/aistack.png`;
const DEFAULT_IMAGE_WIDTH = "802";
const DEFAULT_IMAGE_HEIGHT = "438";
const TWITTER_SITE = "@alperortac";
const AUTHOR = "Alper Ortac";

type SeoInput = {
	title: string;
	description: string;
	url?: string;
	image?: string;
	imageWidth?: string;
	imageHeight?: string;
	keywords?: string;
	noindex?: boolean;
};

export function seoMeta({
	title,
	description,
	url,
	image = DEFAULT_IMAGE,
	imageWidth = DEFAULT_IMAGE_WIDTH,
	imageHeight = DEFAULT_IMAGE_HEIGHT,
	keywords,
	noindex,
}: SeoInput) {
	const fullUrl = url
		? url.startsWith("http")
			? url
			: `${SITE_URL}${url}`
		: SITE_URL;

	const meta: Array<Record<string, string>> = [
		{ title },
		{ name: "description", content: description },
		// Open Graph
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:image", content: image },
		{ property: "og:image:width", content: imageWidth },
		{ property: "og:image:height", content: imageHeight },
		{ property: "og:url", content: fullUrl },
		{ property: "og:type", content: "website" },
		{ property: "og:site_name", content: SITE_NAME },
		// Twitter
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: image },
		{ name: "twitter:site", content: TWITTER_SITE },
		{ name: "twitter:creator", content: TWITTER_SITE },
		// General
		{ name: "author", content: AUTHOR },
	];

	if (keywords) {
		meta.push({ name: "keywords", content: keywords });
	}

	if (noindex) {
		meta.push({ name: "robots", content: "noindex, nofollow" });
	} else {
		meta.push({ name: "robots", content: "index, follow" });
	}

	return meta;
}

// JSON-LD helpers

type WebSiteJsonLd = {
	type: "WebSite";
	name?: string;
	description: string;
	url?: string;
};

type CollectionPageJsonLd = {
	type: "CollectionPage";
	name: string;
	description: string;
	url: string;
};

type SoftwareAppJsonLd = {
	type: "SoftwareApplication";
	name: string;
	description: string;
	url: string;
	author?: string;
	offers?: {
		price: string;
		priceCurrency: string;
	};
};

type ItemListJsonLd = {
	type: "ItemList";
	name: string;
	description: string;
	url: string;
	items: Array<{
		name: string;
		url: string;
		position: number;
	}>;
};

export type JsonLdInput =
	| WebSiteJsonLd
	| CollectionPageJsonLd
	| SoftwareAppJsonLd
	| ItemListJsonLd;

export function buildJsonLd(input: JsonLdInput): string {
	switch (input.type) {
		case "WebSite":
			return JSON.stringify({
				"@context": "https://schema.org",
				"@type": "WebSite",
				name: input.name ?? SITE_NAME,
				description: input.description,
				url: input.url ?? SITE_URL,
				publisher: {
					"@type": "Person",
					name: AUTHOR,
				},
			});
		case "CollectionPage":
			return JSON.stringify({
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				name: input.name,
				description: input.description,
				url: input.url.startsWith("http")
					? input.url
					: `${SITE_URL}${input.url}`,
			});
		case "SoftwareApplication":
			return JSON.stringify({
				"@context": "https://schema.org",
				"@type": "SoftwareApplication",
				name: input.name,
				description: input.description,
				url: input.url.startsWith("http")
					? input.url
					: `${SITE_URL}${input.url}`,
				applicationCategory: "DeveloperApplication",
				...(input.author && {
					author: { "@type": "Person", name: input.author },
				}),
				...(input.offers && {
					offers: {
						"@type": "Offer",
						price: input.offers.price,
						priceCurrency: input.offers.priceCurrency,
					},
				}),
			});
		case "ItemList":
			return JSON.stringify({
				"@context": "https://schema.org",
				"@type": "ItemList",
				name: input.name,
				description: input.description,
				url: input.url.startsWith("http")
					? input.url
					: `${SITE_URL}${input.url}`,
				itemListElement: input.items.map((item) => ({
					"@type": "ListItem",
					position: item.position,
					url: item.url.startsWith("http")
						? item.url
						: `${SITE_URL}${item.url}`,
					name: item.name,
				})),
			});
	}
}
