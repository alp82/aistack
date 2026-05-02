import { createFileRoute } from "@tanstack/react-router";
import sharp from "sharp";
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server";
import { assertSafePublicUrl } from "@/lib/ssrfGuard";
import { api } from "../../convex/_generated/api";

const MAX_DIM = 512;
const WEBP_QUALITY = 80;
const MAX_INPUT_PIXELS = 4096 * 4096;
const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

function jsonError(status: number, message: string): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function getTrustedOrigins(): string[] {
	const origins = new Set<string>();
	const appUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL;
	if (appUrl) {
		try {
			origins.add(new URL(appUrl).origin);
		} catch {
			// ignore malformed env
		}
	}
	return Array.from(origins);
}

function isOriginTrusted(request: Request): boolean {
	const trusted = getTrustedOrigins();
	if (trusted.length === 0) {
		// In dev with no env configured we fail closed by default; allow
		// localhost so local development still works.
		const fallback = ["http://localhost:3019", "http://127.0.0.1:3019"];
		const origin = request.headers.get("origin");
		if (origin && fallback.includes(origin)) return true;
		const referer = request.headers.get("referer");
		if (referer) {
			try {
				if (fallback.includes(new URL(referer).origin)) return true;
			} catch {
				// ignore
			}
		}
		return false;
	}
	const origin = request.headers.get("origin");
	if (origin && trusted.includes(origin)) return true;
	const referer = request.headers.get("referer");
	if (referer) {
		try {
			const refOrigin = new URL(referer).origin;
			if (trusted.includes(refOrigin)) return true;
		} catch {
			// ignore
		}
	}
	return false;
}

async function fetchWithRedirectGuard(rawUrl: string): Promise<Response> {
	let currentUrl = rawUrl;
	for (let i = 0; i <= MAX_REDIRECTS; i++) {
		await assertSafePublicUrl(currentUrl);
		const response = await fetch(currentUrl, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			redirect: "manual",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; AIStack-iconbot/1.0; +https://aistack.to)",
				Accept: "image/*,*/*;q=0.8",
			},
		});
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get("location");
			if (!location) {
				throw new Error(`Redirect ${response.status} without Location header`);
			}
			currentUrl = new URL(location, currentUrl).toString();
			continue;
		}
		return response;
	}
	throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
}

export const Route = createFileRoute("/api/icons/from-url")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				// CSRF / content-type guard (F-B)
				const contentType = request.headers.get("content-type") ?? "";
				if (!contentType.toLowerCase().startsWith("application/json")) {
					return jsonError(415, "Content-Type must be application/json");
				}
				if (!isOriginTrusted(request)) {
					return jsonError(403, "Forbidden");
				}

				let body: { url?: unknown };
				try {
					body = (await request.json()) as { url?: unknown };
				} catch {
					return jsonError(400, "Invalid JSON body");
				}

				const url = typeof body.url === "string" ? body.url.trim() : "";
				if (!url) {
					return jsonError(400, "url is required");
				}

				// Admin gate via the existing checkIsAdmin Convex query, which
				// already enforces the same allowlist used elsewhere.
				let isAdmin = false;
				try {
					isAdmin = (await fetchAuthQuery(
						api.admin.checkIsAdmin,
						{},
					)) as boolean;
				} catch {
					isAdmin = false;
				}
				if (!isAdmin) {
					return jsonError(401, "Unauthorized");
				}

				// Pre-flight SSRF validation (F-A)
				try {
					await assertSafePublicUrl(url);
				} catch (err) {
					console.error("[icons/from-url] URL rejected:", err);
					return jsonError(400, "URL not allowed");
				}

				// Fetch with manual redirect handling and per-hop SSRF re-validation (F-A)
				let response: Response;
				try {
					response = await fetchWithRedirectGuard(url);
				} catch (err) {
					console.error("[icons/from-url] Fetch failed:", err);
					return jsonError(502, "Fetch failed");
				}
				if (!response.ok) {
					return jsonError(response.status === 404 ? 404 : 502, "Fetch failed");
				}

				// Strict content-type validation (F-H) — fail closed
				const upstreamContentType = (response.headers.get("content-type") ?? "")
					.split(";")[0]
					.trim()
					.toLowerCase();
				const isImage =
					upstreamContentType.startsWith("image/") &&
					upstreamContentType !== "image/svg+xml";
				const isSvg = upstreamContentType === "image/svg+xml";
				if (!isImage && !isSvg) {
					return jsonError(415, "Upstream resource is not an image");
				}

				// Content-Length pre-check before buffering (F-I)
				const contentLengthHeader = response.headers.get("content-length");
				if (contentLengthHeader) {
					const contentLength = Number.parseInt(contentLengthHeader, 10);
					if (
						Number.isFinite(contentLength) &&
						contentLength > MAX_INPUT_BYTES
					) {
						return jsonError(
							413,
							`Image too large — exceeds ${MAX_INPUT_BYTES} byte limit`,
						);
					}
				}

				const arrayBuffer = await response.arrayBuffer();
				if (arrayBuffer.byteLength > MAX_INPUT_BYTES) {
					return jsonError(
						413,
						`Image too large — ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB exceeds 5 MB limit`,
					);
				}
				const inputBuffer = Buffer.from(arrayBuffer);

				let webpBuffer: Buffer;
				try {
					webpBuffer = await sharp(inputBuffer, {
						limitInputPixels: MAX_INPUT_PIXELS,
					})
						.resize(MAX_DIM, MAX_DIM, {
							fit: "inside",
							withoutEnlargement: true,
						})
						.webp({ quality: WEBP_QUALITY })
						.toBuffer();
				} catch (err) {
					console.error("[icons/from-url] sharp failed:", err);
					return jsonError(422, "Image processing failed");
				}

				// Get a presigned upload URL via the existing Convex mutation,
				// running with the current admin user's auth token.
				let uploadUrl: string;
				try {
					uploadUrl = await fetchAuthMutation(api.files.generateUploadUrl, {});
				} catch (err) {
					console.error("[icons/from-url] generateUploadUrl failed:", err);
					return jsonError(502, "Upload failed");
				}

				let uploadResp: Response;
				try {
					uploadResp = await fetch(uploadUrl, {
						method: "POST",
						headers: { "Content-Type": "image/webp" },
						body: new Uint8Array(webpBuffer),
					});
				} catch (err) {
					console.error("[icons/from-url] storage POST failed:", err);
					return jsonError(502, "Upload failed");
				}
				if (!uploadResp.ok) {
					console.error(
						"[icons/from-url] storage POST non-OK:",
						uploadResp.status,
						uploadResp.statusText,
					);
					return jsonError(502, "Upload failed");
				}

				let payload: { storageId?: string };
				try {
					payload = (await uploadResp.json()) as { storageId?: string };
				} catch {
					return jsonError(502, "Upload failed");
				}
				if (!payload.storageId) {
					return jsonError(502, "Upload failed");
				}

				return new Response(JSON.stringify({ storageId: payload.storageId }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			},
		},
	},
});
