import { createHmac, timingSafeEqual } from "node:crypto";
import sharp from "sharp";
import { discordStatsSvg } from "../../charts/discordStatsSvg";
import { type RenderRequest, renderRequestSchema } from "./renderContract";

export const RENDER_BODY_LIMIT = 512 * 1024;
export const RENDER_PNG_LIMIT = 8 * 1024 * 1024;
export const RENDER_TIMESTAMP_TTL_MS = 60_000;
const ICON_LIMIT = 256 * 1024;
let active = 0;

/** Both services sign exactly timestamp + newline + UTF-8 JSON bytes with SHA-256 HMAC. */
export function renderSignature(
	secret: string,
	timestamp: string,
	body: string,
) {
	return createHmac("sha256", secret)
		.update(`${timestamp}\n${body}`)
		.digest("hex");
}
async function boundedBytes(
	body: ReadableStream<Uint8Array> | null,
	limit: number,
) {
	if (!body) return new Uint8Array();
	const reader = body.getReader(),
		chunks: Uint8Array[] = [];
	let length = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			length += value.length;
			if (length > limit) {
				await reader.cancel();
				throw new Error("Body exceeds limit");
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const result = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	return result;
}

/** Only configured catalog storage origins may be fetched. Redirects never widen that trust. */
export async function loadRenderIcons(
	request: RenderRequest,
	allowedOrigins: readonly string[],
	fetcher: typeof fetch = fetch,
) {
	const urls = [
		...new Set(
			[request.subject, request.comparison]
				.flatMap((a) =>
					a
						? [
								...a.icons.map((i) => i.iconUrl),
								...a.subscriptions.rows.map((r) => r.iconUrl),
							]
						: [],
				)
				.filter((u): u is string => u !== null),
		),
	].slice(0, 250);
	const images = new Map<string, string>();
	let cursor = 0;
	const deadline = AbortSignal.timeout(4000);
	await Promise.all(
		Array.from({ length: 4 }, async () => {
			while (cursor < urls.length && !deadline.aborted) {
				const value = urls[cursor++];
				try {
					const url = new URL(value);
					if (
						!allowedOrigins.includes(url.origin) ||
						url.username ||
						url.password ||
						!["https:", "http:"].includes(url.protocol)
					)
						continue;
					const response = await fetcher(url, {
						redirect: "error",
						signal: AbortSignal.any([deadline, AbortSignal.timeout(1500)]),
					});
					if (!response.ok) continue;
					const raw = await boundedBytes(response.body, ICON_LIMIT);
					const png = await sharp(raw, { limitInputPixels: 1024 * 1024 })
						.resize(48, 48, { fit: "inside" })
						.png()
						.toBuffer();
					images.set(value, `data:image/png;base64,${png.toString("base64")}`);
				} catch {
					/* Failed icons use the neutral mark. */
				}
			}
		}),
	);
	return images;
}
export async function renderStatsPng(
	request: RenderRequest,
	icons: ReadonlyMap<string, string> = new Map(),
) {
	const { svg } = discordStatsSvg(request, icons);
	const png = await sharp(Buffer.from(svg), { limitInputPixels: 24_000_000 })
		.png()
		.toBuffer();
	if (png.length > RENDER_PNG_LIMIT) throw new Error("PNG exceeds limit");
	return png;
}
export async function handleDiscordRender(
	request: Request,
	options: {
		secret?: string;
		iconOrigins?: readonly string[];
		now?: number;
		render?: typeof renderStatsPng;
	} = {},
) {
	const headers = { "Cache-Control": "no-store" };
	const fail = (status: number) =>
		new Response("Unable to render statistics", { status, headers });
	const secret = options.secret ?? process.env.DISCORD_RENDER_SECRET;
	if (!secret || secret.length < 32) return fail(503);
	const timestamp = request.headers.get("x-aistack-render-timestamp") ?? "",
		signature = request.headers.get("x-aistack-render-signature") ?? "";
	if (
		!/^\d{13}$/.test(timestamp) ||
		Math.abs((options.now ?? Date.now()) - Number(timestamp)) >
			RENDER_TIMESTAMP_TTL_MS ||
		!/^[a-f0-9]{64}$/.test(signature)
	)
		return fail(401);
	if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
		return fail(415);
	const size = request.headers.get("content-length");
	if (size && (!/^\d+$/.test(size) || Number(size) > RENDER_BODY_LIMIT))
		return fail(413);
	let raw: string;
	try {
		raw = new TextDecoder("utf-8", { fatal: true }).decode(
			await boundedBytes(request.body, RENDER_BODY_LIMIT),
		);
	} catch {
		return fail(413);
	}
	const expected = renderSignature(secret, timestamp, raw);
	if (
		!timingSafeEqual(
			Buffer.from(expected, "hex"),
			Buffer.from(signature, "hex"),
		)
	)
		return fail(401);
	let input: RenderRequest;
	try {
		input = renderRequestSchema.parse(JSON.parse(raw));
	} catch {
		return fail(400);
	}
	if (active >= 2) return fail(503);
	active++;
	try {
		const origins =
			options.iconOrigins ??
			(process.env.DISCORD_RENDER_ICON_ORIGINS ?? "")
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
		const icons = await loadRenderIcons(input, origins);
		const png = await (options.render ?? renderStatsPng)(input, icons);
		return new Response(new Uint8Array(png), {
			headers: {
				...headers,
				"Content-Type": "image/png",
				"Content-Length": String(png.length),
			},
		});
	} catch {
		return fail(500);
	} finally {
		active--;
	}
}
