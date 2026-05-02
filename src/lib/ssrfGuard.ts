import dns from "node:dns/promises";
import net from "node:net";

/**
 * SSRF guard for admin-driven URL fetches. Validates that:
 *   - protocol is http: or https:
 *   - hostname resolves to public IPs only (no loopback, RFC1918, link-local,
 *     cloud IMDS, multicast, ULA, etc.)
 *   - literal IP hostnames are caught at the IP-layer check
 *
 * Caller is responsible for using `redirect: 'manual'` and re-validating any
 * 3xx Location with this helper.
 */

function ipv4ToInt(ip: string): number | null {
	const parts = ip.split(".");
	if (parts.length !== 4) return null;
	let n = 0;
	for (const p of parts) {
		const v = Number(p);
		if (!Number.isInteger(v) || v < 0 || v > 255) return null;
		n = (n << 8) | v;
	}
	return n >>> 0;
}

function inRange(ipInt: number, cidr: string): boolean {
	const [base, bitsStr] = cidr.split("/");
	const baseInt = ipv4ToInt(base);
	const bits = Number(bitsStr);
	if (baseInt === null || !Number.isInteger(bits)) return false;
	if (bits === 0) return true;
	const mask = ~((1 << (32 - bits)) - 1) >>> 0;
	return (ipInt & mask) === (baseInt & mask);
}

const BLOCKED_V4_CIDRS = [
	"0.0.0.0/8",
	"10.0.0.0/8",
	"100.64.0.0/10",
	"127.0.0.0/8",
	"169.254.0.0/16",
	"172.16.0.0/12",
	"192.168.0.0/16",
	"224.0.0.0/4",
	"240.0.0.0/4",
];

function isBlockedV4(ip: string): boolean {
	const ipInt = ipv4ToInt(ip);
	if (ipInt === null) return true; // malformed → treat as blocked
	return BLOCKED_V4_CIDRS.some((c) => inRange(ipInt, c));
}

function isBlockedV6(ip: string): boolean {
	// Normalize: lowercase, no zone id
	const normalized = ip.toLowerCase().replace(/%.*/, "");
	if (normalized === "::1") return true; // loopback
	if (normalized === "::") return true; // unspecified
	if (normalized.startsWith("::ffff:")) {
		// IPv4-mapped — extract the v4 portion and check that
		const v4 = normalized.slice("::ffff:".length);
		return isBlockedV4(v4);
	}
	// Quick prefix checks per RFC ranges:
	// fc00::/7  (unique local)  → first byte 0xfc or 0xfd
	// fe80::/10 (link-local)    → first 10 bits 1111 1110 10 → fe80–febf
	// ff00::/8  (multicast)     → starts with ff
	const firstHextet = normalized.split(":")[0] ?? "";
	if (!firstHextet) return true;
	const firstNum = Number.parseInt(firstHextet, 16);
	if (Number.isNaN(firstNum)) return true;
	const firstByte = firstNum >> 8;
	if (firstByte === 0xfc || firstByte === 0xfd) return true; // fc00::/7
	if (firstNum >= 0xfe80 && firstNum <= 0xfebf) return true; // fe80::/10
	if (firstByte === 0xff) return true; // multicast
	if (firstNum === 0) {
		// covers ::/8 and the v4-compatible space we already partially handled
		return true;
	}
	return false;
}

function isBlockedIp(ip: string): boolean {
	const family = net.isIP(ip);
	if (family === 4) return isBlockedV4(ip);
	if (family === 6) return isBlockedV6(ip);
	return true; // unrecognized → block
}

/**
 * Validates a URL is safe for server-side fetch from an admin context.
 * Throws on rejection. Returns the parsed URL on success.
 */
export async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
	let parsed: URL;
	try {
		parsed = new URL(rawUrl);
	} catch {
		throw new Error("Invalid URL");
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error("Only http(s) URLs are allowed");
	}
	const hostname = parsed.hostname;
	if (!hostname) throw new Error("URL has no hostname");

	// If the hostname is a literal IP, validate it directly.
	const family = net.isIP(hostname);
	if (family !== 0) {
		if (isBlockedIp(hostname)) {
			throw new Error("URL resolves to a blocked address");
		}
		return parsed;
	}

	// Otherwise resolve via DNS and check every returned IP.
	let addrs: { address: string; family: number }[];
	try {
		addrs = await dns.lookup(hostname, { all: true });
	} catch {
		throw new Error("DNS lookup failed");
	}
	if (addrs.length === 0) {
		throw new Error("DNS lookup returned no addresses");
	}
	for (const a of addrs) {
		if (isBlockedIp(a.address)) {
			throw new Error("URL resolves to a blocked address");
		}
	}
	return parsed;
}
