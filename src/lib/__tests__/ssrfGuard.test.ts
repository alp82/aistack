import { describe, expect, it } from "vitest";

import { assertSafePublicUrl } from "@/lib/ssrfGuard";

describe("assertSafePublicUrl", () => {
	it("rejects non-http(s) protocols", async () => {
		await expect(assertSafePublicUrl("file:///etc/passwd")).rejects.toThrow();
		await expect(assertSafePublicUrl("ftp://example.com")).rejects.toThrow();
		await expect(assertSafePublicUrl("javascript:alert(1)")).rejects.toThrow();
		await expect(assertSafePublicUrl("gopher://10.0.0.1")).rejects.toThrow();
	});

	it("rejects malformed URLs", async () => {
		await expect(assertSafePublicUrl("not a url")).rejects.toThrow(
			"Invalid URL",
		);
		await expect(assertSafePublicUrl("")).rejects.toThrow("Invalid URL");
	});

	it("rejects IPv4 loopback / private / link-local literals", async () => {
		await expect(assertSafePublicUrl("http://127.0.0.1/")).rejects.toThrow(
			"blocked address",
		);
		await expect(assertSafePublicUrl("http://10.0.0.5/path")).rejects.toThrow(
			"blocked address",
		);
		await expect(assertSafePublicUrl("http://192.168.1.1/")).rejects.toThrow(
			"blocked address",
		);
		await expect(assertSafePublicUrl("http://172.20.0.1/")).rejects.toThrow(
			"blocked address",
		);
		// AWS / GCP / Azure cloud metadata endpoint
		await expect(
			assertSafePublicUrl("http://169.254.169.254/latest/meta-data/"),
		).rejects.toThrow("blocked address");
		// CGNAT
		await expect(assertSafePublicUrl("http://100.64.0.1/")).rejects.toThrow(
			"blocked address",
		);
	});

	it("rejects IPv4 outside private ranges only when blocked", async () => {
		// 11.0.0.0 is not in any blocked CIDR — should NOT throw blocked
		// (DNS lookup is skipped for IP literals, so this would resolve to itself)
		await expect(
			assertSafePublicUrl("http://11.0.0.1/"),
		).resolves.toBeInstanceOf(URL);
	});

	it("rejects IPv6 loopback / ULA / link-local / multicast literals", async () => {
		await expect(assertSafePublicUrl("http://[::1]/")).rejects.toThrow(
			"blocked address",
		);
		await expect(assertSafePublicUrl("http://[fc00::1]/")).rejects.toThrow(
			"blocked address",
		);
		await expect(assertSafePublicUrl("http://[fe80::1]/")).rejects.toThrow(
			"blocked address",
		);
		await expect(assertSafePublicUrl("http://[ff02::1]/")).rejects.toThrow(
			"blocked address",
		);
	});

	it("rejects IPv4-mapped IPv6 addresses pointing at private ranges", async () => {
		await expect(
			assertSafePublicUrl("http://[::ffff:127.0.0.1]/"),
		).rejects.toThrow("blocked address");
		await expect(
			assertSafePublicUrl("http://[::ffff:10.0.0.1]/"),
		).rejects.toThrow("blocked address");
	});

	it("accepts public IPv4 literal", async () => {
		// Cloudflare public DNS, definitely not in any blocked range
		const u = await assertSafePublicUrl("http://1.1.1.1/");
		expect(u).toBeInstanceOf(URL);
		expect(u.hostname).toBe("1.1.1.1");
	});
});
